package share_url_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

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
				}
				return e.JSON(200, map[string]any{"url": nil})
			case "apple":
				url := podcast.GetString("apple_url")
				if url != "" {
					return e.JSON(200, map[string]any{"url": "podcast://" + url})
				}
				return e.JSON(200, map[string]any{"url": nil})
			case "spotify":
				url := podcast.GetString("spotify_url")
				if url != "" {
					return e.JSON(200, map[string]any{"url": url})
				}
				return e.JSON(200, map[string]any{"url": nil})
			case "youtube":
				url := podcast.GetString("youtube_url")
				if url != "" {
					return e.JSON(200, map[string]any{"url": url})
				}
				return e.JSON(200, map[string]any{"url": nil})
			}

			return e.NotFoundError("platform not supported", nil)
		}).Bind(apis.RequireAuth())

		return se.Next()
	})

	return nil
}
