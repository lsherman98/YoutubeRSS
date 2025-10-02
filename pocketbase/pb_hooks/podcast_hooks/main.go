package podcast_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordCreateRequest(collections.Podcasts).BindFunc(func(e *core.RecordRequestEvent) error {
		title := e.Record.GetString("title")
		description := e.Record.GetString("description")
		website := e.Record.GetString("website")
		image := e.Record.GetString("image")

		if err := e.App.Save(e.Record); err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to save record: " + err.Error())
			return e.Next()
		}

		podcast := rss_utils.NewPodcast(
			title,
			website,
			description,
			e.Auth.GetString("username"),
			e.Auth.Email(),
			files.GetFileURL(e.Record.BaseFilesPath(), image),
		)

		xml, err := rss_utils.GenerateXML(&podcast)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to generate podcast XML")
			return e.Next()
		}

		e.App.Logger().Info("record id: " + e.Record.Id)
		f, err := filesystem.NewFileFromBytes([]byte(xml), e.Record.Id+".xml")
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to create podcast XML file")
			return e.Next()
		}

		e.Record.Set("file", f)

		if err := e.App.Save(e.Record); err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to save record: " + err.Error())
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
