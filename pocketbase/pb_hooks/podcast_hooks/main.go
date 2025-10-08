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
		podcast := e.Record
		title := podcast.GetString("title")
		description := podcast.GetString("description")
		website := podcast.GetString("website")
		username := e.Auth.GetString("name")
		email := e.Auth.Email()

		if err := e.App.Save(podcast); err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to save podcast", "error", err)
			return e.Next()
		}

		image := podcast.GetString("image")
		if image == "" {
			file, err := filesystem.NewFileFromPath("./pb_public/static/rss.png")
			if err != nil {
				e.App.Logger().Error("Podcast Hooks: failed to create file from path", "error", err)
				return e.Next()
			}

			podcast.Set("image", file)
			if err := e.App.Save(podcast); err != nil {
				e.App.Logger().Error("Podcast Hooks: failed to save podcast with default image", "error", err)
				return e.Next()
			}
		}

		fileClient, err := files.NewFileClient(e.App, podcast, "file")
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to create file client", "error", err)
			return e.Next()
		}
		defer fileClient.Close()

		p := rss_utils.NewPodcast(
			title,
			website,
			description,
			username,
			email,
			fileClient.GetFileURL(podcast, "image"),
		)

		xml, err := rss_utils.GenerateXML(&p)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to generate XML", "error", err)
			return e.Next()
		}

		xmlFile, err := fileClient.NewXMLFile(xml, podcast.Id)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to create new XML file", "error", err)
			return e.Next()
		}

		podcast.Set("file", xmlFile)
		if err := e.App.Save(podcast); err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to save podcast with XML file", "error", err)
			return e.Next()
		}

		return e.Next()
	})

	app.OnRecordAfterUpdateSuccess(collections.Podcasts).BindFunc(func(e *core.RecordEvent) error {
		podcast := e.Record
		title := podcast.GetString("title")
		description := podcast.GetString("description")
		website := podcast.GetString("website")

		fileClient, err := files.NewFileClient(e.App, podcast, "file")
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to create file client", "error", err)
			return e.Next()
		}
		defer fileClient.Close()

		content, err := fileClient.GetXMLFile()
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to get XML file", "error", err)
			return e.Next()
		}

		p, err := rss_utils.ParseXML(content.String())
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to parse XML", "error", err)
			return e.Next()
		}

		imageUrl := fileClient.GetFileURL(podcast, "image")
		if p.Title == title && p.Link == website && p.Description == description && p.Image.URL == imageUrl {
			return e.Next()
		}

		p.Title = title
		p.Link = website
		p.Description = description
		p.AddImage(imageUrl)

		xml, err := rss_utils.GenerateXML(&p)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to generate XML", "error", err)
			return e.Next()
		}

		xmlFile, err := fileClient.NewXMLFile(xml, podcast.Id)
		if err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to create new XML file", "error", err)
			return e.Next()
		}

		podcast.Set("file", xmlFile)
		if err := e.App.Save(podcast); err != nil {
			e.App.Logger().Error("Podcast Hooks: failed to save podcast with new XML file", "error", err)
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
