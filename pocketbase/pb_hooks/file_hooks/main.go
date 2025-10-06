package file_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnFileDownloadRequest().BindFunc(func(e *core.FileDownloadRequestEvent) error {
		collection := e.Record.Collection().Name
		switch collection {
		case collections.Podcasts:
			e.Response.Header().Add("Content-Disposition", "inline")
		case collections.Downloads, collections.Uploads:
			title := e.Record.GetString("title")
			e.ServedName = title + ".mp3"
		}
		return e.Next()
	})

	return nil
}
