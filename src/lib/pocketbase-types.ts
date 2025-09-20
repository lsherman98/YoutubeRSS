/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	AvgDailyBalance = "avg_daily_balance",
	BalanceOverTime = "balance_over_time",
	CreditsAndDebits = "credits_and_debits",
	CurrentDeal = "current_deal",
	DailyBalance = "daily_balance",
	Deals = "deals",
	ExtractionAgents = "extraction_agents",
	Extractions = "extractions",
	GroupedTransactions = "grouped_transactions",
	Jobs = "jobs",
	LlamaWebhooks = "llama_webhooks",
	Organizations = "organizations",
	PlaidTokens = "plaid_tokens",
	PlaidTransactions = "plaid_transactions",
	StatementDetails = "statement_details",
	Statements = "statements",
	TotalsByMonth = "totals_by_month",
	Transactions = "transactions",
	Users = "users",
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

export type AvgDailyBalanceRecord<Taverage_daily_ending_balance = unknown> = {
	average_daily_ending_balance?: null | Taverage_daily_ending_balance
	deal?: string
	id: string
	month?: string
}

export type BalanceOverTimeRecord = {
	beginning_balance?: number
	date?: IsoDateString
	deal?: string
	ending_balance?: number
	id: string
}

export type CreditsAndDebitsRecord = {
	credits?: number
	date?: IsoDateString
	deal?: string
	debits?: number
	id: string
	statement?: RecordIdString
}

export type CurrentDealRecord = {
	created?: IsoDateString
	deal?: RecordIdString
	id: string
	updated?: IsoDateString
	user?: RecordIdString
}

export type DailyBalanceRecord = {
	balance: number
	created?: IsoDateString
	date: IsoDateString
	deal: RecordIdString
	id: string
	statement: RecordIdString
	updated?: IsoDateString
}

export type DealsRecord = {
	address?: string
	bank?: string
	city?: string
	created?: IsoDateString
	credit_score?: number
	founded?: IsoDateString
	id: string
	industry?: string
	iso?: string
	merchant?: string
	organization?: RecordIdString
	state?: string
	title?: string
	updated?: IsoDateString
	user: RecordIdString
	zip_code?: string
}

export enum ExtractionAgentsKeyOptions {
	"ascend" = "ascend",
	"bmo" = "bmo",
	"choice_one" = "choice_one",
	"chase" = "chase",
	"universal" = "universal",
	"wells_fargo" = "wells_fargo",
	"first_loyal" = "first_loyal",
}
export type ExtractionAgentsRecord = {
	agent_id: string
	created?: IsoDateString
	id: string
	key: ExtractionAgentsKeyOptions
	name: string
	updated?: IsoDateString
}

export type ExtractionsRecord = {
	created?: IsoDateString
	data: string
	id: string
	job: RecordIdString
	statement?: RecordIdString
	updated?: IsoDateString
}

export enum GroupedTransactionsTypeOptions {
	"revenue" = "revenue",
	"transfer" = "transfer",
	"funding" = "funding",
	"none" = "none",
	"payment" = "payment",
	"expense" = "expense",
}
export type GroupedTransactionsRecord<Tdates = unknown, Tgdescription = unknown, Ttotal = unknown> = {
	count?: number
	dates?: null | Tdates
	deal: RecordIdString
	gdescription?: null | Tgdescription
	id: string
	total?: null | Ttotal
	type: GroupedTransactionsTypeOptions
}

export enum JobsStatusOptions {
	"PENDING" = "PENDING",
	"SUCCESS" = "SUCCESS",
	"ERROR" = "ERROR",
	"PARTIAL_SUCCESS" = "PARTIAL_SUCCESS",
	"CANCELLED" = "CANCELLED",
	"CLASSIFY" = "CLASSIFY",
}
export type JobsRecord<Tmetadata = unknown> = {
	agent_id: string
	completed?: IsoDateString
	created?: IsoDateString
	deal: RecordIdString
	document_tokens?: number
	error?: string
	extraction?: RecordIdString
	id: string
	job_id: string
	metadata?: null | Tmetadata
	num_pages?: number
	output_tokens?: number
	run_id?: string
	statement: RecordIdString
	status: JobsStatusOptions
	updated?: IsoDateString
}

export type LlamaWebhooksRecord = {
	created?: IsoDateString
	event_id?: string
	id: string
	job_id?: string
	run_id?: string
	type?: string
	updated?: IsoDateString
}

export type OrganizationsRecord = {
	address?: string
	created?: IsoDateString
	email?: string
	id: string
	logo?: string
	name?: string
	phone?: number
	updated?: IsoDateString
	website?: string
}

export type PlaidTokensRecord = {
	access_token?: string
	created?: IsoDateString
	deal?: RecordIdString
	id: string
	item_id?: string
	updated?: IsoDateString
	user?: RecordIdString
}

export type PlaidTransactionsRecord = {
	account_id?: string
	amount?: number
	created?: IsoDateString
	date?: IsoDateString
	deal?: RecordIdString
	description?: string
	id: string
	merchant_name?: string
	name?: string
	updated?: IsoDateString
	user?: RecordIdString
	website?: string
}

export type StatementDetailsRecord = {
	beginning_balance?: number
	created?: IsoDateString
	credits?: number
	date?: IsoDateString
	deal?: RecordIdString
	debits?: number
	ending_balance?: number
	id: string
	statement?: RecordIdString
	updated?: IsoDateString
}

export type StatementsRecord = {
	created?: IsoDateString
	deal: RecordIdString
	details?: RecordIdString
	file: string
	filename: string
	id: string
	llama_index_file_id?: string
	updated?: IsoDateString
}

export type TotalsByMonthRecord<Tdate = unknown, Texpenses = unknown, Tfunding = unknown, Tpayments = unknown, Trevenue = unknown, Ttransfers = unknown> = {
	date?: null | Tdate
	deal?: string
	expenses?: null | Texpenses
	funding?: null | Tfunding
	id: string
	payments?: null | Tpayments
	revenue?: null | Trevenue
	transfers?: null | Ttransfers
}

export enum TransactionsTypeOptions {
	"revenue" = "revenue",
	"transfer" = "transfer",
	"funding" = "funding",
	"none" = "none",
	"payment" = "payment",
	"expense" = "expense",
}
export type TransactionsRecord = {
	amount?: number
	created?: IsoDateString
	date?: IsoDateString
	deal: RecordIdString
	description?: string
	id: string
	statement: RecordIdString
	type: TransactionsTypeOptions
	updated?: IsoDateString
}

export enum UsersRoleOptions {
	"admin" = "admin",
	"agent" = "agent",
}
export type UsersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	organization?: RecordIdString
	password: string
	role?: UsersRoleOptions
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type AvgDailyBalanceResponse<Taverage_daily_ending_balance = unknown, Texpand = unknown> = Required<AvgDailyBalanceRecord<Taverage_daily_ending_balance>> & BaseSystemFields<Texpand>
export type BalanceOverTimeResponse<Texpand = unknown> = Required<BalanceOverTimeRecord> & BaseSystemFields<Texpand>
export type CreditsAndDebitsResponse<Texpand = unknown> = Required<CreditsAndDebitsRecord> & BaseSystemFields<Texpand>
export type CurrentDealResponse<Texpand = unknown> = Required<CurrentDealRecord> & BaseSystemFields<Texpand>
export type DailyBalanceResponse<Texpand = unknown> = Required<DailyBalanceRecord> & BaseSystemFields<Texpand>
export type DealsResponse<Texpand = unknown> = Required<DealsRecord> & BaseSystemFields<Texpand>
export type ExtractionAgentsResponse<Texpand = unknown> = Required<ExtractionAgentsRecord> & BaseSystemFields<Texpand>
export type ExtractionsResponse<Texpand = unknown> = Required<ExtractionsRecord> & BaseSystemFields<Texpand>
export type GroupedTransactionsResponse<Tdates = unknown, Tgdescription = unknown, Ttotal = unknown, Texpand = unknown> = Required<GroupedTransactionsRecord<Tdates, Tgdescription, Ttotal>> & BaseSystemFields<Texpand>
export type JobsResponse<Tmetadata = unknown, Texpand = unknown> = Required<JobsRecord<Tmetadata>> & BaseSystemFields<Texpand>
export type LlamaWebhooksResponse<Texpand = unknown> = Required<LlamaWebhooksRecord> & BaseSystemFields<Texpand>
export type OrganizationsResponse<Texpand = unknown> = Required<OrganizationsRecord> & BaseSystemFields<Texpand>
export type PlaidTokensResponse<Texpand = unknown> = Required<PlaidTokensRecord> & BaseSystemFields<Texpand>
export type PlaidTransactionsResponse<Texpand = unknown> = Required<PlaidTransactionsRecord> & BaseSystemFields<Texpand>
export type StatementDetailsResponse<Texpand = unknown> = Required<StatementDetailsRecord> & BaseSystemFields<Texpand>
export type StatementsResponse<Texpand = unknown> = Required<StatementsRecord> & BaseSystemFields<Texpand>
export type TotalsByMonthResponse<Tdate = unknown, Texpenses = unknown, Tfunding = unknown, Tpayments = unknown, Trevenue = unknown, Ttransfers = unknown, Texpand = unknown> = Required<TotalsByMonthRecord<Tdate, Texpenses, Tfunding, Tpayments, Trevenue, Ttransfers>> & BaseSystemFields<Texpand>
export type TransactionsResponse<Texpand = unknown> = Required<TransactionsRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	avg_daily_balance: AvgDailyBalanceRecord
	balance_over_time: BalanceOverTimeRecord
	credits_and_debits: CreditsAndDebitsRecord
	current_deal: CurrentDealRecord
	daily_balance: DailyBalanceRecord
	deals: DealsRecord
	extraction_agents: ExtractionAgentsRecord
	extractions: ExtractionsRecord
	grouped_transactions: GroupedTransactionsRecord
	jobs: JobsRecord
	llama_webhooks: LlamaWebhooksRecord
	organizations: OrganizationsRecord
	plaid_tokens: PlaidTokensRecord
	plaid_transactions: PlaidTransactionsRecord
	statement_details: StatementDetailsRecord
	statements: StatementsRecord
	totals_by_month: TotalsByMonthRecord
	transactions: TransactionsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	avg_daily_balance: AvgDailyBalanceResponse
	balance_over_time: BalanceOverTimeResponse
	credits_and_debits: CreditsAndDebitsResponse
	current_deal: CurrentDealResponse
	daily_balance: DailyBalanceResponse
	deals: DealsResponse
	extraction_agents: ExtractionAgentsResponse
	extractions: ExtractionsResponse
	grouped_transactions: GroupedTransactionsResponse
	jobs: JobsResponse
	llama_webhooks: LlamaWebhooksResponse
	organizations: OrganizationsResponse
	plaid_tokens: PlaidTokensResponse
	plaid_transactions: PlaidTransactionsResponse
	statement_details: StatementDetailsResponse
	statements: StatementsResponse
	totals_by_month: TotalsByMonthResponse
	transactions: TransactionsResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'avg_daily_balance'): RecordService<AvgDailyBalanceResponse>
	collection(idOrName: 'balance_over_time'): RecordService<BalanceOverTimeResponse>
	collection(idOrName: 'credits_and_debits'): RecordService<CreditsAndDebitsResponse>
	collection(idOrName: 'current_deal'): RecordService<CurrentDealResponse>
	collection(idOrName: 'daily_balance'): RecordService<DailyBalanceResponse>
	collection(idOrName: 'deals'): RecordService<DealsResponse>
	collection(idOrName: 'extraction_agents'): RecordService<ExtractionAgentsResponse>
	collection(idOrName: 'extractions'): RecordService<ExtractionsResponse>
	collection(idOrName: 'grouped_transactions'): RecordService<GroupedTransactionsResponse>
	collection(idOrName: 'jobs'): RecordService<JobsResponse>
	collection(idOrName: 'llama_webhooks'): RecordService<LlamaWebhooksResponse>
	collection(idOrName: 'organizations'): RecordService<OrganizationsResponse>
	collection(idOrName: 'plaid_tokens'): RecordService<PlaidTokensResponse>
	collection(idOrName: 'plaid_transactions'): RecordService<PlaidTransactionsResponse>
	collection(idOrName: 'statement_details'): RecordService<StatementDetailsResponse>
	collection(idOrName: 'statements'): RecordService<StatementsResponse>
	collection(idOrName: 'totals_by_month'): RecordService<TotalsByMonthResponse>
	collection(idOrName: 'transactions'): RecordService<TransactionsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
