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
		if err != nil || monthlyUsageRecords == nil {
			e.App.Logger().Error("Jobs Hooks: failed to find monthly usage record: " + err.Error())
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

		monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
			"user": user,
		})
		if err != nil || monthlyUsageRecords == nil {
			e.App.Logger().Error("Jobs Hooks: failed to find monthly usage record: " + err.Error())
			return e.Next()
		}

		webhookClient := webhook_client.New(user, e.App, job)
		if webhookClient != nil {
			webhookClient.Send("CREATED")
		}

		downloader.AddJob(e.App, job, collections.Jobs)

		return e.Next()
	})

	return nil
}
