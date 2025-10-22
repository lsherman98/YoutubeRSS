package api_hooks

import (
	"github.com/lsherman98/yt-rss/pocketbase/collections"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/security"
)

func requireValidAPIKey(e *core.RequestEvent) error {
	authHeader := e.Request.Header.Get("Authorization")
	if authHeader == "" {
		return e.UnauthorizedError("Missing Authorization header", nil)
	}

	apiKey := ""
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		apiKey = authHeader[7:]
	} else {
		return e.UnauthorizedError("Invalid Authorization header format", nil)
	}

	hashedAPIKey := security.SHA256(apiKey)
	apiKeyRecord, err := e.App.FindFirstRecordByData(collections.APIKeys, "hashed_key", hashedAPIKey)
	if err != nil || apiKeyRecord == nil {
		return e.UnauthorizedError("Invalid API key", nil)
	}

	userId := apiKeyRecord.GetString("user")
	user, err := e.App.FindRecordById(collections.Users, userId)
	if err != nil || user == nil {
		return e.UnauthorizedError("Invalid API key", nil)
	}

	e.Set("user", user)
    e.Set("apiKeyRecord", apiKeyRecord)

	return e.Next()
}

func checkUsageLimits(e *core.RequestEvent) error {
	user := e.Get("user").(*core.Record)

	tierId := user.GetString("tier")
	tier, err := e.App.FindRecordById(collections.SubscriptionTiers, tierId)
	if err != nil || tier == nil {
		return e.InternalServerError("something went wrong", nil)
	}

	if tier.GetString("lookup_key") == "free" {
		return e.ForbiddenError("free tier users cannot use the API. Please upgrade your subscription.", nil)
	}

	if tier.GetString("lookup_key") == "basic_monthly" || tier.GetString("lookup_key") == "basic_yearly" {
		return e.ForbiddenError("basic tier users cannot use the API. Please upgrade your subscription.", nil)
	}

	monthlyUsageRecords, err := e.App.FindRecordsByFilter(collections.MonthlyUsage, "user = {:user}", "-created", 1, 0, dbx.Params{
		"user": user.Id,
	})
	if err != nil || len(monthlyUsageRecords) == 0 {
		return e.NotFoundError("could not find usage record", nil)
	}
	monthlyUsage := monthlyUsageRecords[0]

	usageLimit := monthlyUsage.GetInt("limit")
	currentUsage := monthlyUsage.GetInt("usage")
	if currentUsage >= usageLimit {
		return e.ForbiddenError("Monthly usage limit exceeded", nil)
	}

	return e.Next()
}
