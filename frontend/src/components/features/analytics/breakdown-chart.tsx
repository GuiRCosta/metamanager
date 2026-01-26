"use client"

import { useState, useEffect } from "react"
import { Loader2, Users, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { analyticsApi, type BreakdownItem, type BreakdownType } from "@/lib/api"
import { cn } from "@/lib/utils"

interface BreakdownChartProps {
  objectId: string
  objectType?: "campaign" | "adset" | "ad"
  adAccountId?: string
  datePreset?: string
  className?: string
}

const breakdownOptions: { value: BreakdownType; label: string }[] = [
  { value: "age", label: "Faixa Etária" },
  { value: "gender", label: "Gênero" },
  { value: "country", label: "País" },
  { value: "publisher_platform", label: "Plataforma" },
  { value: "device_platform", label: "Dispositivo" },
]

const metricOptions = [
  { value: "spend", label: "Gasto" },
  { value: "impressions", label: "Impressões" },
  { value: "clicks", label: "Cliques" },
  { value: "reach", label: "Alcance" },
  { value: "conversions", label: "Conversões" },
] as const

type MetricKey = (typeof metricOptions)[number]["value"]

function formatValue(value: number, metric: MetricKey): string {
  if (metric === "spend") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }
  return new Intl.NumberFormat("pt-BR").format(value)
}

function getBarColor(index: number): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-yellow-500",
    "bg-red-500",
  ]
  return colors[index % colors.length]
}

export function BreakdownChart({
  objectId,
  objectType = "campaign",
  adAccountId,
  datePreset = "last_7d",
  className,
}: BreakdownChartProps) {
  const [breakdown, setBreakdown] = useState<BreakdownType>("age")
  const [metric, setMetric] = useState<MetricKey>("spend")
  const [data, setData] = useState<BreakdownItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBreakdown = async () => {
      if (!objectId) return

      try {
        setLoading(true)
        setError(null)
        const response = await analyticsApi.getBreakdown(objectId, breakdown, datePreset, adAccountId)
        setData(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        setLoading(false)
      }
    }

    fetchBreakdown()
  }, [objectId, breakdown, datePreset, adAccountId])

  const maxValue = Math.max(...data.map((item) => item[metric] as number), 1)
  const totalValue = data.reduce((sum, item) => sum + (item[metric] as number), 0)

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Análise por Dimensão
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={breakdown} onValueChange={(v) => setBreakdown(v as BreakdownType)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {breakdownOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive py-4">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Sem dados para o período selecionado
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => {
              const value = item[metric] as number
              const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0
              const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0

              return (
                <div key={`${item.dimension}-${item.value}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.value}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                      <span className="font-medium w-24 text-right">
                        {formatValue(value, metric)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("absolute top-0 left-0 h-full rounded-full transition-all", getBarColor(index))}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Total */}
            <div className="pt-4 border-t mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formatValue(totalValue, metric)}</span>
              </div>
            </div>

            {/* Additional Metrics */}
            {metric === "spend" && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">CTR Médio</span>
                  <p className="font-medium">
                    {(data.reduce((sum, item) => sum + item.ctr, 0) / data.length || 0).toFixed(2)}%
                  </p>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">CPC Médio</span>
                  <p className="font-medium">
                    {formatValue(data.reduce((sum, item) => sum + item.cpc, 0) / data.length || 0, "spend")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
