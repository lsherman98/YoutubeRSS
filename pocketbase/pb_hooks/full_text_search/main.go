package full_text_search

import (
	"fmt"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// https://www.sqlite.org/fts5.html#external_content_tables
func Init(app *pocketbase.PocketBase, collections ...string) error {
	app.OnCollectionAfterDeleteSuccess().BindFunc(func(e *core.CollectionEvent) error {
		target := e.Collection.Name
		for _, col := range collections {
			if col == target {
				err := createCollectionFts(app, target)
				if err != nil {
					app.Logger().Error(fmt.Sprint(err))
					return err
				}
			}
		}
		return e.Next()
	})

	app.OnCollectionAfterUpdateSuccess().BindFunc(func(e *core.CollectionEvent) error {
		target := e.Collection.Name
		for _, col := range collections {
			if col == target {
				err := deleteCollection(app, target)
				if err != nil {
					app.Logger().Error(fmt.Sprint(err))
					return err
				}
				err = createCollectionFts(app, target)
				if err != nil {
					app.Logger().Error(fmt.Sprint(err))
					return err
				}
			}
		}
		return e.Next()
	})

	app.OnCollectionDeleteRequest().BindFunc(func(e *core.CollectionRequestEvent) error {
		target := e.Collection.Name
		for _, col := range collections {
			if col == target {
				err := deleteCollection(app, target)
				if err != nil {
					app.Logger().Error(fmt.Sprint(err))
					return err
				}
			}
		}
		return e.Next()
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		for _, target := range collections {
			err := createCollectionFts(app, target)
			if err != nil {
				app.Logger().Error(fmt.Sprint(err))
				return err
			}
		}

		se.Router.GET("/api/collections/{collectionIdOrName}/records/full-text-search", func(e *core.RequestEvent) error {
			target := e.Request.PathValue("collectionIdOrName")
			if _, err := app.FindCollectionByNameOrId(target); err != nil {
				app.Logger().Error(fmt.Sprint(err))
				return err
			}
			tbl := target
			q := e.Request.URL.Query().Get("search")
			if q == "" {
				return e.NoContent(204)
			}

			processedQuery := processSearchQuery(q)
			columnFilteredQuery := fmt.Sprintf("{amount trace_number description}:%s", processedQuery)

			var query strings.Builder
			query.WriteString("SELECT * ")
			query.WriteString("FROM " + tbl + "_fts ")
			query.WriteString("WHERE " + tbl + "_fts MATCH {:q} ")
			query.WriteString("ORDER BY rank;")

			results := []dbx.NullStringMap{}
			err := app.DB().
				NewQuery(query.String()).
				Bind(dbx.Params{"q": columnFilteredQuery}).
				All(&results)
			if err != nil {
				app.Logger().Error(fmt.Sprint(err))
				return err
			}

			e.Response.Header().Set("Content-Type", "application/json")
			items := []map[string]any{}
			for _, result := range results {
				m := make(map[string]any)
				for key := range result {
					val := result[key]
					value, err := val.Value()
					if err != nil || !val.Valid {
						m[key] = nil
					} else {
						m[key] = value
					}
				}
				items = append(items, m)
			}

			// TODO: Paging result
			e.JSON(200, items)

			return nil
		})

		return se.Next()
	})

	return nil
}

func createCollectionFts(app *pocketbase.PocketBase, target string) error {
	collection, err := app.FindCollectionByNameOrId(target)
	if err != nil {
		app.Logger().Error(fmt.Sprint(err))
		return err
	}
	fields := collectionFields(collection, "id")
	exists, _ := checkIfTableExists(app, target+"_fts")

	if exists {
		err := deleteCollection(app, target)
		if err != nil {
			app.Logger().Error("Failed to delete existing FTS table", "error", err)
			return err
		}
	}

	tbl := "`" + target + "`"
	var stmt strings.Builder
	stmt.WriteString("CREATE VIRTUAL TABLE " + target + "_fts USING FTS5 (")
	stmt.WriteString("  " + strings.Join(fields, ", ") + ",")
	stmt.WriteString("  content=" + target + ",")
	// stmt.WriteString("  content=''")
	// stmt.WriteString("  content_rowid='id'")
	stmt.WriteString(");")
	if _, err := app.DB().NewQuery(stmt.String()).Execute(); err != nil {
		app.Logger().Error(fmt.Sprint(err))
		return err
	}

	stmt.Reset()
	stmt.WriteString("CREATE TRIGGER  " + target + "_fts_insert AFTER INSERT ON " + tbl + " BEGIN ")
	stmt.WriteString("  INSERT INTO " + target + "_fts(" + strings.Join(fields, ", ") + ")")
	stmt.WriteString("  VALUES (" + strings.Join(surround(fields, "new.", ""), ", ") + ");")
	stmt.WriteString("END;")
	if _, err := app.DB().NewQuery(stmt.String()).Execute(); err != nil {
		app.Logger().Error(fmt.Sprint(err))
		return err
	}

	stmt.Reset()
	stmt.WriteString("CREATE TRIGGER  " + target + "_fts_update AFTER UPDATE ON " + tbl + " BEGIN ")
	stmt.WriteString("  INSERT INTO " + target + "_fts(" + target + "_fts, " + strings.Join(fields, ", ") + ")")
	stmt.WriteString("  VALUES ('delete', " + strings.Join(surround(fields, "old.", ""), ", ") + ");")
	stmt.WriteString("  INSERT INTO " + target + "_fts(" + strings.Join(fields, ", ") + ")")
	stmt.WriteString("  VALUES (" + strings.Join(surround(fields, "new.", ""), ", ") + ");")
	stmt.WriteString("END;")
	if _, err := app.DB().NewQuery(stmt.String()).Execute(); err != nil {
		app.Logger().Error(fmt.Sprint(err))
		return err
	}

	stmt.Reset()
	stmt.WriteString("CREATE TRIGGER  " + target + "_fts_delete AFTER DELETE ON " + tbl + " BEGIN ")
	stmt.WriteString("  INSERT INTO " + target + "_fts(" + target + "_fts, " + strings.Join(fields, ", ") + ")")
	stmt.WriteString("  VALUES ('delete', " + strings.Join(surround(fields, "old.", ""), ", ") + ");")
	stmt.WriteString("END;")
	if _, err := app.DB().NewQuery(stmt.String()).Execute(); err != nil {
		return err
	}

	err = syncCollection(app, target)
	if err != nil {
		return err
	}

	return nil
}

func deleteCollection(app *pocketbase.PocketBase, target string) error {
	triggers := []string{
		target + "_fts_insert",
		target + "_fts_update",
		target + "_fts_delete",
	}

	for _, trigger := range triggers {
		if _, err := app.DB().
			NewQuery("DROP TRIGGER IF EXISTS " + trigger + ";").
			Execute(); err != nil {
			app.Logger().Error("Failed to drop trigger", "trigger", trigger, "error", err)
		}
	}

	if _, err := app.DB().
		NewQuery("DELETE FROM " + target + "_fts;").
		Execute(); err != nil {
		app.Logger().Error("Failed to delete FTS table data", "table", target+"_fts", "error", err)
	}

	if _, err := app.DB().
		NewQuery("DROP TABLE IF EXISTS " + target + "_fts;").
		Execute(); err != nil {
		app.Logger().Error("Failed to drop FTS table", "table", target+"_fts", "error", err)
		return err
	}

	return nil
}

func checkIfTableExists(app *pocketbase.PocketBase, target string) (bool, error) {
	type Meta struct {
		Name string `db:"name" json:"name"`
	}

	meta := &Meta{}

	var stmt strings.Builder
	stmt.WriteString("SELECT name FROM sqlite_master ")
	stmt.WriteString("WHERE type='table' ")
	stmt.WriteString("AND name = {:table_name};")

	if err := app.DB().NewQuery(stmt.String()).Bind(dbx.Params{"table_name": target}).One(&meta); err != nil {
		app.Logger().Error(fmt.Sprint(err))
		return false, err
	}

	valid := meta != nil
	return valid, nil
}

func syncCollection(app *pocketbase.PocketBase, target string) error {
	var stmt strings.Builder
	stmt.WriteString("INSERT INTO " + target + "_fts(" + target + "_fts) VALUES('rebuild');")
	// stmt.WriteString("INSERT INTO " + target + "_fts SELECT " + strings.Join(fields, ", ") + " FROM " + target)
	if _, err := app.DB().NewQuery(stmt.String()).Execute(); err != nil {
		app.Logger().Error(fmt.Sprint(err))
		return err
	}

	return nil
}

func processSearchQuery(query string) string {
	if query == "" {
		return query
	}

	query = strings.TrimSpace(query)
	terms := strings.Fields(query)
	processedTerms := make([]string, len(terms))
	for i, term := range terms {
		term = strings.ReplaceAll(term, `"`, `""`) // Escape quotes
		processedTerms[i] = `"` + term + `"*`
	}

	return strings.Join(processedTerms, " AND ")
}

func collectionFields(collection *core.Collection, id string) []string {
	fields := []string{}
	if id != "" {
		fields = append(fields, id)
	}

	for _, field := range collection.Fields {
		name := field.GetName()
		if name == id {
			continue
		}
		fields = append(fields, name)
	}

	return fields
}

func surround(items []string, prefix string, suffix string) []string {
	results := []string{}
	for i := 0; i < len(items); i++ {
		item := items[i]
		results = append(results, prefix+item+suffix)
	}
	return results
}
