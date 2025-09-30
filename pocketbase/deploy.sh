#!/bin/bash
# filepath: /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/deploy.sh

set -e

go mod download && go mod verify

GOOS=linux GOARCH=amd64 go build -o server .

# Rsync to remote server
rsync -avz -e ssh /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/server root@162.243.70.98:/root/yt-rss/

# Rsync pb_public folder to remote server
rsync -avz -e ssh /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/pb_public/ root@162.243.70.98:/root/yt-rss/pb_public/

# # Rsync .env file to remote server
# rsync -avz -e ssh /Users/levisherman/Documents/code/projects/yt-rss/pocketbase/.env root@162.243.70.98:/root/yt-rss/.env

# # Restart pocketbase.service on remote server
ssh root@162.243.70.98 'systemctl restart pb-rss.service'