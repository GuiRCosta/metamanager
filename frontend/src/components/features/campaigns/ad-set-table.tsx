"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, Loader2, Plus, Play, Pause } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdTable } from "./ad-table"
import { campaignsApi, type AdSetResponse, type AdResponse } from "@/lib/api"

interface AdSetTableProps {
  campaignId: string
  adSets: AdSetResponse[]
  adAccountId?: string
  onStatusChange?: (adSetId: string, newStatus: string) => void
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

export function AdSetTable({ campaignId, adSets, adAccountId, onStatusChange }: AdSetTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [adsMap, setAdsMap] = useState<Record<string, AdResponse[]>>({})
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({})

  const toggleStatus = async (adSetId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"

    setTogglingIds((prev) => new Set(prev).add(adSetId))
    setLocalStatuses((prev) => ({ ...prev, [adSetId]: newStatus }))

    try {
      await campaignsApi.updateAdSet(campaignId, adSetId, { status: newStatus }, adAccountId)
      toast.success(`Conjunto ${newStatus === "ACTIVE" ? "ativado" : "pausado"} com sucesso!`)
      onStatusChange?.(adSetId, newStatus)
    } catch (error) {
      setLocalStatuses((prev) => ({ ...prev, [adSetId]: currentStatus }))
      toast.error("Erro ao alterar status")
    } finally {
      setTogglingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(adSetId)
        return newSet
      })
    }
  }

  const getStatus = (adSet: AdSetResponse) => localStatuses[adSet.id] || adSet.status

  const toggleExpand = async (adSetId: string) => {
    const newExpanded = new Set(expandedIds)

    if (newExpanded.has(adSetId)) {
      newExpanded.delete(adSetId)
      setExpandedIds(newExpanded)
      return
    }

    newExpanded.add(adSetId)
    setExpandedIds(newExpanded)

    if (!adsMap[adSetId]) {
      setLoadingIds((prev) => new Set(prev).add(adSetId))
      try {
        const response = await campaignsApi.getAds(campaignId, adSetId)
        setAdsMap((prev) => ({ ...prev, [adSetId]: response.ads }))
      } catch (error) {
        setAdsMap((prev) => ({ ...prev, [adSetId]: [] }))
      } finally {
        setLoadingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(adSetId)
          return newSet
        })
      }
    }
  }

  const formatBudget = (value: string | undefined) => {
    if (!value) return "-"
    return `R$ ${(parseInt(value) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Orçamento Diário</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adSets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhum conjunto de anúncios encontrado.
              </TableCell>
            </TableRow>
          ) : (
            adSets.map((adSet) => (
              <>
                <TableRow key={adSet.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleExpand(adSet.id)}
                    >
                      {loadingIds.has(adSet.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : expandedIds.has(adSet.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{adSet.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[getStatus(adSet)]?.variant || "outline"}>
                      {statusConfig[getStatus(adSet)]?.label || getStatus(adSet)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatBudget(adSet.daily_budget)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleStatus(adSet.id, getStatus(adSet))}
                        disabled={togglingIds.has(adSet.id) || getStatus(adSet) === "ARCHIVED"}
                        title={getStatus(adSet) === "ACTIVE" ? "Pausar" : "Ativar"}
                      >
                        {togglingIds.has(adSet.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : getStatus(adSet) === "ACTIVE" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/campaigns/${campaignId}/ad-sets/${adSet.id}/ads/new`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Anúncio
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedIds.has(adSet.id) && (
                  <TableRow key={`${adSet.id}-ads`}>
                    <TableCell colSpan={5} className="bg-muted/50 p-4">
                      {loadingIds.has(adSet.id) ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <AdTable ads={adsMap[adSet.id] || []} />
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
