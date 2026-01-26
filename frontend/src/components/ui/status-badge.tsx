import { cn } from "@/lib/utils"
import { colors, getCampaignStatusColor } from "@/lib/design-tokens"

type Status = "active" | "paused" | "archived" | "draft"

interface StatusBadgeProps {
  status: Status | string
  showDot?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const statusLabels: Record<Status, string> = {
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
  draft: "Rascunho",
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
}

export function StatusBadge({
  status,
  showDot = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as Status
  const label = statusLabels[normalizedStatus] || status

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        `status-badge-${normalizedStatus}`,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: getCampaignStatusColor(normalizedStatus) }}
        />
      )}
      {label}
    </span>
  )
}

// Variant para uso em tabelas
export function StatusDot({ status }: { status: Status | string }) {
  const normalizedStatus = status.toLowerCase() as Status

  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: getCampaignStatusColor(normalizedStatus) }}
      title={statusLabels[normalizedStatus] || status}
    />
  )
}
