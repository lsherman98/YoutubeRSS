package podcast_hooks

import (
	"bytes"
	"io"

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

		if err := e.App.Save(e.Record); err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to save record: " + err.Error())
			return e.Next()
		}

		image := e.Record.GetString("image")

		podcast := rss_utils.NewPodcast(
			title,
			website,
			description,
			e.Auth.GetString("name"),
			e.Auth.Email(),
			files.GetFileURL(e.Record.BaseFilesPath(), image),
		)

		xml, err := rss_utils.GenerateXML(&podcast)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to generate podcast XML")
			return e.Next()
		}

		f, err := filesystem.NewFileFromBytes([]byte(xml), e.Record.Id+".rss")
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

	app.OnRecordAfterUpdateSuccess(collections.Podcasts).BindFunc(func(e *core.RecordEvent) error {
		title := e.Record.GetString("title")
		description := e.Record.GetString("description")
		website := e.Record.GetString("website")
		image := e.Record.GetString("image")

		xmlFileKey := e.Record.BaseFilesPath() + "/" + e.Record.GetString("file")

		fsys, err := app.NewFilesystem()
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to open podcast filesystem: " + err.Error())
			return e.Next()
		}
		defer fsys.Close()

		r, err := fsys.GetReader(xmlFileKey)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to get podcast XML file: " + err.Error())
			return e.Next()
		}
		defer r.Close()

		content := new(bytes.Buffer)
		_, err = io.Copy(content, r)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to copy XML content: " + err.Error())
			return e.Next()
		}

		podcast, err := rss_utils.ParseXML(content.String())
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to parse podcast XML: " + err.Error())
			return e.Next()
		}

		if podcast.Title == title && podcast.Link == website && podcast.Description == description && podcast.Image.URL == files.GetFileURL(e.Record.BaseFilesPath(), image) {
			return e.Next()
		}

		podcast.Title = title
		podcast.Link = website
		podcast.Description = description
		podcast.AddImage(files.GetFileURL(e.Record.BaseFilesPath(), image))

		xml, err := rss_utils.GenerateXML(&podcast)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to generate podcast XML: " + err.Error())
			return e.Next()
		}

		xmlFile, err := filesystem.NewFileFromBytes([]byte(xml), e.Record.Id+".rss")
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to create podcast XML file: " + err.Error())
			return e.Next()
		}

		currentXmlFile, err := fsys.GetReuploadableFile(xmlFileKey, true)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to get reuploadable file: " + err.Error())
			return e.Next()
		}

		xmlFile.Name = currentXmlFile.Name
		e.Record.Set("file", xmlFile)

		if err := e.App.Save(e.Record); err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to save record: " + err.Error())
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
