package rss_utils

import (
	"bytes"
	"strconv"
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
