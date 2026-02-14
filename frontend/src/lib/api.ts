const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

let _apiUserId: string | undefined

export function setApiUserId(userId: string | undefined) {
  _apiUserId = userId
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let url = `${API_BASE_URL}${endpoint}`
  if (_apiUserId) {
    const separator = url.includes("?") ? "&" : "?"
    url = `${url}${separator}user_id=${_apiUserId}`
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Ad Accounts API
export interface AdAccount {
  id: string
  account_id: string
  name: string
  currency: string
  account_status: number
  amount_spent: string
  business_name?: string
}

export interface AdAccountsResponse {
  success: boolean
  accounts: AdAccount[]
}

export const accountsApi = {
  getAll: () => fetchApi<AdAccountsResponse>("/api/sync/accounts"),
}

// Campaigns API
export interface MetaCampaign {
  id: string
  name: string
  objective: string
  status: string
  effective_status?: string
  daily_budget?: string
  lifetime_budget?: string
  created_time: string
  updated_time: string
}

export interface SyncCampaignsResponse {
  success: boolean
  campaigns_synced: number
  campaigns: MetaCampaign[]
}

export interface CampaignInsights {
  campaign_id: string
  campaign_name: string
  date_start: string
  date_stop: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number | null
}

export interface CampaignResponse {
  id: string
  meta_id: string
  name: string
  objective: string
  status: string
  daily_budget?: string
  lifetime_budget?: string
  created_at?: string
  updated_at?: string
}

export interface AdSetResponse {
  id: string
  name: string
  status: string
  daily_budget?: string
  targeting?: Record<string, unknown>
  created_time?: string
  updated_time?: string
}

export interface AdSetListResponse {
  ad_sets: AdSetResponse[]
  total: number
}

export interface AdCreative {
  id: string
  name?: string
  object_type?: string  // SHARE, VIDEO, IMAGE, etc.
  thumbnail_url?: string
  image_url?: string
  video_id?: string
}

export interface AdInsights {
  spend: number
  impressions: number
  clicks: number
  reach: number
  conversions: number
  leads: number
  purchases: number
  ctr: number
  cpc: number
}

export interface AdResponse {
  id: string
  name: string
  status: string
  effective_status?: string
  creative?: AdCreative
  insights?: AdInsights
  created_time?: string
  updated_time?: string
}

export interface AdListResponse {
  ads: AdResponse[]
  total: number
}

export interface DuplicateResponse {
  campaigns: CampaignResponse[]
  total: number
  page: number
  limit: number
}

export const campaignsApi = {
  sync: (adAccountId?: string, includeArchived?: boolean) => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    if (includeArchived) params.append("include_archived", "true")
    const queryString = params.toString() ? `?${params.toString()}` : ""
    return fetchApi<SyncCampaignsResponse>(`/api/sync/campaigns${queryString}`, { method: "POST" })
  },

  syncAll: (adAccountId?: string) => {
    const params = adAccountId ? `?ad_account_id=${adAccountId}` : ""
    return fetchApi<{ success: boolean; campaigns_synced: number; metrics_synced: number }>(
      `/api/sync${params}`,
      { method: "POST" }
    )
  },

  syncMetrics: (campaignId?: string, adAccountId?: string) => {
    const params = new URLSearchParams()
    if (campaignId) params.append("campaign_id", campaignId)
    if (adAccountId) params.append("ad_account_id", adAccountId)
    const queryString = params.toString() ? `?${params.toString()}` : ""
    return fetchApi<{ success: boolean; metrics: CampaignInsights[] }>(
      `/api/sync/metrics${queryString}`,
      { method: "POST" }
    )
  },

  getInsights: (campaignId: string) =>
    fetchApi<CampaignInsights>(`/api/campaigns/${campaignId}/insights`),

  updateStatus: (campaignId: string, status: "ACTIVE" | "PAUSED") =>
    fetchApi<CampaignResponse>(`/api/campaigns/${campaignId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  delete: (campaignId: string) =>
    fetchApi<{ message: string }>(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
    }),

  duplicate: (campaignId: string, count: number = 1, adAccountId?: string) => {
    const params = new URLSearchParams()
    params.append("count", count.toString())
    if (adAccountId) params.append("ad_account_id", adAccountId)
    return fetchApi<DuplicateResponse>(`/api/campaigns/${campaignId}/duplicate?${params.toString()}`, {
      method: "POST",
    })
  },

  getById: (campaignId: string) =>
    fetchApi<CampaignResponse>(`/api/campaigns/${campaignId}`),

  create: (data: { name: string; objective: string; daily_budget?: number; status?: string }, adAccountId?: string) => {
    const params = adAccountId ? `?ad_account_id=${adAccountId}` : ""
    return fetchApi<CampaignResponse>(`/api/campaigns${params}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  getAdSets: (campaignId: string) =>
    fetchApi<AdSetListResponse>(`/api/campaigns/${campaignId}/ad-sets`),

  getAds: (campaignId: string, adSetId: string) =>
    fetchApi<AdListResponse>(`/api/campaigns/${campaignId}/ad-sets/${adSetId}/ads`),

  update: (campaignId: string, data: { name?: string; status?: string; daily_budget?: number }) =>
    fetchApi<CampaignResponse>(`/api/campaigns/${campaignId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  createAdSet: (
    campaignId: string,
    data: {
      name: string
      daily_budget: number
      optimization_goal?: string
      billing_event?: string
      targeting?: Record<string, unknown>
      status?: string
    },
    adAccountId?: string
  ) => {
    const params = adAccountId ? `?ad_account_id=${adAccountId}` : ""
    return fetchApi<{ id: string; name: string }>(`/api/campaigns/${campaignId}/ad-sets${params}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  createAd: (
    campaignId: string,
    adSetId: string,
    data: {
      name: string
      creative_id: string
      status?: string
    },
    adAccountId?: string
  ) => {
    const params = adAccountId ? `?ad_account_id=${adAccountId}` : ""
    return fetchApi<{ id: string; name: string }>(`/api/campaigns/${campaignId}/ad-sets/${adSetId}/ads${params}`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateAdSet: (
    campaignId: string,
    adSetId: string,
    data: {
      name?: string
      daily_budget?: number
      status?: string
      targeting?: Record<string, unknown>
      optimization_goal?: string
      billing_event?: string
    },
    adAccountId?: string
  ) => {
    const params = adAccountId ? `?ad_account_id=${adAccountId}` : ""
    return fetchApi<{ success: boolean; id: string; updated_fields: string[] }>(
      `/api/campaigns/${campaignId}/ad-sets/${adSetId}${params}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    )
  },

  updateAd: (
    campaignId: string,
    adSetId: string,
    adId: string,
    data: {
      name?: string
      status?: string
      creative_id?: string
    },
    adAccountId?: string
  ) => {
    const params = adAccountId ? `?ad_account_id=${adAccountId}` : ""
    return fetchApi<{ success: boolean; id: string; updated_fields: string[] }>(
      `/api/campaigns/${campaignId}/ad-sets/${adSetId}/ads/${adId}${params}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    )
  },

  getCreatives: (adAccountId?: string, limit: number = 50) => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    params.append("limit", String(limit))
    return fetchApi<{ success: boolean; creatives: AdCreative[]; total: number }>(
      `/api/campaigns/creatives/list?${params.toString()}`
    )
  },
}

// Chat/Agent API
export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatResponse {
  response: string
  actions?: Array<{
    type: string
    description: string
    data?: Record<string, unknown>
  }>
}

export const agentApi = {
  chat: (message: string, adAccountId?: string, history?: Array<{ role: string; content: string }>) =>
    fetchApi<ChatResponse>("/api/agent/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        ad_account_id: adAccountId,
        context: history ? { history } : undefined,
      }),
    }),
}

// Dashboard API
export interface DashboardMetrics {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cpm: number
  reach: number
  frequency: number
  leads: number
  purchases: number
  landing_page_views: number
  video_views: number
  roas: number
  active_campaigns: number
  paused_campaigns: number
  archived_campaigns: number
  total_campaigns: number
}

export interface DashboardResponse {
  success: boolean
  metrics: DashboardMetrics
}

export interface CampaignInsightsItem {
  id: string
  name: string
  status: string
  objective: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
}

export interface CampaignsInsightsResponse {
  success: boolean
  campaigns: CampaignInsightsItem[]
}

export interface DailyMetric {
  date: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
}

export interface TrendsResponse {
  success: boolean
  data: DailyMetric[]
}

export interface AdSetInsightsItem {
  id: string
  name: string
  status: string
  campaign_id: string
  campaign_name: string
  daily_budget?: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  conversions: number
  ctr: number
  cpc: number
}

export interface AdSetsInsightsResponse {
  success: boolean
  ad_sets: AdSetInsightsItem[]
}

export interface AdInsightsItem {
  id: string
  name: string
  status: string
  campaign_id: string
  campaign_name: string
  adset_id: string
  adset_name: string
  creative_type?: string
  thumbnail_url?: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  conversions: number
  ctr: number
  cpc: number
}

export interface AdsInsightsResponse {
  success: boolean
  ads: AdInsightsItem[]
}

export interface AccountLimitItem {
  name: string
  current: number
  limit: number
  percentage: number
}

export interface AccountLimitsResponse {
  success: boolean
  account_name: string
  limits: AccountLimitItem[]
}

export const dashboardApi = {
  getMetrics: (adAccountId?: string, datePreset: string = "last_7d", includeArchived?: boolean) => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    params.append("date_preset", datePreset)
    if (includeArchived) params.append("include_archived", "true")
    return fetchApi<DashboardResponse>(`/api/sync/dashboard?${params.toString()}`)
  },

  getCampaignsInsights: (adAccountId?: string, datePreset: string = "last_7d", includeArchived?: boolean) => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    params.append("date_preset", datePreset)
    if (includeArchived) params.append("include_archived", "true")
    return fetchApi<CampaignsInsightsResponse>(`/api/sync/campaigns-insights?${params.toString()}`)
  },

  getTrends: (adAccountId?: string, datePreset: string = "last_7d") => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    params.append("date_preset", datePreset)
    return fetchApi<TrendsResponse>(`/api/sync/trends?${params.toString()}`)
  },

  getAdSetsInsights: (adAccountId?: string, datePreset: string = "last_7d", includeArchived?: boolean) => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    params.append("date_preset", datePreset)
    if (includeArchived) params.append("include_archived", "true")
    return fetchApi<AdSetsInsightsResponse>(`/api/sync/adsets-insights?${params.toString()}`)
  },

  getAdsInsights: (adAccountId?: string, datePreset: string = "last_7d", includeArchived?: boolean) => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    params.append("date_preset", datePreset)
    if (includeArchived) params.append("include_archived", "true")
    return fetchApi<AdsInsightsResponse>(`/api/sync/ads-insights?${params.toString()}`)
  },

  getAccountLimits: (adAccountId?: string) => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    const queryString = params.toString() ? `?${params.toString()}` : ""
    return fetchApi<AccountLimitsResponse>(`/api/sync/account-limits${queryString}`)
  },
}

// Health check
export const healthApi = {
  check: () => fetchApi<{ status: string }>("/health"),
}

// Settings API
export interface BudgetAlerts {
  alert_50: boolean
  alert_80: boolean
  alert_100: boolean
  projection_excess: boolean
}

export interface BudgetSettings {
  monthly_budget: number
  alerts: BudgetAlerts
}

export interface MetaApiSettings {
  access_token?: string
  business_id?: string
  ad_account_id?: string
  api_version?: string
}

export interface NotificationSettings {
  daily_reports: boolean
  immediate_alerts: boolean
  optimization_suggestions: boolean
  status_changes: boolean
  report_time: string
}

export interface GoalsSettings {
  conversion_goal?: number
  roas_goal?: number
  cpc_max?: number
  ctr_min?: number
}

export interface EvolutionSettings {
  api_url?: string
  api_key?: string
  instance?: string
  webhook_secret?: string
  enabled: boolean
  allowed_numbers: string[]
}

export interface Settings {
  budget: BudgetSettings
  meta_api: MetaApiSettings
  notifications: NotificationSettings
  goals: GoalsSettings
  evolution: EvolutionSettings
}

export interface SettingsUpdate {
  budget?: BudgetSettings
  meta_api?: MetaApiSettings
  notifications?: NotificationSettings
  goals?: GoalsSettings
  evolution?: EvolutionSettings
}

export interface TestConnectionResponse {
  success: boolean
  message: string
  accounts_found?: number
}

export const settingsApi = {
  get: (userId?: string) => {
    const params = userId ? `?user_id=${userId}` : ""
    return fetchApi<Settings>(`/api/settings${params}`)
  },

  update: (settings: SettingsUpdate, userId?: string) => {
    const params = userId ? `?user_id=${userId}` : ""
    return fetchApi<Settings>(`/api/settings${params}`, {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  },

  testConnection: (credentials: MetaApiSettings) =>
    fetchApi<TestConnectionResponse>("/api/settings/test-connection", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  setDefaultAccount: (adAccountId: string, userId?: string) => {
    const params = userId ? `?user_id=${userId}` : ""
    return fetchApi<{ success: boolean; ad_account_id: string }>(`/api/settings/default-account${params}`, {
      method: "PATCH",
      body: JSON.stringify({ ad_account_id: adAccountId }),
    })
  },
}

// Alerts API
export type AlertType = "budget" | "performance" | "status" | "optimization"
export type AlertPriority = "low" | "medium" | "high" | "critical"

export interface Alert {
  id: string
  type: AlertType
  priority: AlertPriority
  title: string
  message: string
  campaign_id?: string
  campaign_name?: string
  read: boolean
  created_at: string
}

export interface AlertListResponse {
  alerts: Alert[]
  total: number
  unread_count: number
}

export interface AlertUpdate {
  read?: boolean
}

export const alertsApi = {
  getAll: (filters?: { type?: string; priority?: string; read?: boolean; limit?: number }) => {
    const params = new URLSearchParams()
    if (filters?.type) params.append("type", filters.type)
    if (filters?.priority) params.append("priority", filters.priority)
    if (filters?.read !== undefined) params.append("read", String(filters.read))
    if (filters?.limit) params.append("limit", String(filters.limit))
    const queryString = params.toString() ? `?${params.toString()}` : ""
    return fetchApi<AlertListResponse>(`/api/alerts${queryString}`)
  },

  getUnreadCount: () => fetchApi<{ unread_count: number }>("/api/alerts/unread-count"),

  getById: (alertId: string) => fetchApi<Alert>(`/api/alerts/${alertId}`),

  update: (alertId: string, update: AlertUpdate) =>
    fetchApi<Alert>(`/api/alerts/${alertId}`, {
      method: "PUT",
      body: JSON.stringify(update),
    }),

  markAllRead: () =>
    fetchApi<{ success: boolean; updated: number }>("/api/alerts/mark-all-read", {
      method: "PUT",
    }),

  delete: (alertId: string) =>
    fetchApi<{ success: boolean; deleted_id: string }>(`/api/alerts/${alertId}`, {
      method: "DELETE",
    }),

  deleteAll: () =>
    fetchApi<{ success: boolean }>("/api/alerts", {
      method: "DELETE",
    }),

  generate: (campaigns: unknown[]) =>
    fetchApi<{ success: boolean; new_alerts: number }>("/api/alerts/generate", {
      method: "POST",
      body: JSON.stringify(campaigns),
    }),
}

// ========================================
// Targeting API
// ========================================

export interface Interest {
  id: string
  name: string
  audience_size_lower_bound: number
  audience_size_upper_bound: number
  path: string[]
  topic?: string
}

export interface InterestsResponse {
  success: boolean
  interests: Interest[]
}

export interface Location {
  key: string
  name: string
  type: string
  country_code?: string
  country_name?: string
  region?: string
  region_id?: number
  supports_city: boolean
  supports_region: boolean
}

export interface LocationsResponse {
  success: boolean
  locations: Location[]
}

export interface CategoriesResponse {
  success: boolean
  categories: Array<{
    id: string
    name: string
    type?: string
    path?: string[]
    audience_size?: number
  }>
}

export const targetingApi = {
  searchInterests: (query: string, limit: number = 20) =>
    fetchApi<InterestsResponse>(`/api/targeting/interests?q=${encodeURIComponent(query)}&limit=${limit}`),

  searchLocations: (query: string, types?: string[], limit: number = 20) => {
    const params = new URLSearchParams()
    params.append("q", query)
    params.append("limit", String(limit))
    if (types?.length) params.append("types", types.join(","))
    return fetchApi<LocationsResponse>(`/api/targeting/locations?${params.toString()}`)
  },

  getCategories: (categoryClass: string = "interests") =>
    fetchApi<CategoriesResponse>(`/api/targeting/categories?category_class=${categoryClass}`),
}

// ========================================
// Analytics API (Breakdown & Reach)
// ========================================

export type BreakdownType = "age" | "gender" | "country" | "publisher_platform" | "device_platform"

export interface BreakdownItem {
  dimension: string
  value: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  conversions: number
  ctr: number
  cpc: number
  cpm: number
}

export interface BreakdownResponse {
  success: boolean
  breakdown_type: string
  data: BreakdownItem[]
}

export interface ReachEstimate {
  users_lower_bound: number
  users_upper_bound: number
  estimate_ready: boolean
}

export interface ReachEstimateResponse {
  success: boolean
  estimate: ReachEstimate
}

export const analyticsApi = {
  getBreakdown: (objectId: string, breakdown: BreakdownType, datePreset: string = "last_7d", adAccountId?: string) => {
    const params = new URLSearchParams()
    params.append("breakdown", breakdown)
    params.append("date_preset", datePreset)
    if (adAccountId) params.append("ad_account_id", adAccountId)
    return fetchApi<BreakdownResponse>(`/api/sync/breakdown/${objectId}?${params.toString()}`)
  },

  estimateReach: (targetingSpec: Record<string, unknown>, optimizationGoal: string = "REACH", adAccountId?: string) => {
    const params = new URLSearchParams()
    if (adAccountId) params.append("ad_account_id", adAccountId)
    const queryString = params.toString() ? `?${params.toString()}` : ""
    return fetchApi<ReachEstimateResponse>(`/api/sync/reach-estimate${queryString}`, {
      method: "POST",
      body: JSON.stringify({
        targeting_spec: targetingSpec,
        optimization_goal: optimizationGoal,
      }),
    })
  },
}

// ========================================
// WhatsApp API
// ========================================

export interface WhatsAppSchedulerStatus {
  enabled: boolean
  scheduler_running: boolean
  daily_reports_enabled: boolean
  report_time: string
  immediate_alerts_enabled: boolean
  allowed_numbers_count: number
  budget_alerts: {
    alert_50?: boolean
    alert_80?: boolean
    alert_100?: boolean
    projection_excess?: boolean
  }
}

export interface WhatsAppTestResponse {
  success: boolean
  message: string
}

export const whatsappApi = {
  getSchedulerStatus: () =>
    fetchApi<WhatsAppSchedulerStatus>("/api/whatsapp/scheduler-status"),

  sendTestMessage: (phoneNumber: string) =>
    fetchApi<WhatsAppTestResponse>("/api/whatsapp/test-message", {
      method: "POST",
      body: JSON.stringify({ phone_number: phoneNumber }),
    }),

  sendReportNow: () =>
    fetchApi<WhatsAppTestResponse>("/api/whatsapp/send-report", {
      method: "POST",
    }),
}

// ========================================
// Activity Logs API (Superadmin)
// ========================================

export interface ActivityLog {
  id: number
  timestamp: string
  user_id: string | null
  method: string
  path: string
  query_params: string | null
  status_code: number | null
  response_time_ms: number | null
  error_detail: string | null
  ip_address: string | null
  user_agent: string | null
}

export interface LogsResponse {
  success: boolean
  logs: ActivityLog[]
  total: number
  page: number
  limit: number
}

export interface LogStats {
  success: boolean
  total_requests: number
  error_count: number
  avg_response_time_ms: number
  active_users: Array<{ user_id: string; request_count: number; last_seen: string }>
  top_endpoints: Array<{ path: string; method: string; count: number; avg_time_ms: number; error_count: number }>
  status_breakdown: Array<{ status_group: string; count: number }>
  recent_errors: Array<{ timestamp: string; user_id: string | null; method: string; path: string; status_code: number; response_time_ms: number; error_detail: string | null }>
}

export const logsApi = {
  getLogs: (filters?: {
    user_id?: string
    method?: string
    status_min?: number
    status_max?: number
    path_contains?: string
    errors_only?: boolean
    page?: number
    limit?: number
  }) => {
    const params = new URLSearchParams()
    if (filters?.user_id) params.append("user_id", filters.user_id)
    if (filters?.method) params.append("method", filters.method)
    if (filters?.status_min) params.append("status_min", String(filters.status_min))
    if (filters?.status_max) params.append("status_max", String(filters.status_max))
    if (filters?.path_contains) params.append("path_contains", filters.path_contains)
    if (filters?.errors_only) params.append("errors_only", "true")
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))
    const queryString = params.toString() ? `?${params.toString()}` : ""
    return fetchApi<LogsResponse>(`/api/logs${queryString}`)
  },

  getStats: (hours: number = 24) =>
    fetchApi<LogStats>(`/api/logs/stats?hours=${hours}`),
}
