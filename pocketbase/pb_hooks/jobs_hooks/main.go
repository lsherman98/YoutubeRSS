package jobs_hooks

import (
	"regexp"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/downloader"
	"github.com/lsherman98/yt-rss/pocketbase/webhook_client"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordCreateRequest(collections.Jobs).BindFunc(func(e *core.RecordRequestEvent) error {
		url := e.Record.GetString("url")
		youtubeUrlRegex := regexp.MustCompile(`^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$`)

		if !youtubeUrlRegex.MatchString(url) {
			return e.BadRequestError("Invalid YouTube URL", nil)
		}

		monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
			"user": e.Auth.Id,
		})
		if err != nil || len(monthlyUsageRecords) == 0 {
			return e.Next()
		}
		monthlyUsage := monthlyUsageRecords[0]

		usageLimit := monthlyUsage.GetInt("limit")
		currentUsage := monthlyUsage.GetInt("usage")

		if currentUsage >= usageLimit {
			return e.ForbiddenError("Monthly usage limit exceeded", nil)
		}

		return e.Next()
	})

	app.OnRecordAfterCreateSuccess(collections.Jobs).BindFunc(func(e *core.RecordEvent) error {
		job := e.Record
		user := job.GetString("user")

		webhookClient := webhook_client.New(user, e.App, job)
		if webhookClient != nil {
			err := webhookClient.Send("CREATED")
			if err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to send CREATED webhook notification", "error", err)
			}
		}

		if err := downloader.AddJob(e.App, job, collections.Jobs); err != nil {
			e.App.Logger().Error("Jobs Hooks: failed to add job to downloader queue: " + err.Error())
		}

		return e.Next()
	})

	app.OnRecordAfterUpdateSuccess(collections.Jobs).BindFunc(func(e *core.RecordEvent) error {
		job := e.Record
		user := job.GetString("user")

		webhookClient := webhook_client.New(user, app, job)
		if webhookClient == nil {
			return e.Next()
		}

		switch job.GetString("status") {
		case "STARTED":
			err := webhookClient.Send("STARTED")
			if err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to send STARTED webhook notification", "error", err)
			}
		case "SUCCESS":
			err := webhookClient.Send("SUCCESS")
			if err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to send SUCCESS webhook notification", "error", err)
			}
		case "ERROR":
			err := webhookClient.Send("ERROR")
			if err != nil {
				e.App.Logger().Error("Jobs Hooks: failed to send ERROR webhook notification", "error", err)
			}
		}

		return e.Next()
	})

	return nil
}
