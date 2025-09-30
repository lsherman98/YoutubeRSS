package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2488717294")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(7, []byte(`{
			"exceptDomains": [],
			"hidden": false,
			"id": "url593273549",
			"name": "download_link",
			"onlyDomains": [],
			"presentable": false,
			"required": false,
			"system": false,
			"type": "url"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2488717294")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("url593273549")

		return app.Save(collection)
	})
}
