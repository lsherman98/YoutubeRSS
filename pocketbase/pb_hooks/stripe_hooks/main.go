package stripe_hooks

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/stripe/stripe-go/v83"
	portal "github.com/stripe/stripe-go/v83/billingportal/session"
	checkout "github.com/stripe/stripe-go/v83/checkout/session"
	"github.com/stripe/stripe-go/v83/customer"
	"github.com/stripe/stripe-go/v83/webhook"
)

func Init(app *pocketbase.PocketBase) error {
	domain := "https://ytrss.xyz"
	stripe.Key = os.Getenv("STRIPE_API_KEY")
	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	basicMonthlyPriceId := os.Getenv("STRIPE_BASIC_MONTHLY_PRICE_ID")
	basicYearlyPriceId := os.Getenv("STRIPE_BASIC_YEARLY_PRICE_ID")
	powerUserMonthlyPriceId := os.Getenv("STRIPE_POWER_USER_MONTHLY_PRICE_ID")
	powerUserYearlyPriceId := os.Getenv("STRIPE_POWER_USER_YEARLY_PRICE_ID")
	professionalMonthlyPriceId := os.Getenv("STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID")
	professionalYearlyPriceId := os.Getenv("STRIPE_PROFESSIONAL_YEARLY_PRICE_ID")

	dev := os.Getenv("DEV") == "true"
	if dev {
		domain = "http://localhost:5173"
	}

	stripeTest := os.Getenv("STRIPE_TEST") == "true"
	if stripeTest {
		stripe.Key = os.Getenv("TEST_STRIPE_API_KEY")
		webhookSecret = os.Getenv("TEST_STRIPE_WEBHOOK_SECRET")
		basicMonthlyPriceId = os.Getenv("TEST_STRIPE_BASIC_MONTHLY_PRICE_ID")
		basicYearlyPriceId = os.Getenv("TEST_STRIPE_BASIC_YEARLY_PRICE_ID")
		powerUserMonthlyPriceId = os.Getenv("TEST_STRIPE_POWER_USER_MONTHLY_PRICE_ID")
		powerUserYearlyPriceId = os.Getenv("TEST_STRIPE_POWER_USER_YEARLY_PRICE_ID")
		professionalMonthlyPriceId = os.Getenv("TEST_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID")
		professionalYearlyPriceId = os.Getenv("TEST_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID")
	}

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		subscriptionsCollection, err := app.FindCollectionByNameOrId(collections.StripeSubscriptions)
		if err != nil {
			return err
		}

		chargesCollection, err := app.FindCollectionByNameOrId(collections.StripeCharges)
		if err != nil {
			return err
		}

		customersCollection, err := app.FindCollectionByNameOrId(collections.StripeCustomers)
		if err != nil {
			return err
		}

		se.Router.POST("/api/webhooks/stripe", func(e *core.RequestEvent) error {
			payload, err := io.ReadAll(e.Request.Body)
			if err != nil {
				return e.BadRequestError("failed to read request body", err)
			}

			event := stripe.Event{}
			if err := e.BindBody(&event); err != nil {
				return e.BadRequestError("failed to read stripe event", err)
			}

			signatureHeader := e.Request.Header.Get("Stripe-Signature")
			event, err = webhook.ConstructEvent(payload, signatureHeader, webhookSecret)
			if err != nil {
				return e.BadRequestError("failed to verify stripe event", err)
			}

			switch event.Type {
			case "customer.subscription.created":
				var subscription stripe.Subscription
				if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
					return e.BadRequestError("failed to unmarshal customer.subscription.created event", err)
				}
				if err := updateSubscriptionRecord(e, subscription, subscriptionsCollection); err != nil {
					return e.BadRequestError("failed to update subscription record", err)
				}
			case "customer.subscription.updated":
				var subscription stripe.Subscription
				if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
					return e.BadRequestError("failed to unmarshal customer.subscription.updated event", err)
				}
				if err := updateSubscriptionRecord(e, subscription, subscriptionsCollection); err != nil {
					return e.BadRequestError("failed to update subscription record", err)
				}
			case "customer.subscription.deleted":
				var subscription stripe.Subscription
				if err := json.Unmarshal(event.Data.Raw, &subscription); err != nil {
					return e.BadRequestError("failed to unmarshal customer.subscription.deleted event", err)
				}
				if err := updateSubscriptionRecord(e, subscription, subscriptionsCollection); err != nil {
					return e.BadRequestError("failed to update subscription record", err)
				}
			case "charge.succeeded":
				var charge stripe.Charge
				if err := json.Unmarshal(event.Data.Raw, &charge); err != nil {
					return e.BadRequestError("failed to unmarshal charge.succeeded event", err)
				}
				if err := handleChargeSucceeded(e, charge, chargesCollection); err != nil {
					return e.BadRequestError("failed to handle charge.succeeded", err)
				}
			default:
				return e.BadRequestError("unexpected stripe event type", nil)
			}

			e.Response.WriteHeader(http.StatusOK)
			return nil
		})

		se.Router.GET("/api/stripe/create-checkout-session", func(e *core.RequestEvent) error {
			user := e.Auth.Id
			email := e.Auth.Email()
			subscriptionType := e.Request.URL.Query().Get("subscriptionType")

			customerRecord, err := e.App.FindFirstRecordByData(customersCollection.Name, "user", user)
			if err != nil && customerRecord == nil {
				params := &stripe.CustomerParams{
					Email: stripe.String(email),
					Metadata: map[string]string{
						"pb_user": user,
					},
				}

				result, err := customer.New(params)
				if err != nil {
					return e.BadRequestError("failed to create customer", err)
				}

				customerRecord = core.NewRecord(customersCollection)
				customerRecord.Set("user", user)
				customerRecord.Set("customer_id", result.ID)
				customerRecord.Set("email", email)
				if err := app.Save(customerRecord); err != nil {
					return e.BadRequestError("failed to save customer record", err)
				}
			}

			var priceId string

			switch subscriptionType {
			case "basicMonthly":
				priceId = basicMonthlyPriceId
			case "basicYearly":
				priceId = basicYearlyPriceId
			case "powerUserMonthly":
				priceId = powerUserMonthlyPriceId
			case "powerUserYearly":
				priceId = powerUserYearlyPriceId
			case "professionalMonthly":
				priceId = professionalMonthlyPriceId
			case "professionalYearly":
				priceId = professionalYearlyPriceId
			default:
				return e.BadRequestError("invalid product param", nil)
			}

			params := &stripe.CheckoutSessionParams{
				LineItems: []*stripe.CheckoutSessionLineItemParams{
					{
						Price:    stripe.String(priceId),
						Quantity: stripe.Int64(1),
					},
				},
				Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
				SuccessURL: stripe.String(domain + "/podcasts"),
				CancelURL:  stripe.String(domain + "/subscriptions"),
				Customer:   stripe.String(customerRecord.GetString("customer_id")),
			}

			s, err := checkout.New(params)
			if err != nil {
				e.App.Logger().Error("New checkout session", "error", err)
				return e.BadRequestError("failed to create checkout session", err)
			}

			e.JSON(http.StatusOK, map[string]string{"url": s.URL})
			return nil
		}).Bind(apis.RequireAuth())

		se.Router.GET("/api/stripe/create-portal-session", func(e *core.RequestEvent) error {
			userId := e.Auth.Id
			customer, err := e.App.FindFirstRecordByData(customersCollection.Name, "user", userId)
			if err != nil {
				return e.BadRequestError("failed to find customer", err)
			}

			params := &stripe.BillingPortalSessionParams{
				Customer:  stripe.String(customer.GetString("customer_id")),
				ReturnURL: stripe.String(domain + "/subscriptions"),
			}

			s, err := portal.New(params)
			if err != nil {
				e.App.Logger().Error("New billing portal session", "error", err)
				return e.BadRequestError("failed to create portal session", err)
			}

			e.JSON(http.StatusOK, map[string]string{"url": s.URL})
			return nil
		}).Bind(apis.RequireAuth())

		return se.Next()
	})

	return nil
}

func updateSubscriptionRecord(e *core.RequestEvent, subscription stripe.Subscription, subscriptionsCollection *core.Collection) error {
	var subscriptionRecord *core.Record
	subscriptionRecord, err := e.App.FindFirstRecordByData(collections.StripeSubscriptions, "customer_id", subscription.Customer.ID)
	if err != nil {
		e.App.Logger().Info("Stripe Hooks: creating new subscription record")
		subscriptionRecord = core.NewRecord(subscriptionsCollection)
	}

	customer, err := e.App.FindFirstRecordByData(collections.StripeCustomers, "customer_id", subscription.Customer.ID)
	if err != nil {
		e.App.Logger().Info("Stripe Hooks: failed to find customer record")
		return err
	}

	user, err := e.App.FindRecordById(collections.Users, customer.GetString("user"))
	if err != nil {
		e.App.Logger().Info("Stripe Hooks: failed to find user record")
	}

	priceId := subscription.Items.Data[0].Price.ID
	cancelled := subscription.Status != stripe.SubscriptionStatusActive
	if cancelled {
		priceId = "free"
	}

	var field string
	if os.Getenv("STRIPE_TEST") == "true" {
		field = "test_price_id"
	} else {
		field = "price_id"
	}

	tier, err := e.App.FindFirstRecordByData(collections.SubscriptionTiers, field, priceId)
	if err != nil {
		e.App.Logger().Error("Stripe Hooks: failed to find subscription tier: " + err.Error())
	}

	if user != nil {
		monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
			"user": user.Id,
		})
		if err != nil || monthlyUsageRecords == nil || len(monthlyUsageRecords) == 0 {
			e.App.Logger().Error("Stripe Hooks: failed to find monthly usage record: " + err.Error())
		} else {
			usageRecord := monthlyUsageRecords[0]
			usageRecord.Set("tier", tier.Id)
			usageRecord.Set("limit", tier.Get("monthly_usage_limit"))
			if !cancelled {
				usageRecord.Set("billing_cycle_start", time.Unix(subscription.Items.Data[0].CurrentPeriodStart, 0).UTC().Format(time.RFC3339))
				usageRecord.Set("billing_cycle_end", time.Unix(subscription.Items.Data[0].CurrentPeriodEnd, 0).UTC().Format(time.RFC3339))
			}
			if err := e.App.Save(usageRecord); err != nil {
				return err
			}
		}

		user.Set("tier", tier.Id)
		if err := e.App.Save(user); err != nil {
			return err
		}
	}

	subscriptionRecord.Set("tier", tier.Id)
	subscriptionRecord.Set("subscription_id", subscription.ID)
	subscriptionRecord.Set("user", customer.GetString("user"))
	subscriptionRecord.Set("customer_id", subscription.Customer.ID)
	subscriptionRecord.Set("metadata", subscription.Metadata)
	subscriptionRecord.Set("status", subscription.Status)
	subscriptionRecord.Set("cancel_at_period_end", subscription.CancelAtPeriodEnd)
	subscriptionRecord.Set("cancel_at", subscription.CancelAt)
	subscriptionRecord.Set("canceled_at", subscription.CanceledAt)
	subscriptionRecord.Set("current_period_start", subscription.Items.Data[0].CurrentPeriodStart)
	subscriptionRecord.Set("current_period_end", subscription.Items.Data[0].CurrentPeriodEnd)
	subscriptionRecord.Set("created", subscription.Created)
	subscriptionRecord.Set("ended_at", subscription.EndedAt)

	if err := e.App.Save(subscriptionRecord); err != nil {
		return err
	}

	return nil
}

func handleChargeSucceeded(e *core.RequestEvent, charge stripe.Charge, chargesCollection *core.Collection) error {
	user, err := e.App.FindFirstRecordByData(collections.StripeCustomers, "customer_id", charge.Customer.ID)
	if err != nil {
		return e.BadRequestError("failed to find customer", err)
	}

	chargeRecord := core.NewRecord(chargesCollection)
	chargeRecord.Set("charge_id", charge.ID)
	chargeRecord.Set("amount", charge.Amount)
	chargeRecord.Set("status", charge.Status)
	chargeRecord.Set("created", charge.Created)
	chargeRecord.Set("user", user.GetString("user"))
	chargeRecord.Set("customer_id", charge.Customer.ID)
	chargeRecord.Set("receipt_url", charge.ReceiptURL)
	chargeRecord.Set("metadata", charge.Metadata)
	chargeRecord.Set("paid", charge.Paid)
	chargeRecord.Set("refunded", charge.Refunded)

	if err := e.App.Save(chargeRecord); err != nil {
		return err
	}
	return nil
}
