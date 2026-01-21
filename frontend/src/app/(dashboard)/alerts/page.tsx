"use client"

import { useState } from "react"
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Alert, AlertType } from "@/types"

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    priority: "high",
    title: "Orçamento próximo do limite",
    message:
      "A campanha 'Promoção Black Friday' está em 85% do orçamento diário. Considere ajustar o limite ou pausar temporariamente.",
    campaignId: "1",
    campaignName: "Promoção Black Friday",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    type: "success",
    priority: "medium",
    title: "Meta de conversões atingida",
    message:
      "Parabéns! A campanha 'Leads Janeiro' atingiu 100% da meta de conversões estabelecida.",
    campaignId: "2",
    campaignName: "Leads Janeiro",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    type: "info",
    priority: "low",
    title: "Sincronização concluída",
    message: "8 campanhas foram sincronizadas com sucesso do Meta Ads Manager.",
    campaignId: null,
    campaignName: null,
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "4",
    type: "error",
    priority: "high",
    title: "Erro na campanha",
    message:
      "A campanha 'Tráfego Blog' foi rejeitada devido a políticas de anúncio. Revise o conteúdo.",
    campaignId: "4",
    campaignName: "Tráfego Blog",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

const typeConfig: Record<
  AlertType,
  { icon: typeof AlertTriangle; color: string }
> = {
  warning: { icon: AlertTriangle, color: "text-yellow-500" },
  success: { icon: CheckCircle, color: "text-green-500" },
  info: { icon: Info, color: "text-blue-500" },
  error: { icon: XCircle, color: "text-red-500" },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts)

  const unreadCount = alerts.filter((a) => !a.read).length

  const markAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    )
  }

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
  }

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
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
            {unreadCount > 0
              ? `${unreadCount} alerta${unreadCount > 1 ? "s" : ""} não lido${unreadCount > 1 ? "s" : ""}`
              : "Todos os alertas foram lidos"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Marcar todos como lidos
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Nenhum alerta encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const config = typeConfig[alert.type]
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
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                      {alert.campaignName && (
                        <p className="text-xs text-muted-foreground">
                          Campanha: {alert.campaignName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatTime(alert.createdAt)}
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
