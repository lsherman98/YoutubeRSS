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
		if err := collection.Fields.AddMarshaledJSONAt(8, []byte(`{
			"cascadeDelete": false,
			"collectionId": "pbc_4204686209",
			"hidden": false,
			"id": "relation521872670",
			"maxSelect": 1,
			"minSelect": 0,
			"name": "item",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "relation"
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
		collection.Fields.RemoveById("relation521872670")

		return app.Save(collection)
	})
}
