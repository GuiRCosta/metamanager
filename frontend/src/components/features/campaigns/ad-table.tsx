"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Image, Video, LayoutGrid, FileQuestion } from "lucide-react"
import type { AdResponse } from "@/lib/api"

interface AdTableProps {
  ads: AdResponse[]
  compact?: boolean
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  ACTIVE: { label: "Ativo", variant: "default" },
  PAUSED: { label: "Pausado", variant: "secondary" },
  ARCHIVED: { label: "Arquivado", variant: "outline" },
  DELETED: { label: "Excluído", variant: "destructive" },
}

function getCreativeType(objectType?: string): { label: string; icon: React.ReactNode } {
  switch (objectType) {
    case "VIDEO":
      return { label: "Vídeo", icon: <Video className="h-4 w-4" /> }
    case "SHARE":
    case "IMAGE":
      return { label: "Imagem", icon: <Image className="h-4 w-4" /> }
    case "CAROUSEL":
    case "MULTI_SHARE":
      return { label: "Carrossel", icon: <LayoutGrid className="h-4 w-4" /> }
    default:
      return { label: objectType || "Desconhecido", icon: <FileQuestion className="h-4 w-4" /> }
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value)
}

export function AdTable({ ads, compact = false }: AdTableProps) {
  if (ads.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        Nenhum anúncio encontrado.
      </div>
    )
  }

  // Sort by spend (best performing first)
  const sortedAds = [...ads].sort((a, b) => {
    const spendA = a.insights?.spend || 0
    const spendB = b.insights?.spend || 0
    return spendB - spendA
  })

  return (
    <div className={compact ? "" : "rounded-md border"}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Tipo</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Gasto</TableHead>
            <TableHead className="text-right">Impressões</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Conversões</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAds.map((ad, index) => {
            const creativeType = getCreativeType(ad.creative?.object_type)
            const insights = ad.insights

            return (
              <TableRow key={ad.id}>
                <TableCell>
                  <div
                    className="flex items-center justify-center"
                    title={creativeType.label}
                  >
                    {ad.creative?.thumbnail_url ? (
                      <img
                        src={ad.creative.thumbnail_url}
                        alt={ad.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        {creativeType.icon}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{ad.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {creativeType.icon}
                      {creativeType.label}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[ad.effective_status || ad.status]?.variant || "outline"}>
                    {statusConfig[ad.effective_status || ad.status]?.label || ad.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {insights ? formatCurrency(insights.spend) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {insights ? formatNumber(insights.impressions) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {insights ? formatNumber(insights.clicks) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {insights ? `${insights.ctr.toFixed(2)}%` : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {insights ? (
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{formatNumber(insights.conversions)}</span>
                      {(insights.leads > 0 || insights.purchases > 0) && (
                        <span className="text-xs text-muted-foreground">
                          {insights.leads > 0 && `${insights.leads} leads`}
                          {insights.leads > 0 && insights.purchases > 0 && ", "}
                          {insights.purchases > 0 && `${insights.purchases} compras`}
                        </span>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
