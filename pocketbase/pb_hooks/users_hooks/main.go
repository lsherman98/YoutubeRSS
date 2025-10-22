package users_hooks

import (
	"os"
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/stripe/stripe-go/v83"
	"github.com/stripe/stripe-go/v83/subscription"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordAfterCreateSuccess(collections.Users).BindFunc(func(e *core.RecordEvent) error {
		userId := e.Record.Id

		monthlyUsageCollection, err := e.App.FindCollectionByNameOrId(collections.MonthlyUsage)
		if err != nil {
			return e.Next()
		}

		freeTier, err := e.App.FindFirstRecordByData(collections.SubscriptionTiers, "price_id", "free")
		if err != nil {
			return e.Next()
		}

		e.Record.Set("tier", freeTier.Id)
		if err := e.App.Save(e.Record); err != nil {
			return e.Next()
		}

		usageRecord := core.NewRecord(monthlyUsageCollection)
		usageRecord.Set("user", userId)
		usageRecord.Set("billing_cycle_start", time.Now().UTC().Format(time.RFC3339))
		usageRecord.Set("billing_cycle_end", time.Now().AddDate(0, 1, 0).UTC().Format(time.RFC3339))
		usageRecord.Set("tier", freeTier.Id)
		usageRecord.Set("limit", freeTier.Get("monthly_usage_limit"))
		if err := e.App.Save(usageRecord); err != nil {
			return e.Next()
		}

		return e.Next()
	})

	app.OnRecordDeleteRequest(collections.Users).BindFunc(func(e *core.RecordRequestEvent) error {
		stripe.Key = os.Getenv("STRIPE_API_KEY")
		stripeTest := os.Getenv("STRIPE_TEST") == "true"
		if stripeTest {
			stripe.Key = os.Getenv("TEST_STRIPE_API_KEY")
		}

		subscriptionRecord, err := e.App.FindFirstRecordByData(collections.StripeSubscriptions, "user", e.Record.Id)
		if err != nil {
			return e.Next()
		}

		subscriptionId := subscriptionRecord.GetString("subscription_id")

		params := &stripe.SubscriptionCancelParams{}
		_, err = subscription.Cancel(subscriptionId, params)
		if err != nil {
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
