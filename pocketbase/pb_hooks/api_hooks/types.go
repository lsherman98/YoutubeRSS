package api_hooks

type ConvertRequest struct {
	URLs []string `json:"urls"`
}

type JobResponse struct {
	ID               string         `json:"id"`
	URL              string         `json:"url"`
	Status           string         `json:"status"`
	DownloadEndpoint string         `json:"download_endpoint,omitempty"`
	VideoMetadata    *VideoMetadata `json:"video_metadata,omitempty"`
	Title            string         `json:"title,omitempty"`
	Created          string         `json:"created,omitempty"`
}

type VideoMetadata struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Duration    int    `json:"duration"`
	VideoID     string `json:"video_id"`
	Size        int    `json:"size"`
}

type AddUrlRequestBody struct {
	PodcastID string `json:"podcast_id"`
	URL       string `json:"url"`
}

type ItemResponse struct {
	Status  string `json:"status"`
	Title   string `json:"title,omitempty"`
	Error   string `json:"error,omitempty"`
	Created string `json:"created,omitempty"`
}

type PodcastResponse struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}
