"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Play,
  Pause,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Copy,
} from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Campaign, CampaignStatus } from "@/types"

interface CampaignTableProps {
  campaigns: Campaign[]
  onStatusChange?: (id: string, status: CampaignStatus) => void
  onDelete?: (id: string) => void
}

const statusConfig: Record<
  CampaignStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  ACTIVE: { label: "Ativa", variant: "default" },
  PAUSED: { label: "Pausada", variant: "secondary" },
  ARCHIVED: { label: "Arquivada", variant: "outline" },
  DRAFT: { label: "Rascunho", variant: "outline" },
}

const objectiveLabels: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Vendas",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_AWARENESS: "Reconhecimento",
  OUTCOME_APP_PROMOTION: "Promoção de App",
}

export function CampaignTable({
  campaigns,
  onStatusChange,
  onDelete,
}: CampaignTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelectAll = () => {
    if (selectedIds.length === campaigns.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(campaigns.map((c) => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleToggleStatus = (campaign: Campaign) => {
    if (!onStatusChange) return
    const newStatus: CampaignStatus =
      campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
    onStatusChange(campaign.id, newStatus)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  selectedIds.length === campaigns.length && campaigns.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Objetivo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Orçamento Diário</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhuma campanha encontrada.
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(campaign.id)}
                    onCheckedChange={() => toggleSelect(campaign.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="font-medium hover:underline"
                  >
                    {campaign.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {objectiveLabels[campaign.objective] || campaign.objective}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[campaign.status].variant}>
                    {statusConfig[campaign.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {campaign.dailyBudget
                    ? `R$ ${campaign.dailyBudget.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/campaigns/${campaign.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(campaign)}>
                        {campaign.status === "ACTIVE" ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete?.(campaign.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
