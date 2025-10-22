/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Analytics = "_analytics",
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	JobLogs = "_job_logs",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	ApiKeys = "api_keys",
	Downloads = "downloads",
	Issues = "issues",
	Items = "items",
	Jobs = "jobs",
	MonthlyUsage = "monthly_usage",
	Podcasts = "podcasts",
	Queue = "queue",
	StripeCharges = "stripe_charges",
	StripeCustomers = "stripe_customers",
	StripeSubscriptions = "stripe_subscriptions",
	SubscriptionTiers = "subscription_tiers",
	Uploads = "uploads",
	Users = "users",
	WebhookEvents = "webhook_events",
	Webhooks = "webhooks",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AnalyticsRecord = {
	browser?: string
	country?: string
	created?: IsoDateString
	device_type?: string
	duration_ms: number
	id: string
	ip: string
	is_new_visit?: boolean
	method: string
	os?: string
	path: string
	query_params?: string
	referrer?: string
	timestamp: IsoDateString
	updated?: IsoDateString
	user_agent?: string
	utm_campaign?: string
	utm_medium?: string
	utm_source?: string
	visitor_id?: string
}

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export enum JobLogsStatusOptions {
	"started" = "started",
	"completed" = "completed",
	"failed" = "failed",
	"timeout" = "timeout",
}

export enum JobLogsTriggerTypeOptions {
	"scheduled" = "scheduled",
	"manual" = "manual",
	"api" = "api",
}
export type JobLogsRecord = {
	created?: IsoDateString
	description?: string
	duration?: number
	end_time?: IsoDateString
	error?: string
	expression?: string
	id: string
	job_id: string
	job_name: string
	output?: string
	start_time: IsoDateString
	status: JobLogsStatusOptions
	trigger_by?: string
	trigger_type: JobLogsTriggerTypeOptions
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type ApiKeysRecord = {
	created?: IsoDateString
	hashed_key: string
	id: string
	title: string
	updated?: IsoDateString
	user: RecordIdString
}

export type DownloadsRecord = {
	channel: string
	created?: IsoDateString
	description?: string
	duration?: number
	file: string
	id: string
	size: number
	title: string
	updated?: IsoDateString
	video_id: string
}

export type IssuesRecord = {
	content?: string
	created?: IsoDateString
	id: string
	screenshots?: string[]
	updated?: IsoDateString
	user?: RecordIdString
}

export enum ItemsTypeOptions {
	"upload" = "upload",
	"url" = "url",
}

export enum ItemsStatusOptions {
	"CREATED" = "CREATED",
	"SUCCESS" = "SUCCESS",
	"ERROR" = "ERROR",
}
export type ItemsRecord = {
	created?: IsoDateString
	download?: RecordIdString
	error?: string
	id: string
	podcast: RecordIdString
	status: ItemsStatusOptions
	title?: string
	type: ItemsTypeOptions
	updated?: IsoDateString
	upload?: RecordIdString
	url?: string
	user: RecordIdString
}

export enum JobsStatusOptions {
	"SUCCESS" = "SUCCESS",
	"ERROR" = "ERROR",
	"PROCESSING" = "PROCESSING",
	"STARTED" = "STARTED",
	"CREATED" = "CREATED",
}
export type JobsRecord = {
	api_key?: RecordIdString
	batch_id: string
	created?: IsoDateString
	download?: RecordIdString
	error?: string
	id: string
	status: JobsStatusOptions
	title?: string
	updated?: IsoDateString
	url: string
	user: RecordIdString
}

export type MonthlyUsageRecord = {
	billing_cycle_end: IsoDateString
	billing_cycle_start: IsoDateString
	created?: IsoDateString
	id: string
	limit?: number
	tier?: RecordIdString
	updated?: IsoDateString
	uploads?: number
	usage?: number
	user: RecordIdString
}

export type PodcastsRecord = {
	apple_url?: string
	created?: IsoDateString
	description: string
	file?: string
	id: string
	image: string
	pocketcasts_url?: string
	spotify_url?: string
	title: string
	updated?: IsoDateString
	user: RecordIdString
	website?: string
	youtube_url?: string
}

export enum QueueCollectionOptions {
	"jobs" = "jobs",
	"items" = "items",
}

export enum QueueStatusOptions {
	"PENDING" = "PENDING",
	"PROCESSING" = "PROCESSING",
	"FAILED" = "FAILED",
	"COMPLETED" = "COMPLETED",
}
export type QueueRecord = {
	collection: QueueCollectionOptions
	created?: IsoDateString
	id: string
	last_error?: string
	last_proxy?: string
	record_id: string
	retry_count?: number
	status: QueueStatusOptions
	updated?: IsoDateString
	worker_id?: string
}

export enum StripeChargesStatusOptions {
	"succeeded" = "succeeded",
	"pending" = "pending",
	"failed" = "failed",
}
export type StripeChargesRecord<Tmetadata = unknown> = {
	amount?: number
	charge_id?: string
	created?: IsoDateString
	customer_id: string
	id: string
	metadata?: null | Tmetadata
	paid?: boolean
	receipt_url?: string
	refunded?: boolean
	status?: StripeChargesStatusOptions
	user?: RecordIdString
}

export type StripeCustomersRecord = {
	created?: IsoDateString
	customer_id: string
	email?: string
	id: string
	updated?: IsoDateString
	user?: RecordIdString
}

export type StripeSubscriptionsRecord<Tmetadata = unknown> = {
	cancel_at?: IsoDateString
	cancel_at_period_end?: boolean
	canceled_at?: IsoDateString
	created?: IsoDateString
	current_period_end?: IsoDateString
	current_period_start?: IsoDateString
	customer_id: string
	ended_at?: IsoDateString
	id: string
	metadata?: null | Tmetadata
	status?: string
	subscription_id?: string
	tier?: RecordIdString
	updated?: IsoDateString
	user?: RecordIdString
}

export enum SubscriptionTiersIntervalOptions {
	"yearly" = "yearly",
	"monthly" = "monthly",
}
export type SubscriptionTiersRecord = {
	created?: IsoDateString
	id: string
	interval?: SubscriptionTiersIntervalOptions
	lookup_key?: string
	monthly_usage_limit?: number
	price?: number
	price_id?: string
	test_price_id?: string
	title?: string
	updated?: IsoDateString
	upload_limit?: number
}

export type UploadsRecord = {
	created?: IsoDateString
	duration?: number
	file: string
	id: string
	item?: RecordIdString
	podcast: RecordIdString
	size?: number
	title: string
	updated?: IsoDateString
	user: RecordIdString
}

export type UsersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name: string
	password: string
	tier?: RecordIdString
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export enum WebhookEventsStatusOptions {
	"FAILED" = "FAILED",
	"SUCCESS" = "SUCCESS",
	"ACTIVE" = "ACTIVE",
}

export enum WebhookEventsEventOptions {
	"ERROR" = "ERROR",
	"SUCCESS" = "SUCCESS",
	"STARTED" = "STARTED",
	"CREATED" = "CREATED",
}
export type WebhookEventsRecord = {
	api_key?: RecordIdString
	attempts?: number
	created?: IsoDateString
	event: WebhookEventsEventOptions
	id: string
	job: RecordIdString
	status: WebhookEventsStatusOptions
	updated?: IsoDateString
	webhook: RecordIdString
}

export enum WebhooksEventsOptions {
	"SUCCESS" = "SUCCESS",
	"ERROR" = "ERROR",
	"STARTED" = "STARTED",
	"CREATED" = "CREATED",
}
export type WebhooksRecord = {
	created?: IsoDateString
	enabled?: boolean
	events?: WebhooksEventsOptions[]
	id: string
	updated?: IsoDateString
	url?: string
	user: RecordIdString
}

// Response types include system fields and match responses from the PocketBase API
export type AnalyticsResponse<Texpand = unknown> = Required<AnalyticsRecord> & BaseSystemFields<Texpand>
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type JobLogsResponse<Texpand = unknown> = Required<JobLogsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type ApiKeysResponse<Texpand = unknown> = Required<ApiKeysRecord> & BaseSystemFields<Texpand>
export type DownloadsResponse<Texpand = unknown> = Required<DownloadsRecord> & BaseSystemFields<Texpand>
export type IssuesResponse<Texpand = unknown> = Required<IssuesRecord> & BaseSystemFields<Texpand>
export type ItemsResponse<Texpand = unknown> = Required<ItemsRecord> & BaseSystemFields<Texpand>
export type JobsResponse<Texpand = unknown> = Required<JobsRecord> & BaseSystemFields<Texpand>
export type MonthlyUsageResponse<Texpand = unknown> = Required<MonthlyUsageRecord> & BaseSystemFields<Texpand>
export type PodcastsResponse<Texpand = unknown> = Required<PodcastsRecord> & BaseSystemFields<Texpand>
export type QueueResponse<Texpand = unknown> = Required<QueueRecord> & BaseSystemFields<Texpand>
export type StripeChargesResponse<Tmetadata = unknown, Texpand = unknown> = Required<StripeChargesRecord<Tmetadata>> & BaseSystemFields<Texpand>
export type StripeCustomersResponse<Texpand = unknown> = Required<StripeCustomersRecord> & BaseSystemFields<Texpand>
export type StripeSubscriptionsResponse<Tmetadata = unknown, Texpand = unknown> = Required<StripeSubscriptionsRecord<Tmetadata>> & BaseSystemFields<Texpand>
export type SubscriptionTiersResponse<Texpand = unknown> = Required<SubscriptionTiersRecord> & BaseSystemFields<Texpand>
export type UploadsResponse<Texpand = unknown> = Required<UploadsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type WebhookEventsResponse<Texpand = unknown> = Required<WebhookEventsRecord> & BaseSystemFields<Texpand>
export type WebhooksResponse<Texpand = unknown> = Required<WebhooksRecord> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_analytics: AnalyticsRecord
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_job_logs: JobLogsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	api_keys: ApiKeysRecord
	downloads: DownloadsRecord
	issues: IssuesRecord
	items: ItemsRecord
	jobs: JobsRecord
	monthly_usage: MonthlyUsageRecord
	podcasts: PodcastsRecord
	queue: QueueRecord
	stripe_charges: StripeChargesRecord
	stripe_customers: StripeCustomersRecord
	stripe_subscriptions: StripeSubscriptionsRecord
	subscription_tiers: SubscriptionTiersRecord
	uploads: UploadsRecord
	users: UsersRecord
	webhook_events: WebhookEventsRecord
	webhooks: WebhooksRecord
}

export type CollectionResponses = {
	_analytics: AnalyticsResponse
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_job_logs: JobLogsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	api_keys: ApiKeysResponse
	downloads: DownloadsResponse
	issues: IssuesResponse
	items: ItemsResponse
	jobs: JobsResponse
	monthly_usage: MonthlyUsageResponse
	podcasts: PodcastsResponse
	queue: QueueResponse
	stripe_charges: StripeChargesResponse
	stripe_customers: StripeCustomersResponse
	stripe_subscriptions: StripeSubscriptionsResponse
	subscription_tiers: SubscriptionTiersResponse
	uploads: UploadsResponse
	users: UsersResponse
	webhook_events: WebhookEventsResponse
	webhooks: WebhooksResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_analytics'): RecordService<AnalyticsResponse>
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_job_logs'): RecordService<JobLogsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'api_keys'): RecordService<ApiKeysResponse>
	collection(idOrName: 'downloads'): RecordService<DownloadsResponse>
	collection(idOrName: 'issues'): RecordService<IssuesResponse>
	collection(idOrName: 'items'): RecordService<ItemsResponse>
	collection(idOrName: 'jobs'): RecordService<JobsResponse>
	collection(idOrName: 'monthly_usage'): RecordService<MonthlyUsageResponse>
	collection(idOrName: 'podcasts'): RecordService<PodcastsResponse>
	collection(idOrName: 'queue'): RecordService<QueueResponse>
	collection(idOrName: 'stripe_charges'): RecordService<StripeChargesResponse>
	collection(idOrName: 'stripe_customers'): RecordService<StripeCustomersResponse>
	collection(idOrName: 'stripe_subscriptions'): RecordService<StripeSubscriptionsResponse>
	collection(idOrName: 'subscription_tiers'): RecordService<SubscriptionTiersResponse>
	collection(idOrName: 'uploads'): RecordService<UploadsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
	collection(idOrName: 'webhook_events'): RecordService<WebhookEventsResponse>
	collection(idOrName: 'webhooks'): RecordService<WebhooksResponse>
}
