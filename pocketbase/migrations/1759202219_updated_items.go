package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_4204686209")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(4, []byte(`{
			"cascadeDelete": false,
			"collectionId": "pbc_2488717294",
			"hidden": false,
			"id": "relation2015003248",
			"maxSelect": 1,
			"minSelect": 0,
			"name": "download",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "relation"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_4204686209")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("relation2015003248")

		return app.Save(collection)
	})
}
