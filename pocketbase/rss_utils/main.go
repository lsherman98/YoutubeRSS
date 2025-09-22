package rss_utils

import (
	"bytes"
	"strings"
	"time"

	"github.com/eduncan911/podcast"
	"github.com/mmcdole/gofeed/rss"
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
	p.AddImage(image)
	return p
}

func AddItemToPodcast(p *podcast.Podcast, title, link, description string) {
	pubDate := time.Now()
	item := podcast.Item{
		Title:       title,
		Link:        link,
		Description: description,
		PubDate:     &pubDate,
	}
	p.AddItem(item)
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

	title := feed.Title
	link := feed.Link
	description := feed.Description
	image := feed.Image.URL
	authorName := feed.ManagingEditor
    var pubDate time.Time
    if feed.PubDate != "" {
        pubDate, _ = time.Parse(time.RFC1123Z, feed.PubDate)
    } else {
        pubDate = time.Now()
    }
	now := time.Now()

	p := podcast.New(
		title,
		link,
		description,
		&pubDate,
		&now,
	)
	p.AddAuthor(authorName, "")
	p.AddImage(image)

	for _, item := range feed.Items {
		AddItemToPodcast(&p, item.Title, item.Link, item.Description)
	}

	return p, nil
}
