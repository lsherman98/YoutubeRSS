package ytdlp

import (
	"context"
	"io"
	"log"
	"net/http"
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
	ThordataProxyURL   string
	DecodedProxyURL    string
	EvomiProxyURLOne   string
	EvomiProxyURLTwo   string
	EvomiProxyURLThree string
	EvomiProxyURLFour  string
	EvomiProxyURLFive  string
	EvomiProxyURLSix   string
	EvomiProxyURLSeven string
	EvomiProxyURLEight string
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

	thordataURL := os.Getenv("THORDATA_PROXY_URL")
	decodedURL := os.Getenv("DECODO_PROXY_URL")
	evomiOneURL := os.Getenv("EVOMI_PROXY_URL_ONE")
	evomiTwoURL := os.Getenv("EVOMI_PROXY_URL_TWO")
	evomiThreeURL := os.Getenv("EVOMI_PROXY_URL_THREE")
	evomiFourURL := os.Getenv("EVOMI_PROXY_URL_FOUR")
	evomiFiveURL := os.Getenv("EVOMI_PROXY_URL_FIVE")
	evomiSixURL := os.Getenv("EVOMI_PROXY_URL_SIX")
	evomiSevenURL := os.Getenv("EVOMI_PROXY_URL_SEVEN")
	evomiEightURL := os.Getenv("EVOMI_PROXY_URL_EIGHT")

	return &Client{
		App:                app,
		ProxyURL:           primaryURL,
		BackupProxyOneURL:  backupOneURL,
		BackupProxyTwoURL:  backupTwoURL,
		CurrentProxyURL:    primaryURL,
		CurrentProxy:       proxy,
		BackupProxyOne:     backupProxyOne,
		BackupProxyTwo:     backupProxyTwo,
		ThordataProxyURL:   thordataURL,
		DecodedProxyURL:    decodedURL,
		EvomiProxyURLOne:   evomiOneURL,
		EvomiProxyURLTwo:   evomiTwoURL,
		EvomiProxyURLThree: evomiThreeURL,
		EvomiProxyURLFour:  evomiFourURL,
		EvomiProxyURLFive:  evomiFiveURL,
		EvomiProxyURLSix:   evomiSixURL,
		EvomiProxyURLSeven: evomiSevenURL,
		EvomiProxyURLEight: evomiEightURL,
	}
}

func (c *Client) SwitchProxy(retryCount int) {
	if os.Getenv("DEV") == "true" {
		return
	}

	switch {
	case retryCount >= 33:
		if c.BackupProxyTwoURL == "" {
			c.App.Logger().Warn("YTDLP: no backup proxy two configured")
			return
		}
		c.CurrentProxyURL = c.BackupProxyTwoURL
		c.CurrentProxy = c.BackupProxyTwo
		c.App.Logger().Info("YTDLP: Switched to backup proxy two", "proxy", c.CurrentProxyURL)
	case retryCount >= 30:
		if c.BackupProxyOneURL == "" {
			c.App.Logger().Warn("YTDLP: no backup proxy one configured")
			return
		}
		c.CurrentProxyURL = c.BackupProxyOneURL
		c.CurrentProxy = c.BackupProxyOne
		c.App.Logger().Info("YTDLP: Switched to backup proxy one", "proxy", c.CurrentProxyURL)
	case retryCount >= 27:
		c.CurrentProxyURL = c.EvomiProxyURLEight
		c.CurrentProxy = "evomi 8 (x3)"
		c.App.Logger().Info("YTDLP: Switched to evomi proxy eight", "proxy", c.CurrentProxyURL)
	case retryCount >= 24:
		c.CurrentProxyURL = c.EvomiProxyURLSeven
		c.CurrentProxy = "evomi 7 (x3)"
		c.App.Logger().Info("YTDLP: Switched to evomi proxy seven", "proxy", c.CurrentProxyURL)
	case retryCount >= 21:
		c.CurrentProxyURL = c.EvomiProxyURLSix
		c.CurrentProxy = "evomi 6 (x3)"
		c.App.Logger().Info("YTDLP: Switched to evomi proxy six", "proxy", c.CurrentProxyURL)
	case retryCount >= 18:
		c.CurrentProxyURL = c.EvomiProxyURLFive
		c.CurrentProxy = "evomi 5 (x3)"
		c.App.Logger().Info("YTDLP: Switched to evomi proxy five", "proxy", c.CurrentProxyURL)
	case retryCount >= 15:
		c.CurrentProxyURL = c.EvomiProxyURLFour
		c.CurrentProxy = "evomi 4"
		c.App.Logger().Info("YTDLP: Switched to evomi proxy four", "proxy", c.CurrentProxyURL)
	case retryCount >= 12:
		c.CurrentProxyURL = c.EvomiProxyURLThree
		c.CurrentProxy = "evomi 3"
		c.App.Logger().Info("YTDLP: Switched to evomi proxy three", "proxy", c.CurrentProxyURL)
	case retryCount >= 9:
		c.CurrentProxyURL = c.EvomiProxyURLTwo
		c.CurrentProxy = "evomi 2"
		c.App.Logger().Info("YTDLP: Switched to evomi proxy two", "proxy", c.CurrentProxyURL)
	case retryCount >= 6:
		c.CurrentProxyURL = c.DecodedProxyURL
		c.CurrentProxy = "decodo"
		c.App.Logger().Info("YTDLP: Switched to decodo proxy", "proxy", c.CurrentProxyURL)
	case retryCount >= 3:
		c.CurrentProxyURL = c.ThordataProxyURL
		c.CurrentProxy = "thordata"
		c.App.Logger().Info("YTDLP: Switched to thordata proxy", "proxy", c.CurrentProxyURL)
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

func (c *Client) Download(url string, result *goutubedl.Result, retryCount int) (*filesystem.File, string, error) {
	download, err := result.DownloadWithOptions(context.Background(), goutubedl.DownloadOptions{
		DownloadAudioOnly: true,
		AudioFormats:      "mp3",
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

	path := directory + "/" + result.Info.ID + "_temp.mp3"
	f, err := os.Create(path)
	if err != nil {
		return nil, "", err
	}
	defer f.Close()

	_, err = io.Copy(f, download)
	if err != nil {
		return nil, "", err
	}

	tempFile, err := os.Open(path)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to open temporary file for type checking", "error", err)
		return nil, "", err
	}

	buffer := make([]byte, 512)
	_, err = tempFile.Read(buffer)
	if err != nil && err != io.EOF {
		c.App.Logger().Error("YTDLP: failed to read temporary file for type checking", "error", err)
		tempFile.Close()
		return nil, "", err
	}
	tempFile.Close()

	contentType := http.DetectContentType(buffer)

	convertedPath := directory + "/" + result.Info.ID + ".mp3"

	if contentType == "audio/mpeg" {
		err = os.Rename(path, convertedPath)
		if err != nil {
			c.App.Logger().Error("YTDLP: failed to rename temporary file", "error", err)
			return nil, "", err
		}
	} else {
		err = ffmpeg.Input(path).
			Output(convertedPath, ffmpeg.KwArgs{"vn": "", "acodec": "libmp3lame", "ab": "192k"}).
			OverWriteOutput().ErrorToStdOut().Run()
		if err != nil {
			os.Remove(path)
			c.App.Logger().Error("YTDLP: ffmpeg conversion failed", "error", err)
			return nil, "", err
		}
	}

	err = os.Remove(path)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to delete temporary file", "error", err)
	}

	audio, err := filesystem.NewFileFromPath(convertedPath)
	if err != nil {
		return nil, "", err
	}

	return audio, convertedPath, nil
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
	case "thordata":
		return os.Getenv("THORDATA_PROXY_URL")
	case "decodo":
		return os.Getenv("DECODO_PROXY_URL")
	default:
		return ""
	}
}
