"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Copy,
  Loader2,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  Layers,
  Megaphone,
  BarChart3,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  campaignsApi,
  type CampaignResponse,
  type CampaignInsights,
  type AdSetResponse,
  type AdResponse,
} from "@/lib/api"
import { AdSetTable } from "@/components/features/campaigns/ad-set-table"
import { AdTable } from "@/components/features/campaigns/ad-table"
import { BreakdownChart } from "@/components/features/analytics/breakdown-chart"
import type { CampaignStatus } from "@/types"

const statusConfig: Record<
  string,
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

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<CampaignResponse | null>(null)
  const [insights, setInsights] = useState<CampaignInsights | null>(null)
  const [adSets, setAdSets] = useState<AdSetResponse[]>([])
  const [allAds, setAllAds] = useState<AdResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAdSets, setLoadingAdSets] = useState(false)
  const [loadingAds, setLoadingAds] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [campaignData, insightsData] = await Promise.all([
          campaignsApi.getById(campaignId),
          campaignsApi.getInsights(campaignId).catch(() => null),
        ])
        setCampaign(campaignData)
        setInsights(insightsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar campanha")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [campaignId])

  const fetchAdSets = async () => {
    if (adSets.length > 0) return

    try {
      setLoadingAdSets(true)
      const response = await campaignsApi.getAdSets(campaignId)
      setAdSets(response.ad_sets)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar conjuntos")
    } finally {
      setLoadingAdSets(false)
    }
  }

  const fetchAllAds = async () => {
    if (allAds.length > 0) return

    try {
      setLoadingAds(true)
      // First ensure we have ad sets
      let currentAdSets = adSets
      if (adSets.length === 0) {
        const adSetsResponse = await campaignsApi.getAdSets(campaignId)
        currentAdSets = adSetsResponse.ad_sets
        setAdSets(currentAdSets)
      }

      // Fetch ads from all ad sets in parallel
      const adsPromises = currentAdSets.map((adSet) =>
        campaignsApi.getAds(campaignId, adSet.id).catch(() => ({ ads: [] }))
      )
      const adsResponses = await Promise.all(adsPromises)
      const ads = adsResponses.flatMap((r) => r.ads)
      setAllAds(ads)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar anúncios")
    } finally {
      setLoadingAds(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "adsets" && adSets.length === 0) {
      fetchAdSets()
    }
    if (value === "ads" && allAds.length === 0) {
      fetchAllAds()
    }
  }

  const handleToggleStatus = async () => {
    if (!campaign) return

    const newStatus: CampaignStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
    const previousStatus = campaign.status

    setCampaign({ ...campaign, status: newStatus })
    setUpdating(true)

    try {
      await campaignsApi.updateStatus(campaignId, newStatus)
    } catch (err) {
      setCampaign({ ...campaign, status: previousStatus })
      setError(err instanceof Error ? err.message : "Erro ao atualizar status")
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!campaign) return
    if (!window.confirm(`Deseja arquivar a campanha "${campaign.name}"?`)) return

    try {
      await campaignsApi.delete(campaignId)
      router.push("/campaigns")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao arquivar campanha")
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await campaignsApi.duplicate(campaignId)
      if (response.campaigns.length > 0) {
        router.push(`/campaigns/${response.campaigns[0].id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao duplicar campanha")
    }
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  }

  const formatBudget = (value: string | undefined) => {
    if (!value) return "-"
    return formatCurrency(parseInt(value) / 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error || "Campanha não encontrada"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge variant={statusConfig[campaign.status]?.variant || "outline"}>
                {statusConfig[campaign.status]?.label || campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {objectiveLabels[campaign.objective] || campaign.objective}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={updating || campaign.status === "ARCHIVED"}
          >
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
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={campaign.status === "ARCHIVED"}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Arquivar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="adsets" className="gap-2">
            <Layers className="h-4 w-4" />
            Conjuntos
            {adSets.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {adSets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ads" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Anúncios
            {allAds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {allAds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento Diário</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBudget(campaign.daily_budget)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento Vitalício</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBudget(campaign.lifetime_budget)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Objetivo</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {objectiveLabels[campaign.objective] || campaign.objective}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Criada em</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign.created_at
                    ? new Date(campaign.created_at).toLocaleDateString("pt-BR")
                    : "-"}
                </div>
              </CardContent>
            </Card>
          </div>

          {insights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Métricas (Últimos 7 dias)
                </CardTitle>
                <CardDescription>
                  {insights.date_start} - {insights.date_stop}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Gasto</p>
                    <p className="text-xl font-bold">{formatCurrency(insights.spend)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Impressões</p>
                    <p className="text-xl font-bold">{insights.impressions.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliques</p>
                    <p className="text-xl font-bold">{insights.clicks.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversões</p>
                    <p className="text-xl font-bold">{insights.conversions.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CTR</p>
                    <p className="text-xl font-bold">{insights.ctr.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPC</p>
                    <p className="text-xl font-bold">{formatCurrency(insights.cpc)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Informações da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">ID da Campanha</p>
                  <p className="font-mono text-sm">{campaign.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Meta ID</p>
                  <p className="font-mono text-sm">{campaign.meta_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Atualização</p>
                  <p>
                    {campaign.updated_at
                      ? new Date(campaign.updated_at).toLocaleString("pt-BR")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p>{statusConfig[campaign.status]?.label || campaign.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adsets" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {adSets.length} conjunto{adSets.length !== 1 && "s"} de anúncios
            </p>
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/ad-sets/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Conjunto
              </Link>
            </Button>
          </div>
          {loadingAdSets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AdSetTable campaignId={campaignId} adSets={adSets} />
          )}
        </TabsContent>

        <TabsContent value="ads" className="mt-6">
          {loadingAds ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {allAds.length} anúncio{allAds.length !== 1 && "s"} encontrado{allAds.length !== 1 && "s"}
                  {" "}(ordenados por gasto)
                </p>
              </div>
              <AdTable ads={allAds} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BreakdownChart
              objectId={campaign.meta_id}
              objectType="campaign"
              datePreset="last_7d"
            />
            <BreakdownChart
              objectId={campaign.meta_id}
              objectType="campaign"
              datePreset="last_30d"
            />
          </div>
          <div className="mt-6 text-sm text-muted-foreground text-center">
            Selecione diferentes dimensões e métricas nos gráficos para explorar os dados
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
