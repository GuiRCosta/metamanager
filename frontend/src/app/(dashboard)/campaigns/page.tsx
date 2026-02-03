"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Filter, RefreshCw, Loader2, Archive, Play, Pause, Trash2, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { CampaignTable } from "@/components/features/campaigns/campaign-table"
import { campaignsApi, type MetaCampaign } from "@/lib/api"
import { useAdAccount } from "@/contexts/ad-account-context"
import type { Campaign, CampaignStatus } from "@/types"

function mapMetaCampaignToCampaign(meta: MetaCampaign): Campaign {
  return {
    id: meta.id,
    metaId: meta.id,
    name: meta.name,
    objective: meta.objective as Campaign["objective"],
    status: meta.status as CampaignStatus,
    dailyBudget: meta.daily_budget ? parseInt(meta.daily_budget) / 100 : null,
    lifetimeBudget: meta.lifetime_budget ? parseInt(meta.lifetime_budget) / 100 : null,
    createdAt: meta.created_time,
    updatedAt: meta.updated_time,
  }
}

// Utility to add delay between API calls to avoid rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Delay between bulk API calls (in ms) - Meta API allows ~200 calls/hour
const BULK_API_DELAY = 500

export default function CampaignsPage() {
  const { selectedAccount, loading: accountLoading } = useAdAccount()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [includeArchived, setIncludeArchived] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, action: "" })

  // Duplicate dialog state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateCampaignId, setDuplicateCampaignId] = useState<string | null>(null)
  const [duplicateCount, setDuplicateCount] = useState(1)
  const [duplicating, setDuplicating] = useState(false)
  const [duplicateProgress, setDuplicateProgress] = useState({ current: 0, total: 0 })

  // Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archiveCampaignId, setArchiveCampaignId] = useState<string | null>(null)
  const [archiveCampaignName, setArchiveCampaignName] = useState("")
  const [archiving, setArchiving] = useState(false)

  const fetchCampaigns = async (withArchived?: boolean) => {
    if (!selectedAccount) return

    const shouldIncludeArchived = withArchived ?? includeArchived

    try {
      setLoading(true)
      setError(null)
      const response = await campaignsApi.sync(selectedAccount.account_id, shouldIncludeArchived)
      const mapped = response.campaigns.map(mapMetaCampaignToCampaign)
      setCampaigns(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar campanhas")
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!selectedAccount) return

    try {
      setSyncing(true)
      setError(null)
      const response = await campaignsApi.sync(selectedAccount.account_id, includeArchived)
      const mapped = response.campaigns.map(mapMetaCampaignToCampaign)
      setCampaigns(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar")
    } finally {
      setSyncing(false)
    }
  }

  const handleToggleArchived = (checked: boolean) => {
    setIncludeArchived(checked)
    fetchCampaigns(checked)
  }

  // Fetch campaigns when selected account changes
  useEffect(() => {
    if (accountLoading) return

    if (!selectedAccount) {
      setLoading(false)
      return
    }

    fetchCampaigns()
  }, [selectedAccount?.account_id, accountLoading])

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    // Atualização otimista - atualiza a UI imediatamente
    const previousCampaigns = campaigns
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    )

    try {
      await campaignsApi.updateStatus(id, status as "ACTIVE" | "PAUSED")
    } catch (err) {
      // Reverte em caso de erro
      setCampaigns(previousCampaigns)
      setError(err instanceof Error ? err.message : "Erro ao atualizar status")
    }
  }

  const handleDelete = (id: string) => {
    const campaign = campaigns.find((c) => c.id === id)
    if (!campaign) return

    setArchiveCampaignId(id)
    setArchiveCampaignName(campaign.name)
    setArchiveDialogOpen(true)
  }

  const handleConfirmArchive = async () => {
    if (!archiveCampaignId) return

    // Atualização otimista
    const previousCampaigns = campaigns
    setCampaigns((prev) => prev.filter((c) => c.id !== archiveCampaignId))

    try {
      setArchiving(true)
      await campaignsApi.delete(archiveCampaignId)
      setArchiveDialogOpen(false)
      setArchiveCampaignId(null)
      setArchiveCampaignName("")
    } catch (err) {
      // Reverte em caso de erro
      setCampaigns(previousCampaigns)
      setError(err instanceof Error ? err.message : "Erro ao arquivar campanha")
    } finally {
      setArchiving(false)
    }
  }

  const handleDuplicate = (id: string) => {
    setDuplicateCampaignId(id)
    setDuplicateCount(1)
    setDuplicateDialogOpen(true)
  }

  const handleConfirmDuplicate = async () => {
    if (!duplicateCampaignId || !selectedAccount) return

    try {
      setDuplicating(true)
      setError(null)
      setDuplicateProgress({ current: 0, total: duplicateCount })

      const allNewCampaigns: Campaign[] = []

      // Create copies one by one for real progress tracking
      for (let i = 0; i < duplicateCount; i++) {
        const response = await campaignsApi.duplicate(
          duplicateCampaignId,
          1, // One copy at a time
          selectedAccount.account_id
        )

        const newCampaigns = response.campaigns.map((c) =>
          mapMetaCampaignToCampaign({
            id: c.id,
            name: c.name,
            objective: c.objective,
            status: c.status,
            daily_budget: c.daily_budget,
            lifetime_budget: c.lifetime_budget,
            created_time: c.created_at || new Date().toISOString(),
            updated_time: c.updated_at || new Date().toISOString(),
          })
        )

        allNewCampaigns.push(...newCampaigns)
        setDuplicateProgress({ current: i + 1, total: duplicateCount })

        // Small delay to avoid rate limiting
        if (i < duplicateCount - 1) {
          await sleep(300)
        }
      }

      setCampaigns((prev) => [...allNewCampaigns, ...prev])
      setDuplicateDialogOpen(false)
      setDuplicateCampaignId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao duplicar campanha")
    } finally {
      setDuplicating(false)
      setDuplicateProgress({ current: 0, total: 0 })
    }
  }

  // Bulk Actions with progress tracking
  const handleBulkPause = async () => {
    if (!window.confirm(`Deseja pausar ${selectedIds.length} campanhas?`)) return

    setBulkActionLoading(true)
    setBulkProgress({ current: 0, total: selectedIds.length, action: "Pausando" })
    const previousCampaigns = campaigns
    let completed = 0

    try {
      for (const id of selectedIds) {
        await campaignsApi.updateStatus(id, "PAUSED")
        completed++
        setBulkProgress({ current: completed, total: selectedIds.length, action: "Pausando" })
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "PAUSED" as CampaignStatus } : c))
        )
        // Delay to avoid rate limiting
        if (completed < selectedIds.length) {
          await sleep(BULK_API_DELAY)
        }
      }
      setSelectedIds([])
    } catch (err) {
      setCampaigns(previousCampaigns)
      setError(err instanceof Error ? err.message : "Erro ao pausar campanhas")
    } finally {
      setBulkActionLoading(false)
      setBulkProgress({ current: 0, total: 0, action: "" })
    }
  }

  const handleBulkActivate = async () => {
    if (!window.confirm(`Deseja ativar ${selectedIds.length} campanhas?`)) return

    setBulkActionLoading(true)
    setBulkProgress({ current: 0, total: selectedIds.length, action: "Ativando" })
    const previousCampaigns = campaigns
    let completed = 0

    try {
      for (const id of selectedIds) {
        await campaignsApi.updateStatus(id, "ACTIVE")
        completed++
        setBulkProgress({ current: completed, total: selectedIds.length, action: "Ativando" })
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "ACTIVE" as CampaignStatus } : c))
        )
        // Delay to avoid rate limiting
        if (completed < selectedIds.length) {
          await sleep(BULK_API_DELAY)
        }
      }
      setSelectedIds([])
    } catch (err) {
      setCampaigns(previousCampaigns)
      setError(err instanceof Error ? err.message : "Erro ao ativar campanhas")
    } finally {
      setBulkActionLoading(false)
      setBulkProgress({ current: 0, total: 0, action: "" })
    }
  }

  const handleBulkArchive = async () => {
    if (!window.confirm(`Deseja arquivar ${selectedIds.length} campanhas?`)) return

    setBulkActionLoading(true)
    setBulkProgress({ current: 0, total: selectedIds.length, action: "Arquivando" })
    const previousCampaigns = campaigns
    let completed = 0

    try {
      for (const id of selectedIds) {
        await campaignsApi.delete(id)
        completed++
        setBulkProgress({ current: completed, total: selectedIds.length, action: "Arquivando" })
        setCampaigns((prev) => prev.filter((c) => c.id !== id))
        // Delay to avoid rate limiting
        if (completed < selectedIds.length) {
          await sleep(BULK_API_DELAY)
        }
      }
      setSelectedIds([])
    } catch (err) {
      setCampaigns(previousCampaigns)
      setError(err instanceof Error ? err.message : "Erro ao arquivar campanhas")
    } finally {
      setBulkActionLoading(false)
      setBulkProgress({ current: 0, total: 0, action: "" })
    }
  }

  const handleBulkDuplicate = async () => {
    if (!selectedAccount) return
    if (!window.confirm(`Deseja duplicar ${selectedIds.length} campanhas?`)) return

    setBulkActionLoading(true)
    setBulkProgress({ current: 0, total: selectedIds.length, action: "Duplicando" })
    let completed = 0

    try {
      for (const id of selectedIds) {
        const response = await campaignsApi.duplicate(id, 1, selectedAccount.account_id)
        const newCampaigns = response.campaigns.map((c) =>
          mapMetaCampaignToCampaign({
            id: c.id,
            name: c.name,
            objective: c.objective,
            status: c.status,
            daily_budget: c.daily_budget,
            lifetime_budget: c.lifetime_budget,
            created_time: c.created_at || new Date().toISOString(),
            updated_time: c.updated_at || new Date().toISOString(),
          })
        )
        completed++
        setBulkProgress({ current: completed, total: selectedIds.length, action: "Duplicando" })
        setCampaigns((prev) => [...newCampaigns, ...prev])
        // Delay to avoid rate limiting
        if (completed < selectedIds.length) {
          await sleep(BULK_API_DELAY)
        }
      }
      setSelectedIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao duplicar campanhas")
    } finally {
      setBulkActionLoading(false)
      setBulkProgress({ current: 0, total: 0, action: "" })
    }
  }

  const clearSelection = () => setSelectedIds([])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground">
            {selectedAccount ? (
              <>Conta: <span className="font-medium">{selectedAccount.name}</span></>
            ) : (
              "Selecione uma conta de anúncios"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing || !selectedAccount}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar
          </Button>
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Link>
          </Button>
        </div>
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
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Archive className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="include-archived" className="text-sm cursor-pointer">
            Arquivadas
          </Label>
          <Switch
            id="include-archived"
            checked={includeArchived}
            onCheckedChange={handleToggleArchived}
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length >= 2 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedIds.length} campanha{selectedIds.length > 1 ? "s" : ""} selecionada{selectedIds.length > 1 ? "s" : ""}
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection} disabled={bulkActionLoading}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkActivate}
                disabled={bulkActionLoading}
              >
                <Play className="mr-2 h-4 w-4" />
                Ativar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkPause}
                disabled={bulkActionLoading}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDuplicate}
                disabled={bulkActionLoading}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                disabled={bulkActionLoading}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Arquivar
              </Button>
            </div>
          </div>
          {/* Progress Bar */}
          {bulkActionLoading && bulkProgress.total > 0 && (
            <div className="rounded-lg border bg-background px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {bulkProgress.action} campanhas...
                </span>
                <span className="font-medium">
                  {bulkProgress.current} / {bulkProgress.total}
                </span>
              </div>
              <Progress
                value={(bulkProgress.current / bulkProgress.total) * 100}
                className="h-2"
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {loading || accountLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {filteredCampaigns.length} campanha{filteredCampaigns.length !== 1 ? "s" : ""} encontrada{filteredCampaigns.length !== 1 ? "s" : ""}
          </div>
          <CampaignTable
            campaigns={filteredCampaigns}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </>
      )}

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Campanha</DialogTitle>
            <DialogDescription>
              Escolha quantas cópias deseja criar desta campanha.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {duplicating ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando {duplicateCount} {duplicateCount === 1 ? "cópia" : "cópias"}...
                  </span>
                  <span className="font-medium">
                    {duplicateProgress.current} / {duplicateProgress.total}
                  </span>
                </div>
                <Progress
                  value={duplicateProgress.total > 0 ? (duplicateProgress.current / duplicateProgress.total) * 100 : 0}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {duplicateProgress.current < duplicateProgress.total
                    ? `Criando cópia ${duplicateProgress.current + 1} de ${duplicateProgress.total}...`
                    : "Finalizando..."}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="duplicate-count" className="text-sm font-medium">
                    Número de cópias
                  </Label>
                  <Select
                    value={duplicateCount.toString()}
                    onValueChange={(value) => setDuplicateCount(parseInt(value))}
                  >
                    <SelectTrigger id="duplicate-count" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} {n === 1 ? "cópia" : "cópias"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  As campanhas serão criadas como pausadas.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateDialogOpen(false)}
              disabled={duplicating}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmDuplicate} disabled={duplicating}>
              {duplicating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Duplicando...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar Campanha</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja arquivar esta campanha?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              A campanha <strong>&quot;{archiveCampaignName}&quot;</strong> será arquivada.
              Você pode restaurá-la posteriormente no Gerenciador de Anúncios do Meta.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveDialogOpen(false)}
              disabled={archiving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmArchive}
              disabled={archiving}
            >
              {archiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Arquivando...
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
