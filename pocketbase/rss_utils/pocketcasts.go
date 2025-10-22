package rss_utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/pocketbase/pocketbase/core"
)

func setPocketCastsURL(app core.App, podcast *core.Record) {
	fileClient, err := files.NewFileClient(app, podcast, "file")
	if err != nil {
		app.Logger().Error("rss_utils: failed to create file client for pocketcasts url", "error", err)
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
		app.Logger().Error("rss_utils: failed to add feed to Pocketcasts: " + err.Error())
		return
	}
	defer resp.Body.Close()

	var addResp PocketCastsAddFeedResp
	if err := json.NewDecoder(resp.Body).Decode(&addResp); err != nil {
		app.Logger().Error("rss_utils: failed to decode pocketcasts response", "error", err)
		return
	}

	searchURL := fmt.Sprintf("https://pocketcasts.com/search?q=%s", url.QueryEscape(podcastURL))

	if addResp.Status == "ok" {
		url := addResp.Result.ShareLink
		podcast.Set("pocketcasts_url", url)
		if err := app.Save(podcast); err != nil {
			app.Logger().Error("rss_utils: failed to save podcast with pocketcasts url", "error", err)
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
					app.Logger().Error("rss_utils: failed to save podcast with pocketcasts url", "error", err)
				}
				break
			} else if pollResp.Status == "error" {
				app.Logger().Error("rss_utils: Pocketcasts returned error status", "error", pollResp)
				podcast.Set("pocketcasts_url", searchURL)
				if err := app.Save(podcast); err != nil {
					app.Logger().Error("rss_utils: failed to save podcast with pocketcasts url", "error", err)
				}
				break
			}
		}
	} else {
		podcast.Set("pocketcasts_url", searchURL)
		if err := app.Save(podcast); err != nil {
			app.Logger().Error("rss_utils: failed to save podcast with pocketcasts url", "error", err)
		}
	}
}
