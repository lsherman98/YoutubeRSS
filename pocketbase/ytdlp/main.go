package ytdlp

import (
	"context"
	"io"
	"log"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	ffmpeg "github.com/u2takey/ffmpeg-go"
	"github.com/wader/goutubedl"
)

type Client struct {
	App                core.App
	ProxyURL           string
	BackupProxyOneURL  string
	BackupProxyTwoURL  string
	CurrentProxyURL    string
	CurrentProxy       string
	BackupProxyOne     string
	BackupProxyTwo     string
	EvomiProxyURLOne   string
	EvomiProxyURLTwo   string
	EvomiProxyURLThree string
	EvomiProxyURLFour  string
	EvomiProxyURLFive  string
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

	evomiOneURL := os.Getenv("EVOMI_PROXY_URL_ONE")
	evomiTwoURL := os.Getenv("EVOMI_PROXY_URL_TWO")
	evomiThreeURL := os.Getenv("EVOMI_PROXY_URL_THREE")
	evomiFourURL := os.Getenv("EVOMI_PROXY_URL_FOUR")
	evomiFiveURL := os.Getenv("EVOMI_PROXY_URL_FIVE")

	return &Client{
		App:                app,
		ProxyURL:           primaryURL,
		BackupProxyOneURL:  backupOneURL,
		BackupProxyTwoURL:  backupTwoURL,
		CurrentProxyURL:    evomiOneURL,
		CurrentProxy:       proxy,
		BackupProxyOne:     backupProxyOne,
		BackupProxyTwo:     backupProxyTwo,
		EvomiProxyURLOne:   evomiOneURL,
		EvomiProxyURLTwo:   evomiTwoURL,
		EvomiProxyURLThree: evomiThreeURL,
		EvomiProxyURLFour:  evomiFourURL,
		EvomiProxyURLFive:  evomiFiveURL,
	}
}

func (c *Client) SwitchProxy(retryCount int) {
	switch {
	case retryCount >= 12:
		if c.BackupProxyTwoURL == "" {
			c.App.Logger().Warn("YTDLP: no backup proxy two configured")
			return
		}
		c.CurrentProxyURL = c.BackupProxyTwoURL
		c.CurrentProxy = c.BackupProxyTwo
		c.App.Logger().Info("YTDLP: Switched to backup proxy two", "proxy", c.CurrentProxyURL)
	case retryCount >= 10:
		if c.BackupProxyOneURL == "" {
			c.App.Logger().Warn("YTDLP: no backup proxy one configured")
			return
		}
		c.CurrentProxyURL = c.BackupProxyOneURL
		c.CurrentProxy = c.BackupProxyOne
		c.App.Logger().Info("YTDLP: Switched to backup proxy one", "proxy", c.CurrentProxyURL)
	case retryCount >= 8:
		c.CurrentProxyURL = c.EvomiProxyURLFive
		c.App.Logger().Info("YTDLP: Switched to evomi proxy five", "proxy", c.CurrentProxyURL)
	case retryCount >= 6:
		c.CurrentProxyURL = c.EvomiProxyURLFour
		c.App.Logger().Info("YTDLP: Switched to evomi proxy four", "proxy", c.CurrentProxyURL)
	case retryCount >= 4:
		c.CurrentProxyURL = c.EvomiProxyURLThree
		c.App.Logger().Info("YTDLP: Switched to evomi proxy three", "proxy", c.CurrentProxyURL)
	case retryCount >= 2:
		c.CurrentProxyURL = c.EvomiProxyURLTwo
		c.App.Logger().Info("YTDLP: Switched to evomi proxy two", "proxy", c.CurrentProxyURL)
	}
}

func (c *Client) GetCurrentProxy() string {
	return c.CurrentProxyURL
}

func (c *Client) GetCurrentProxyKey() string {
	return c.CurrentProxy
}

func (c *Client) GetInfo(url string) (*goutubedl.Result, error) {
	opts := goutubedl.Options{
		DebugLog: log.New(os.Stderr, "ytdlp: ", log.LstdFlags),
	}
	if os.Getenv("DEV") != "true" {
		opts.ProxyUrl = c.CurrentProxyURL
	}
	result, err := goutubedl.New(context.Background(), url, opts)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (c *Client) Download(url string, record *core.Record, result *goutubedl.Result, retryCount int) error {
	record.Set("title", result.Info.Title)
	record.Set("duration", result.Info.Duration)
	record.Set("channel", result.Info.Channel)
	record.Set("description", result.Info.Description)
	record.Set("video_id", result.Info.ID)

	download, err := result.DownloadWithOptions(context.Background(), goutubedl.DownloadOptions{
		DownloadAudioOnly: true,
		AudioFormats:      "mp3",
	})
	if err != nil {
		c.App.Logger().Error("YTDLP: download failed", "error", err)
		return err
	}
	defer download.Close()

	directory := "pb_data/output"
	if _, err := os.Stat(directory); os.IsNotExist(err) {
		err = os.Mkdir(directory, 0755)
		if err != nil {
			return err
		}
	}

	path := directory + "/" + result.Info.ID + "_temp.mp3"
	f, err := os.Create(path)
	if err != nil {
		return err
	}

	_, err = io.Copy(f, download)
	if err != nil {
		f.Close()
		return err
	}
	f.Close() 

	convertedPath := directory + "/" + result.Info.ID + ".mp3"
	err = ffmpeg.Input(path).
		Output(convertedPath, ffmpeg.KwArgs{"vn": "", "acodec": "libmp3lame", "ab": "192k"}).
		OverWriteOutput().ErrorToStdOut().Run()
	if err != nil {
		c.App.Logger().Error("YTDLP: ffmpeg conversion failed", "error", err)
		return err
	}

	err = os.Remove(path)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to delete temporary file", "error", err)
	}

	audio, err := filesystem.NewFileFromPath(convertedPath)
	if err != nil {
		return err
	}

	record.Set("file", audio)
	record.Set("size", audio.Size)
	if err := c.App.Save(record); err != nil {
		return err
	}

	err = os.Remove(convertedPath)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to delete converted file", "error", err)
	}

	return nil
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
		return os.Getenv("EVOMI_PROXY_URL_ONE")
	default:
		return ""
	}
}
