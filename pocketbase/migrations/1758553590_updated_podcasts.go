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
			"hidden": false,
			"id": "file3309110367",
			"maxSelect": 1,
			"maxSize": 0,
			"mimeTypes": [
				"image/jpeg",
				"image/vnd.mozilla.apng",
				"image/png"
			],
			"name": "image",
			"presentable": false,
			"protected": false,
			"required": false,
			"system": false,
			"thumbs": [],
			"type": "file"
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
		collection.Fields.RemoveById("file3309110367")

		return app.Save(collection)
	})
}
