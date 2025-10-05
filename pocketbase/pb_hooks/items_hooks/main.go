package items_hooks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"

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

			if podcast.GetString("pocketcasts_url") == "" {
				routine.FireAndForget(func() {
					setPocketCastsURL(e.App, podcast)
				})
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

type PocketCastsAddFeedReq struct {
	Url          string  `json:"url"`
	PublicOption string  `json:"public_option"`
	PollUUID     *string `json:"poll_uuid"`
}

type PocketCastsAddFeedResp struct {
	Status   string `json:"status"`
	PollUUID string `json:"poll_uuid"`
	Result   struct {
		ShareLink string `json:"share_link"`
	}
}

func setPocketCastsURL(app core.App, podcast *core.Record) {
	fileClient, err := files.NewFileClient(app, podcast, "file")
	if err != nil {
		app.Logger().Error("Items Hooks: failed to create file client for pocketcasts url", "error", err)
		return
	}

	podcastURL := fileClient.GetFileURL(podcast, "file")
	addFeedReq := PocketCastsAddFeedReq{
		Url:          podcastURL,
		PublicOption: "no",
		PollUUID:     nil,
	}
	addFeedJSON, _ := json.Marshal(addFeedReq)

	resp, err := http.Post("https://refresh.pocketcasts.com/author/add_feed_url", "application/json", bytes.NewBuffer(addFeedJSON))
	if err != nil {
		app.Logger().Error("Share URL Route: failed to add feed to Pocketcasts: " + err.Error())
		return
	}
	defer resp.Body.Close()

	var addResp PocketCastsAddFeedResp
	if err := json.NewDecoder(resp.Body).Decode(&addResp); err != nil {
		app.Logger().Error("Items Hooks: failed to decode pocketcasts response", "error", err)
		return
	}

	searchURL := fmt.Sprintf("https://pocketcasts.com/search?q=%s", url.QueryEscape(podcastURL))

	if addResp.Status == "ok" {
		url := addResp.Result.ShareLink
		podcast.Set("pocketcasts_url", url)
		if err := app.Save(podcast); err != nil {
			app.Logger().Error("Items Hooks: failed to save podcast with pocketcasts url", "error", err)
		}
		return
	}

	if addResp.Status == "poll" && addResp.PollUUID != "" {
		pollURL := "https://refresh.pocketcasts.com/author/add_feed_url"
		for range 30 {
			time.Sleep(2 * time.Second)

			pollReq := PocketCastsAddFeedReq{
				Url:          podcastURL,
				PublicOption: "no",
				PollUUID:     &addResp.PollUUID,
			}
			pollJSON, _ := json.Marshal(pollReq)

			resp, err := http.Post(pollURL, "application/json", bytes.NewBuffer(pollJSON))
			if err != nil {
				continue
			}

			var pollResp PocketCastsAddFeedResp
			if err := json.NewDecoder(resp.Body).Decode(&pollResp); err != nil {
				continue
			}

			if pollResp.Status == "ok" && pollResp.Result.ShareLink != "" {
				podcast.Set("pocketcasts_url", pollResp.Result.ShareLink)
				if err := app.Save(podcast); err != nil {
					app.Logger().Error("Items Hooks: failed to save podcast with pocketcasts url", "error", err)
				}
				break
			} else if pollResp.Status == "error" {
				app.Logger().Error("Podcast Hooks: Pocketcasts returned error status", "error", pollResp)
				podcast.Set("pocketcasts_url", searchURL)
				if err := app.Save(podcast); err != nil {
					app.Logger().Error("Items Hooks: failed to save podcast with pocketcasts url", "error", err)
				}
				break
			}
		}
	} else {
		podcast.Set("pocketcasts_url", searchURL)
		if err := app.Save(podcast); err != nil {
			app.Logger().Error("Items Hooks: failed to save podcast with pocketcasts url", "error", err)
		}
	}
}
