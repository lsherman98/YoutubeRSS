package apify_client

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/pocketbase/pocketbase"
)

const (
	defaultBaseURL = "https://api.apify.com/v2/acts/"
)

type ApifyClient struct {
	client  *http.Client
	APIKey  string
	BaseURL *url.URL
	App     *pocketbase.PocketBase
}

func New(app *pocketbase.PocketBase) (*ApifyClient, error) {
	baseURL, err := url.Parse(defaultBaseURL)
	if err != nil {
		app.Logger().Error("Apify Client: failed to parse base URL: " + err.Error())
		return nil, err
	}

	apiKey := os.Getenv("APIFY_API_KEY")
	if apiKey == "" {
		app.Logger().Error("Apify Client: APIFY_API_KEY environment variable is not set")
		return nil, errors.New("APIFY_API_KEY environment variable is not set")
	}

	return &ApifyClient{
		client:  http.DefaultClient,
		APIKey:  apiKey,
		BaseURL: baseURL,
		App:     app,
	}, nil
}

func (c *ApifyClient) RunActor(actorId string, body map[string]any) (*map[string]any, error) {
	var response map[string]any

	err := c.do("POST", actorId+"/runs", body, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

func (c *ApifyClient) RunYoutubeDownloader(urls []string) (*map[string]any, error) {
	actorId := "jvDjDIPtCZAcZo9jb"

	body := map[string]any{
		"links": urls,
		"proxyConfiguration": map[string]any{
			"useApifyProxy": true,
			"apifyProxyGroups": []string{
				"RESIDENTIAL",
			},
			"apifyProxyCountry": "US",
		},
	}

	return c.RunActor(actorId, body)
}

func (c *ApifyClient) do(method, endpointPath string, reqBody, resBody any) error {
	endpoint, err := c.BaseURL.Parse(path.Join(c.BaseURL.Path, endpointPath))
	if err != nil {
		c.App.Logger().Error("Apify Client: failed to parse endpoint URL:", "error", err)
		return err
	}

	var payload io.Reader
	if reqBody != nil {
		bodyBytes, err := json.Marshal(reqBody)
		if err != nil {
			c.App.Logger().Error("Apify Client: failed to marshal request payload", "error", err)
			return err
		}
		payload = bytes.NewBuffer(bodyBytes)
	}

	req, err := http.NewRequest(method, endpoint.String(), payload)
	if err != nil {
		c.App.Logger().Error("Apify Client: failed to create HTTP request", "error", err)
		return err
	}

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept", "application/json")
	req.Header.Add("Authorization", "Bearer "+c.APIKey)

	resp, err := c.client.Do(req)
	if err != nil {
		c.App.Logger().Error("Apify Client: failed to execute request", "error", err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("apify request failed with status: %s, body: %s", resp.Status, string(bodyBytes))
	}

	if resBody != nil && resp.StatusCode != http.StatusNoContent {
		if err := json.NewDecoder(resp.Body).Decode(resBody); err != nil {
			c.App.Logger().Error("Apify Client: failed to decode response body", "error", err)
			return err
		}
	}

	return nil
}
