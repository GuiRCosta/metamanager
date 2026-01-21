import {
  DollarSign,
  Eye,
  MousePointer,
  Target,
  TrendingUp,
  Megaphone,
} from "lucide-react"
import { MetricCard } from "@/components/features/dashboard/metric-card"
import { BudgetCard } from "@/components/features/dashboard/budget-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  // TODO: Fetch real data from API
  const metrics = {
    totalSpend: 3250.75,
    totalImpressions: 125000,
    totalClicks: 4500,
    totalConversions: 180,
    averageCtr: 3.6,
    averageCpc: 0.72,
    activeCampaigns: 5,
    pausedCampaigns: 3,
  }

  const budget = {
    spent: 3250.75,
    limit: 5000,
    projected: 4875.5,
  }

  const recentAlerts = [
    {
      id: "1",
      type: "warning" as const,
      title: "Orçamento próximo do limite",
      message: "Campanha 'Promoção Black Friday' está em 85% do orçamento",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      type: "success" as const,
      title: "Meta de conversões atingida",
      message: "Campanha 'Leads Janeiro' atingiu 100% da meta",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      type: "info" as const,
      title: "Sincronização concluída",
      message: "8 campanhas sincronizadas com sucesso",
      createdAt: new Date().toISOString(),
    },
  ]

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive"
      case "warning":
        return "outline"
      case "success":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas campanhas Meta Ads
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gasto Total"
          value={metrics.totalSpend}
          icon={DollarSign}
          format="currency"
          trend={12.5}
          trendLabel="vs. semana anterior"
        />
        <MetricCard
          title="Impressões"
          value={metrics.totalImpressions}
          icon={Eye}
          trend={8.2}
          trendLabel="vs. semana anterior"
        />
        <MetricCard
          title="Cliques"
          value={metrics.totalClicks}
          icon={MousePointer}
          trend={15.3}
          trendLabel="vs. semana anterior"
        />
        <MetricCard
          title="Conversões"
          value={metrics.totalConversions}
          icon={Target}
          trend={-2.1}
          trendLabel="vs. semana anterior"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BudgetCard
          spent={budget.spent}
          limit={budget.limit}
          projected={budget.projected}
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
                <span className="text-sm text-muted-foreground">CTR Médio</span>
                <span className="font-medium">{metrics.averageCtr}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CPC Médio</span>
                <span className="font-medium">
                  R$ {metrics.averageCpc.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Custo por Conversão
                </span>
                <span className="font-medium">
                  R${" "}
                  {(metrics.totalSpend / metrics.totalConversions).toFixed(2)}
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
                <span className="font-medium">{metrics.activeCampaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pausadas</span>
                </div>
                <span className="font-medium">{metrics.pausedCampaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <span className="text-sm">Total</span>
                </div>
                <span className="font-medium">
                  {metrics.activeCampaigns + metrics.pausedCampaigns}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getAlertBadgeVariant(alert.type)}>
                      {alert.type}
                    </Badge>
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
