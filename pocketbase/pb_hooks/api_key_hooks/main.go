package api_key_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/security"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordCreateRequest(collections.APIKeys).BindFunc(func(e *core.RecordRequestEvent) error {
		apiKey := security.RandomString(32)
		hashedAPIKey := security.SHA256(apiKey)
		e.Record.Set(("hashed_key"), hashedAPIKey)
		if err := e.App.Save(e.Record); err != nil {
			return e.InternalServerError("failed to generate api key", map[string]any{})
		}

		return e.JSON(200, map[string]any{
			"api_key": apiKey,
		})
	})

	return nil
}
