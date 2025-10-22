package webhook_client

import (
	"bytes"
	"encoding/json"
	"net/http"
	"slices"
	"time"

	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
)

type Client struct {
	User    string
	App     core.App
	URL     string
	Events  []string
	Enabled bool
	Job     *core.Record
	Webhook *core.Record
}

func New(user string, app core.App, job *core.Record) *Client {
	webhook, err := app.FindFirstRecordByFilter(collections.Webhooks, "user = {:user}", dbx.Params{"user": user})
	if err != nil {
		return nil
	}

	url := webhook.GetString("url")
	events := webhook.GetStringSlice("events")
	enabled := webhook.GetBool("enabled")

	return &Client{
		User:    user,
		App:     app,
		URL:     url,
		Events:  events,
		Enabled: enabled,
		Job:     job,
		Webhook: webhook,
	}
}

type WebhookEventPayload struct {
	Event string         `json:"event"`
	Data  map[string]any `json:"data"`
}

func (c *Client) Send(event string) error {
	if !c.Enabled || !slices.Contains(c.Events, event) {
		return nil
	}

	data := map[string]any{
		"job_id":   c.Job.Id,
		"batch_id": c.Job.GetString("batch_id"),
	}

	if event == "ERROR" {
		data["error"] = c.Job.GetString("error")
	}

	payload := WebhookEventPayload{
		Event: event,
		Data:  data,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	webhookEvents, err := c.App.FindCollectionByNameOrId(collections.WebhookEvents)
	if err != nil {
		return err
	}

	eventRecord := core.NewRecord(webhookEvents)
	eventRecord.Set("webhook", c.Webhook.Id)
	eventRecord.Set("api_key", c.Job.GetString("api_key"))
	eventRecord.Set("job", c.Job.Id)
	eventRecord.Set("event", event)
	eventRecord.Set("status", "ACTIVE")
	if err := c.App.Save(eventRecord); err != nil {
		return err
	}

	routine.FireAndForget(func() {
		c.sendWithRetries(body, eventRecord)
	})

	return nil
}

func (c *Client) sendWithRetries(body []byte, eventRecord *core.Record) {
	maxRetries := 4
	backoffs := []time.Duration{30 * time.Second, 1 * time.Minute, 5 * time.Minute}

	for i := range maxRetries {
		req, err := http.NewRequest("POST", c.URL, bytes.NewBuffer(body))
		if err != nil {
			c.App.Logger().Error("WebhookClient: failed to create request", "error", err)
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			if i < len(backoffs) {
				time.Sleep(backoffs[i])
			}
			continue
		}
		defer resp.Body.Close()

		eventRecord.Set("attempts", eventRecord.GetInt("attempts")+1)
		if err := c.App.Save(eventRecord); err != nil {
			continue
		}

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			eventRecord.Set("status", "SUCCESS")
			if err := c.App.Save(eventRecord); err != nil {
				c.App.Logger().Error("WebhookClient: failed to update event record", "error", err)
			}
			return
		}

		if i < len(backoffs) {
			time.Sleep(backoffs[i])
		}
	}

	eventRecord.Set("status", "FAILED")
	if err := c.App.Save(eventRecord); err != nil {
		return
	}
}
