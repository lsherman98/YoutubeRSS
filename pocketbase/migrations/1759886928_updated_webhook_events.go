package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1564425120")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(7, []byte(`{
			"hidden": false,
			"id": "select1001261735",
			"maxSelect": 1,
			"name": "event",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "select",
			"values": [
				"CREATED",
				"STARTED",
				"ERROR",
				"SUCCESS"
			]
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_1564425120")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("select1001261735")

		return app.Save(collection)
	})
}
