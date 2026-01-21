export type CampaignStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "DRAFT"

export type CampaignObjective =
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_AWARENESS"
  | "OUTCOME_APP_PROMOTION"

export type AlertType = "error" | "warning" | "info" | "success"

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
  priority: string
  title: string
  message: string
  campaignId: string | null
  campaignName: string | null
  read: boolean
  createdAt: string
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
