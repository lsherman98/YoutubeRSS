package uploads_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordAfterCreateSuccess(collections.Uploads).BindFunc(func(e *core.RecordEvent) error {
        itemsCollection, err := e.App.FindCollectionByNameOrId(collections.Items)
        if err != nil {
            e.App.Logger().Error("Uploads Hooks: failed to find items collection: " + err.Error())
            return e.Next()
        }

        itemRecord := core.NewRecord(itemsCollection)
        itemRecord.Set("user", e.Record.GetString("user"))
        itemRecord.Set("podcast", e.Record.GetString("podcast"))
        itemRecord.Set("type", "upload")
        itemRecord.Set("upload", e.Record.Id)

        if err := e.App.Save(itemRecord); err != nil {
            e.App.Logger().Error("Uploads Hooks: failed to create item record: " + err.Error())
            return e.Next()
        }

        e.Record.Set("item", itemRecord.Id)
        if err := e.App.Save(e.Record); err != nil {
            e.App.Logger().Error("Uploads Hooks: failed to update upload record with item ID: " + err.Error())
            return e.Next()
        }

		return e.Next()
	})

	return nil
}
