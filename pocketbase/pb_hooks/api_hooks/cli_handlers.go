package api_hooks

import (
	"net/http"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

func addItemHandler(e *core.RequestEvent) error {
	body := AddUrlRequestBody{}
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("failed to parse request body", nil)
	}

	itemsCollection, err := e.App.FindCollectionByNameOrId(collections.Items)
	if err != nil {
		return e.InternalServerError("internal server error", nil)
	}

	user := e.Get("user").(*core.Record)

	item := core.NewRecord(itemsCollection)
	item.Set("user", user.Id)
	item.Set("podcast", body.PodcastID)
	item.Set("url", body.URL)
	item.Set("type", "url")
	item.Set("status", "CREATED")
	if err := e.App.Save(item); err != nil {
		return e.InternalServerError("internal server error", nil)
	}

	return e.JSON(http.StatusOK, nil)
}

func getItemsHandler(e *core.RequestEvent) error {
	podcastId := e.Request.PathValue("podcastId")
	if podcastId == "" {
		return e.BadRequestError("Missing podcastId parameter", nil)
	}

	user := e.Get("user").(*core.Record)

	items, err := e.App.FindAllRecords(collections.Items, dbx.HashExp{"podcast": podcastId, "user": user.Id})
	if err != nil || items == nil {
		return e.NotFoundError("No items found", nil)
	}

	ItemResponses := []ItemResponse{}
	for _, item := range items {
		response := ItemResponse{
			Status:  item.GetString("status"),
			Title:   item.GetString("title"),
			Error:   item.GetString("error"),
			Created: item.GetString("created"),
		}
		ItemResponses = append(ItemResponses, response)
	}

	return e.JSON(200, ItemResponses)
}

func listPodcastsHandler(e *core.RequestEvent) error {
	user := e.Get("user").(*core.Record)

	podcasts, err := e.App.FindAllRecords(collections.Podcasts, dbx.HashExp{"user": user.Id})
	if err != nil {
		return e.NotFoundError("no podcasts found", nil)
	}

	podcastResponses := []PodcastResponse{}
	for _, podcast := range podcasts {
		response := PodcastResponse{
			ID:    podcast.Id,
			Title: podcast.GetString("title"),
		}
		podcastResponses = append(podcastResponses, response)
	}

	return e.JSON(http.StatusOK, podcastResponses)
}

func getUsageHandler(e *core.RequestEvent) error {
	user := e.Get("user").(*core.Record)

	monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
		"user": user.Id,
	})
	if err != nil || len(monthlyUsageRecords) == 0 {
		return e.NotFoundError("could not find usage record", nil)
	}
	monthlyUsage := monthlyUsageRecords[0]

	usageLimit := monthlyUsage.GetInt("limit")
	currentUsage := monthlyUsage.GetInt("usage")

	return e.JSON(http.StatusOK, map[string]any{
		"usage": currentUsage,
		"limit": usageLimit,
	})
}
