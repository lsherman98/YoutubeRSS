package cron_jobs

import (
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.Cron().MustAdd("CronJobMonthlyUsageReset", "0 */3 * * *", func() {
		usageCollection, err := app.FindCollectionByNameOrId(collections.MonthlyUsage)
		if err != nil {
			return
		}

		expiredUsageRecords, err := app.FindRecordsByFilter(usageCollection, "billing_cycle_end <= {:now}", "", 0, 0, dbx.Params{
			"now": time.Now().UTC().Format(time.RFC3339),
		})
		if err != nil {
			return
		}

		for _, record := range expiredUsageRecords {
			tier, err := app.FindRecordById(collections.SubscriptionTiers, record.GetString("tier"))
			if err != nil {
				continue
			}

			newUsageRecord := core.NewRecord(usageCollection)
			newUsageRecord.Set("user", record.GetString("user"))
			newUsageRecord.Set("billing_cycle_start", time.Now().UTC().Format(time.RFC3339))
			newUsageRecord.Set("billing_cycle_end", time.Now().AddDate(0, 1, 0).UTC().Format(time.RFC3339))
			newUsageRecord.Set("tier", tier.Id)

			lookupKey := tier.GetString("lookup_key")
			usageLimit := tier.GetInt("monthly_usage_limit")
			if lookupKey == "professional_yearly" || lookupKey == "professional_monthly" {
				prevUsage := record.GetInt("usage")
				prevLimit := record.GetInt("limit")
				newUsageRecord.Set("limit", usageLimit+(prevLimit-prevUsage))
			} else {
				newUsageRecord.Set("limit", usageLimit)
			}

			if err := app.Save(newUsageRecord); err != nil {
				continue
			}
		}
	})

	return nil
}
