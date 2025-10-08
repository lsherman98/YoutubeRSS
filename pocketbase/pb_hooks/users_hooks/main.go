package users_hooks

import (
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordAfterCreateSuccess(collections.Users).BindFunc(func(e *core.RecordEvent) error {
		userId := e.Record.Id

		monthlyUsageCollection, err := e.App.FindCollectionByNameOrId(collections.MonthlyUsage)
		if err != nil {
			e.App.Logger().Error("Users Hooks: failed to find monthly usage collection: " + err.Error())
			return e.Next()
		}

		usageRecord := core.NewRecord(monthlyUsageCollection)
		usageRecord.Set("user", userId)
		usageRecord.Set("billing_cycle_start", time.Now().UTC().Format(time.RFC3339))
		usageRecord.Set("billing_cycle_end", time.Now().AddDate(0, 1, 0).UTC().Format(time.RFC3339))
		if err := e.App.Save(usageRecord); err != nil {
			e.App.Logger().Error("Users Hooks: failed to create monthly usage record: " + err.Error())
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
