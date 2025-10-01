package files

import "os"

func GetFileURL(basePath, fileName string) string {
	var domain string
	if os.Getenv("DEV") == "true" {
		domain = "localhost:8090"
	} else {
		domain = "rss.levisherman.xyz"
	}
    
	return domain + "/api/files/" + basePath + "/" + fileName
}
