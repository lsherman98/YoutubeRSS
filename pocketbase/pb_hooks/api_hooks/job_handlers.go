package api_hooks

import (
	"bytes"
	"io"
	"net/http"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/security"
)

const (
	URLsLimit = 25
)

func convertHandler(e *core.RequestEvent) error {
	body := ConvertRequest{}
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("Invalid request body", err)
	}

	if len(body.URLs) == 0 || len(body.URLs) > URLsLimit {
		return e.BadRequestError("Invalid number of URLs, must be between 1 and "+string(rune(URLsLimit)), nil)
	}

	user := e.Get("user").(*core.Record)
	apiKeyRecord := e.Get("apiKeyRecord").(*core.Record)

	jobCollection, err := e.App.FindCollectionByNameOrId(collections.Jobs)
	if err != nil {
		return e.InternalServerError("internal server error", nil)
	}

	batchId := security.PseudorandomString(15)
	jobs := make([]JobResponse, 0, len(body.URLs))

	err = e.App.RunInTransaction(func(txApp core.App) error {
		for _, url := range body.URLs {
			jobRecord := core.NewRecord(jobCollection)
			jobRecord.Set("user", user.Id)
			jobRecord.Set("url", url)
			jobRecord.Set("status", "CREATED")
			jobRecord.Set("batch_id", batchId)
			jobRecord.Set("api_key", apiKeyRecord.Id)
			if err := txApp.Save(jobRecord); err != nil {
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

	return e.JSON(http.StatusOK, map[string]any{
		"batch_id": batchId,
		"message":  "Jobs created successfully",
		"jobs":     jobs,
	})
}

func pollBatchHandler(e *core.RequestEvent) error {
	batchId := e.Request.PathValue("batchId")
	if batchId == "" {
		return e.BadRequestError("missing batchId parameter", nil)
	}

	jobCollection, err := e.App.FindCollectionByNameOrId(collections.Jobs)
	if err != nil {
		return e.InternalServerError("internal server error", nil)
	}

	jobs, err := e.App.FindRecordsByFilter(jobCollection, "batch_id = {:batchId}", "", 0, 0, dbx.Params{"batchId": batchId})
	if err != nil {
		return e.NotFoundError("batch not found", nil)
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
}

func pollJobHandler(e *core.RequestEvent) error {
	jobId := e.Request.PathValue("jobId")
	if jobId == "" {
		return e.BadRequestError("Missing jobId parameter", nil)
	}

	job, err := e.App.FindRecordById(collections.Jobs, jobId)
	if err != nil || job == nil {
		return e.NotFoundError("Job not found", nil)
	}

	status := job.GetString("status")
	url := job.GetString("url")

	if status == "SUCCESS" {
		download, err := e.App.FindRecordById(collections.Downloads, job.GetString("download"))
		if err != nil || download == nil {
			return e.NotFoundError("Download not found", nil)
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
}

func downloadHandler(e *core.RequestEvent) error {
	jobId := e.Request.PathValue("jobId")
	if jobId == "" {
		return e.BadRequestError("missing jobId parameter", nil)
	}

	job, err := e.App.FindRecordById(collections.Jobs, jobId)
	if err != nil || job == nil {
		return e.NotFoundError("job not found", nil)
	}

	if job.GetString("status") != "SUCCESS" {
		return e.BadRequestError("job has not completed successfully", nil)
	}

	downloadId := job.GetString("download")
	if downloadId == "" {
		return e.BadRequestError("job does not have an associated download", nil)
	}

	download, err := e.App.FindRecordById(collections.Downloads, downloadId)
	if err != nil || download == nil {
		return e.NotFoundError("download not found", nil)
	}

	fsys, err := e.App.NewFilesystem()
	if err != nil {
		return e.InternalServerError("internal server error", nil)
	}
	defer fsys.Close()

	fileKey := download.BaseFilesPath() + "/" + download.GetString("file")
	r, err := fsys.GetReader(fileKey)
	if err != nil {
		return e.InternalServerError("internal server error", nil)
	}
	defer r.Close()

	content := new(bytes.Buffer)
	_, err = io.Copy(content, r)
	if err != nil {
		return e.InternalServerError("internal server error", nil)
	}

	return e.Blob(200, "audio/mpeg", content.Bytes())
}
