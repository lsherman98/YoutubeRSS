package rss_utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/eduncan911/podcast"
	"github.com/lsherman98/yt-rss/pocketbase/files"
	"github.com/mmcdole/gofeed/rss"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/routine"
)

func NewPodcast(title, link, description, authorName, email, image string) podcast.Podcast {
	now := time.Now()
	p := podcast.New(
		title,
		link,
		description,
		&now,
		&now,
	)
	p.AddAuthor(authorName, email)
	p.IOwner = &podcast.Author{Name: authorName, Email: email}
	p.AddImage(image)
	p.AddCategory("Technology", []string{})
	p.AddAtomLink(link)
	return p
}

func AddItemToPodcast(p *podcast.Podcast, title, url, description, guid, enclosure string, length int64) {
	pubDate := time.Now()
	item := podcast.Item{
		Title:       title,
		Link:        url,
		Description: description,
		PubDate:     &pubDate,
		GUID:        guid,
		Author:      &podcast.Author{Name: p.IOwner.Name, Email: p.IOwner.Email},
		Enclosure:   &podcast.Enclosure{URL: enclosure, TypeFormatted: podcast.MP3.String(), Type: podcast.MP3, Length: length},
	}
	p.AddItem(item)
}

func RemoveItemFromPodcast(p *podcast.Podcast, guid string) {
	for i, item := range p.Items {
		if item.GUID == guid {
			p.Items = append(p.Items[:i], p.Items[i+1:]...)
			break
		}
	}
}

func GenerateXML(p *podcast.Podcast) (string, error) {
	var buf bytes.Buffer
	if err := p.Encode(&buf); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func ParseXML(data string) (podcast.Podcast, error) {
	fp := rss.Parser{}
	feed, err := fp.Parse(strings.NewReader(data))
	if err != nil {
		return podcast.Podcast{}, err
	}

	parts := strings.Split(feed.ManagingEditor, " (")
	email := parts[0]
	name := strings.TrimSuffix(parts[1], ")")

	now := time.Now()
	pubDate := time.Now()
	if feed.PubDate != "" {
		pubDate, _ = time.Parse(time.RFC1123Z, feed.PubDate)
	}

	p := podcast.New(
		feed.Title,
		feed.Link,
		feed.Description,
		&pubDate,
		&now,
	)
	p.AddAuthor(name, email)
	p.IOwner = &podcast.Author{Name: name, Email: email}
	p.AddImage(feed.Image.URL)
	p.AddCategory("Technology", []string{})
	p.AddAtomLink(feed.Link)

	for _, item := range feed.Items {
		var length int64 = 0
		if item.Enclosure != nil && item.Enclosure.Length != "" {
			if l, err := strconv.ParseInt(item.Enclosure.Length, 10, 64); err == nil {
				length = l
			}
		}

		AddItemToPodcast(&p, item.Title, item.Link, item.Description, item.GUID.Value, item.Enclosure.URL, length)
	}

	return p, nil
}

func UpdateXMLFile(app core.App, fileClient *files.FileClient, p podcast.Podcast, podcastRecord *core.Record) error {
	xml, err := GenerateXML(&p)
	if err != nil {
		app.Logger().Error("rss_utils: failed to generate XML", "error", err)
		return err
	}

	xmlFile, err := fileClient.NewXMLFile(xml, podcastRecord.Id)
	if err != nil {
		app.Logger().Error("rss_utils: failed to create new XML file", "error", err)
		return err
	}

	podcastRecord.Set("file", xmlFile)
	if err := app.Save(podcastRecord); err != nil {
		app.Logger().Error("rss_utils: failed to save podcast with new XML file", "error", err)
		return err
	}

	if podcastRecord.GetString("pocketcasts_url") == "" {
		routine.FireAndForget(func() {
			setPocketCastsURL(app, podcastRecord)
		})
	}

	defer fileClient.Close()
	return nil
}

type PocketCastsAddFeedReq struct {
	Url          string  `json:"url"`
	PublicOption string  `json:"public_option"`
	PollUUID     *string `json:"poll_uuid"`
}

type PocketCastsAddFeedResp struct {
	Status   string `json:"status"`
	PollUUID string `json:"poll_uuid"`
	Result   struct {
		ShareLink string `json:"share_link"`
	}
}

func setPocketCastsURL(app core.App, podcast *core.Record) {
	fileClient, err := files.NewFileClient(app, podcast, "file")
	if err != nil {
		app.Logger().Error("rss_utils: failed to create file client for pocketcasts url", "error", err)
		return
	}
	defer fileClient.Close()

	podcastURL := fileClient.GetFileURL(podcast, "file")
	addFeedReq := PocketCastsAddFeedReq{
		Url:          podcastURL,
		PublicOption: "no",
		PollUUID:     nil,
	}
	addFeedJSON, _ := json.Marshal(addFeedReq)

	resp, err := http.Post("https://refresh.pocketcasts.com/author/add_feed_url", "application/json", bytes.NewBuffer(addFeedJSON))
	if err != nil {
		app.Logger().Error("rss_utils: failed to add feed to Pocketcasts: " + err.Error())
		return
	}
	defer resp.Body.Close()

	var addResp PocketCastsAddFeedResp
	if err := json.NewDecoder(resp.Body).Decode(&addResp); err != nil {
		app.Logger().Error("rss_utils: failed to decode pocketcasts response", "error", err)
		return
	}

	searchURL := fmt.Sprintf("https://pocketcasts.com/search?q=%s", url.QueryEscape(podcastURL))

	if addResp.Status == "ok" {
		url := addResp.Result.ShareLink
		podcast.Set("pocketcasts_url", url)
		if err := app.Save(podcast); err != nil {
			app.Logger().Error("rss_utils: failed to save podcast with pocketcasts url", "error", err)
		}
		return
	}

	if addResp.Status == "poll" && addResp.PollUUID != "" {
		pollURL := "https://refresh.pocketcasts.com/author/add_feed_url"
		for range 30 {
			time.Sleep(2 * time.Second)

			pollReq := PocketCastsAddFeedReq{
				Url:          podcastURL,
				PublicOption: "no",
				PollUUID:     &addResp.PollUUID,
			}
			pollJSON, _ := json.Marshal(pollReq)

			resp, err := http.Post(pollURL, "application/json", bytes.NewBuffer(pollJSON))
			if err != nil {
				continue
			}

			var pollResp PocketCastsAddFeedResp
			if err := json.NewDecoder(resp.Body).Decode(&pollResp); err != nil {
				continue
			}

			if pollResp.Status == "ok" && pollResp.Result.ShareLink != "" {
				podcast.Set("pocketcasts_url", pollResp.Result.ShareLink)
				if err := app.Save(podcast); err != nil {
					app.Logger().Error("rss_utils: failed to save podcast with pocketcasts url", "error", err)
				}
				break
			} else if pollResp.Status == "error" {
				app.Logger().Error("rss_utils: Pocketcasts returned error status", "error", pollResp)
				podcast.Set("pocketcasts_url", searchURL)
				if err := app.Save(podcast); err != nil {
					app.Logger().Error("rss_utils: failed to save podcast with pocketcasts url", "error", err)
				}
				break
			}
		}
	} else {
		podcast.Set("pocketcasts_url", searchURL)
		if err := app.Save(podcast); err != nil {
			app.Logger().Error("rss_utils: failed to save podcast with pocketcasts url", "error", err)
		}
	}
}
