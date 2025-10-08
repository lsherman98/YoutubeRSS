package main

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	_ "github.com/lsherman98/yt-rss/pocketbase/migrations"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/api_hooks"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/api_key_hooks"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/file_hooks"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/items_hooks"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/jobs_hooks"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/podcast_hooks"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/share_url_hooks"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/uploads_hooks"
	"github.com/lsherman98/yt-rss/pocketbase/pb_hooks/users_hooks"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	if err := items_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	if err := podcast_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	if err := file_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	if err := share_url_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	if err := uploads_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	if err := api_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	if err := api_key_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	if err := jobs_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	if err := users_hooks.Init(app); err != nil {
		log.Fatal(err)
	}

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), true))
		return se.Next()
	})

	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: isGoRun,
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
