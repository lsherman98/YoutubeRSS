package files

import (
	"bytes"
	"io"
	"os"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

type FileClient struct {
	fsys    *filesystem.System
	app     core.App
	fileKey string
}

func NewFileClient(app core.App, record *core.Record, field string) (*FileClient, error) {
	fsys, err := app.NewFilesystem()
	if err != nil {
		app.Logger().Error("Failed to create filesystem:", "error", err)
		return nil, err
	}

	fileKey := record.BaseFilesPath() + "/" + record.GetString(field)
	return &FileClient{
		fsys:    fsys,
		app:     app,
		fileKey: fileKey,
	}, nil
}

func (c *FileClient) Close() error {
	return c.fsys.Close()
}

func (c *FileClient) GetFileURL(record *core.Record, field string) string {
	var domain string
	if os.Getenv("DEV") == "true" {
		domain = "localhost:8090"
	} else {
		domain = "ytrss.xyz"
	}

	basePath := record.BaseFilesPath()
	filename := record.GetString(field)
	return "https://" + domain + "/api/files/" + basePath + "/" + filename
}

func (c *FileClient) GetXMLFile() (*bytes.Buffer, error) {
	r, err := c.fsys.GetReader(c.fileKey)
	if err != nil {
		c.app.Logger().Error("Failed to get file reader:", "error", err)
		return nil, err
	}
	defer r.Close()

	content := new(bytes.Buffer)
	_, err = io.Copy(content, r)
	if err != nil {
		c.app.Logger().Error("Failed to read file content:", "error", err)
		return nil, err
	}

	return content, nil
}

func (c *FileClient) NewXMLFile(xml, fileName string) (*filesystem.File, error) {
	file, err := filesystem.NewFileFromBytes([]byte(xml), fileName+".rss")
	if err != nil {
		c.app.Logger().Error("Failed to create new file from bytes:", "error", err)
		return nil, err
	}

	currentFile, err := c.fsys.GetReuploadableFile(c.fileKey, true)
	if err == nil {
		file.Name = currentFile.Name
	}

	return file, nil
}
