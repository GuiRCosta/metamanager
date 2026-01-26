export type CampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "DRAFT"

export type CampaignObjective =
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_AWARENESS"
  | "OUTCOME_APP_PROMOTION"

export type AlertType = "budget" | "performance" | "status" | "optimization"
export type AlertPriority = "low" | "medium" | "high" | "critical"

export interface Campaign {
  id: string
  metaId: string
  name: string
  objective: CampaignObjective
  status: CampaignStatus
  dailyBudget: number | null
  lifetimeBudget: number | null
  createdAt: string
  updatedAt: string
}

export interface AdSet {
  id: string
  name: string
  status: string
  dailyBudget: number | null
  targeting: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface Ad {
  id: string
  name: string
  status: string
  creative: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface CampaignMetric {
  id: string
  campaignId: string
  date: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number | null
  cpc: number | null
  roas: number | null
}

export interface DashboardMetrics {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  averageCtr: number
  averageCpc: number
  averageRoas: number | null
  activeCampaigns: number
  pausedCampaigns: number
}

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

export interface Settings {
  id: string
  monthlyBudgetLimit: number
  alertAt50Percent: boolean
  alertAt80Percent: boolean
  alertAt100Percent: boolean
  alertOnProjectedOverrun: boolean
  conversionGoal: number | null
  roasGoal: number | null
  cpcMaxLimit: number | null
  ctrMinLimit: number | null
  whatsappEnabled: boolean
  whatsappNumber: string | null
  dailyReportTime: string
  sendDailyReports: boolean
  sendImmediateAlerts: boolean
  sendSuggestions: boolean
  sendStatusChanges: boolean
  metaAccessToken: string | null
  metaAdAccountId: string | null
  metaPageId: string | null
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  agentType?: string
  suggestions?: string[]
  timestamp: Date
}

export interface User {
  id: string
  name: string | null
  email: string
}

// ========================================
// Targeting Types
// ========================================

export interface Interest {
  id: string
  name: string
  audience_size_lower_bound: number
  audience_size_upper_bound: number
  path: string[]
  topic?: string
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

export interface TargetingCategory {
  id: string
  name: string
  type?: string
  path?: string[]
  audience_size?: number
}

// ========================================
// Analytics Types
// ========================================

export type BreakdownType =
  | "age"
  | "gender"
  | "country"
  | "publisher_platform"
  | "device_platform"

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

export interface ReachEstimate {
  users_lower_bound: number
  users_upper_bound: number
  estimate_ready: boolean
}
