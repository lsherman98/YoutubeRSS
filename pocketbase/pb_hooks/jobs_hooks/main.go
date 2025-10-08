package jobs_hooks

import (
	"os"
	"regexp"
	"time"

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
			return e.Next()
		}

		download := core.NewRecord(downloads)

		webhookClient := webhook_client.New(user, e.App, job)
		if webhookClient != nil {
			webhookClient.Send("CREATED")
		}

		routine.FireAndForget(func() {
			job.Set("status", "STARTED")
			if err := e.App.Save(job); err != nil {
				return
			}

			if webhookClient != nil {
				webhookClient.Send("STARTED")
			}

			ytdlp := ytdlp.New()
			if ytdlp == nil {
				return
			}

			result, err := ytdlp.GetInfo(url)
			if err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to get video info: " + err.Error())
				return
			}

			job.Set("status", "PROCESSING")
			if err := e.App.Save(job); err != nil {
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
					return
				}

				if err := os.Remove(path); err != nil {
					return
				}
			}

			job.Set("download", download.Id)
			job.Set("status", "SUCCESS")
			if err := e.App.Save(job); err != nil {
				return
			}

			if webhookClient != nil {
				webhookClient.Send("SUCCESS")
			}

			monthlyUsage, err := e.App.FindFirstRecordByFilter(collections.MonthlyUsage, "user = {:user} && billing_cycle_end > {:now}", dbx.Params{
				"user": user,
				"now":  time.Now().UTC().Format(time.RFC3339),
			})
			if err != nil || monthlyUsage == nil {
				return
			}

			downloadSize := download.GetInt("size")
			currentUsage := monthlyUsage.GetInt("usage")
			monthlyUsage.Set("usage", currentUsage+downloadSize)

			if err := e.App.Save(monthlyUsage); err != nil {
				return
			}
		})

		return e.Next()
	})

	return nil
}
