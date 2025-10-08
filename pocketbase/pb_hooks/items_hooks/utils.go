package items_hooks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/eduncan911/podcast"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/lsherman98/yt-rss/pocketbase/rss_utils"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
)

func UpdateXMLFile(app core.App, fileClient *files.FileClient, p podcast.Podcast, podcast *core.Record) error {
	xml, err := rss_utils.GenerateXML(&p)
	if err != nil {
		app.Logger().Error("Items Hooks: failed to generate XML", "error", err)
		return err
	}

	xmlFile, err := fileClient.NewXMLFile(xml, podcast.Id)
	if err != nil {
		app.Logger().Error("Items Hooks: failed to create new XML file", "error", err)
		return err
	}

	podcast.Set("file", xmlFile)
	if err := app.Save(podcast); err != nil {
		app.Logger().Error("Items Hooks: failed to save podcast with new XML file", "error", err)
		return err
	}

	if podcast.GetString("pocketcasts_url") == "" {
		routine.FireAndForget(func() {
			setPocketCastsURL(app, podcast)
		})
	}
	
	defer fileClient.Close()
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
	defer fileClient.Close()

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
