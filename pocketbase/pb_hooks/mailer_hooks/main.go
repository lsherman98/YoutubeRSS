package mailer_hooks

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func Init(app *pocketbase.PocketBase) error {
	app.OnMailerSend().BindFunc(func(e *core.MailerEvent) error {
		if e.Message.Headers == nil {
			e.Message.Headers = make(map[string]string)
		}
		e.Message.Headers["Reply-To"] = "levisherman98@gmail.com"
		return e.Next()
	})

	return nil
}
