import { cn } from "@/lib/utils"
import { colors, getMetricColor } from "@/lib/design-tokens"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from "lucide-react"

type MetricType =
  | "spend"
  | "impressions"
  | "clicks"
  | "conversions"
  | "ctr"
  | "cpc"
  | "roas"

interface MetricValueProps {
  value: number
  metric?: MetricType
  format?: "number" | "currency" | "percent"
  trend?: number
  trendLabel?: string
  size?: "sm" | "md" | "lg" | "xl"
  showColor?: boolean
  className?: string
}

const sizeClasses = {
  sm: "text-lg font-semibold",
  md: "text-2xl font-bold",
  lg: "text-3xl font-bold",
  xl: "text-4xl font-bold",
}

const formatValue = (
  value: number,
  format: "number" | "currency" | "percent"
): string => {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)
    case "percent":
      return `${value.toFixed(2)}%`
    case "number":
    default:
      return new Intl.NumberFormat("pt-BR").format(value)
  }
}

export function MetricValue({
  value,
  metric,
  format = "number",
  trend,
  trendLabel,
  size = "md",
  showColor = false,
  className,
}: MetricValueProps) {
  const color = metric && showColor ? getMetricColor(metric) : undefined

  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn(sizeClasses[size], "tracking-tight")}
        style={color ? { color } : undefined}
      >
        {formatValue(value, format)}
      </span>
      {trend !== undefined && (
        <MetricTrend value={trend} label={trendLabel} />
      )}
    </div>
  )
}

interface MetricTrendProps {
  value: number
  label?: string
  className?: string
}

export function MetricTrend({ value, label, className }: MetricTrendProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  const Icon: LucideIcon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : Minus

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs",
        isPositive && "text-success",
        isNegative && "text-error",
        isNeutral && "text-muted-foreground",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span className="font-medium">
        {isPositive && "+"}
        {value.toFixed(1)}%
      </span>
      {label && (
        <span className="text-muted-foreground">{label}</span>
      )}
    </div>
  )
}

// Componente para exibir múltiplas métricas em grid
interface MetricGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function MetricGrid({
  children,
  columns = 4,
  className,
}: MetricGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  )
}

// Card de métrica individual
interface MetricCardProps {
  title: string
  value: number
  metric?: MetricType
  format?: "number" | "currency" | "percent"
  trend?: number
  trendLabel?: string
  icon?: LucideIcon
  className?: string
}

export function MetricCard({
  title,
  value,
  metric,
  format = "number",
  trend,
  trendLabel,
  icon: Icon,
  className,
}: MetricCardProps) {
  const color = metric ? getMetricColor(metric) : undefined

  return (
    <div
      className={cn(
        "metric-card card-interactive",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <MetricValue
            value={value}
            metric={metric}
            format={format}
            trend={trend}
            trendLabel={trendLabel}
            size="md"
          />
        </div>
        {Icon && (
          <div
            className="rounded-lg p-2"
            style={{
              backgroundColor: color ? `${color}15` : undefined,
              color: color,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
