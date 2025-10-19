package items_hooks

import (
	"os"
	"regexp"

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
			return e.BadRequestError("Invalid YouTube URL", nil)
		}

		monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
			"user": e.Auth.Id,
		})
		if err != nil || monthlyUsageRecords == nil {
			e.App.Logger().Error("Item Hooks: failed to find monthly usage record: " + err.Error())
			return e.Next()
		}
		monthlyUsage := monthlyUsageRecords[0]

		usageLimit := monthlyUsage.GetInt("limit")
		currentUsage := monthlyUsage.GetInt("usage")
		if currentUsage >= usageLimit {
			return e.ForbiddenError("Monthly usage limit exceeded", nil)
		}

		return e.Next()
	})

	app.OnRecordAfterCreateSuccess(collections.Items).BindFunc(func(e *core.RecordEvent) error {
		itemRecord := e.Record
		url := itemRecord.GetString("url")
		podcastId := itemRecord.GetString("podcast")
		itemType := itemRecord.GetString("type")
		user := itemRecord.GetString("user")

		itemRecord.Set("status", "CREATED")
		if err := e.App.Save(itemRecord); err != nil {
			e.App.Logger().Error("Items Hooks: failed to update item record status to CREATED: " + err.Error())
			return e.Next()
		}

		podcast, err := e.App.FindRecordById(collections.Podcasts, podcastId)
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to find podcast record: " + err.Error())
			return e.Next()
		}

		fileClient, err := files.NewFileClient(e.App, podcast, "file")
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to create file client: " + err.Error())
			return e.Next()
		}

		content, err := fileClient.GetXMLFile()
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to get XML file: " + err.Error())
			return e.Next()
		}

		p, err := rss_utils.ParseXML(content.String())
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to parse XML file: " + err.Error())
			return e.Next()
		}

		monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
			"user": user,
		})
		if err != nil || monthlyUsageRecords == nil {
			e.App.Logger().Error("Items Hooks: failed to find monthly usage record: " + err.Error())
			return e.Next()
		}
		monthlyUsage := monthlyUsageRecords[0]

		switch itemType {
		case "url":
			downloads, err := e.App.FindCollectionByNameOrId(collections.Downloads)
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to find downloads collection: " + err.Error())
				return e.Next()
			}

			download := core.NewRecord(downloads)

			routine.FireAndForget(func() {
				ytdlp := ytdlp.New(e.App)
				if ytdlp == nil {
					e.App.Logger().Error("Items Hooks: failed to initialize ytdlp")
					return
				}

				result, err := ytdlp.GetInfo(url)
				if err != nil {
					e.App.Logger().Error("Items Hooks: failed to get video info: " + err.Error())
					return
				}

				itemRecord.Set("title", result.Info.Title)
				if err := e.App.Save(itemRecord); err != nil {
					e.App.Logger().Error("Items Hooks: failed to update item record title: " + err.Error())
					return
				}

				fileSize := 0
				if result.Info.Filesize != 0 {
					fileSize = int(result.Info.Filesize)
				} else {
					length := result.Info.Duration
					fileSize = int(float64(length) * 25000)
				}

				usageLimit := monthlyUsage.GetInt("limit")
				currentUsage := monthlyUsage.GetInt("usage")

				if currentUsage > usageLimit || (currentUsage+int(fileSize/2)) > usageLimit {
					itemRecord.Set("status", "ERROR")
					itemRecord.Set("error", "Failed to add item to podcast: Monthly usage limit exceeded")
					if err := e.App.Save(itemRecord); err != nil {
						e.App.Logger().Error("Items Hooks: failed to update item record status to ERROR: " + err.Error())
						return
					}
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
						e.App.Logger().Error("Items Hooks: failed to save download record: " + err.Error())
						return
					}

					if err := os.Remove(path); err != nil {
						e.App.Logger().Error("Items Hooks: failed to remove temp file: " + err.Error())
						return
					}
				}

				itemRecord.Set("download", download.Id)
				if err := e.App.Save(itemRecord); err != nil {
					e.App.Logger().Error("Items Hooks: failed to update item record with download ID: " + err.Error())
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

				itemRecord.Set("status", "SUCCESS")
				if err := e.App.Save(itemRecord); err != nil {
					e.App.Logger().Error("Items Hooks: failed to update item record status to SUCCESS: " + err.Error())
					return
				}

				downloadSize := download.GetInt("size")
				monthlyUsage.Set("usage", currentUsage+downloadSize)
				if err := e.App.Save(monthlyUsage); err != nil {
					e.App.Logger().Error("Items Hooks: failed to update monthly usage: " + err.Error())
					return
				}
			})
		case "upload":
			currentUploadCount := monthlyUsage.GetInt("uploads")

			upload, err := e.App.FindRecordById(collections.Uploads, itemRecord.GetString("upload"))
			if err != nil {
				e.App.Logger().Error("Items Hooks: failed to find upload record: " + err.Error())
				return e.Next()
			}

			itemRecord.Set("status", "SUCCESS")
			if err := e.App.Save(itemRecord); err != nil {
				e.App.Logger().Error("Items Hooks: failed to update item record status to SUCCESS: " + err.Error())
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

			monthlyUsage.Set("uploads", currentUploadCount+1)
			if err := e.App.Save(monthlyUsage); err != nil {
				e.App.Logger().Error("Items Hooks: failed to update monthly usage: " + err.Error())
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
			e.App.Logger().Error("Items Hooks: failed to create file client: " + err.Error())
			return e.Next()
		}

		content, err := fileClient.GetXMLFile()
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to get XML file: " + err.Error())
			return e.Next()
		}

		p, err := rss_utils.ParseXML(content.String())
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to parse XML file: " + err.Error())
			return e.Next()
		}

		switch itemType {
		case "url":
			rss_utils.RemoveItemFromPodcast(&p, downloadId)
		case "upload":
			rss_utils.RemoveItemFromPodcast(&p, uploadId)
		}

		if err := UpdateXMLFile(e.App, fileClient, p, podcast); err != nil {
			e.App.Logger().Error("Items Hooks: failed to update XML file: " + err.Error())
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
