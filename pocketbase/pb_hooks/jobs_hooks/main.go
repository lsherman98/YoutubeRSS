package jobs_hooks

import (
	"os"
	"regexp"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/webhook_client"
	"github.com/lsherman98/yt-rss/pocketbase/ytdlp"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordCreateRequest(collections.Jobs).BindFunc(func(e *core.RecordRequestEvent) error {
		url := e.Record.GetString("url")
		youtubeUrlRegex := regexp.MustCompile(`^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$`)

		if !youtubeUrlRegex.MatchString(url) {
			return e.BadRequestError("Invalid YouTube URL", map[string]any{})
		}

		return e.Next()
	})

	app.OnRecordAfterCreateSuccess(collections.Jobs).BindFunc(func(e *core.RecordEvent) error {
		job := e.Record
		url := job.GetString("url")
		user := job.GetString("user")

		downloads, err := e.App.FindCollectionByNameOrId(collections.Downloads)
		if err != nil {
			e.App.Logger().Error("Jobs Hooks: failed to find downloads collection: " + err.Error())
			return e.Next()
		}

		download := core.NewRecord(downloads)

		monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
			"user": user,
		})
		if err != nil || monthlyUsageRecords == nil {
			e.App.Logger().Error("Jobs Hooks: failed to find monthly usage record: " + err.Error())
			return e.Next()
		}
		monthlyUsage := monthlyUsageRecords[0]

		webhookClient := webhook_client.New(user, e.App, job)
		if webhookClient != nil {
			webhookClient.Send("CREATED")
		}

		routine.FireAndForget(func() {
			job.Set("status", "STARTED")
			if err := e.App.Save(job); err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to update job status to STARTED: " + err.Error())
				return
			}

			if webhookClient != nil {
				webhookClient.Send("STARTED")
			}

			ytdlp := ytdlp.New(e.App)
			if ytdlp == nil {
				e.App.Logger().Error("Jobs Hooks: failed to initialize ytdlp")
				return
			}

			result, err := ytdlp.GetInfo(url)
			if err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to get video info: " + err.Error())
				return
			}

			downloadSize := result.Info.Filesize
			if downloadSize == 0 {
				downloadSize = result.Info.FilesizeApprox
			}
			usageLimit := monthlyUsage.GetInt("limit")
			currentUsage := monthlyUsage.GetInt("usage")

			if currentUsage > usageLimit || (currentUsage+int(downloadSize)) > usageLimit {
				job.Set("status", "ERROR")
				job.Set("error", "Monthly usage limit exceeded")
				if err := e.App.Save(job); err != nil {
					e.App.Logger().Error("Jobs Hooks: failed to update job status to ERROR: " + err.Error())
					return
				}
				if webhookClient != nil {
					webhookClient.Send("ERROR")
				}
				return
			}

			job.Set("status", "PROCESSING")
			if err := e.App.Save(job); err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to update job status to PROCESSING: " + err.Error())
				return
			}

			videoId := result.Info.ID
			existingDownload, err := e.App.FindFirstRecordByData(collections.Downloads, "video_id", videoId)
			if err == nil && existingDownload != nil {
				download = existingDownload
			} else {
				audio, path, err := ytdlp.Download(url, download, result)
				if err != nil {
					e.App.Logger().Error("Jobs Hooks: failed to download audio: " + err.Error())
					job.Set("status", "ERROR")
					job.Set("error", err.Error())
					if webhookClient != nil {
						webhookClient.Send("ERROR")
					}
					return
				}
				defer audio.Close()

				if err := e.App.Save(download); err != nil {
					e.App.Logger().Error("Jobs Hooks: failed to save download record: " + err.Error())
					return
				}

				if err := os.Remove(path); err != nil {
					e.App.Logger().Error("Jobs Hooks: failed to remove temp file: " + err.Error())
					return
				}
			}

			job.Set("download", download.Id)
			job.Set("status", "SUCCESS")
			if err := e.App.Save(job); err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to update job status to SUCCESS: " + err.Error())
				return
			}

			if webhookClient != nil {
				webhookClient.Send("SUCCESS")
			}

			monthlyUsage.Set("usage", currentUsage+int(downloadSize))
			if err := e.App.Save(monthlyUsage); err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to update monthly usage: " + err.Error())
				return
			}
		})

		return e.Next()
	})

	return nil
}
