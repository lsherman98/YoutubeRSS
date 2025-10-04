package items_hooks

import (
	"bytes"
	"context"
	"io"
	"os"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/pocketbase/pocketbase/tools/routine"
	"github.com/wader/goutubedl"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordAfterCreateSuccess(collections.Items).BindFunc(func(e *core.RecordEvent) error {
		itemRecord := e.Record
		url := itemRecord.GetString("url")
		user := itemRecord.GetString("user")
		podcastId := itemRecord.GetString("podcast")

		routine.FireAndForget(func() {
			result, err := goutubedl.New(context.Background(), url, goutubedl.Options{
				ProxyUrl: "http://2.tcp.ngrok.io:11281",
			})
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to initialize youtube-dl: " + err.Error())
				return
			}

			videoId := result.Info.ID
			videoTitle := result.Info.Title
			duration := result.Info.Duration
			channel := result.Info.Channel
			description := result.Info.Description

			download, err := result.DownloadWithOptions(context.Background(), goutubedl.DownloadOptions{
				AudioFormats:      "mp3",
				DownloadAudioOnly: true,
			})
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to download audio: " + err.Error())
				return
			}
			defer download.Close()

			outputDir := "output"
			if _, err := os.Stat(outputDir); os.IsNotExist(err) {
				err = os.Mkdir(outputDir, 0755)
				if err != nil {
					return
				}
			}

			outputPath := outputDir + "/" + videoId + ".mp3"
			f, err := os.Create(outputPath)
			if err != nil {
				return
			}
			defer f.Close()
			io.Copy(f, download)

			downloadsCollection, err := e.App.FindCollectionByNameOrId(collections.Downloads)
			if err != nil {
				return
			}

			audioFile, err := filesystem.NewFileFromPath(outputPath)
			if err != nil {
				return
			}

			downloadRecord := core.NewRecord(downloadsCollection)
			downloadRecord.Set("title", videoTitle)
			downloadRecord.Set("duration", duration)
			downloadRecord.Set("channel", channel)
			downloadRecord.Set("user", user)
			downloadRecord.Set("file", audioFile)
			downloadRecord.Set("description", description)
			downloadRecord.Set("podcast", podcastId)
			downloadRecord.Set("item", e.Record.Id)
			if err := e.App.Save(downloadRecord); err != nil {
				return
			}

			itemRecord.Set("download", downloadRecord.Id)
			if err := e.App.Save(itemRecord); err != nil {
				return
			}

			if err := os.Remove(outputPath); err != nil {
				return
			}

			podcastRecord, err := e.App.FindRecordById(collections.Podcasts, podcastId)
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to find podcast record: " + err.Error())
				return
			}

			xmlFileKey := podcastRecord.BaseFilesPath() + "/" + podcastRecord.GetString("file")

			fsys, err := app.NewFilesystem()
			if err != nil {
				return
			}
			defer fsys.Close()

			r, err := fsys.GetReader(xmlFileKey)
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to get podcast XML file: " + err.Error())
				return
			}
			defer r.Close()

			content := new(bytes.Buffer)
			_, err = io.Copy(content, r)
			if err != nil {
				return
			}

			currentXmlFile, err := fsys.GetReuploadableFile(xmlFileKey, true)
			if err != nil {
				return
			}

			podcast, err := rss_utils.ParseXML(content.String())
			if err != nil {
				return
			}

			audioUrl := files.GetFileURL(downloadRecord.BaseFilesPath(), downloadRecord.GetString("file"))
			rss_utils.AddItemToPodcast(&podcast, videoTitle, audioUrl, description, downloadRecord.Id, audioUrl, podcast.IOwner.Name, podcast.IOwner.Email, int64(duration))

			xml, err := rss_utils.GenerateXML(&podcast)
			if err != nil {
				return
			}

			xmlFile, err := filesystem.NewFileFromBytes([]byte(xml), podcastRecord.Id+".rss")
			if err != nil {
				return
			}

			xmlFile.Name = currentXmlFile.Name

			podcastRecord.Set("file", xmlFile)
			if err := e.App.Save(podcastRecord); err != nil {
				return
			}
		})

		return e.Next()
	})

	app.OnRecordAfterDeleteSuccess(collections.Items).BindFunc(func(e *core.RecordEvent) error {
		podcastId := e.Record.GetString("podcast")
		downloadId := e.Record.GetString("download")

		podcastRecord, err := e.App.FindRecordById(collections.Podcasts, podcastId)
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to find podcast record: " + err.Error())
			return e.Next()
		}

		xmlFileKey := podcastRecord.BaseFilesPath() + "/" + podcastRecord.GetString("file")

		fsys, err := app.NewFilesystem()
		if err != nil {
			return e.Next()
		}
		defer fsys.Close()

		r, err := fsys.GetReader(xmlFileKey)
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to get podcast XML file: " + err.Error())
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

		rss_utils.RemoveItemFromPodcast(&podcast, downloadId)

		xml, err := rss_utils.GenerateXML(&podcast)
		if err != nil {
			return e.Next()
		}

		file, err := fsys.GetReuploadableFile(xmlFileKey, true)
		if err != nil {
			return e.Next()
		}

		xmlFile, err := filesystem.NewFileFromBytes([]byte(xml), file.OriginalName)
		if err != nil {
			return e.Next()
		}

		xmlFile.Name = file.Name

		podcastRecord.Set("file", xmlFile)
		if err := e.App.Save(podcastRecord); err != nil {
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
