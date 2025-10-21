package ytdlp

import (
	"context"
	"fmt"
	"io"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	ffmpeg "github.com/u2takey/ffmpeg-go"
	"github.com/wader/goutubedl"
)

type Client struct {
	App               core.App
	ProxyURL          string
	BackupProxyOneURL string
	BackupProxyTwoURL string
	CurrentProxyURL   string
	CurrentProxy      string
	BackupProxyOne    string
	BackupProxyTwo    string
}

func New(app core.App) *Client {
	dev := os.Getenv("DEV")
	if dev == "true" {
		return &Client{
			App: app,
		}
	}

	proxy := os.Getenv("PROXY")
	backupProxyOne := os.Getenv("BACKUP_PROXY_ONE")
	backupProxyTwo := os.Getenv("BACKUP_PROXY_TWO")

	var primaryURL string
	var backupOneURL string
	var backupTwoURL string

	switch proxy {
	case "ngrok":
		primaryURL = os.Getenv("NGROK_PROXY")
	case "oxylabs":
		primaryURL = os.Getenv("OXY_LABS_PROXY_URL")
	case "iproyal":
		primaryURL = os.Getenv("IP_ROYAL_PROXY_URL")
	case "evomi":
		primaryURL = os.Getenv("EVOMI_PROXY_URL")
	}

	if backupProxyOne != "" {
		switch backupProxyOne {
		case "ngrok":
			backupOneURL = os.Getenv("NGROK_PROXY")
		case "oxylabs":
			backupOneURL = os.Getenv("OXY_LABS_PROXY_URL")
		case "iproyal":
			backupOneURL = os.Getenv("IP_ROYAL_PROXY_URL")
		case "evomi":
			backupOneURL = os.Getenv("EVOMI_PROXY_URL")
		}
	}

	if backupProxyTwo != "" {
		switch backupProxyTwo {
		case "ngrok":
			backupTwoURL = os.Getenv("NGROK_PROXY")
		case "oxylabs":
			backupTwoURL = os.Getenv("OXY_LABS_PROXY_URL")
		case "iproyal":
			backupTwoURL = os.Getenv("IP_ROYAL_PROXY_URL")
		case "evomi":
			backupTwoURL = os.Getenv("EVOMI_PROXY_URL")
		}
	}

	return &Client{
		App:               app,
		ProxyURL:          primaryURL,
		BackupProxyOneURL: backupOneURL,
		BackupProxyTwoURL: backupTwoURL,
		CurrentProxyURL:   primaryURL,
		CurrentProxy:      proxy,
		BackupProxyOne:    backupProxyOne,
		BackupProxyTwo:    backupProxyTwo,
	}
}

func (c *Client) SwitchProxy(retryCount int) {
	if retryCount >= 4 {
		if c.BackupProxyTwoURL == "" {
			c.App.Logger().Warn("YTDLP: no backup proxy two configured")
			return
		}
		c.App.Logger().Info("YTDLP: switching to backup proxy two", "backup_url", c.BackupProxyTwoURL, "retry_count", retryCount)
		c.CurrentProxyURL = c.BackupProxyTwoURL
		c.CurrentProxy = c.BackupProxyTwo
	} else if retryCount >= 2 {
		if c.BackupProxyOneURL == "" {
			c.App.Logger().Warn("YTDLP: no backup proxy one configured")
			return
		}
		c.App.Logger().Info("YTDLP: switching to backup proxy one", "backup_url", c.BackupProxyOneURL, "retry_count", retryCount)
		c.CurrentProxyURL = c.BackupProxyOneURL
		c.CurrentProxy = c.BackupProxyOne
	}
}

func (c *Client) ResetToPrimaryProxy() {
	c.CurrentProxyURL = c.ProxyURL
	c.CurrentProxy = os.Getenv("PROXY")
}

func (c *Client) GetCurrentProxy() string {
	return c.CurrentProxyURL
}

func (c *Client) GetCurrentProxyKey() string {
	return c.CurrentProxy
}

func (c *Client) GetInfo(url string) (*goutubedl.Result, error) {
	opts := goutubedl.Options{}
	if os.Getenv("DEV") != "true" {
		opts.ProxyUrl = c.CurrentProxyURL
	}

	result, err := goutubedl.New(context.Background(), url, opts)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to get info", "error", err, "proxy", c.CurrentProxyURL)
		return nil, err
	}

	return &result, nil
}

func (c *Client) Download(url string, record *core.Record, result *goutubedl.Result, retryCount int) (*goutubedl.DownloadResult, string, error) {
	record.Set("title", result.Info.Title)
	record.Set("duration", result.Info.Duration)
	record.Set("channel", result.Info.Channel)
	record.Set("description", result.Info.Description)
	record.Set("video_id", result.Info.ID)

	if os.Getenv("SIMULATE_DOWNLOAD_FAILURE") == "true" && retryCount < 4 {
		c.App.Logger().Warn("YTDLP: simulating download failure for testing",
			"proxy", c.CurrentProxyURL)
		return nil, "", fmt.Errorf("simulated download failure for testing (attempt %d)", retryCount)
	}

	download, err := result.DownloadWithOptions(context.Background(), goutubedl.DownloadOptions{
		DownloadAudioOnly: true,
	})
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to download audio", "error", err)
		return nil, "", err
	}
	defer download.Close()

	directory := "pb_data/output"
	if _, err := os.Stat(directory); os.IsNotExist(err) {
		c.App.Logger().Info("YTDLP: output directory does not exist, creating it")
		err = os.Mkdir(directory, 0755)
		if err != nil {
			c.App.Logger().Error("YTDLP: failed to create output directory", "error", err)
			return nil, "", err
		}
	}

	path := directory + "/" + result.Info.ID + ".webm"
	f, err := os.Create(path)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to create output file", "error", err)
		return nil, "", err
	}
	defer f.Close()
	io.Copy(f, download)

	convertedPath := directory + "/" + result.Info.ID + ".mp3"
	err = ffmpeg.Input(path).
		Output(convertedPath, ffmpeg.KwArgs{"vn": "", "acodec": "libmp3lame", "ab": "192k"}).
		OverWriteOutput().ErrorToStdOut().Run()
	if err != nil {
		c.App.Logger().Error("YTDLP: ffmpeg conversion failed", "error", err)
		return nil, "", err
	}

	audio, err := filesystem.NewFileFromPath(convertedPath)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to create file from path", "error", err)
		return nil, "", err
	}

	record.Set("file", audio)
	record.Set("size", audio.Size)

	err = os.Remove(path)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to delete original file", "error", err)
		return nil, "", err
	}

	return download, convertedPath, nil
}
