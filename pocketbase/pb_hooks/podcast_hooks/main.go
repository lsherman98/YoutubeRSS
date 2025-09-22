package podcast_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

func Init(app *pocketbase.PocketBase) error {

	app.OnRecordCreateRequest(collections.Podcasts).BindFunc(func(e *core.RecordRequestEvent) error {
		title := e.Record.GetString("title")
		description := e.Record.GetString("description")

		podcast := rss_utils.NewPodcast(
			title,
			"http://example.com",
			description,
			"Admin",
			"example@example.com",
			"http://example.com/image.jpg",
		)

		xml, err := rss_utils.GenerateXML(&podcast)
		if err != nil {
			e.App.Logger().Error("Failed to generate podcast XML")
			return e.Next()
		}

		f, err := filesystem.NewFileFromBytes([]byte(xml), e.Record.Id+".xml")
		if err != nil {
			e.App.Logger().Error("Failed to create podcast XML file")
			return e.Next()
		}

		e.Record.Set("file", f)

		return e.Next()
	})

	return nil
}
