package apify_webhooks

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.POST("/webhooks/apify", func(e *core.RequestEvent) error {
			event := ApifyEvent{}
			if err := e.BindBody(&event); err != nil {
				e.App.Logger().Error("Apify Webhook: failed to bind Apify webhook body: " + err.Error())
				return e.BadRequestError("Invalid request body", err)
			}

			e.App.Logger().Info("Received Apify webhook event:", "event", event)
			e.JSON(200, map[string]any{"status": "ok"})
			return nil
		})
		return se.Next()
	})
	return nil
}
