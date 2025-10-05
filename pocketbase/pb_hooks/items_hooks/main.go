package items_hooks

import (
	"os"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/lsherman98/yt-rss/pocketbase/ytdlp"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordAfterCreateSuccess(collections.Items).BindFunc(func(e *core.RecordEvent) error {
		itemRecord := e.Record
		url := itemRecord.GetString("url")
		user := itemRecord.GetString("user")
		podcastId := itemRecord.GetString("podcast")

		downloads, err := e.App.FindCollectionByNameOrId(collections.Downloads)
		if err != nil {
			return e.Next()
		}

		routine.FireAndForget(func() {
			download := core.NewRecord(downloads)
			podcast, err := e.App.FindRecordById(collections.Podcasts, podcastId)
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to find podcast record: " + err.Error())
				return
			}

			ytdlp := ytdlp.New()
			if ytdlp == nil {
				e.App.Logger().Error("Items Hooks: failed to create ytdlp client")
				return
			}

			result, path, err := ytdlp.Download(url, download)
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to download audio: " + err.Error())
				return
			}
			defer result.Close()

			download.Set("user", user)
			download.Set("podcast", podcastId)
			download.Set("item", e.Record.Id)
			if err := e.App.Save(download); err != nil {
				e.App.Logger().Error("Items Hooks: failed to save download record: " + err.Error())
				return
			}

			itemRecord.Set("download", download.Id)
			if err := e.App.Save(itemRecord); err != nil {
				e.App.Logger().Error("Items Hooks: failed to save item record: " + err.Error())
				return
			}

			if err := os.Remove(path); err != nil {
				return
			}

			fileClient, err := files.NewFileClient(e.App, podcast, "file")
			if err != nil {
				return
			}

			content, err := fileClient.GetXMLFile()
			if err != nil {
				return
			}

			p, err := rss_utils.ParseXML(content.String())
			if err != nil {
				return
			}

			audioURL := fileClient.GetFileURL(download, "file")
			title := download.GetString("title")
			description := download.GetString("description")
			duration := download.GetFloat("duration")
			rss_utils.AddItemToPodcast(&p, title, audioURL, description, download.Id, audioURL, int64(duration))

			xml, err := rss_utils.GenerateXML(&p)
			if err != nil {
				return
			}

			xmlFile, err := fileClient.NewXMLFile(xml, podcast.Id)
			if err != nil {
				return
			}

			podcast.Set("file", xmlFile)
			if err := e.App.Save(podcast); err != nil {
				return
			}
		})

		return e.Next()
	})

	app.OnRecordAfterDeleteSuccess(collections.Items).BindFunc(func(e *core.RecordEvent) error {
		podcastId := e.Record.GetString("podcast")
		downloadId := e.Record.GetString("download")

		podcast, err := e.App.FindRecordById(collections.Podcasts, podcastId)
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to find podcast record: " + err.Error())
			return e.Next()
		}

		fileClient, err := files.NewFileClient(e.App, podcast, "file")
		if err != nil {
			return e.Next()
		}

		content, err := fileClient.GetXMLFile()
		if err != nil {
			return e.Next()
		}

		p, err := rss_utils.ParseXML(content.String())
		if err != nil {
			return e.Next()
		}

		rss_utils.RemoveItemFromPodcast(&p, downloadId)

		xml, err := rss_utils.GenerateXML(&p)
		if err != nil {
			return e.Next()
		}

		xmlFile, err := fileClient.NewXMLFile(xml, podcast.Id)
		if err != nil {
			return e.Next()
		}

		podcast.Set("file", xmlFile)
		if err := e.App.Save(podcast); err != nil {
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
