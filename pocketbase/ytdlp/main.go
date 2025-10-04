package ytdlp

import (
	"context"
	"io"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/wader/goutubedl"
)

const proxyUrl = "http://2.tcp.ngrok.io:11281"

func Download(url string, record *core.Record) (*goutubedl.DownloadResult, string, error) {
	result, err := goutubedl.New(context.Background(), url, goutubedl.Options{
		ProxyUrl: proxyUrl,
	})
	if err != nil {
		return nil, "", err
	}

	record.Set("title", result.Info.Title)
	record.Set("duration", result.Info.Duration)
	record.Set("channel", result.Info.Channel)
	record.Set("description", result.Info.Description)

	download, err := result.DownloadWithOptions(context.Background(), goutubedl.DownloadOptions{
		AudioFormats:      "mp3",
		DownloadAudioOnly: true,
	})
	if err != nil {
		return nil, "", err
	}

	directory := "output"
	if _, err := os.Stat(directory); os.IsNotExist(err) {
		err = os.Mkdir(directory, 0755)
		if err != nil {
			return nil, "", err
		}
	}

	path := directory + "/" + result.Info.ID + ".mp3"
	f, err := os.Create(path)
	if err != nil {
		return nil, "", err
	}
	defer f.Close()
	io.Copy(f, download)

	audio, err := filesystem.NewFileFromPath(path)
	if err != nil {
		return nil, "", err
	}

	record.Set("file", audio)
	return download, path, nil
}
