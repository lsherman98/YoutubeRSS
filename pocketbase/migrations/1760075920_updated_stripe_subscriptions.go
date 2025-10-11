package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("qfiqyxbv63dsbsr")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_lnL7G0jjvJ` + "`" + ` ON ` + "`" + `subscriptions` + "`" + ` (` + "`" + `subscription_id` + "`" + `)",
				"CREATE UNIQUE INDEX ` + "`" + `idx_yzONCAqJMA` + "`" + ` ON ` + "`" + `stripe_subscriptions` + "`" + ` (` + "`" + `user` + "`" + `)"
			]
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("qfiqyxbv63dsbsr")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_lnL7G0jjvJ` + "`" + ` ON ` + "`" + `subscriptions` + "`" + ` (` + "`" + `subscription_id` + "`" + `)"
			]
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
