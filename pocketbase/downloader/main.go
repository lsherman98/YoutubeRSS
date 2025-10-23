package downloader

import (
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
)

func Init(app *pocketbase.PocketBase) error {
	numWorkers, err := strconv.ParseInt(os.Getenv("DOWNLOAD_MAX_WORKERS"), 10, 64)
	if err != nil || numWorkers <= 0 {
		app.Logger().Info("DOWNLOAD_MAX_WORKERS not set or invalid, defaulting to 2")
		numWorkers = 2
	}

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		resetHangingJobs(app)
		return se.Next()
	})

	routine.FireAndForget(func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			processQueue(app, numWorkers)
		}
	})

	app.Logger().Info("Downloader initialized", "num_workers", numWorkers)
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

func processQueue(app *pocketbase.PocketBase, numWorkers int64) {
	processingCount, err := app.CountRecords(collections.Queue, dbx.HashExp{"status": "PROCESSING"})
	if err != nil {
		app.Logger().Error("Downloader: failed to get processing job count", "error", err)
		return
	}

	if processingCount >= numWorkers {
		return
	}

	availableWorkers := numWorkers - processingCount

	jobsToProcess, err := app.FindRecordsByFilter(collections.Queue, "status={:status}", "+updated", int(availableWorkers), 0, dbx.Params{"status": "PENDING"})
	if err != nil {
		app.Logger().Error("Downloader: failed to fetch jobs from queue", "error", err)
		return
	}

	for _, qr := range jobsToProcess {
		queueRecordId := qr.Id
		routine.FireAndForget(func() {
			queueRecord, err := app.FindRecordById(collections.Queue, queueRecordId)
			if err != nil {
				app.Logger().Error("Downloader: failed to refetch queue record", "queue_id", queueRecordId, "error", err)
				return
			}

			if queueRecord.GetString("status") != "PENDING" {
				app.Logger().Error("Downloader: job already claimed by another worker", "queue_id", queueRecordId)
				return
			}

			workerId := uuid.New().String()
			queueRecord.Set("status", "PROCESSING")
			queueRecord.Set("worker_id", workerId)
			if err := app.Save(queueRecord); err != nil {
				app.Logger().Error("Downloader: failed to claim job", "job_id", queueRecordId, "error", err)
				return
			}

			recordId := queueRecord.GetString("record_id")
			collection := queueRecord.GetString("collection")

			record, err := app.FindRecordById(collection, recordId)
			if err != nil {
				app.Logger().Error("Downloader: failed to find record for job", "record_id", recordId, "collection", collection, "job_id", queueRecordId, "error", err)
				queueRecord.Set("status", "FAILED")
				queueRecord.Set("worker_id", nil)
				if err := app.Save(queueRecord); err != nil {
					app.Logger().Error("Downloader: failed to update job status to FAILED", "job_id", queueRecordId, "error", err)
				}
				return
			}

			var jobErr error
			switch collection {
			case collections.Jobs:
				jobErr = processJob(app, record, queueRecord)
			case collections.Items:
				jobErr = processItem(app, record, queueRecord)
			}

			if jobErr != nil {
				app.Logger().Error("Downloader: job processing failed", "job_id", queueRecord.Id, "error", jobErr)
				handleJobFailure(app, record, queueRecord, jobErr)
				return
			}

			queueRecord.Set("status", "COMPLETED")
			if err := app.Save(queueRecord); err != nil {
				app.Logger().Error("Downloader: failed to update job status to COMPLETED", "job_id", queueRecordId, "error", err)
			}
		})
	}
}

func handleJobFailure(app *pocketbase.PocketBase, record *core.Record, queueRecord *core.Record, jobErr error) {
	retryCount := queueRecord.GetInt("retry_count") + 1
	maxRetries := 14

	queueRecord.Set("retry_count", retryCount)
	queueRecord.Set("last_error", jobErr.Error())

	if retryCount >= maxRetries {
		app.Logger().Error("Downloader: job failed after max retries", "job_id", queueRecord.Id)

		queueRecord.Set("status", "FAILED")
		queueRecord.Set("worker_id", nil)
		if err := app.Save(queueRecord); err != nil {
			app.Logger().Error("Downloader: failed to save queue record as FAILED", "job_id", queueRecord.Id, "error", err)
		}

		record.Set("status", "ERROR")
		record.Set("error", jobErr.Error())
		if err := app.Save(record); err != nil {
			app.Logger().Error("Downloader: failed to update record status to ERROR", "record_id", record.Id, "error", err)
		}
	} else {
		app.Logger().Info("Job failed, will retry", "job_id", queueRecord.Id, "retry_count", retryCount, "error", jobErr.Error())

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

	monthlyUsage, err := getMonthlyUsage(app, user)
	if err != nil {
		return err
	}

	job.Set("status", "STARTED")
	if err := app.Save(job); err != nil {
		return err
	}

	ytdlpClient, err := setupYtdlpClient(app, queueRecord)
	if err != nil {
		return err
	}

	result, err := ytdlpClient.GetInfo(url)
	if err != nil {
		return err
	}

	fileSize := calculateFileSize(result)

	exceedsLimit, currentUsage, _ := checkUsageLimit(monthlyUsage, fileSize)
	if exceedsLimit {
		job.Set("status", "ERROR")
		job.Set("error", "Monthly usage limit exceeded")
		if err := app.Save(job); err != nil {
			app.Logger().Error("Downloader: failed to update job status to ERROR", "error", err)
		}
		return nil
	}

	job.Set("title", result.Info.Title)
	job.Set("status", "PROCESSING")
	if err := app.Save(job); err != nil {
		return err
	}

	retryCount := queueRecord.GetInt("retry_count")
	download, err := getOrCreateDownload(app, ytdlpClient, url, result.Info.ID, result, retryCount)
	if err != nil {
		return err
	}

	job.Set("download", download.Id)
	job.Set("status", "SUCCESS")
	if err := app.Save(job); err != nil {
		return err
	}

	updateMonthlyUsage(app, monthlyUsage, currentUsage, fileSize)

	return nil
}

func processItem(app *pocketbase.PocketBase, itemRecord *core.Record, queueRecord *core.Record) error {
	url := itemRecord.GetString("url")
	podcastId := itemRecord.GetString("podcast")
	user := itemRecord.GetString("user")

	podcast, err := app.FindRecordById(collections.Podcasts, podcastId)
	if err != nil {
		return err
	}

	fileClient, err := files.NewFileClient(app, podcast, "file")
	if err != nil {
		return err
	}

	content, err := fileClient.GetXMLFile()
	if err != nil {
		return err
	}

	p, err := rss_utils.ParseXML(content.String())
	if err != nil {
		return err
	}

	monthlyUsage, err := getMonthlyUsage(app, user)
	if err != nil {
		return err
	}

	ytdlpClient, err := setupYtdlpClient(app, queueRecord)
	if err != nil {
		return err
	}

	result, err := ytdlpClient.GetInfo(url)
	if err != nil {
		return err
	}

	itemRecord.Set("title", result.Info.Title)
	if err := app.Save(itemRecord); err != nil {
		return err
	}

	fileSize := calculateFileSize(result)

	exceedsLimit, currentUsage, _ := checkUsageLimit(monthlyUsage, fileSize)
	if exceedsLimit {
		itemRecord.Set("status", "ERROR")
		itemRecord.Set("error", "Failed to add item to podcast: Monthly usage limit exceeded")
		if err := app.Save(itemRecord); err != nil {
			app.Logger().Error("Downloader: failed to update item record status to ERROR", "error", err)
		}
		return nil
	}

	retryCount := queueRecord.GetInt("retry_count")
	download, err := getOrCreateDownload(app, ytdlpClient, url, result.Info.ID, result, retryCount)
	if err != nil {
		return err
	}

	itemRecord.Set("download", download.Id)
	if err := app.Save(itemRecord); err != nil {
		return err
	}

	audioURL := fileClient.GetFileURL(download, "file")
	title := download.GetString("title")
	description := download.GetString("description")
	duration := download.GetFloat("duration")

	if description == "" {
		description = "No description available."
	}

	now := time.Now()
	rss_utils.AddItemToPodcast(&p, title, audioURL, description, download.Id, audioURL, int64(duration), &now)

	if err := rss_utils.UpdateXMLFile(app, fileClient, p, podcast); err != nil {
		return err
	}

	itemRecord.Set("status", "SUCCESS")
	if err := app.Save(itemRecord); err != nil {
		return err
	}

	updateMonthlyUsage(app, monthlyUsage, currentUsage, fileSize)

	return nil
}
