"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  TrendingDown,
  Activity,
  Lightbulb,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAdAccount } from "@/contexts/ad-account-context"
import { alertsApi, type Alert, type AlertType, type AlertPriority } from "@/lib/api"

const typeConfig: Record<AlertType, { icon: typeof AlertTriangle; color: string; label: string }> = {
  budget: { icon: AlertTriangle, color: "text-yellow-500", label: "Orçamento" },
  performance: { icon: TrendingDown, color: "text-red-500", label: "Performance" },
  status: { icon: Activity, color: "text-primary", label: "Status" },
  optimization: { icon: Lightbulb, color: "text-green-500", label: "Otimização" },
}

const priorityConfig: Record<AlertPriority, { className: string; label: string }> = {
  low: { className: "bg-gray-100 text-gray-700", label: "Baixa" },
  medium: { className: "bg-yellow-100 text-yellow-700", label: "Média" },
  high: { className: "bg-orange-100 text-orange-700", label: "Alta" },
  critical: { className: "bg-red-100 text-red-700", label: "Crítica" },
}

export default function AlertsPage() {
  const { selectedAccount } = useAdAccount()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await alertsApi.getAll({
        ad_account_id: selectedAccount?.account_id,
      })
      setAlerts(response.alerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar alertas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [selectedAccount?.account_id])

  const unreadCount = alerts.filter((a) => !a.read).length

  const markAsRead = async (id: string) => {
    try {
      await alertsApi.update(id, { read: true })
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao marcar como lido")
    }
  }

  const markAllAsRead = async () => {
    try {
      await alertsApi.markAllRead()
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao marcar todos como lidos")
    }
  }

  const deleteAlert = async (id: string) => {
    try {
      await alertsApi.delete(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir alerta")
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    return `${days}d atrás`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
          <p className="text-muted-foreground">
            {selectedAccount ? (
              <>Conta: <span className="font-medium">{selectedAccount.name}</span> • </>
            ) : null}
            {unreadCount > 0
              ? `${unreadCount} alerta${unreadCount > 1 ? "s" : ""} não lido${unreadCount > 1 ? "s" : ""}`
              : "Todos os alertas foram lidos"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAlerts} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Marcar todos como lidos
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Nenhum alerta encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const config = typeConfig[alert.type] || typeConfig.status
                const priority = priorityConfig[alert.priority] || priorityConfig.medium
                const Icon = config.icon

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                      !alert.read && "bg-muted/50"
                    )}
                  >
                    <Icon className={cn("mt-1 h-5 w-5", config.color)} />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.title}</span>
                        {!alert.read && (
                          <Badge variant="secondary" className="text-xs">
                            Novo
                          </Badge>
                        )}
                        <Badge className={cn("text-xs", priority.className)}>
                          {priority.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                      {alert.campaign_name && (
                        <p className="text-xs text-muted-foreground">
                          Campanha: {alert.campaign_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatTime(alert.created_at)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!alert.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(alert.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
