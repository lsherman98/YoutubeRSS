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
		username := e.Auth.GetString("name")
		email := e.Auth.Email()

		if err := e.App.Save(e.Record); err != nil {
			return e.Next()
		}

		image := e.Record.GetString("image")
		if image == "" {
			file, err := filesystem.NewFileFromPath("./static/rss.png")
			if err != nil {
				return e.Next()
			}

			e.Record.Set("image", file)
			if err := e.App.Save(e.Record); err != nil {
				return e.Next()
			}
		}

		podcast := rss_utils.NewPodcast(
			title,
			website,
			description,
			username,
			email,
			files.GetFileURL(e.Record.BaseFilesPath(), image),
		)

		xml, err := rss_utils.GenerateXML(&podcast)
		if err != nil {
			return e.Next()
		}

		f, err := filesystem.NewFileFromBytes([]byte(xml), e.Record.Id+".rss")
		if err != nil {
			return e.Next()
		}

		e.Record.Set("file", f)
		if err := e.App.Save(e.Record); err != nil {
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
			return e.Next()
		}
		defer fsys.Close()

		r, err := fsys.GetReader(xmlFileKey)
		if err != nil {
			return e.Next()
		}
		defer r.Close()

		content := new(bytes.Buffer)
		_, err = io.Copy(content, r)
		if err != nil {
			return e.Next()
		}

		podcast, err := rss_utils.ParseXML(content.String())
		if err != nil {
			return e.Next()
		}

		imageUrl := files.GetFileURL(e.Record.BaseFilesPath(), image)
		if podcast.Title == title && podcast.Link == website && podcast.Description == description && podcast.Image.URL == imageUrl {
			return e.Next()
		}

		podcast.Title = title
		podcast.Link = website
		podcast.Description = description
		podcast.AddImage(imageUrl)

		xml, err := rss_utils.GenerateXML(&podcast)
		if err != nil {
			return e.Next()
		}

		xmlFile, err := filesystem.NewFileFromBytes([]byte(xml), e.Record.Id+".rss")
		if err != nil {
			return e.Next()
		}

		currentXmlFile, err := fsys.GetReuploadableFile(xmlFileKey, true)
		if err != nil {
			return e.Next()
		}

		xmlFile.Name = currentXmlFile.Name
		e.Record.Set("file", xmlFile)

		if err := e.App.Save(e.Record); err != nil {
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
