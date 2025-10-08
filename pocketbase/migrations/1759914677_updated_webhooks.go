package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3653375940")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(3, []byte(`{
			"hidden": false,
			"id": "select1401378634",
			"maxSelect": 4,
			"name": "events",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "select",
			"values": [
				"SUCCESS",
				"ERROR",
				"STARTED",
				"CREATED"
			]
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3653375940")
		if err != nil {
			return err
		}

		// update field
		if err := collection.Fields.AddMarshaledJSONAt(3, []byte(`{
			"hidden": false,
			"id": "select1401378634",
			"maxSelect": 4,
			"name": "events",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "select",
			"values": [
				"SUCCESS",
				"ERROR",
				"PROCESSING",
				"STARTED",
				"CREATED"
			]
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
