package items_hooks

import (
	"regexp"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/downloader"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
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
		podcastId := itemRecord.GetString("podcast")
		itemType := itemRecord.GetString("type")

		itemRecord.Set("status", "CREATED")
		if err := e.App.Save(itemRecord); err != nil {
			e.App.Logger().Error("Items Hooks: failed to update item record status to CREATED: " + err.Error())
			return e.Next()
		}

		switch itemType {
		case "url":
			downloader.AddJob(downloader.Job{
				App:        e.App,
				Record:     itemRecord,
				Collection: collections.Items,
			})
		case "upload":
			user := itemRecord.GetString("user")
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
				if err := rss_utils.UpdateXMLFile(e.App, fileClient, p, podcast); err != nil {
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

		xml, err := rss_utils.GenerateXML(&p)
		if err != nil {
			e.App.Logger().Error("Items Hooks: failed to generate XML: " + err.Error())
			return e.Next()
		}
		if err := fileClient.SetXMLFile(xml); err != nil {
			e.App.Logger().Error("Items Hooks: failed to update XML file: " + err.Error())
			return e.Next()
		}

		return e.Next()
	})

	return nil
}
