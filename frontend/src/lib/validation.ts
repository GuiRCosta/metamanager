import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
})

export const campaignSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  objective: z.enum([
    "OUTCOME_TRAFFIC",
    "OUTCOME_LEADS",
    "OUTCOME_SALES",
    "OUTCOME_ENGAGEMENT",
    "OUTCOME_AWARENESS",
    "OUTCOME_APP_PROMOTION",
  ]),
  dailyBudget: z.number().min(0).optional(),
  lifetimeBudget: z.number().min(0).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED", "DRAFT"]).default("PAUSED"),
})

export const settingsSchema = z.object({
  monthlyBudgetLimit: z.number().min(0),
  alertAt50Percent: z.boolean(),
  alertAt80Percent: z.boolean(),
  alertAt100Percent: z.boolean(),
  alertOnProjectedOverrun: z.boolean(),
  conversionGoal: z.number().min(0).optional().nullable(),
  roasGoal: z.number().min(0).optional().nullable(),
  cpcMaxLimit: z.number().min(0).optional().nullable(),
  ctrMinLimit: z.number().min(0).optional().nullable(),
  whatsappEnabled: z.boolean(),
  whatsappNumber: z.string().optional().nullable(),
  dailyReportTime: z.string(),
  sendDailyReports: z.boolean(),
  sendImmediateAlerts: z.boolean(),
  sendSuggestions: z.boolean(),
  sendStatusChanges: z.boolean(),
  metaAccessToken: z.string().optional().nullable(),
  metaAdAccountId: z.string().optional().nullable(),
  metaPageId: z.string().optional().nullable(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CampaignInput = z.infer<typeof campaignSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
