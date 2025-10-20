package downloader

import (
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/lsherman98/yt-rss/pocketbase/webhook_client"
	"github.com/lsherman98/yt-rss/pocketbase/ytdlp"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
)

func Init(app *pocketbase.PocketBase, maxWorkers int, queueSize int) error {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		resetHangingJobs(app)
		return se.Next()
	})

	routine.FireAndForget(func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			processQueue(app, maxWorkers)
		}
	})

	app.Logger().Info("Downloader initialized", "max_workers", maxWorkers)
	return nil
}

func AddJob(app core.App, record *core.Record, collection string) error {
	queueCollection, err := app.FindCollectionByNameOrId(collections.Queue)
	if err != nil {
		return err
	}

	queueRecord := core.NewRecord(queueCollection)
	queueRecord.Set("record_id", record.Id)
	queueRecord.Set("collection", collection)
	queueRecord.Set("status", "PENDING")

	return app.Save(queueRecord)
}

func resetHangingJobs(app *pocketbase.PocketBase) {
	hangingJobs, err := app.FindRecordsByFilter(collections.Queue, "status = 'PROCESSING'", "", 0, 0)
	if err != nil {
		app.Logger().Error("Failed to query for hanging jobs", "error", err)
		return
	}

	for _, job := range hangingJobs {
		job.Set("status", "PENDING")
		job.Set("worker_id", nil)
		if err := app.Save(job); err != nil {
			app.Logger().Error("Failed to reset hanging job", "job_id", job.Id, "error", err)
		}
	}

	if len(hangingJobs) > 0 {
		app.Logger().Info("Reset hanging jobs", "count", len(hangingJobs))
	}
}

func processQueue(app *pocketbase.PocketBase, maxWorkers int) {
	processingCount, err := app.CountRecords(collections.Queue, dbx.HashExp{"status": "PROCESSING"})
	if err != nil {
		app.Logger().Error("Failed to get processing job count", "error", err)
		return
	}

	if processingCount >= int64(maxWorkers) {
		return
	}

	availableWorkers := maxWorkers - int(processingCount)

	jobsToProcess, err := app.FindRecordsByFilter(
		collections.Queue,
		"status = 'PENDING'",
		"+created",
		availableWorkers,
		0,
	)
	if err != nil {
		app.Logger().Error("Failed to fetch jobs from queue", "error", err)
		return
	}

	for _, queueRecord := range jobsToProcess {
		routine.FireAndForget(func() {
			workerId := uuid.New().String()
			err := app.RunInTransaction(func(txApp core.App) error {
				freshQr, err := txApp.FindRecordById(collections.Queue, queueRecord.Id)
				if err != nil {
					return err
				}

				if freshQr.GetString("status") != "PENDING" {
					return fmt.Errorf("job already taken")
				}

				freshQr.Set("status", "PROCESSING")
				freshQr.Set("worker_id", workerId)
				return txApp.Save(freshQr)
			})

			if err != nil {
				return
			}

			recordId := queueRecord.GetString("record_id")
			collectionName := queueRecord.GetString("collection")

			record, err := app.FindRecordById(collectionName, recordId)
			if err != nil {
				app.Logger().Error("Failed to find record for job", "record_id", recordId, "collection", collectionName, "error", err)
				if err := app.Delete(queueRecord); err != nil {
					app.Logger().Error("Failed to delete job from queue", "job_id", queueRecord.Id, "error", err)
				}
				return
			}

			switch collectionName {
			case collections.Jobs:
				processJob(app, record)
			case collections.Items:
				processItem(app, record)
			}

			if err := app.Delete(queueRecord); err != nil {
				app.Logger().Error("Failed to delete job from queue", "job_id", queueRecord.Id, "error", err)
			}
		})
	}
}

func processJob(app *pocketbase.PocketBase, job *core.Record) {
	url := job.GetString("url")
	user := job.GetString("user")

	downloads, err := app.FindCollectionByNameOrId(collections.Downloads)
	if err != nil {
		app.Logger().Error("Downloader: failed to find downloads collection", "error", err)
		return
	}
	download := core.NewRecord(downloads)

	monthlyUsageRecords, err := app.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{"user": user})
	if err != nil || len(monthlyUsageRecords) == 0 {
		app.Logger().Error("Downloader: failed to find monthly usage record", "error", err, "user", user)
		return
	}
	monthlyUsage := monthlyUsageRecords[0]

	webhookClient := webhook_client.New(user, app, job)

	job.Set("status", "STARTED")
	if err := app.Save(job); err != nil {
		app.Logger().Error("Downloader: failed to update job status to STARTED", "error", err)
		return
	}
	if webhookClient != nil {
		webhookClient.Send("STARTED")
	}

	ytdlpClient := ytdlp.New(app)
	if ytdlpClient == nil {
		app.Logger().Error("Downloader: failed to initialize ytdlp")
		return
	}

	result, err := ytdlpClient.GetInfo(url)
	if err != nil {
		app.Logger().Error("Downloader: failed to get video info", "error", err)
		return
	}

	job.Set("title", result.Info.Title)

	fileSize := 0
	if result.Info.Filesize != 0 {
		fileSize = int(result.Info.Filesize)
	} else {
		length := result.Info.Duration
		fileSize = int(float64(length) * 25000)
	}

	usageLimit := monthlyUsage.GetInt("limit")
	currentUsage := monthlyUsage.GetInt("usage")

	if currentUsage > usageLimit || (currentUsage+int(fileSize)) > usageLimit {
		job.Set("status", "ERROR")
		job.Set("error", "Monthly usage limit exceeded")
		if err := app.Save(job); err != nil {
			app.Logger().Error("Downloader: failed to update job status to ERROR", "error", err)
		}
		if webhookClient != nil {
			webhookClient.Send("ERROR")
		}
		return
	}

	job.Set("status", "PROCESSING")
	if err := app.Save(job); err != nil {
		app.Logger().Error("Downloader: failed to update job status to PROCESSING", "error", err)
		return
	}

	videoId := result.Info.ID
	existingDownload, err := app.FindFirstRecordByData(collections.Downloads, "video_id", videoId)
	if err == nil && existingDownload != nil {
		download = existingDownload
	} else {
		audio, path, err := ytdlpClient.Download(url, download, result)
		if err != nil {
			app.Logger().Error("Downloader: failed to download audio", "error", err)
			job.Set("status", "ERROR")
			job.Set("error", err.Error())
			if err := app.Save(job); err != nil {
				app.Logger().Error("Downloader: failed to update job status to ERROR", "error", err)
			}
			if webhookClient != nil {
				webhookClient.Send("ERROR")
			}
			return
		}
		defer audio.Close()

		if err := app.Save(download); err != nil {
			app.Logger().Error("Downloader: failed to save download record", "error", err)
			return
		}

		if err := os.Remove(path); err != nil {
			app.Logger().Error("Downloader: failed to remove temp file", "error", err)
		}
	}

	job.Set("download", download.Id)
	job.Set("status", "SUCCESS")
	if err := app.Save(job); err != nil {
		app.Logger().Error("Downloader: failed to update job status to SUCCESS", "error", err)
		return
	}

	if webhookClient != nil {
		webhookClient.Send("SUCCESS")
	}

	monthlyUsage.Set("usage", currentUsage+int(fileSize))
	if err := app.Save(monthlyUsage); err != nil {
		app.Logger().Error("Downloader: failed to update monthly usage", "error", err)
	}
}

func processItem(app *pocketbase.PocketBase, itemRecord *core.Record) {
	url := itemRecord.GetString("url")
	podcastId := itemRecord.GetString("podcast")
	user := itemRecord.GetString("user")

	podcast, err := app.FindRecordById(collections.Podcasts, podcastId)
	if err != nil {
		app.Logger().Error("Downloader: failed to find podcast record", "error", err)
		return
	}

	fileClient, err := files.NewFileClient(app, podcast, "file")
	if err != nil {
		app.Logger().Error("Downloader: failed to create file client", "error", err)
		return
	}

	content, err := fileClient.GetXMLFile()
	if err != nil {
		app.Logger().Error("Downloader: failed to get XML file", "error", err)
		return
	}

	p, err := rss_utils.ParseXML(content.String())
	if err != nil {
		app.Logger().Error("Downloader: failed to parse XML file", "error", err)
		return
	}

	monthlyUsageRecords, err := app.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{"user": user})
	if err != nil || len(monthlyUsageRecords) == 0 {
		app.Logger().Error("Downloader: failed to find monthly usage record", "error", err)
		return
	}
	monthlyUsage := monthlyUsageRecords[0]

	downloads, err := app.FindCollectionByNameOrId(collections.Downloads)
	if err != nil {
		app.Logger().Error("Downloader: failed to find downloads collection", "error", err)
		return
	}
	download := core.NewRecord(downloads)

	ytdlpClient := ytdlp.New(app)
	if ytdlpClient == nil {
		app.Logger().Error("Downloader: failed to initialize ytdlp")
		return
	}

	result, err := ytdlpClient.GetInfo(url)
	if err != nil {
		app.Logger().Error("Downloader: failed to get video info", "error", err)
		return
	}

	itemRecord.Set("title", result.Info.Title)
	if err := app.Save(itemRecord); err != nil {
		app.Logger().Error("Downloader: failed to update item record title", "error", err)
		return
	}

	fileSize := 0
	if result.Info.Filesize != 0 {
		fileSize = int(result.Info.Filesize)
	} else {
		length := result.Info.Duration
		fileSize = int(float64(length) * 25000)
	}

	usageLimit := monthlyUsage.GetInt("limit")
	currentUsage := monthlyUsage.GetInt("usage")

	if currentUsage > usageLimit || (currentUsage+int(fileSize/2)) > usageLimit {
		itemRecord.Set("status", "ERROR")
		itemRecord.Set("error", "Failed to add item to podcast: Monthly usage limit exceeded")
		if err := app.Save(itemRecord); err != nil {
			app.Logger().Error("Downloader: failed to update item record status to ERROR", "error", err)
		}
		return
	}

	videoId := result.Info.ID
	existingDownload, err := app.FindFirstRecordByData(collections.Downloads, "video_id", videoId)
	if err == nil && existingDownload != nil {
		download = existingDownload
	} else {
		audio, path, err := ytdlpClient.Download(url, download, result)
		if err != nil {
			app.Logger().Error("Downloader: failed to download audio", "error", err)
			return
		}
		defer audio.Close()

		if err := app.Save(download); err != nil {
			app.Logger().Error("Downloader: failed to save download record", "error", err)
			return
		}

		if err := os.Remove(path); err != nil {
			app.Logger().Error("Downloader: failed to remove temp file", "error", err)
		}
	}

	itemRecord.Set("download", download.Id)
	if err := app.Save(itemRecord); err != nil {
		app.Logger().Error("Downloader: failed to update item record with download ID", "error", err)
		return
	}

	audioURL := fileClient.GetFileURL(download, "file")
	title := download.GetString("title")
	description := download.GetString("description")
	duration := download.GetFloat("duration")

	if description == "" {
		description = "No description available."
	}

	rss_utils.AddItemToPodcast(&p, title, audioURL, description, download.Id, audioURL, int64(duration))

	if err := rss_utils.UpdateXMLFile(app, fileClient, p, podcast); err != nil {
		app.Logger().Error("Downloader: failed to update XML file", "error", err)
		return
	}

	itemRecord.Set("status", "SUCCESS")
	if err := app.Save(itemRecord); err != nil {
		app.Logger().Error("Downloader: failed to update item record status to SUCCESS", "error", err)
		return
	}

	downloadSize := download.GetInt("size")
	monthlyUsage.Set("usage", currentUsage+downloadSize)
	if err := app.Save(monthlyUsage); err != nil {
		app.Logger().Error("Downloader: failed to update monthly usage", "error", err)
	}
}
