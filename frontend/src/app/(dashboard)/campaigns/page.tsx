"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CampaignTable } from "@/components/features/campaigns/campaign-table"
import type { Campaign, CampaignStatus } from "@/types"

// Mock data - TODO: Replace with API call
const mockCampaigns: Campaign[] = [
  {
    id: "1",
    metaId: "123456789",
    name: "Promoção Black Friday",
    objective: "OUTCOME_SALES",
    status: "ACTIVE",
    dailyBudget: 150,
    lifetimeBudget: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    metaId: "987654321",
    name: "Leads Janeiro",
    objective: "OUTCOME_LEADS",
    status: "ACTIVE",
    dailyBudget: 80,
    lifetimeBudget: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    metaId: "456789123",
    name: "Awareness Marca",
    objective: "OUTCOME_AWARENESS",
    status: "PAUSED",
    dailyBudget: 50,
    lifetimeBudget: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    metaId: "789123456",
    name: "Tráfego Blog",
    objective: "OUTCOME_TRAFFIC",
    status: "ACTIVE",
    dailyBudget: 30,
    lifetimeBudget: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    metaId: "321654987",
    name: "Engajamento Redes",
    objective: "OUTCOME_ENGAGEMENT",
    status: "PAUSED",
    dailyBudget: 25,
    lifetimeBudget: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [campaigns, setCampaigns] = useState(mockCampaigns)

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = (id: string, status: CampaignStatus) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    )
  }

  const handleDelete = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground">
            Gerencie suas campanhas do Meta Ads
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Campanha
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativas</SelectItem>
            <SelectItem value="PAUSED">Pausadas</SelectItem>
            <SelectItem value="ARCHIVED">Arquivadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CampaignTable
        campaigns={filteredCampaigns}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  )
}
