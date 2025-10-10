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

		freeTier, err := e.App.FindFirstRecordByData(collections.SubscriptionTiers, "price_key", "free")
		if err != nil {
			e.App.Logger().Error("Users Hooks: failed to find free subscription tier: " + err.Error())
			return e.Next()
		}

		e.Record.Set("tier", freeTier.Id)
		if err := e.App.Save(e.Record); err != nil {
			e.App.Logger().Error("Users Hooks: failed to set user tier: " + err.Error())
			return e.Next()
		}

		usageRecord := core.NewRecord(monthlyUsageCollection)
		usageRecord.Set("user", userId)
		usageRecord.Set("billing_cycle_start", time.Now().UTC().Format(time.RFC3339))
		usageRecord.Set("billing_cycle_end", time.Now().AddDate(0, 1, 0).UTC().Format(time.RFC3339))
		usageRecord.Set("tier", freeTier.Id)
		usageRecord.Set("limit", freeTier.Get("monthly_usage_limit"))
		if err := e.App.Save(usageRecord); err != nil {
			e.App.Logger().Error("Users Hooks: failed to create monthly usage record: " + err.Error())
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
