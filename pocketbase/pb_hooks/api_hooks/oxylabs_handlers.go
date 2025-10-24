package api_hooks

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/lsherman98/yt-rss/pocketbase/oxylabs"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/pocketbase/pocketbase/tools/routine"
)

type ContextItem struct {
	Key   string `json:"key"`
	Value any    `json:"value"`
}

type WebhookPayload struct {
	CallbackURL   string        `json:"callback_url"`
	ClientID      int           `json:"client_id"`
	Context       []ContextItem `json:"context"`
	CreatedAt     string        `json:"created_at"`
	ID            string        `json:"id"`
	Query         string        `json:"query"`
	Source        string        `json:"source"`
	Status        string        `json:"status"`
	StorageType   string        `json:"storage_type"`
	StorageURL    string        `json:"storage_url"`
	UpdatedAt     string        `json:"updated_at"`
	UserAgentType string        `json:"user_agent_type"`
}

func oxyLabsWebhookHandler(e *core.RequestEvent) error {
	queueId := e.Request.PathValue("queueId")
	queue, err := e.App.FindRecordById(collections.Queue, queueId)
	if err != nil {
		e.App.Logger().Error("Oxylabs Webhook: failed to find queue record", "queue_id", queueId, "error", err)
		return e.JSON(http.StatusNotFound, map[string]string{"error": "Queue record not found"})
	}

	payload := WebhookPayload{}
	if err := e.BindBody(&payload); err != nil {
		return e.BadRequestError("Invalid request body", err)
	}

	status := payload.Status
	if status == "" {
		return e.JSON(http.StatusBadRequest, map[string]string{"error": "Missing or invalid 'status' in payload"})
	}

	oxylabClient, err := oxylabs.NewClient()
	if err != nil {
		return fmt.Errorf("failed to initialize oxylabClient: %w", err)
	}

	switch status {
	case "pending":
		handlePending(e.App, queue)
	case "done":
		handleDone(e.App, oxylabClient, payload, queue)
	case "faulted":
		handleFaulted(e.App, queue)
	default:
		log.Printf("Unknown webhook status: %s", status)
	}

	return e.JSON(http.StatusOK, map[string]string{"message": "Webhook received"})
}

func handlePending(app core.App, queue *core.Record) {
	app.Logger().Info("Oxylabs Webhook: Job pending", "queue_id", queue.Id)
}

func handleDone(app core.App, oxylabClient *oxylabs.Client, payload WebhookPayload, queue *core.Record) {
	collection := queue.GetString("collection")
	recordId := queue.GetString("record_id")
	record, err := app.FindRecordById(collection, recordId)
	if err != nil {
		app.Logger().Error("Oxylabs Webhook: failed to find record for done job", "collection", collection, "record_id", recordId, "error", err)
		return
	}

	routine.FireAndForget(func() {
		path, err := oxylabClient.DownloadFile(payload.Query, payload.ID)
		if err != nil {
			app.Logger().Error("Oxylabs Webhook: failed to download file", "queue_id", queue.Id, "error", err)
			return
		}

		file, err := filesystem.NewFileFromPath(path)
		if err != nil {
			return
		}

		download, err := app.FindFirstRecordByData(collections.Downloads, "video_id", payload.Query)
		if err != nil {
			app.Logger().Error("Oxylabs Webhook: failed to find download record", "queue_id", queue.Id, "video_id", payload.Query, "error", err)
			return
		}

		download.Set("file", file)
		download.Set("size", file.Size)
		if err := app.Save(download); err != nil {
			return
		}

		record.Set("download", download.Id)
		record.Set("status", "SUCCESS")
		if err := app.Save(record); err != nil {
			app.Logger().Error("Oxylabs Webhook: failed to save record with downloaded file", "collection", collection, "record_id", recordId, "error", err)
			return
		}

		usageRecords, err := app.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{"user": record.GetString("user")})
		if err != nil || len(usageRecords) == 0 {
			app.Logger().Error("Oxylabs Webhook: failed to find monthly usage record", "user", record.GetString("user"), "error", err)
			return
		}
		usage := usageRecords[0]

		usage.Set("usage", usage.GetInt("usage")+int(file.Size))
		if err := app.Save(usage); err != nil {
			app.Logger().Error("Downloader: failed to update monthly usage", "error", err)
		}

		err = os.Remove(path)
		if err != nil {
		}

		queue.Set("status", "COMPLETED")
		if err := app.Save(queue); err != nil {
			app.Logger().Error("Oxylabs Webhook: failed to update queue record for completed job", "queue_id", queue.Id, "error", err)
			return
		}
	})
}

func handleFaulted(app core.App, queue *core.Record) {
	collection := queue.GetString("collection")
	recordId := queue.GetString("record_id")
	record, err := app.FindRecordById(collection, recordId)
	if err != nil {
		app.Logger().Error("Oxylabs Webhook: failed to find record for faulted job", "collection", collection, "record_id", recordId, "error", err)
		return
	}

	record.Set("status", "ERROR")
	record.Set("error_message", "Oxylabs job faulted")
	if err := app.Save(record); err != nil {
		app.Logger().Error("Oxylabs Webhook: failed to update record for faulted job", "collection", collection, "record_id", recordId, "error", err)
		return
	}

	queue.Set("status", "FAILED")
	queue.Set("last_error", "Oxylabs job faulted")
	if err := app.Save(queue); err != nil {
		app.Logger().Error("Oxylabs Webhook: failed to update queue record for faulted job", "queue_id", queue.Id, "error", err)
		return
	}
}
