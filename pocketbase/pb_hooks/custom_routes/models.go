package apify_webhooks

type ApifyEvent struct {
	UserId    string         `json:"userId"`
	CreatedAt string         `json:"createdAt"`
	EventType string         `json:"eventType"`
	EventData ApifyEventData `json:"eventData"`
	Resource  map[string]any `json:"resource"`
}

type ApifyEventData struct {
	ActorId    string `json:"actorId"`
	ActorRunId string `json:"actorRunId"`
}

// type ApifyResource struct {
// 	Id         string `json:"id"`
// 	ActId      string `json:"actId"`
// 	UserId     string `json:"userId"`
// 	StartedAt  string `json:"startedAt"`
// 	FinishedAt string `json:"finishedAt"`
// 	Status     string `json:"status"`
// }
