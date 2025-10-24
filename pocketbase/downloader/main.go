package downloader

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/oxylabs"
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

	oxylabClient, err := oxylabs.NewClient()
	if err != nil || oxylabClient == nil {
		return fmt.Errorf("failed to initialize oxylabClient: %w", err)
	}

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		resetHangingJobs(app)
		return se.Next()
	})

	routine.FireAndForget(func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			processQueue(app, oxylabClient, numWorkers)
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

	queue := core.NewRecord(queueCollection)
	queue.Set("record_id", record.Id)
	queue.Set("collection", collection)
	queue.Set("status", "PENDING")
	if err := app.Save(queue); err != nil {
		return err
	}

	return nil
}

func processQueue(app *pocketbase.PocketBase, oxylabClient *oxylabs.Client, numWorkers int64) {
	processingCount, err := app.CountRecords(collections.Queue, dbx.HashExp{"status": "PROCESSING", "oxylab_job_id": nil})
	if err != nil {
		app.Logger().Error("Downloader: failed to get processing job count", "error", err)
		return
	}

	if processingCount >= numWorkers {
		return
	}

	availableWorkers := numWorkers - processingCount

	queuesToProcess, err := app.FindRecordsByFilter(collections.Queue, "status={:status}", "+updated", int(availableWorkers), 0, dbx.Params{"status": "PENDING"})
	if err != nil {
		app.Logger().Error("Downloader: failed to fetch jobs from queue", "error", err)
		return
	}

	for _, q := range queuesToProcess {
		routine.FireAndForget(func() {
			queue, err := app.FindRecordById(collections.Queue, q.Id)
			if err != nil {
				app.Logger().Error("Downloader: failed to refetch queue record", "queue_id", q.Id, "error", err)
				return
			}

			if queue.GetString("status") != "PENDING" {
				app.Logger().Error("Downloader: job already claimed by another worker", "queue_id", queue.Id)
				return
			}

			workerId := uuid.New().String()
			queue.Set("status", "PROCESSING")
			queue.Set("worker_id", workerId)
			if err := app.Save(queue); err != nil {
				app.Logger().Error("Downloader: failed to claim job", "job_id", queue.Id, "error", err)
				return
			}

			recordId := queue.GetString("record_id")
			collection := queue.GetString("collection")

			record, err := app.FindRecordById(collection, recordId)
			if err != nil {
				app.Logger().Error("Downloader: failed to find record for job", "record_id", recordId, "collection", collection, "job_id", queue.Id, "error", err)
				queue.Set("status", "FAILED")
				queue.Set("worker_id", nil)
				if err := app.Save(queue); err != nil {
					app.Logger().Error("Downloader: failed to update job status to FAILED", "job_id", queue.Id, "error", err)
				}
				return
			}

			var jobErr error
			switch collection {
			case collections.Jobs:
				jobErr = processJob(app, oxylabClient, record, queue)
			case collections.Items:
				jobErr = processItem(app, oxylabClient, record, queue)
			}

			if jobErr != nil {
				app.Logger().Error("Downloader: job processing failed", "job_id", queue.Id, "error", jobErr)
				handleJobFailure(app, record, queue, jobErr)
				return
			}
		})
	}
}

func handleJobFailure(app *pocketbase.PocketBase, record *core.Record, queue *core.Record, jobErr error) {
	retryCount := queue.GetInt("retry_count")
	maxRetries := 36

	queue.Set("retry_count", retryCount+1)
	queue.Set("last_error", jobErr.Error())

	if retryCount+1 >= maxRetries {
		app.Logger().Error("Downloader: job failed after max retries", "job_id", queue.Id)

		queue.Set("status", "FAILED")
		queue.Set("worker_id", nil)
		if err := app.Save(queue); err != nil {
			app.Logger().Error("Downloader: failed to save queue record as FAILED", "job_id", queue.Id, "error", err)
		}

		record.Set("status", "ERROR")
		record.Set("error", jobErr.Error())
		if err := app.Save(record); err != nil {
			app.Logger().Error("Downloader: failed to update record status to ERROR", "record_id", record.Id, "error", err)
		}
	} else {
		app.Logger().Info("Job failed, will retry", "job_id", queue.Id, "retry_count", retryCount+1, "error", jobErr.Error())

		queue.Set("status", "PENDING")
		queue.Set("worker_id", nil)
		if err := app.Save(queue); err != nil {
			app.Logger().Error("Failed to save queue record for retry", "job_id", queue.Id, "error", err)
		}
	}
}

func processJob(app *pocketbase.PocketBase, oxylabClient *oxylabs.Client, job *core.Record, queue *core.Record) error {
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

	ytdlpClient, err := setupYtdlpClient(app, queue)
	if err != nil {
		return err
	}

	result, err := ytdlpClient.GetInfo(url)
	if err != nil {
		return err
	}

	fileSize := calculateFileSize(result)
	ok := checkUsageLimit(app, monthlyUsage, fileSize, job)
	if !ok {
		return nil
	}

	job.Set("title", result.Info.Title)
	job.Set("status", "PROCESSING")
	if err := app.Save(job); err != nil {
		return err
	}

	ok = checkDownloadExists(app, result.Info.ID, job, queue)
	if ok {
		updateMonthlyUsage(app, monthlyUsage, monthlyUsage.GetInt("usage"), fileSize)
		return nil
	}

	download, err := createDownloadRecord(app, result)
	if err != nil {
		return err
	}

	resp, err := oxylabClient.Start(result.Info.ID, queue.Id)
	if err != nil {
		app.Logger().Error("Downloader: failed to start Oxylabs job", "error", err)
	} else {
		queue.Set("oxylab_job_id", resp.ID)
		if err := app.Save(queue); err != nil {
			return err
		}
		return nil
	}
	

	retryCount := queue.GetInt("retry_count")
	file, path, err := ytdlpClient.Download(url, result, retryCount)
	if err != nil {
		return err
	}

	download.Set("file", file)
	download.Set("size", file.Size)
	if err := app.Save(download); err != nil {
		return err
	}

	err = os.Remove(path)
	if err != nil {
		app.Logger().Error("Downloader: failed to delete converted file", "error", err)
	}

	job.Set("download", download.Id)
	job.Set("status", "SUCCESS")
	if err := app.Save(job); err != nil {
		return err
	}

	queue.Set("status", "COMPLETED")
	if err := app.Save(queue); err != nil {
		app.Logger().Error("Downloader: failed to update job status to COMPLETED", "job_id", queue.Id, "error", err)
	}

	updateMonthlyUsage(app, monthlyUsage, monthlyUsage.GetInt("usage"), fileSize)

	return nil
}

func processItem(app *pocketbase.PocketBase, oxylabClient *oxylabs.Client, item *core.Record, queue *core.Record) error {
	url := item.GetString("url")
	podcastId := item.GetString("podcast")
	user := item.GetString("user")

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

	ytdlpClient, err := setupYtdlpClient(app, queue)
	if err != nil {
		return err
	}

	result, err := ytdlpClient.GetInfo(url)
	if err != nil {
		return err
	}

	item.Set("title", result.Info.Title)
	if err := app.Save(item); err != nil {
		return err
	}

	fileSize := calculateFileSize(result)
	ok := checkUsageLimit(app, monthlyUsage, fileSize, item)
	if !ok {
		return nil
	}

	ok = checkDownloadExists(app, result.Info.ID, item, queue)
	if ok {
		updateMonthlyUsage(app, monthlyUsage, monthlyUsage.GetInt("usage"), fileSize)
		return nil
	}

	download, err := createDownloadRecord(app, result)
	if err != nil {
		return err
	}

	resp, err := oxylabClient.Start(result.Info.ID, queue.Id)
	if err == nil {
		queue.Set("oxylab_job_id", resp.ID)
		if err := app.Save(queue); err != nil {
			return err
		}
		return nil
	} else {
		app.Logger().Error("Downloader: failed to start Oxylabs job", "error", err)
	}

	retryCount := queue.GetInt("retry_count")
	file, path, err := ytdlpClient.Download(url, result, retryCount)
	if err != nil {
		return err
	}

	download.Set("file", file)
	download.Set("size", file.Size)
	if err := app.Save(download); err != nil {
		return err
	}

	err = os.Remove(path)
	if err != nil {
		app.Logger().Error("Downloader: failed to delete converted file", "error", err)
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

	item.Set("download", download.Id)
	item.Set("status", "SUCCESS")
	if err := app.Save(item); err != nil {
		return err
	}

	updateMonthlyUsage(app, monthlyUsage, monthlyUsage.GetInt("usage"), fileSize)

	return nil
}
