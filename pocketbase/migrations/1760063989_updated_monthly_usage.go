package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_464380059")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(6, []byte(`{
			"cascadeDelete": false,
			"collectionId": "pbc_2253575739",
			"hidden": false,
			"id": "relation614373258",
			"maxSelect": 1,
			"minSelect": 0,
			"name": "tier",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "relation"
		}`)); err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(7, []byte(`{
			"hidden": false,
			"id": "number2140596320",
			"max": null,
			"min": null,
			"name": "limit",
			"onlyInt": false,
			"presentable": false,
			"required": false,
			"system": false,
			"type": "number"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_464380059")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("relation614373258")

		// remove field
		collection.Fields.RemoveById("number2140596320")

		return app.Save(collection)
	})
}
