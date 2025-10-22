package ytdlp

import (
	"context"
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

	primaryURL := getProxyURL(proxy)
	backupOneURL := getProxyURL(backupProxyOne)
	backupTwoURL := getProxyURL(backupProxyTwo)

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
		c.CurrentProxyURL = c.BackupProxyTwoURL
		c.CurrentProxy = c.BackupProxyTwo
	} else if retryCount >= 2 {
		if c.BackupProxyOneURL == "" {
			c.App.Logger().Warn("YTDLP: no backup proxy one configured")
			return
		}
		c.CurrentProxyURL = c.BackupProxyOneURL
		c.CurrentProxy = c.BackupProxyOne
	}
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

	download, err := result.DownloadWithOptions(context.Background(), goutubedl.DownloadOptions{
		DownloadAudioOnly: true,
	})
	if err != nil {
		return nil, "", err
	}
	defer download.Close()

	directory := "pb_data/output"
	if _, err := os.Stat(directory); os.IsNotExist(err) {
		err = os.Mkdir(directory, 0755)
		if err != nil {
			return nil, "", err
		}
	}

	path := directory + "/" + result.Info.ID + ".webm"
	f, err := os.Create(path)
	if err != nil {
		return nil, "", err
	}
	defer f.Close()
	io.Copy(f, download)

	convertedPath := directory + "/" + result.Info.ID + ".mp3"
	err = ffmpeg.Input(path).
		Output(convertedPath, ffmpeg.KwArgs{"vn": "", "acodec": "libmp3lame", "ab": "192k"}).
		OverWriteOutput().ErrorToStdOut().Run()
	if err != nil {
		os.Remove(path)
		c.App.Logger().Error("YTDLP: ffmpeg conversion failed", "error", err)
		return nil, "", err
	}

	audio, err := filesystem.NewFileFromPath(convertedPath)
	if err != nil {
		return nil, "", err
	}

	record.Set("file", audio)
	record.Set("size", audio.Size)

	err = os.Remove(path)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to delete original file", "error", err)
	}

	return download, convertedPath, nil
}

func getProxyURL(proxyKey string) string {
	switch proxyKey {
	case "ngrok":
		return os.Getenv("NGROK_PROXY")
	case "oxylabs":
		return os.Getenv("OXY_LABS_PROXY_URL")
	case "iproyal":
		return os.Getenv("IP_ROYAL_PROXY_URL")
	case "evomi":
		return os.Getenv("EVOMI_PROXY_URL")
	default:
		return ""
	}
}
