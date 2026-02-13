"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  TrendingUp,
  BarChart3,
  Loader2,
  Users,
  MousePointerClick,
  DollarSign,
  Eye,
  Video,
  Target,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Megaphone,
  Image,
  LayoutGrid,
  FileQuestion,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  dashboardApi,
  type DashboardMetrics,
  type CampaignInsightsItem,
  type DailyMetric,
  type AdSetInsightsItem,
  type AdInsightsItem,
} from "@/lib/api"
import { useAdAccount } from "@/contexts/ad-account-context"
import { BreakdownChart } from "@/components/features/analytics/breakdown-chart"

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  ACTIVE: { label: "Ativa", className: "bg-green-500 text-white hover:bg-green-600" },
  PAUSED: { label: "Pausada", className: "bg-yellow-500 text-white hover:bg-yellow-600" },
  ARCHIVED: { label: "Arquivada", className: "bg-gray-400 text-white hover:bg-gray-500" },
}

const objectiveLabels: Record<string, string> = {
  OUTCOME_TRAFFIC: "Tráfego",
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Vendas",
  OUTCOME_ENGAGEMENT: "Engajamento",
  OUTCOME_AWARENESS: "Reconhecimento",
  OUTCOME_APP_PROMOTION: "Promoção de App",
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { selectedAccount, loading: accountLoading } = useAdAccount()
  const [period, setPeriod] = useState("last_7d")
  const [activeTab, setActiveTab] = useState("overview")
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [campaignsInsights, setCampaignsInsights] = useState<CampaignInsightsItem[]>([])
  const [trendsData, setTrendsData] = useState<DailyMetric[]>([])
  const [adSetsInsights, setAdSetsInsights] = useState<AdSetInsightsItem[]>([])
  const [adsInsights, setAdsInsights] = useState<AdInsightsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [loadingAdSets, setLoadingAdSets] = useState(false)
  const [loadingAds, setLoadingAds] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    if (!selectedAccount) return

    try {
      setLoading(true)
      setError(null)
      const response = await dashboardApi.getMetrics(selectedAccount.account_id, period)
      setMetrics(response.metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar métricas")
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaignsInsights = async (force = false) => {
    if (!selectedAccount) return
    if (loadingCampaigns) return // Prevent duplicate calls
    if (!force && campaignsInsights.length > 0) return

    try {
      setLoadingCampaigns(true)
      setError(null)
      const response = await dashboardApi.getCampaignsInsights(
        selectedAccount.account_id,
        period
      )
      setCampaignsInsights(response.campaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar campanhas")
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const fetchTrends = async (force = false) => {
    if (!selectedAccount) return
    if (loadingTrends) return
    if (!force && trendsData.length > 0) return

    try {
      setLoadingTrends(true)
      setError(null)
      const response = await dashboardApi.getTrends(selectedAccount.account_id, period)
      setTrendsData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar tendências")
    } finally {
      setLoadingTrends(false)
    }
  }

  const fetchAdSetsInsights = async (force = false) => {
    if (!selectedAccount) return
    if (loadingAdSets) return
    if (!force && adSetsInsights.length > 0) return

    try {
      setLoadingAdSets(true)
      setError(null)
      const response = await dashboardApi.getAdSetsInsights(
        selectedAccount.account_id,
        period
      )
      setAdSetsInsights(response.ad_sets)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar conjuntos")
    } finally {
      setLoadingAdSets(false)
    }
  }

  const fetchAdsInsights = async (force = false) => {
    if (!selectedAccount) return
    if (loadingAds) return
    if (!force && adsInsights.length > 0) return

    try {
      setLoadingAds(true)
      setError(null)
      const response = await dashboardApi.getAdsInsights(
        selectedAccount.account_id,
        period
      )
      setAdsInsights(response.ads)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar anúncios")
    } finally {
      setLoadingAds(false)
    }
  }

  // Refetch for active tab when period changes
  const refetchActiveTab = () => {
    if (activeTab === "campaigns" || activeTab === "breakdown") {
      fetchCampaignsInsights(true)
    } else if (activeTab === "trends") {
      fetchTrends(true)
    } else if (activeTab === "adsets") {
      fetchAdSetsInsights(true)
    } else if (activeTab === "ads") {
      fetchAdsInsights(true)
    }
  }

  useEffect(() => {
    if (accountLoading) return

    if (!selectedAccount) {
      // No account selected - stop loading
      setLoading(false)
      return
    }

    fetchMetrics()
    // Reset data when period changes
    setCampaignsInsights([])
    setTrendsData([])
    setAdSetsInsights([])
    setAdsInsights([])
    // Refetch for active tab after state reset
    setTimeout(() => refetchActiveTab(), 0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.account_id, accountLoading, period])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "campaigns" && campaignsInsights.length === 0 && !loadingCampaigns) {
      fetchCampaignsInsights()
    }
    if (value === "breakdown" && campaignsInsights.length === 0 && !loadingCampaigns) {
      fetchCampaignsInsights()
    }
    if (value === "trends" && trendsData.length === 0 && !loadingTrends) {
      fetchTrends()
    }
    if (value === "adsets" && adSetsInsights.length === 0 && !loadingAdSets) {
      fetchAdSetsInsights()
    }
    if (value === "ads" && adsInsights.length === 0 && !loadingAds) {
      fetchAdsInsights()
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  }

  if (loading || accountLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!selectedAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Selecione uma conta de anúncios</p>
        </div>
        <div className="flex h-[30vh] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            Selecione uma conta de anúncios no menu superior para ver as métricas
          </p>
        </div>
      </div>
    )
  }

  const displayMetrics = metrics || {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    reach: 0,
    frequency: 0,
    leads: 0,
    purchases: 0,
    landing_page_views: 0,
    video_views: 0,
    roas: 0,
    active_campaigns: 0,
    paused_campaigns: 0,
    archived_campaigns: 0,
    total_campaigns: 0,
  }

  // Calculate max spend for bar chart scaling
  const maxSpend = Math.max(...campaignsInsights.map((c) => c.spend), 1)
  const maxTrendSpend = Math.max(...trendsData.map((d) => d.spend), 1)
  const maxAdSetSpend = Math.max(...adSetsInsights.map((a) => a.spend), 1)
  const maxAdSpend = Math.max(...adsInsights.map((a) => a.spend), 1)

  const getCreativeTypeInfo = (type?: string) => {
    switch (type) {
      case "VIDEO":
        return { label: "Vídeo", icon: <Video className="h-4 w-4" /> }
      case "SHARE":
      case "IMAGE":
        return { label: "Imagem", icon: <Image className="h-4 w-4" /> }
      case "CAROUSEL":
      case "MULTI_SHARE":
        return { label: "Carrossel", icon: <LayoutGrid className="h-4 w-4" /> }
      default:
        return { label: type || "Outro", icon: <FileQuestion className="h-4 w-4" /> }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            {selectedAccount ? (
              <>
                Conta: <span className="font-medium">{selectedAccount.name}</span>
              </>
            ) : (
              "Selecione uma conta de anúncios"
            )}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
            <SelectItem value="last_14d">Últimos 14 dias</SelectItem>
            <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayMetrics.spend)}
            </div>
            <p className="text-xs text-muted-foreground">
              CPM: {formatCurrency(displayMetrics.cpm)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayMetrics.roas.toFixed(2)}x
            </div>
            <p className="text-xs text-muted-foreground">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(displayMetrics.reach)}
            </div>
            <p className="text-xs text-muted-foreground">
              Frequência: {displayMetrics.frequency.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(displayMetrics.conversions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {displayMetrics.leads} leads, {displayMetrics.purchases} compras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Engajamento */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(displayMetrics.impressions)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(displayMetrics.clicks)}
            </div>
            <p className="text-xs text-muted-foreground">
              CTR: {displayMetrics.ctr.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPC</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayMetrics.cpc)}
            </div>
            <p className="text-xs text-muted-foreground">Custo por clique</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Visualizações de Vídeo
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(displayMetrics.video_views)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="adsets" className="gap-1">
            <Layers className="h-4 w-4" />
            Conjuntos
          </TabsTrigger>
          <TabsTrigger value="ads" className="gap-1">
            <Megaphone className="h-4 w-4" />
            Anúncios
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="gap-1">
            <BarChart3 className="h-4 w-4" />
            Breakdown
          </TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversões Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Leads</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatNumber(displayMetrics.leads)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Compras</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatNumber(displayMetrics.purchases)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Visualizações de Página
                        </p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatNumber(displayMetrics.landing_page_views)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Visualizações de Vídeo
                        </p>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatNumber(displayMetrics.video_views)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Ativas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {displayMetrics.active_campaigns}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Pausadas</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {displayMetrics.paused_campaigns}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Arquivadas</p>
                      <p className="text-2xl font-bold text-gray-500">
                        {displayMetrics.archived_campaigns}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">
                        {displayMetrics.total_campaigns}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Custo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Custo por Clique (CPC)
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(displayMetrics.cpc)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Custo por Mil (CPM)
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(displayMetrics.cpm)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Taxa de Cliques (CTR)
                  </p>
                  <p className="text-xl font-bold">
                    {displayMetrics.ctr.toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Frequência Média</p>
                  <p className="text-xl font-bold">
                    {displayMetrics.frequency.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Campanhas por Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaignsInsights.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  Nenhuma campanha encontrada
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual Bar Chart */}
                  <div className="space-y-3">
                    {campaignsInsights.slice(0, 10).map((campaign, index) => (
                      <div key={campaign.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground w-6">
                              #{index + 1}
                            </span>
                            <span
                              className="font-medium truncate max-w-[200px] cursor-pointer hover:underline"
                              onClick={() => router.push(`/campaigns/${campaign.id}`)}
                            >
                              {campaign.name}
                            </span>
                            <Badge
                              className={`${statusConfig[campaign.status]?.className || "bg-gray-400 text-white"} text-xs`}
                            >
                              {statusConfig[campaign.status]?.label ||
                                campaign.status}
                            </Badge>
                          </div>
                          <span className="font-bold">
                            {formatCurrency(campaign.spend)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${(campaign.spend / maxSpend) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground pl-8">
                          <span>{formatNumber(campaign.impressions)} impr.</span>
                          <span>{formatNumber(campaign.clicks)} cliques</span>
                          <span>CTR {campaign.ctr.toFixed(2)}%</span>
                          <span>{formatNumber(campaign.conversions)} conv.</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Data Table */}
                  <div className="mt-8 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campanha</TableHead>
                          <TableHead>Objetivo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Gasto</TableHead>
                          <TableHead className="text-right">Impressões</TableHead>
                          <TableHead className="text-right">Cliques</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">CPC</TableHead>
                          <TableHead className="text-right">Conversões</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignsInsights.map((campaign) => (
                          <TableRow
                            key={campaign.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {campaign.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {objectiveLabels[campaign.objective] ||
                                campaign.objective}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  statusConfig[campaign.status]?.className || "bg-gray-400 text-white"
                                }
                              >
                                {statusConfig[campaign.status]?.label ||
                                  campaign.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(campaign.spend)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(campaign.impressions)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(campaign.clicks)}
                            </TableCell>
                            <TableCell className="text-right">
                              {campaign.ctr.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(campaign.cpc)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(campaign.conversions)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adsets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Conjuntos por Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAdSets ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : adSetsInsights.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  Nenhum conjunto de anúncios encontrado
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual Bar Chart */}
                  <div className="space-y-3">
                    {adSetsInsights.slice(0, 10).map((adset, index) => (
                      <div key={adset.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground w-6">
                              #{index + 1}
                            </span>
                            <span className="font-medium truncate max-w-[200px]">
                              {adset.name}
                            </span>
                            <Badge
                              className={`${statusConfig[adset.status]?.className || "bg-gray-400 text-white"} text-xs`}
                            >
                              {statusConfig[adset.status]?.label || adset.status}
                            </Badge>
                          </div>
                          <span className="font-bold">
                            {formatCurrency(adset.spend)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${(adset.spend / maxAdSetSpend) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground pl-8">
                          <span className="text-muted-foreground/70">
                            {adset.campaign_name}
                          </span>
                          <span>{formatNumber(adset.impressions)} impr.</span>
                          <span>{formatNumber(adset.clicks)} cliques</span>
                          <span>CTR {adset.ctr.toFixed(2)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Data Table */}
                  <div className="mt-8 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conjunto</TableHead>
                          <TableHead>Campanha</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Gasto</TableHead>
                          <TableHead className="text-right">Impressões</TableHead>
                          <TableHead className="text-right">Cliques</TableHead>
                          <TableHead className="text-right">Alcance</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Conversões</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adSetsInsights.map((adset) => (
                          <TableRow key={adset.id}>
                            <TableCell className="font-medium max-w-[180px] truncate">
                              {adset.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[150px] truncate">
                              {adset.campaign_name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  statusConfig[adset.status]?.className || "bg-gray-400 text-white"
                                }
                              >
                                {statusConfig[adset.status]?.label || adset.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(adset.spend)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(adset.impressions)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(adset.clicks)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(adset.reach)}
                            </TableCell>
                            <TableCell className="text-right">
                              {adset.ctr.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(adset.conversions)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Anúncios por Gasto</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAds ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : adsInsights.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  Nenhum anúncio encontrado
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Visual Bar Chart */}
                  <div className="space-y-3">
                    {adsInsights.slice(0, 10).map((ad, index) => {
                      const creativeInfo = getCreativeTypeInfo(ad.creative_type)
                      return (
                        <div key={ad.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-muted-foreground w-6">
                                #{index + 1}
                              </span>
                              {ad.thumbnail_url ? (
                                <img
                                  src={ad.thumbnail_url}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                  {creativeInfo.icon}
                                </div>
                              )}
                              <span className="font-medium truncate max-w-[180px]">
                                {ad.name}
                              </span>
                              <Badge
                                className={`${statusConfig[ad.status]?.className || "bg-gray-400 text-white"} text-xs`}
                              >
                                {statusConfig[ad.status]?.label || ad.status}
                              </Badge>
                            </div>
                            <span className="font-bold">
                              {formatCurrency(ad.spend)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-500 rounded-full transition-all"
                                style={{
                                  width: `${(ad.spend / maxAdSpend) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground pl-8">
                            <span className="text-muted-foreground/70">
                              {ad.campaign_name}
                            </span>
                            <span>{formatNumber(ad.impressions)} impr.</span>
                            <span>{formatNumber(ad.clicks)} cliques</span>
                            <span>CTR {ad.ctr.toFixed(2)}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Data Table */}
                  <div className="mt-8 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Anúncio</TableHead>
                          <TableHead>Campanha</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Gasto</TableHead>
                          <TableHead className="text-right">Impressões</TableHead>
                          <TableHead className="text-right">Cliques</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Conversões</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adsInsights.map((ad) => {
                          const creativeInfo = getCreativeTypeInfo(ad.creative_type)
                          return (
                            <TableRow key={ad.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {ad.thumbnail_url ? (
                                    <img
                                      src={ad.thumbnail_url}
                                      alt=""
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                      {creativeInfo.icon}
                                    </div>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {creativeInfo.label}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium max-w-[150px] truncate">
                                {ad.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-[120px] truncate">
                                {ad.campaign_name}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    statusConfig[ad.status]?.className || "bg-gray-400 text-white"
                                  }
                                >
                                  {statusConfig[ad.status]?.label || ad.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(ad.spend)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(ad.impressions)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(ad.clicks)}
                              </TableCell>
                              <TableCell className="text-right">
                                {ad.ctr.toFixed(2)}%
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(ad.conversions)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Dimensão</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaignsInsights.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Carregue as campanhas primeiro para ver os breakdowns
                  </p>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => {
                      setActiveTab("campaigns")
                      fetchCampaignsInsights()
                    }}
                  >
                    Carregar Campanhas
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    Selecione diferentes dimensões e métricas para explorar os dados das suas campanhas.
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {campaignsInsights.slice(0, 4).map((campaign) => (
                      <BreakdownChart
                        key={campaign.id}
                        objectId={campaign.id}
                        objectType="campaign"
                        datePreset={period}
                        adAccountId={selectedAccount?.account_id}
                      />
                    ))}
                  </div>
                  {campaignsInsights.length > 4 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Mostrando breakdowns das 4 principais campanhas por gasto
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Gasto Diário</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : trendsData.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  Nenhum dado de tendência encontrado
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Simple Bar Chart */}
                  <div className="flex items-end gap-1" style={{ height: trendsData.length > 1 ? "200px" : "100px" }}>
                    {trendsData.map((day, index) => {
                      const heightPx = Math.max((day.spend / maxTrendSpend) * (trendsData.length > 1 ? 180 : 80), 4)
                      const prevDay = index > 0 ? trendsData[index - 1] : null
                      const change = prevDay && prevDay.spend > 0
                        ? ((day.spend - prevDay.spend) / prevDay.spend) * 100
                        : 0

                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center gap-1 group max-w-[80px]"
                        >
                          <div className="relative w-full flex flex-col items-center justify-end" style={{ height: trendsData.length > 1 ? "180px" : "80px" }}>
                            <div
                              className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                              style={{ height: `${heightPx}px` }}
                              title={`${formatDate(day.date)}: ${formatCurrency(day.spend)}`}
                            />
                            <div className="absolute -top-6 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                              {formatCurrency(day.spend)}
                              {change !== 0 && (
                                <span
                                  className={
                                    change > 0 ? "text-red-500" : "text-green-500"
                                  }
                                >
                                  {" "}
                                  ({change > 0 ? "+" : ""}
                                  {change.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(day.date)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Metrics Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Gasto Total</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(
                          trendsData.reduce((acc, d) => acc + d.spend, 0)
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Média Diária</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(
                          trendsData.reduce((acc, d) => acc + d.spend, 0) /
                            trendsData.length
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Maior Gasto</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(Math.max(...trendsData.map((d) => d.spend)))}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Menor Gasto</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(Math.min(...trendsData.map((d) => d.spend)))}
                      </p>
                    </div>
                  </div>

                  {/* Daily Data Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Gasto</TableHead>
                          <TableHead className="text-right">Variação</TableHead>
                          <TableHead className="text-right">Impressões</TableHead>
                          <TableHead className="text-right">Cliques</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Conversões</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trendsData.map((day, index) => {
                          const prevDay = index > 0 ? trendsData[index - 1] : null
                          const change = prevDay
                            ? ((day.spend - prevDay.spend) / prevDay.spend) * 100
                            : 0

                          return (
                            <TableRow key={day.date}>
                              <TableCell className="font-medium">
                                {formatDate(day.date)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(day.spend)}
                              </TableCell>
                              <TableCell className="text-right">
                                {index === 0 ? (
                                  "-"
                                ) : (
                                  <span
                                    className={`flex items-center justify-end gap-1 ${
                                      change > 0
                                        ? "text-red-500"
                                        : change < 0
                                          ? "text-green-500"
                                          : ""
                                    }`}
                                  >
                                    {change > 0 ? (
                                      <ArrowUpRight className="h-3 w-3" />
                                    ) : change < 0 ? (
                                      <ArrowDownRight className="h-3 w-3" />
                                    ) : null}
                                    {Math.abs(change).toFixed(1)}%
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(day.impressions)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(day.clicks)}
                              </TableCell>
                              <TableCell className="text-right">
                                {day.ctr.toFixed(2)}%
                              </TableCell>
                              <TableCell className="text-right">
                                {formatNumber(day.conversions)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
