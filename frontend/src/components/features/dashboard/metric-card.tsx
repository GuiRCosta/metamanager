import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  format?: "number" | "currency" | "percentage"
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  format = "number",
}: MetricCardProps) {
  const formatValue = () => {
    if (typeof value === "string") return value

    switch (format) {
      case "currency":
        return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      case "percentage":
        return `${value.toFixed(2)}%`
      default:
        return value.toLocaleString("pt-BR")
    }
  }

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null
    if (trend > 0) return TrendingUp
    if (trend < 0) return TrendingDown
    return Minus
  }

  const TrendIcon = getTrendIcon()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        {trend !== undefined && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {TrendIcon && (
              <TrendIcon
                className={cn(
                  "h-3 w-3",
                  trend > 0 && "text-green-500",
                  trend < 0 && "text-red-500",
                  trend === 0 && "text-muted-foreground"
                )}
              />
            )}
            <span
              className={cn(
                trend > 0 && "text-green-500",
                trend < 0 && "text-red-500",
                trend === 0 && "text-muted-foreground"
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
