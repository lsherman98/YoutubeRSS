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
		ticker := time.NewTicker(10 * time.Second)
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
	queueRecord.Set("max_retries", 6)

	if err := app.Save(queueRecord); err != nil {
		return err
	}

	return nil
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
		queueRecordId := queueRecord.Id
		routine.FireAndForget(func() {
			workerId := uuid.New().String()
			err := app.RunInTransaction(func(txApp core.App) error {
				freshQr, err := txApp.FindRecordById(collections.Queue, queueRecordId)
				if err != nil {
					return err
				}

				if freshQr.GetString("status") != "PENDING" {
					return fmt.Errorf("job already taken")
				}

				freshQr.Set("status", "PROCESSING")
				freshQr.Set("worker_id", workerId)
				if err := txApp.Save(freshQr); err != nil {
					app.Logger().Error("Failed to claim job", "job_id", queueRecordId, "error", err)
					return err
				}
				return nil
			})

			if err != nil {
				return
			}

			freshQueueRecord, err := app.FindRecordById(collections.Queue, queueRecordId)
			if err != nil {
				app.Logger().Error("Failed to refetch queue record", "queue_id", queueRecordId, "error", err)
				return
			}

			app.Logger().Info("Processing job from queue",
				"queue_id", freshQueueRecord.Id,
				"worker_id", freshQueueRecord.GetString("worker_id"),
				"retry_count", freshQueueRecord.GetInt("retry_count"))

			recordId := freshQueueRecord.GetString("record_id")
			collectionName := freshQueueRecord.GetString("collection")

			record, err := app.FindRecordById(collectionName, recordId)
			if err != nil {
				app.Logger().Error("Failed to find record for job", "record_id", recordId, "collection", collectionName, "error", err)
				if err := app.Delete(freshQueueRecord); err != nil {
					app.Logger().Error("Failed to delete job from queue", "job_id", queueRecordId, "error", err)
				}
				return
			}

			var jobErr error
			switch collectionName {
			case collections.Jobs:
				jobErr = processJob(app, record, freshQueueRecord)
			case collections.Items:
				jobErr = processItem(app, record, freshQueueRecord)
			}

			if jobErr != nil {
				handleJobFailure(app, record, freshQueueRecord, jobErr)
				return
			}

			freshQueueRecord.Set("status", "COMPLETED")
			if err := app.Save(freshQueueRecord); err != nil {
				app.Logger().Error("Failed to update job status to COMPLETED", "job_id", queueRecordId, "error", err)
			}
		})
	}
}

func handleJobFailure(app *pocketbase.PocketBase, record *core.Record, queueRecord *core.Record, jobErr error) {
	retryCount := queueRecord.GetInt("retry_count")
	maxRetries := queueRecord.GetInt("max_retries")
	if maxRetries == 0 {
		maxRetries = 6
	}

	retryCount++
	queueRecord.Set("retry_count", retryCount)
	queueRecord.Set("last_error", jobErr.Error())

	if retryCount >= maxRetries {
		app.Logger().Error("Job failed after max retries",
			"queue_id", queueRecord.Id,
			"retry_count", retryCount,
			"error", jobErr.Error())

		queueRecord.Set("status", "FAILED")
		queueRecord.Set("worker_id", nil)

		if err := app.Save(queueRecord); err != nil {
			app.Logger().Error("Failed to save queue record as FAILED", "job_id", queueRecord.Id, "error", err)
		}

		record.Set("status", "ERROR")
		record.Set("error", jobErr.Error())
		if err := app.Save(record); err != nil {
			app.Logger().Error("Failed to update record status to ERROR", "record_id", record.Id, "error", err)
		}

		collectionName := queueRecord.GetString("collection")
		if collectionName == collections.Jobs {
			user := record.GetString("user")
			webhookClient := webhook_client.New(user, app, record)
			if webhookClient != nil {
				webhookClient.Send("ERROR")
			}
		}
	} else {
		app.Logger().Info("Job failed, will retry",
			"queue_id", queueRecord.Id,
			"retry_count", retryCount,
			"max_retries", maxRetries,
			"error", jobErr.Error())

		queueRecord.Set("status", "PENDING")
		queueRecord.Set("worker_id", nil)

		if err := app.Save(queueRecord); err != nil {
			app.Logger().Error("Failed to save queue record for retry", "job_id", queueRecord.Id, "error", err)
		}
	}
}

func processJob(app *pocketbase.PocketBase, job *core.Record, queueRecord *core.Record) error {
	url := job.GetString("url")
	user := job.GetString("user")

	downloads, err := app.FindCollectionByNameOrId(collections.Downloads)
	if err != nil {
		app.Logger().Error("Downloader: failed to find downloads collection", "error", err)
		return err
	}
	download := core.NewRecord(downloads)

	monthlyUsageRecords, err := app.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{"user": user})
	if err != nil || len(monthlyUsageRecords) == 0 {
		app.Logger().Error("Downloader: failed to find monthly usage record", "error", err, "user", user)
		return fmt.Errorf("failed to find monthly usage record: %w", err)
	}
	monthlyUsage := monthlyUsageRecords[0]

	webhookClient := webhook_client.New(user, app, job)

	job.Set("status", "STARTED")
	if err := app.Save(job); err != nil {
		app.Logger().Error("Downloader: failed to update job status to STARTED", "error", err)
		return err
	}
	if webhookClient != nil {
		webhookClient.Send("STARTED")
	}

	ytdlpClient := ytdlp.New(app)
	if ytdlpClient == nil {
		app.Logger().Error("Downloader: failed to initialize ytdlp")
		return fmt.Errorf("failed to initialize ytdlp client")
	}

	retryCount := queueRecord.GetInt("retry_count")
	ytdlpClient.SwitchProxy(retryCount)

	currentProxy := ytdlpClient.GetCurrentProxyKey()
	queueRecord.Set("last_proxy", currentProxy)
	if err := app.Save(queueRecord); err != nil {
		app.Logger().Warn("Downloader: failed to update queue record with proxy info", "error", err)
	}

	result, err := ytdlpClient.GetInfo(url)
	if err != nil {
		app.Logger().Error("Downloader: failed to get video info", "error", err)
		return err
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
		return nil
	}

	job.Set("status", "PROCESSING")
	if err := app.Save(job); err != nil {
		app.Logger().Error("Downloader: failed to update job status to PROCESSING", "error", err)
		return err
	}

	videoId := result.Info.ID
	existingDownload, err := app.FindFirstRecordByData(collections.Downloads, "video_id", videoId)
	if err == nil && existingDownload != nil {
		download = existingDownload
	} else {
		audio, path, err := ytdlpClient.Download(url, download, result, retryCount)
		if err != nil {
			app.Logger().Error("Downloader: failed to download audio", "error", err)
			return err
		}
		defer audio.Close()

		if err := app.Save(download); err != nil {
			app.Logger().Error("Downloader: failed to save download record", "error", err)
			return err
		}

		if err := os.Remove(path); err != nil {
			app.Logger().Error("Downloader: failed to remove temp file", "error", err)
		}
	}

	job.Set("download", download.Id)
	job.Set("status", "SUCCESS")
	if err := app.Save(job); err != nil {
		app.Logger().Error("Downloader: failed to update job status to SUCCESS", "error", err)
		return err
	}

	if webhookClient != nil {
		webhookClient.Send("SUCCESS")
	}

	monthlyUsage.Set("usage", currentUsage+int(fileSize))
	if err := app.Save(monthlyUsage); err != nil {
		app.Logger().Error("Downloader: failed to update monthly usage", "error", err)
	}

	return nil
}

func processItem(app *pocketbase.PocketBase, itemRecord *core.Record, queueRecord *core.Record) error {
	url := itemRecord.GetString("url")
	podcastId := itemRecord.GetString("podcast")
	user := itemRecord.GetString("user")

	podcast, err := app.FindRecordById(collections.Podcasts, podcastId)
	if err != nil {
		app.Logger().Error("Downloader: failed to find podcast record", "error", err)
		return err
	}

	fileClient, err := files.NewFileClient(app, podcast, "file")
	if err != nil {
		app.Logger().Error("Downloader: failed to create file client", "error", err)
		return err
	}

	content, err := fileClient.GetXMLFile()
	if err != nil {
		app.Logger().Error("Downloader: failed to get XML file", "error", err)
		return err
	}

	p, err := rss_utils.ParseXML(content.String())
	if err != nil {
		app.Logger().Error("Downloader: failed to parse XML file", "error", err)
		return err
	}

	monthlyUsageRecords, err := app.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{"user": user})
	if err != nil || len(monthlyUsageRecords) == 0 {
		app.Logger().Error("Downloader: failed to find monthly usage record", "error", err)
		return fmt.Errorf("failed to find monthly usage record: %w", err)
	}
	monthlyUsage := monthlyUsageRecords[0]

	downloads, err := app.FindCollectionByNameOrId(collections.Downloads)
	if err != nil {
		app.Logger().Error("Downloader: failed to find downloads collection", "error", err)
		return err
	}
	download := core.NewRecord(downloads)

	ytdlpClient := ytdlp.New(app)
	if ytdlpClient == nil {
		app.Logger().Error("Downloader: failed to initialize ytdlp")
		return fmt.Errorf("failed to initialize ytdlp client")
	}

	retryCount := queueRecord.GetInt("retry_count")
	ytdlpClient.SwitchProxy(retryCount)

	currentProxy := ytdlpClient.GetCurrentProxyKey()
	queueRecord.Set("last_proxy", currentProxy)
	if err := app.Save(queueRecord); err != nil {
		app.Logger().Warn("Downloader: failed to update queue record with proxy info", "error", err)
	}

	result, err := ytdlpClient.GetInfo(url)
	if err != nil {
		app.Logger().Error("Downloader: failed to get video info", "error", err)
		return err
	}

	itemRecord.Set("title", result.Info.Title)
	if err := app.Save(itemRecord); err != nil {
		app.Logger().Error("Downloader: failed to update item record title", "error", err)
		return err
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
		return nil
	}

	videoId := result.Info.ID
	existingDownload, err := app.FindFirstRecordByData(collections.Downloads, "video_id", videoId)
	if err == nil && existingDownload != nil {
		download = existingDownload
	} else {
		audio, path, err := ytdlpClient.Download(url, download, result, retryCount)
		if err != nil {
			app.Logger().Error("Downloader: failed to download audio", "error", err)
			return err
		}
		defer audio.Close()

		if err := app.Save(download); err != nil {
			app.Logger().Error("Downloader: failed to save download record", "error", err)
			return err
		}

		if err := os.Remove(path); err != nil {
			app.Logger().Error("Downloader: failed to remove temp file", "error", err)
		}
	}

	itemRecord.Set("download", download.Id)
	if err := app.Save(itemRecord); err != nil {
		app.Logger().Error("Downloader: failed to update item record with download ID", "error", err)
		return err
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
		return err
	}

	itemRecord.Set("status", "SUCCESS")
	if err := app.Save(itemRecord); err != nil {
		app.Logger().Error("Downloader: failed to update item record status to SUCCESS", "error", err)
		return err
	}

	downloadSize := download.GetInt("size")
	monthlyUsage.Set("usage", currentUsage+downloadSize)
	if err := app.Save(monthlyUsage); err != nil {
		app.Logger().Error("Downloader: failed to update monthly usage", "error", err)
	}

	return nil
}
