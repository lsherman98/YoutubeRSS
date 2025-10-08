package ytdlp

import (
	"context"
	"fmt"
	"io"
	u "net/url"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/wader/goutubedl"
)

type Client struct {
	App       core.App
	ProxyHost string
	ProxyAuth string
	ProxyURL  string
}

func New(app core.App) *Client {
	dev := os.Getenv("DEV")
	if dev == "true" {
		return &Client{
			App: app,
		}
	}

	proxy := os.Getenv("PROXY")
	if proxy == "ngrok" {
		return &Client{
			App:      app,
			ProxyURL: os.Getenv("NGROK_PROXY"),
		}
	}

	host := os.Getenv("IP_ROYAL_PROXY_HOST")
	auth := os.Getenv("IP_ROYAL_PROXY_AUTH")
	url, err := u.Parse(fmt.Sprintf("http://%s@%s", auth, host))
	if err != nil {
		app.Logger().Error("YTDLP: failed to parse proxy URL", "error", err)
		return nil
	}

	return &Client{
		App:       app,
		ProxyHost: host,
		ProxyAuth: auth,
		ProxyURL:  url.String(),
	}
}

func (c *Client) GetInfo(url string) (*goutubedl.Result, error) {
	opts := goutubedl.Options{}
	if os.Getenv("DEV") != "true" {
		opts.ProxyUrl = c.ProxyURL
	}

	result, err := goutubedl.New(context.Background(), url, opts)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to get info", "error", err)
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
		AudioFormats:      "mp3",
		DownloadAudioOnly: true,
	})
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to download audio", "error", err)
		return nil, "", err
	}
	defer download.Close()

	directory := "output"
	if _, err := os.Stat(directory); os.IsNotExist(err) {
		c.App.Logger().Info("YTDLP: output directory does not exist, creating it")
		err = os.Mkdir(directory, 0755)
		if err != nil {
			c.App.Logger().Error("YTDLP: failed to create output directory", "error", err)
			return nil, "", err
		}
	}

	path := directory + "/" + result.Info.ID + ".mp3"
	f, err := os.Create(path)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to create output file", "error", err)
		return nil, "", err
	}
	defer f.Close()
	io.Copy(f, download)

	audio, err := filesystem.NewFileFromPath(path)
	if err != nil {
		c.App.Logger().Error("YTDLP: failed to create file from path", "error", err)
		return nil, "", err
	}

	record.Set("file", audio)
	record.Set("size", audio.Size)
	return download, path, nil
}
