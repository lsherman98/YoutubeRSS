package api_hooks

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/security"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/api/generate-batch-id", func(e *core.RequestEvent) error {
			randomString := security.PseudorandomString(15)
			return e.JSON(200, map[string]any{
				"batchId": randomString,
			})
		}).Bind(apis.RequireAuth())

		v1 := se.Router.Group("/api/v1")

		v1.GET("/poll/batch/{batchId}", pollBatchHandler)
		v1.GET("/poll/job/{jobId}", pollJobHandler)
		v1.POST("/convert", convertHandler).BindFunc(requireValidAPIKey, checkUsageLimits)
		v1.POST("/download/{jobId}", downloadHandler).BindFunc(requireValidAPIKey)

		v1.GET("/get-items/{podcastId}", getItemsHandler).BindFunc(requireValidAPIKey)
		v1.GET("/list-podcasts", listPodcastsHandler).BindFunc(requireValidAPIKey)
		v1.GET("/get-usage", getUsageHandler).BindFunc(requireValidAPIKey)
		v1.POST("/podcasts/add-url", addItemHandler).BindFunc(requireValidAPIKey, checkUsageLimits)

		return se.Next()
	})

	return nil
}
