package oxylabs

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"cloud.google.com/go/storage"
)

const (
	apiURL       = "https://data.oxylabs.io/v1/queries"
	source       = "youtube_download"
	downloadType = "audio"
	storageType  = "gcs"
)

type Client struct {
	httpClient    *http.Client
	gcpClient     *storage.Client
	username      string
	password      string
	storageBucket string
	callbackURL   string
}

func NewClient() (*Client, error) {
	username := os.Getenv("OXYLABS_USERNAME")
	password := os.Getenv("OXYLABS_PASSWORD")
	storageBucket := "oxylab_object_store"
	callbackURL := "https://ytrss.xyz/api/v1/oxylabs/webhook"

	if username == "" || password == "" {
		return nil, fmt.Errorf("OXYLABS_USERNAME and OXYLABS_PASSWORD must be set")
	}

	ctx := context.Background()
	storageClient, err := storage.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("storage.NewClient: %w", err)
	}

	return &Client{
		httpClient:    &http.Client{},
		gcpClient:     storageClient,
		username:      username,
		password:      password,
		storageBucket: storageBucket,
		callbackURL:   callbackURL,
	}, nil
}

func (c *Client) Close() error {
	return c.gcpClient.Close()
}

type ContextItem struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type JobPayload struct {
	Source      string        `json:"source"`
	Query       string        `json:"query"`
	Context     []ContextItem `json:"context"`
	StorageType string        `json:"storage_type"`
	StorageURL  string        `json:"storage_url"`
	CallbackURL string        `json:"callback_url"`
}

type JobCreateResponse struct {
	ID string `json:"id"`
}

func (c *Client) Start(videoID string, jobId string) (*JobCreateResponse, error) {
	payload := JobPayload{
		Source: source,
		Query:  videoID,
		Context: []ContextItem{
			{Key: "download_type", Value: downloadType},
		},
		StorageType: storageType,
		StorageURL:  c.storageBucket,
		CallbackURL: c.callbackURL + "/" + jobId,
	}

	jsonValue, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonValue))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(c.username, c.password)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var jobResp JobCreateResponse
	if err := json.NewDecoder(resp.Body).Decode(&jobResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &jobResp, nil
}

func (c *Client) DownloadFile(videoID, jobID string) (string, error) {
	ctx := context.Background()

	objectName := fmt.Sprintf("oxylabs/%s_%s.m4a", videoID, jobID)

	rc, err := c.gcpClient.Bucket(c.storageBucket).Object(objectName).NewReader(ctx)
	if err != nil {
		return "", fmt.Errorf("Object(%q).NewReader: %w", objectName, err)
	}
	defer rc.Close()

	data, err := io.ReadAll(rc)
	if err != nil {
		return "", fmt.Errorf("ioutil.ReadAll: %w", err)
	}

	destPath := filepath.Join("pb_data", "storage", fmt.Sprintf("%s_%s.m4a", videoID, jobID))
	if err := os.WriteFile(destPath, data, 0644); err != nil {
		return "", fmt.Errorf("os.WriteFile: %w", err)
	}

	deleteCtx, cancel := context.WithTimeout(ctx, time.Second*10)
	defer cancel()

	o := c.gcpClient.Bucket(c.storageBucket).Object(objectName)

	// Optional: set a generation-match precondition to avoid potential race
	// conditions and data corruptions. The request to delete the file is aborted
	// if the object's generation number does not match your precondition.
	attrs, err := o.Attrs(deleteCtx)
	if err != nil {
		return "", fmt.Errorf("object.Attrs: %w", err)
	}
	o = o.If(storage.Conditions{GenerationMatch: attrs.Generation})

	if err := o.Delete(deleteCtx); err != nil {
		return "", fmt.Errorf("Object(%q).Delete: %w", objectName, err)
	}

	return destPath, nil
}
