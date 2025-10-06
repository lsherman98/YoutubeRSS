#!/bin/bash
# filepath: /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/deploy.sh

set -e

PASSWORD="8RWTJH1ezsQ^WzMw"

go mod download && go mod verify

GOOS=linux GOARCH=amd64 go build -o server .

# Rsync to remote server
rsync -avz -e "sshpass -p $PASSWORD ssh" /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/server root@162.243.186.51:/root/ytrss/

# Rsync pb_public folder to remote server
rsync -avz -e "sshpass -p $PASSWORD ssh" /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/pb_public/ root@162.243.186.51:/root/ytrss/pb_public/

# # Rsync .env file to remote server
# rsync -avz -e "sshpass -p $PASSWORD ssh" /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/.env root@162.243.186.51:/root/ytrss/.env

# # Restart ytrss.service on remote server
sshpass -p $PASSWORD ssh root@162.243.186.51 'systemctl restart ytrss.service'