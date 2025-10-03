package share_url_hooks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

type AddFeedRequest struct {
	Url          string  `json:"url"`
	PublicOption string  `json:"public_option"`
	PollUUID     *string `json:"poll_uuid"`
}

type AddFeedResponse struct {
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
				return e.NotFoundError("Podcast not found", nil)
			}

			if podcast.GetString("user") != e.Auth.Id {
				return e.ForbiddenError("You do not have access to this podcast", nil)
			}

			switch platform {
			case "pocketcasts":
				shareUrl := podcast.GetString("pocketcasts_share_url")
				if shareUrl != "" {
					return e.JSON(200, map[string]any{"share_url": shareUrl})
				} else {
					fileName := podcast.GetString("file")
					podcastURL := files.GetFileURL(podcast.BaseFilesPath(), fileName)
					addFeedReq := AddFeedRequest{
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

					var addResp AddFeedResponse
					if err := json.NewDecoder(resp.Body).Decode(&addResp); err != nil {
						e.App.Logger().Error("Share URL Route: failed to decode add feed response: " + err.Error())
						return e.Next()
					}

					if addResp.Status == "ok" {
						shareUrl := addResp.Result.ShareLink
						podcast.Set("pocketcasts_share_url", shareUrl)
						if err := e.App.Save(podcast); err != nil {
							e.App.Logger().Error("Share URL Route: failed to save podcast with share URL: " + err.Error())
							return e.Next()
						}
						return e.JSON(200, map[string]any{"share_url": shareUrl})
					}

					if addResp.Status != "poll" || addResp.PollUUID == "" {
						e.App.Logger().Error("Share URL Route: unexpected add feed response", "response", addResp)
						return e.JSON(200, map[string]any{"connect_url": fmt.Sprintf("https://pocketcasts.com/search?q=%s", url.QueryEscape(podcastURL))})
					}

					if addResp.Status == "poll" && addResp.PollUUID != "" {
						pollURL := "https://refresh.pocketcasts.com/author/add_feed_url"
						for range 30 {
							time.Sleep(2 * time.Second)

							pollReq := AddFeedRequest{
								Url:          podcastURL,
								PublicOption: "no",
								PollUUID:     &addResp.PollUUID,
							}
							pollJSON, _ := json.Marshal(pollReq)

							resp, err := http.Post(pollURL, "application/json", bytes.NewBuffer(pollJSON))
							if err != nil {
								e.App.Logger().Error("Podcast Hooks: failed to poll feed: " + err.Error())
								continue
							}

							var pollResp AddFeedResponse
							if err := json.NewDecoder(resp.Body).Decode(&pollResp); err != nil {
								e.App.Logger().Error("Podcast Hooks: failed to decode poll response: " + err.Error())
								continue
							}

							if pollResp.Status == "ok" && pollResp.Result.ShareLink != "" {
								podcast.Set("pocketcasts_share_url", pollResp.Result.ShareLink)
								if err := e.App.Save(podcast); err != nil {
									e.App.Logger().Error("Podcast Hooks: failed to save share URL: " + err.Error())
								}
								break
							} else if pollResp.Status == "error" {
								e.App.Logger().Error("Podcast Hooks: Pocketcasts returned error status", "error", pollResp)
								return e.JSON(200, map[string]any{"connect_url": fmt.Sprintf("https://pocketcasts.com/search?q=%s", url.QueryEscape(podcastURL))})
							}
						}
					}
				}

				return e.JSON(200, map[string]any{"share_url": podcast.GetString("pocketcasts_share_url")})
			case "apple":
				shareUrl := podcast.GetString("apple_share_url")
				if shareUrl != "" {
					return e.JSON(200, map[string]any{"share_url": "podcast://" + shareUrl})
				} else {
					return e.JSON(200, map[string]any{"connect_url": "https://podcastsconnect.apple.com/my-podcasts/new-feed?submitfeed=" + files.GetFileURL(podcast.BaseFilesPath(), podcast.GetString("file"))})
				}
			case "spotify":
				shareUrl := podcast.GetString("spotify_share_url")
				if shareUrl != "" {
					return e.JSON(200, map[string]any{"share_url": shareUrl})
				} else {
					return e.JSON(200, map[string]any{"connect_url": "https://creators.spotify.com/dash/submit"})
				}
			case "youtube":
				shareUrl := podcast.GetString("youtube_share_url")
				if shareUrl != "" {
					return e.JSON(200, map[string]any{"share_url": shareUrl})
				} else {
					return e.JSON(200, map[string]any{"connect_url": "https://music.youtube.com/library/podcasts"})
				}
			}

			return e.NotFoundError("Platform not supported", nil)
		}).Bind(apis.RequireAuth())

		return se.Next()
	})

	return nil
}
