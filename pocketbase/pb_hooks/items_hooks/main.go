package items_hooks

import (
	"os"
	"regexp"
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/lsherman98/yt-rss/pocketbase/ytdlp"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnRecordCreateRequest(collections.Items).BindFunc(func(e *core.RecordRequestEvent) error {
		url := e.Record.GetString("url")
		youtubeUrlRegex := regexp.MustCompile(`^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$`)

		if !youtubeUrlRegex.MatchString(url) {
			return e.BadRequestError("Invalid YouTube URL", map[string]any{})
		}

		return e.Next()
	})

	app.OnRecordAfterCreateSuccess(collections.Items).BindFunc(func(e *core.RecordEvent) error {
		itemRecord := e.Record
		url := itemRecord.GetString("url")
		podcastId := itemRecord.GetString("podcast")
		itemType := itemRecord.GetString("type")
		user := itemRecord.GetString("user")

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

		monthlyUsage, err := e.App.FindFirstRecordByFilter(collections.MonthlyUsage, "user = {:user} && billing_cycle_end > {:now}", dbx.Params{
			"user": user,
			"now":  time.Now().UTC().Format(time.RFC3339),
		})
		if err != nil || monthlyUsage == nil {
			e.App.Logger().Error("Items Hooks: failed to find monthly usage record: " + err.Error())
		}

		switch itemType {
		case "url":
			downloads, err := e.App.FindCollectionByNameOrId(collections.Downloads)
			if err != nil {
				return e.Next()
			}

			download := core.NewRecord(downloads)

			routine.FireAndForget(func() {
				ytdlp := ytdlp.New()
				if ytdlp == nil {
					return
				}

				result, err := ytdlp.GetInfo(url)
				if err != nil {
					e.App.Logger().Error("Items Hooks: failed to get video info: " + err.Error())
					return
				}

				videoId := result.Info.ID
				existingDownload, err := e.App.FindFirstRecordByData(collections.Downloads, "video_id", videoId)
				if err == nil && existingDownload != nil {
					download = existingDownload
				} else {
					audio, path, err := ytdlp.Download(url, download, result)
					if err != nil {
						e.App.Logger().Error("Items Hooks: failed to download audio: " + err.Error())
						return
					}
					defer audio.Close()

					if err := e.App.Save(download); err != nil {
						return
					}

					if err := os.Remove(path); err != nil {
						return
					}
				}

				itemRecord.Set("download", download.Id)
				if err := e.App.Save(itemRecord); err != nil {
					return
				}

				audioURL := fileClient.GetFileURL(download, "file")
				title := download.GetString("title")
				description := download.GetString("description")
				duration := download.GetFloat("duration")
				rss_utils.AddItemToPodcast(&p, title, audioURL, description, download.Id, audioURL, int64(duration))

				if err := UpdateXMLFile(e.App, fileClient, p, podcast); err != nil {
					e.App.Logger().Error("Items Hooks: failed to update XML file: " + err.Error())
					return
				}

				downloadSize := download.GetInt("size")
				currentUsage := monthlyUsage.GetInt("usage")
				monthlyUsage.Set("usage", currentUsage+downloadSize)

				if err := e.App.Save(monthlyUsage); err != nil {
					return
				}
			})
		case "upload":
			upload, err := e.App.FindRecordById(collections.Uploads, itemRecord.GetString("upload"))
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to find upload record: " + err.Error())
				return e.Next()
			}

			audioURL := fileClient.GetFileURL(upload, "file")
			title := upload.GetString("title")
			duration := upload.GetFloat("duration")
			rss_utils.AddItemToPodcast(&p, title, audioURL, "No description provided.", upload.Id, audioURL, int64(duration))

			routine.FireAndForget(func() {
				if err := UpdateXMLFile(e.App, fileClient, p, podcast); err != nil {
					e.App.Logger().Error("Items Hooks: failed to update XML file: " + err.Error())
					return
				}
			})

			currentUploadCount := monthlyUsage.GetInt("uploads")
			monthlyUsage.Set("uploads", currentUploadCount+1)
			if err := e.App.Save(monthlyUsage); err != nil {
				return e.Next()
			}
		}

		return e.Next()
	})

	app.OnRecordAfterDeleteSuccess(collections.Items).BindFunc(func(e *core.RecordEvent) error {
		itemType := e.Record.GetString("type")
		podcastId := e.Record.GetString("podcast")
		downloadId := e.Record.GetString("download")
		uploadId := e.Record.GetString("upload")

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

		switch itemType {
		case "url":
			rss_utils.RemoveItemFromPodcast(&p, downloadId)
		case "upload":
			rss_utils.RemoveItemFromPodcast(&p, uploadId)
		}

		if err := UpdateXMLFile(e.App, fileClient, p, podcast); err != nil {
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
