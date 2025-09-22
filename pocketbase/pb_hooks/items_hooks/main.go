package items_hooks

import (
	"bytes"
	"context"
	"io"
	"os"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/wader/goutubedl"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordAfterCreateSuccess(collections.Items).BindFunc(func(e *core.RecordEvent) error {
		url := e.Record.GetString("url")
		user := e.Record.GetString("user")
		podcastId := e.Record.GetString("podcast")

		result, err := goutubedl.New(context.Background(), url, goutubedl.Options{})
		if err != nil {
			e.App.Logger().Error("Failed to initialize youtube-dl: " + err.Error())
			return e.Next()
		}

		videoId := result.Info.ID
		videoTitle := result.Info.Title
		duration := result.Info.Duration
		channel := result.Info.Channel
		description := result.Info.Description

		downloadResult, err := result.DownloadWithOptions(context.Background(), goutubedl.DownloadOptions{
			AudioFormats:      "mp3",
			DownloadAudioOnly: true,
		})
		if err != nil {
			e.App.Logger().Error("Failed to download audio: " + err.Error())
			return e.Next()
		}
		defer downloadResult.Close()

		outputDir := "output"
		if _, err := os.Stat(outputDir); os.IsNotExist(err) {
			err = os.Mkdir(outputDir, 0755)
			if err != nil {
				e.App.Logger().Error("Failed to create output directory: " + err.Error())
				return e.Next()
			}
		}

		outputPath := outputDir + "/" + videoId + ".mp3"
		f, err := os.Create(outputPath)
		if err != nil {
			e.App.Logger().Error("Failed to create output file: " + err.Error())
			return e.Next()
		}
		defer f.Close()
		io.Copy(f, downloadResult)

		downloadsCollection, err := e.App.FindCollectionByNameOrId(collections.Downloads)
		if err != nil {
			e.App.Logger().Error("Failed to find downloads collection: " + err.Error())
			return e.Next()
		}

		file, err := filesystem.NewFileFromPath(outputPath)
		if err != nil {
			e.App.Logger().Error("Failed to create file from path: " + err.Error())
			return e.Next()
		}

		newDownload := core.NewRecord(downloadsCollection)
		newDownload.Set("title", videoTitle)
		newDownload.Set("duration", duration)
		newDownload.Set("channel", channel)
		newDownload.Set("user", user)
		newDownload.Set("file", file)
		newDownload.Set("description", description)

		if err := e.App.Save(newDownload); err != nil {
			e.App.Logger().Error("Failed to save new download record: " + err.Error())
			return e.Next()
		}

		newDownload.Set("download_link", "127.0.0.1:8090/api/files/"+downloadsCollection.Id+"/"+newDownload.Id+"/"+file.Name)
		if err := e.App.Save(newDownload); err != nil {
			e.App.Logger().Error("Failed to save new download record: " + err.Error())
			return e.Next()
		}

		if err := os.Remove(outputPath); err != nil {
			e.App.Logger().Error("Failed to remove temporary output file: " + err.Error())
			return e.Next()
		}

		podcastRecord, err := e.App.FindRecordById(collections.Podcasts, podcastId)
		if err != nil {
			e.App.Logger().Error("Failed to find podcast record: " + err.Error())
			return e.Next()
		}

		xmlFileKey := podcastRecord.BaseFilesPath() + "/" + podcastRecord.GetString("file")
		e.App.Logger().Info("Podcast XML file key: " + xmlFileKey)

		fsys, err := app.NewFilesystem()
		if err != nil {
			e.App.Logger().Error("Failed to open podcast filesystem: " + err.Error())
			return e.Next()
		}
		defer fsys.Close()

		r, err := fsys.GetReader(xmlFileKey)
		if err != nil {
			e.App.Logger().Error("Failed to get podcast XML file: " + err.Error())
			return e.Next()
		}
		defer r.Close()

		content := new(bytes.Buffer)
		_, err = io.Copy(content, r)
		if err != nil {
			e.App.Logger().Error("Failed to copy XML content: " + err.Error())
			return e.Next()
		}

		podcast, err := rss_utils.ParseXML(content.String())
		if err != nil {
			e.App.Logger().Error("Failed to parse podcast XML: " + err.Error())
			return e.Next()
		}

		rss_utils.AddItemToPodcast(&podcast, videoTitle, "download link", description)

		xml, err := rss_utils.GenerateXML(&podcast)
		if err != nil {
			e.App.Logger().Error("Failed to generate podcast XML: " + err.Error())
			return e.Next()
		}

		xmlFile, err := filesystem.NewFileFromBytes([]byte(xml), e.Record.Id+".xml")
		if err != nil {
			e.App.Logger().Error("Failed to create podcast XML file: " + err.Error())
			return e.Next()
		}

		podcastRecord.Set("file", xmlFile)
		if err := e.App.Save(podcastRecord); err != nil {
			e.App.Logger().Error("Failed to save record: " + err.Error())
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
