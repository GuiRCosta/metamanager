"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  DollarSign,
  Eye,
  MousePointer,
  Target,
  TrendingUp,
  Megaphone,
  Loader2,
  Bell,
} from "lucide-react"
import { MetricCard } from "@/components/features/dashboard/metric-card"
import { BudgetCard } from "@/components/features/dashboard/budget-card"
import { AccountLimitsCard } from "@/components/features/dashboard/account-limits-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardApi, alertsApi, settingsApi, type DashboardMetrics, type Alert } from "@/lib/api"
import { useAdAccount } from "@/contexts/ad-account-context"
import { useSession } from "next-auth/react"

export default function DashboardPage() {
  const { selectedAccount, loading: accountLoading } = useAdAccount()
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [monthlyBudget, setMonthlyBudget] = useState(5000)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const settings = await settingsApi.get(userId)
        if (settings.budget?.monthly_budget) {
          setMonthlyBudget(settings.budget.monthly_budget)
        }
      } catch {
        // Keep default
      }
    }
    loadBudget()
  }, [userId])

  const fetchData = async () => {
    if (!selectedAccount) return

    try {
      setLoading(true)
      setError(null)

      const [metricsResponse, alertsResponse] = await Promise.all([
        dashboardApi.getMetrics(selectedAccount.account_id, "last_7d"),
        alertsApi.getAll({ limit: 5, ad_account_id: selectedAccount.account_id }),
      ])

      setMetrics(metricsResponse.metrics)
      setAlerts(alertsResponse.alerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accountLoading) return

    if (!selectedAccount) {
      setLoading(false)
      return
    }

    fetchData()
  }, [selectedAccount?.account_id, accountLoading])

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "budget":
        return "default"
      case "performance":
        return "outline"
      case "optimization":
        return "secondary"
      default:
        return "secondary"
    }
  }

  if (loading || accountLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!selectedAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Selecione uma conta de anúncios</p>
        </div>
        <div className="flex h-[30vh] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            Selecione uma conta de anúncios no menu superior para ver as métricas
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {selectedAccount ? `Conta: ${selectedAccount.name}` : "Selecione uma conta"}
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </div>
    )
  }

  const displayMetrics = metrics || {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    active_campaigns: 0,
    paused_campaigns: 0,
    total_campaigns: 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {selectedAccount ? (
            <>Conta: <span className="font-medium">{selectedAccount.name}</span></>
          ) : (
            "Selecione uma conta de anúncios"
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gasto Total"
          value={displayMetrics.spend}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Impressões"
          value={displayMetrics.impressions}
          icon={Eye}
        />
        <MetricCard
          title="Cliques"
          value={displayMetrics.clicks}
          icon={MousePointer}
        />
        <MetricCard
          title="Conversões"
          value={displayMetrics.conversions}
          icon={Target}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BudgetCard
          spent={displayMetrics.spend}
          limit={monthlyBudget}
          projected={displayMetrics.spend * 1.2}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Performance Geral
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CTR</span>
                <span className="font-medium">{displayMetrics.ctr.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CPC Médio</span>
                <span className="font-medium">
                  R$ {displayMetrics.cpc.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Custo por Conversão
                </span>
                <span className="font-medium">
                  R${" "}
                  {displayMetrics.conversions > 0
                    ? (displayMetrics.spend / displayMetrics.conversions).toFixed(2)
                    : "0.00"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Ativas</span>
                </div>
                <span className="font-medium">{displayMetrics.active_campaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pausadas</span>
                </div>
                <span className="font-medium">{displayMetrics.paused_campaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <span className="text-sm">Total</span>
                </div>
                <span className="font-medium">
                  {displayMetrics.total_campaigns}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <AccountLimitsCard adAccountId={selectedAccount?.account_id} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas Recentes
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/alerts">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum alerta no momento
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Os alertas serão gerados automaticamente ao sincronizar campanhas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between rounded-lg border p-4 ${
                    !alert.read ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityBadgeVariant(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      <Badge variant={getTypeBadgeVariant(alert.type)}>
                        {alert.type}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                    {alert.campaign_name && (
                      <p className="text-xs text-muted-foreground">
                        Campanha: {alert.campaign_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
