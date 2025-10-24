package downloader

import (
	"fmt"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/ytdlp"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/wader/goutubedl"
)

func resetHangingJobs(app *pocketbase.PocketBase) {
	hangingQueues, err := app.FindRecordsByFilter(collections.Queue, "status={:status}", "", 0, 0, dbx.Params{"status": "PROCESSING"})
	if err != nil {
		app.Logger().Error("Downloader: failed to query for hanging jobs", "error", err)
		return
	}

	for _, q := range hangingQueues {
		q.Set("status", "PENDING")
		q.Set("worker_id", nil)
		if err := app.Save(q); err != nil {
			app.Logger().Error("Downloader: failed to reset hanging job", "job_id", q.Id, "error", err)
		}
	}
}

func setupYtdlpClient(app *pocketbase.PocketBase, queue *core.Record) (*ytdlp.Client, error) {
	ytdlpClient := ytdlp.New(app)
	if ytdlpClient == nil {
		return nil, fmt.Errorf("failed to initialize ytdlp client")
	}

	retryCount := queue.GetInt("retry_count")
	if retryCount > 0 {
		ytdlpClient.SwitchProxy(retryCount)
	} else {
		return ytdlpClient, nil
	}

	currentProxy := ytdlpClient.GetCurrentProxyKey()
	queue.Set("last_proxy", currentProxy)
	if err := app.Save(queue); err != nil {
		app.Logger().Warn("Downloader: failed to update queue record with proxy info", "error", err)
	}

	return ytdlpClient, nil
}

func getMonthlyUsage(app *pocketbase.PocketBase, user string) (*core.Record, error) {
	usageRecords, err := app.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{"user": user})
	if err != nil || len(usageRecords) == 0 {
		return nil, fmt.Errorf("failed to find monthly usage record: %w", err)
	}
	return usageRecords[0], nil
}

func calculateFileSize(result *goutubedl.Result) int {
	if result.Info.Filesize != 0 {
		return int(result.Info.Filesize)
	}
	length := result.Info.Duration
	return int(float64(length) * 25000)
}

func checkUsageLimit(app *pocketbase.PocketBase, monthlyUsage *core.Record, fileSize int, record *core.Record) bool {
	usageLimit := monthlyUsage.GetInt("limit")
	currentUsage := monthlyUsage.GetInt("usage")
	exceedsLimit := currentUsage > usageLimit || (currentUsage+fileSize) > usageLimit
	if exceedsLimit {
		record.Set("status", "ERROR")
		record.Set("error", "Failed to add item to podcast: Monthly usage limit exceeded")
		if err := app.Save(record); err != nil {
			app.Logger().Error("Downloader: failed to update item record status to ERROR", "error", err)
		}
		return false
	}
	return true
}

func checkDownloadExists(app *pocketbase.PocketBase, videoId string, record, queue *core.Record) bool {
	existingDownload, err := app.FindFirstRecordByData(collections.Downloads, "video_id", videoId)
	if err == nil && existingDownload != nil && existingDownload.Get("file") != "" {
		record.Set("download", existingDownload.Id)
		record.Set("status", "SUCCESS")
		if err := app.Save(record); err != nil {
			return false
		}

		queue.Set("status", "COMPLETED")
		if err := app.Save(queue); err != nil {
			app.Logger().Error("Downloader: failed to update job status to COMPLETED", "job_id", queue.Id, "error", err)
		}

		return true
	}
	return false
}

func updateMonthlyUsage(app *pocketbase.PocketBase, monthlyUsage *core.Record, currentUsage, fileSize int) {
	monthlyUsage.Set("usage", currentUsage+fileSize)
	if err := app.Save(monthlyUsage); err != nil {
		app.Logger().Error("Downloader: failed to update monthly usage", "error", err)
	}
}

func createDownloadRecord(app *pocketbase.PocketBase, result *goutubedl.Result) (*core.Record, error) {
	downloads, err := app.FindCollectionByNameOrId(collections.Downloads)
	if err != nil {
		return nil, err
	}

	download := core.NewRecord(downloads)
	download.Set("title", result.Info.Title)
	download.Set("duration", result.Info.Duration)
	download.Set("channel", result.Info.Channel)
	download.Set("description", result.Info.Description)
	download.Set("video_id", result.Info.ID)
	if err := app.Save(download); err != nil {
		return nil, err
	}

	return download, nil
}
