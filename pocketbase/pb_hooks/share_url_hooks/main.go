package share_url_hooks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	u "net/url"
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

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

func Init(app *pocketbase.PocketBase) error {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/api/share_url/{podcastId}/{platform}", func(e *core.RequestEvent) error {
			podcastId := e.Request.PathValue("podcastId")
			platform := e.Request.PathValue("platform")

			podcast, err := e.App.FindRecordById(collections.Podcasts, podcastId)
			if err != nil {
				return e.NotFoundError("invalid podcast id", nil)
			}

			if podcast.GetString("user") != e.Auth.Id {
				return e.ForbiddenError("forbidden", nil)
			}

			switch platform {
			case "pocketcasts":
				url := podcast.GetString("pocketcasts_url")
				if url != "" {
					return e.JSON(200, map[string]any{"url": url})
				} else {
					fileName := podcast.GetString("file")
					podcastURL := files.GetFileURL(podcast.BaseFilesPath(), fileName)
					addFeedReq := PocketCastsAddFeedReq{
						Url:          podcastURL,
						PublicOption: "no",
						PollUUID:     nil,
					}
					addFeedJSON, _ := json.Marshal(addFeedReq)

					resp, err := http.Post("https://refresh.pocketcasts.com/author/add_feed_url", "application/json", bytes.NewBuffer(addFeedJSON))
					if err != nil {
						e.App.Logger().Error("Share URL Route: failed to add feed to Pocketcasts: " + err.Error())
						return e.Next()
					}
					defer resp.Body.Close()

					var addResp PocketCastsAddFeedResp
					if err := json.NewDecoder(resp.Body).Decode(&addResp); err != nil {
						return e.Next()
					}

					searchURL := fmt.Sprintf("https://pocketcasts.com/search?q=%s", u.QueryEscape(podcastURL))

					if addResp.Status == "ok" {
						url = addResp.Result.ShareLink
						podcast.Set("pocketcasts_url", url)
						if err := e.App.Save(podcast); err != nil {
							return e.Next()
						}
						return e.JSON(200, map[string]any{"url": url})
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
								e.App.Save(podcast)
								break
							} else if pollResp.Status == "error" {
								e.App.Logger().Error("Podcast Hooks: Pocketcasts returned error status", "error", pollResp)
								return e.JSON(200, map[string]any{"url": searchURL})
							}
						}
					} else {
						return e.JSON(200, map[string]any{"url": searchURL})
					}
				}
			case "apple":
				shareUrl := podcast.GetString("apple_url")
				if shareUrl != "" {
					return e.JSON(200, map[string]any{"url": "podcast://" + shareUrl})
				} else {
					return e.JSON(200, map[string]any{"url": nil})
				}
			case "spotify":
				shareUrl := podcast.GetString("spotify_url")
				if shareUrl != "" {
					return e.JSON(200, map[string]any{"url": shareUrl})
				} else {
					return e.JSON(200, map[string]any{"url": nil})
				}
			case "youtube":
				shareUrl := podcast.GetString("youtube_url")
				if shareUrl != "" {
					return e.JSON(200, map[string]any{"url": shareUrl})
				} else {
					return e.JSON(200, map[string]any{"url": nil})
				}
			}

			return e.NotFoundError("platform not supported", nil)
		}).Bind(apis.RequireAuth())

		return se.Next()
	})

	return nil
}
