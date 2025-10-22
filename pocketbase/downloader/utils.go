package downloader

import (
	"fmt"
	"os"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/ytdlp"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/wader/goutubedl"
)

func resetHangingJobs(app *pocketbase.PocketBase) {
	hangingQueueJobs, err := app.FindRecordsByFilter(collections.Queue, "status={:status}", "", 0, 0, dbx.Params{"status": "PROCESSING"})
	if err != nil {
		app.Logger().Error("Downloader: failed to query for hanging jobs", "error", err)
		return
	}

	for _, qj := range hangingQueueJobs {
		qj.Set("status", "PENDING")
		qj.Set("worker_id", nil)
		if err := app.Save(qj); err != nil {
			app.Logger().Error("Downloader: failed to reset hanging job", "job_id", qj.Id, "error", err)
		}
	}
}

func setupYtdlpClient(app *pocketbase.PocketBase, queueRecord *core.Record) (*ytdlp.Client, error) {
	ytdlpClient := ytdlp.New(app)
	if ytdlpClient == nil {
		return nil, fmt.Errorf("failed to initialize ytdlp client")
	}

	retryCount := queueRecord.GetInt("retry_count")
	if retryCount > 0 {
		ytdlpClient.SwitchProxy(retryCount)
	}

	currentProxy := ytdlpClient.GetCurrentProxyKey()
	queueRecord.Set("last_proxy", currentProxy)
	if err := app.Save(queueRecord); err != nil {
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

func checkUsageLimit(monthlyUsage *core.Record, fileSize int) (bool, int, int) {
	usageLimit := monthlyUsage.GetInt("limit")
	currentUsage := monthlyUsage.GetInt("usage")
	exceedsLimit := currentUsage > usageLimit || (currentUsage+fileSize) > usageLimit
	return exceedsLimit, currentUsage, usageLimit
}

func getOrCreateDownload(app *pocketbase.PocketBase, ytdlpClient *ytdlp.Client, url string, videoId string, result *goutubedl.Result, retryCount int) (*core.Record, error) {
	existingDownload, err := app.FindFirstRecordByData(collections.Downloads, "video_id", videoId)
	if err == nil && existingDownload != nil {
		return existingDownload, nil
	}

	downloads, err := app.FindCollectionByNameOrId(collections.Downloads)
	if err != nil {
		return nil, err
	}

	download := core.NewRecord(downloads)
	audio, path, err := ytdlpClient.Download(url, download, result, retryCount)
	if err != nil {
		return nil, err
	}
	defer audio.Close()

	if err := app.Save(download); err != nil {
		return nil, err
	}

	if err := os.Remove(path); err != nil {
		app.Logger().Warn("Downloader: failed to remove temp file", "error", err)
	}

	return download, nil
}

func updateMonthlyUsage(app *pocketbase.PocketBase, monthlyUsage *core.Record, currentUsage, fileSize int) {
	monthlyUsage.Set("usage", currentUsage+fileSize)
	if err := app.Save(monthlyUsage); err != nil {
		app.Logger().Error("Downloader: failed to update monthly usage", "error", err)
	}
}
