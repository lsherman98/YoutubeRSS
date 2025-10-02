package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3271294384")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(8, []byte(`{
			"exceptDomains": null,
			"hidden": false,
			"id": "url1093929478",
			"name": "pocketcasts_share_url",
			"onlyDomains": null,
			"presentable": false,
			"required": false,
			"system": false,
			"type": "url"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3271294384")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("url1093929478")

		return app.Save(collection)
	})
}
