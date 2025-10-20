package ytdlp

import (
	"context"
	"fmt"
	"io"
	u "net/url"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	ffmpeg "github.com/u2takey/ffmpeg-go"
	"github.com/wader/goutubedl"
)

type Client struct {
	App             core.App
	ProxyURL        string
	BackupProxyURL  string
	CurrentProxyURL string
}

func New(app core.App) *Client {
	dev := os.Getenv("DEV")
	if dev == "true" {
		return &Client{
			App: app,
		}
	}

	proxy := os.Getenv("PROXY")
	backupProxy := os.Getenv("BACKUP_PROXY")
	
	var primaryURL string
	var backupURL string

	switch proxy {
	case "ngrok":
		primaryURL = os.Getenv("NGROK_PROXY")
	case "oxylabs":
		primaryURL = os.Getenv("OXY_LABS_PROXY_URL")
	case "iproyal":
		host := os.Getenv("IP_ROYAL_PROXY_HOST")
		auth := os.Getenv("IP_ROYAL_PROXY_AUTH")
		url, err := u.Parse(fmt.Sprintf("http://%s@%s", auth, host))
		if err != nil {
			app.Logger().Error("YTDLP: failed to parse proxy URL", "error", err)
			return nil
		}
		primaryURL = url.String()
	case "evomi":
		primaryURL = os.Getenv("EVOMI_PROXY_URL")
	}

	if backupProxy != "" {
		backupURL = backupProxy
	}

	return &Client{
		App:             app,
		ProxyURL:        primaryURL,
		BackupProxyURL:  backupURL,
		CurrentProxyURL: primaryURL,
	}
}

func (c *Client) SwitchToBackupProxy() bool {
	if c.BackupProxyURL == "" {
		c.App.Logger().Warn("YTDLP: no backup proxy configured")
		return false
	}
	
	c.App.Logger().Info("YTDLP: switching to backup proxy", "backup_url", c.BackupProxyURL)
	c.CurrentProxyURL = c.BackupProxyURL
	return true
}

func (c *Client) ResetToPrimaryProxy() {
	c.CurrentProxyURL = c.ProxyURL
}

func (c *Client) GetCurrentProxy() string {
	return c.CurrentProxyURL
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

func (c *Client) Download(url string, record *core.Record, result *goutubedl.Result) (*goutubedl.DownloadResult, string, error) {
	record.Set("title", result.Info.Title)
	record.Set("duration", result.Info.Duration)
	record.Set("channel", result.Info.Channel)
	record.Set("description", result.Info.Description)
	record.Set("video_id", result.Info.ID)

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
