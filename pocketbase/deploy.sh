#!/bin/bash
# filepath: /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/deploy.sh

set -e

PASSWORD="8RWTJH1ezsQ^WzMw"

go mod download && go mod verify

GOOS=linux GOARCH=amd64 go build -o server .

# Rsync to remote server
rsync -avz -e "sshpass -p $PASSWORD ssh" /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/server root@162.243.70.98:/root/pb-rss/

# Rsync pb_public folder to remote server
rsync -avz -e "sshpass -p $PASSWORD ssh" /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/pb_public/ root@162.243.70.98:/root/pb-rss/pb_public/

# # Rsync .env file to remote server
# rsync -avz -e ssh /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/.env root@162.243.70.98:/root/pb-rss/.env

# # Restart pocketbase.service on remote server
sshpass -p $PASSWORD ssh root@162.243.70.98 'systemctl restart pb-rss.service'