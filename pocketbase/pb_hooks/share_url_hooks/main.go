package share_url_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func respondWithUrl(e *core.RequestEvent, url, prefix string) error {
	if url != "" {
		return e.JSON(200, map[string]any{"url": prefix + url})
	}
	return e.JSON(200, map[string]any{"url": nil})
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
				return respondWithUrl(e, podcast.GetString("pocketcasts_url"), "")
			case "apple":
				return respondWithUrl(e, podcast.GetString("apple_url"), "podcast://")
			case "spotify":
				return respondWithUrl(e, podcast.GetString("spotify_url"), "")
			case "youtube":
				return respondWithUrl(e, podcast.GetString("youtube_url"), "")
			}

			return e.NotFoundError("platform not supported", nil)
		}).Bind(apis.RequireAuth())

		return se.Next()
	})

	return nil
}
