package file_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnFileDownloadRequest().BindFunc(func(e *core.FileDownloadRequestEvent) error {
		collection := e.Record.Collection().Name
		if collection == collections.Podcasts {
			e.Response.Header().Add("Content-Disposition", "inline")
		}
		return e.Next()
	})

	return nil
}
