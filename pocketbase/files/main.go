package files

var domain = "localhost:8090"

func GetFileURL(basePath, fileName string) string {
    return domain + "/api/files/" + basePath + "/" + fileName
}