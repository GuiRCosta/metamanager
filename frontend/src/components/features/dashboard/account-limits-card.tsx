"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertTriangle, Megaphone, Layers, FileImage } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { dashboardApi, type AccountLimitItem } from "@/lib/api"
import { cn } from "@/lib/utils"

interface AccountLimitsCardProps {
  adAccountId?: string
}

const iconMap: Record<string, typeof Megaphone> = {
  Campanhas: Megaphone,
  "Conjuntos de Anúncios": Layers,
  Anúncios: FileImage,
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "bg-red-500"
  if (percentage >= 70) return "bg-yellow-500"
  return "bg-green-500"
}

export function AccountLimitsCard({ adAccountId }: AccountLimitsCardProps) {
  const [limits, setLimits] = useState<AccountLimitItem[]>([])
  const [accountName, setAccountName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLimits = async () => {
      if (!adAccountId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await dashboardApi.getAccountLimits(adAccountId)
        setLimits(response.limits)
        setAccountName(response.account_name)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar limites")
      } finally {
        setLoading(false)
      }
    }

    fetchLimits()
  }, [adAccountId])

  if (!adAccountId) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Limites da Conta
        </CardTitle>
        {accountName && (
          <p className="text-sm text-muted-foreground">{accountName}</p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive py-4">{error}</div>
        ) : (
          <div className="space-y-4">
            {limits.map((item) => {
              const Icon = iconMap[item.name] || Megaphone
              const progressColor = getProgressColor(item.percentage)

              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.current.toLocaleString("pt-BR")} / {item.limit.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={item.percentage}
                      className="h-2"
                    />
                    <div
                      className={cn("absolute top-0 left-0 h-2 rounded-full transition-all", progressColor)}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        item.percentage >= 90
                          ? "text-red-500"
                          : item.percentage >= 70
                            ? "text-yellow-500"
                            : "text-green-500"
                      )}
                    >
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
