package api_hooks

import (
	"bytes"
	"io"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/security"
)

type ConvertRequest struct {
	URLs   []string `json:"urls"`
	APIKey string   `json:"api_key"`
}

type DownloadRequest struct {
	APIKey string `json:"api_key"`
}

type JobResponse struct {
	ID               string         `json:"id"`
	URL              string         `json:"url"`
	Status           string         `json:"status"`
	DownloadEndpoint string         `json:"download_endpoint,omitempty"`
	VideoMetadata    *VideoMetadata `json:"video_metadata,omitempty"`
}

type VideoMetadata struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    int    `json:"duration"`
	VideoID     string `json:"video_id"`
	Size        int    `json:"size"`
}

const (
	URLsLimit = 25
)

func Init(app *pocketbase.PocketBase) error {
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/api/generate-batch-id", func(e *core.RequestEvent) error {
			randomString := security.PseudorandomString(15)
			return e.JSON(200, map[string]any{
				"batchId": randomString,
			})
		}).Bind(apis.RequireAuth())

		se.Router.POST("/api/v1/convert", func(e *core.RequestEvent) error {
			e.App.Logger().Info("API Hooks: /api/v1/convert called")
			body := ConvertRequest{}
			if err := e.BindBody(&body); err != nil {
				return e.BadRequestError("Invalid request body", err)
			}

			apiKeysCollection, err := app.FindCollectionByNameOrId(collections.APIKeys)
			if err != nil {
				return e.InternalServerError("internal server error", map[string]any{})
			}

			apiKey := body.APIKey
			hashedAPIKey := security.SHA256(apiKey)
			apiKeyRecord, err := app.FindFirstRecordByData(apiKeysCollection, "hashed_key", hashedAPIKey)
			if err != nil || apiKeyRecord == nil {
				return e.UnauthorizedError("Invalid API key", map[string]any{})
			}

			if len(body.URLs) == 0 || len(body.URLs) > URLsLimit {
				return e.BadRequestError("Invalid number of URLs, must be between 1 and "+string(rune(URLsLimit)), map[string]any{})
			}

			jobCollection, err := app.FindCollectionByNameOrId(collections.Jobs)
			if err != nil {
				return e.InternalServerError("internal server error", map[string]any{})
			}

			batchId := security.PseudorandomString(15)
			jobs := make([]JobResponse, 0, len(body.URLs))

			err = app.RunInTransaction(func(txApp core.App) error {
				for _, url := range body.URLs {
					jobRecord := core.NewRecord(jobCollection)
					jobRecord.Set("user", apiKeyRecord.GetString("user"))
					jobRecord.Set("url", url)
					jobRecord.Set("status", "CREATED")
					jobRecord.Set("batch_id", batchId)
					jobRecord.Set("api_key", apiKeyRecord.Id)
					if err := txApp.Save(jobRecord); err != nil {
						e.App.Logger().Error("API Hooks: failed to create job record: " + err.Error())
						return err
					}

					jobs = append(jobs, JobResponse{
						ID:     jobRecord.Id,
						URL:    url,
						Status: "CREATED",
					})
				}

				return nil
			})
			if err != nil {
				return e.InternalServerError("failed to create jobs", err.Error())
			}

			return e.JSON(200, map[string]any{
				"batch_id": batchId,
				"message":  "Jobs created successfully",
				"jobs":     jobs,
			})
		})

		se.Router.GET("/api/v1/poll/batch/{batchId}", func(e *core.RequestEvent) error {
			batchId := e.Request.PathValue("batchId")
			if batchId == "" {
				return e.BadRequestError("Missing batchId parameter", map[string]any{})
			}

			jobCollection, err := e.App.FindCollectionByNameOrId(collections.Jobs)
			if err != nil {
				return e.InternalServerError("internal server error", map[string]any{})
			}

			jobs, err := e.App.FindRecordsByFilter(jobCollection, "batch_id = {:batchId}", "", 0, 0, dbx.Params{"batchId": batchId})
			if err != nil {
				return e.InternalServerError("internal server error", map[string]any{})
			}

			jobsResponse := []JobResponse{}
			batchSize := len(jobs)
			pendingCount := 0
			processingCount := 0
			successCount := 0
			errorCount := 0

			for _, job := range jobs {
				url := job.GetString("url")
				id := job.Id
				status := job.GetString("status")

				if status == "SUCCESS" {
					download, err := e.App.FindRecordById(collections.Downloads, job.GetString("download"))
					if err != nil || download == nil {
						jobsResponse = append(jobsResponse, JobResponse{
							ID:     id,
							URL:    url,
							Status: status,
						})
					}

					title := download.GetString("title")
					description := download.GetString("description")
					duration := download.GetInt("duration")
					videoId := download.GetString("video_id")
					size := download.GetInt("size")
					downloadEndpoint := "/api/v1/download/" + job.Id

					jobsResponse = append(jobsResponse, JobResponse{
						ID:               id,
						URL:              url,
						Status:           status,
						DownloadEndpoint: downloadEndpoint,
						VideoMetadata: &VideoMetadata{
							Title:       title,
							Description: description,
							Duration:    duration,
							VideoID:     videoId,
							Size:        size,
						},
					})
				} else {
					jobsResponse = append(jobsResponse, JobResponse{
						ID:     id,
						URL:    url,
						Status: status,
					})
				}

				switch status {
				case "PENDING":
					pendingCount++
				case "PROCESSING":
					processingCount++
				case "SUCCESS":
					successCount++
				case "ERROR":
					errorCount++
				}
			}

			batchComplete := successCount+errorCount == batchSize

			return e.JSON(200, map[string]any{
				"batch_id": batchId,
				"jobs":     jobsResponse,
				"finished": batchComplete,
				"counts": map[string]int{
					"pending":    pendingCount,
					"processing": processingCount,
					"success":    successCount,
					"error":      errorCount,
				},
			})
		})

		se.Router.GET("/api/v1/poll/job/{jobId}", func(e *core.RequestEvent) error {
			jobId := e.Request.PathValue("jobId")
			if jobId == "" {
				return e.BadRequestError("Missing jobId parameter", map[string]any{})
			}

			job, err := e.App.FindRecordById(collections.Jobs, jobId)
			if err != nil || job == nil {
				return e.NotFoundError("Job not found", map[string]any{})
			}

			status := job.GetString("status")
			url := job.GetString("url")

			if status == "SUCCESS" {
				download, err := e.App.FindRecordById(collections.Downloads, job.GetString("download"))
				if err != nil || download == nil {
					return e.NotFoundError("Download not found", map[string]any{})
				}

				title := download.GetString("title")
				description := download.GetString("description")
				duration := download.GetInt("duration")
				videoId := download.GetString("video_id")
				size := download.GetInt("size")
				downloadEndpoint := "/api/v1/download/" + job.Id

				return e.JSON(200, JobResponse{
					ID:               job.Id,
					URL:              url,
					Status:           status,
					DownloadEndpoint: downloadEndpoint,
					VideoMetadata: &VideoMetadata{
						Title:       title,
						Description: description,
						Duration:    duration,
						VideoID:     videoId,
						Size:        size,
					},
				})
			} else {
				return e.JSON(200, JobResponse{
					ID:     job.Id,
					URL:    url,
					Status: status,
				})
			}
		})

		se.Router.POST("/api/v1/download/{jobId}", func(e *core.RequestEvent) error {
			jobId := e.Request.PathValue("jobId")
			if jobId == "" {
				return e.BadRequestError("Missing jobId parameter", map[string]any{})
			}

			body := DownloadRequest{}
			if err := e.BindBody(&body); err != nil {
				return e.BadRequestError("Invalid request body", err)
			}

			apiKeysCollection, err := app.FindCollectionByNameOrId(collections.APIKeys)
			if err != nil {
				return e.InternalServerError("internal server error", map[string]any{})
			}

			apiKey := body.APIKey
			hashedAPIKey := security.SHA256(apiKey)
			apiKeyRecord, err := app.FindFirstRecordByData(apiKeysCollection, "hashed_key", hashedAPIKey)
			if err != nil || apiKeyRecord == nil {
				return e.UnauthorizedError("Invalid API key", map[string]any{})
			}

			job, err := e.App.FindRecordById(collections.Jobs, jobId)
			if err != nil || job == nil {
				return e.NotFoundError("Job not found", map[string]any{})
			}

			if job.GetString("status") != "SUCCESS" {
				return e.BadRequestError("Job has not completed successfully", map[string]any{})
			}

			downloadId := job.GetString("download")
			if downloadId == "" {
				return e.BadRequestError("Job does not have an associated download", map[string]any{})
			}

			download, err := e.App.FindRecordById(collections.Downloads, downloadId)
			if err != nil || download == nil {
				return e.NotFoundError("Download not found", map[string]any{})
			}

			fsys, err := app.NewFilesystem()
			if err != nil {
				return e.InternalServerError("internal server error", map[string]any{})
			}
			defer fsys.Close()

			fileKey := download.BaseFilesPath() + "/" + download.GetString("file")

			r, err := fsys.GetReader(fileKey)
			if err != nil {
				return e.InternalServerError("internal server error", map[string]any{})
			}
			defer r.Close()

			content := new(bytes.Buffer)
			_, err = io.Copy(content, r)
			if err != nil {
				return e.InternalServerError("internal server error", map[string]any{})
			}

			return e.Blob(200, "audio/mpeg", content.Bytes())
		})

		return se.Next()
	})

	return nil

}
