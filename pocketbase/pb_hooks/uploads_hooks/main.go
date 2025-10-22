package uploads_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordCreateRequest(collections.Uploads).BindFunc(func(e *core.RecordRequestEvent) error {
		user, err := e.App.FindRecordById(collections.Users, e.Auth.Id)
		if err != nil {
			return e.ForbiddenError("user not found", nil)
		}

		tier, err := e.App.FindRecordById(collections.SubscriptionTiers, user.GetString("tier"))
		if err != nil {
			return e.ForbiddenError("subscription tier not found", nil)
		}

		monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
			"user": e.Auth.Id,
		})
		if err != nil || len(monthlyUsageRecords) == 0 {
			e.App.Logger().Error("Uploads Hooks: failed to find monthly usage record: " + err.Error())
			return e.Next()
		}
		monthlyUsage := monthlyUsageRecords[0]

		if tier.GetString("lookup_key") == "free" && monthlyUsage.GetInt("uploads") >= 15 {
			return e.ForbiddenError("Free tier users can only upload 15 files per month. Please upgrade your subscription to continue uploading.", nil)
		}

		if (tier.GetString("lookup_key") == "basic_monthly" || tier.GetString("lookup_key") == "basic_yearly") && monthlyUsage.GetInt("uploads") >= 50 {
			return e.ForbiddenError("Basic tier users can only upload 50 files per month. Please upgrade your subscription to continue uploading.", nil)
		}

		return e.Next()
	})

	app.OnRecordAfterCreateSuccess(collections.Uploads).BindFunc(func(e *core.RecordEvent) error {
		itemsCollection, err := e.App.FindCollectionByNameOrId(collections.Items)
		if err != nil {
			e.App.Logger().Error("Uploads Hooks: failed to find items collection: " + err.Error())
			return e.Next()
		}

		itemRecord := core.NewRecord(itemsCollection)
		itemRecord.Set("user", e.Record.GetString("user"))
		itemRecord.Set("podcast", e.Record.GetString("podcast"))
		itemRecord.Set("type", "upload")
		itemRecord.Set("upload", e.Record.Id)
		itemRecord.Set("status", "SUCCESS")
		if err := e.App.Save(itemRecord); err != nil {
			return e.Next()
		}

		e.Record.Set("item", itemRecord.Id)
		if err := e.App.Save(e.Record); err != nil {
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
