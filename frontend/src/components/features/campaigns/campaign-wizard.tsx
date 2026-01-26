"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Target,
  Users,
  Eye,
  Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { InterestSearch } from "@/components/features/targeting/interest-search"
import { LocationSearch } from "@/components/features/targeting/location-search"
import { campaignsApi, analyticsApi, type Interest, type Location, type ReachEstimate } from "@/lib/api"
import { cn } from "@/lib/utils"

interface CampaignWizardProps {
  adAccountId?: string
  onCancel?: () => void
}

interface CampaignData {
  name: string
  objective: string
  daily_budget: number
  status: string
}

interface AdSetData {
  name: string
  daily_budget: number
  optimization_goal: string
  age_min: number
  age_max: number
  genders: number[]
  interests: Interest[]
  locations: Location[]
}

const objectives = [
  { value: "OUTCOME_TRAFFIC", label: "Tráfego", description: "Direcione pessoas para seu site ou app" },
  { value: "OUTCOME_LEADS", label: "Leads", description: "Colete informações de contato" },
  { value: "OUTCOME_SALES", label: "Vendas", description: "Impulsione vendas online ou offline" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engajamento", description: "Aumente curtidas, comentários e compartilhamentos" },
  { value: "OUTCOME_AWARENESS", label: "Reconhecimento", description: "Alcance o máximo de pessoas" },
]

const optimizationGoals = [
  { value: "REACH", label: "Alcance" },
  { value: "LINK_CLICKS", label: "Cliques no Link" },
  { value: "LANDING_PAGE_VIEWS", label: "Visualizações da Página" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversões" },
  { value: "LEAD_GENERATION", label: "Geração de Leads" },
]

const steps = [
  { id: 1, name: "Campanha", icon: Target },
  { id: 2, name: "Público", icon: Users },
  { id: 3, name: "Revisão", icon: Eye },
]

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString("pt-BR")
}

export function CampaignWizard({ adAccountId, onCancel }: CampaignWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campaign data
  const [campaign, setCampaign] = useState<CampaignData>({
    name: "",
    objective: "",
    daily_budget: 50,
    status: "PAUSED",
  })

  // Ad Set data
  const [adSet, setAdSet] = useState<AdSetData>({
    name: "",
    daily_budget: 50,
    optimization_goal: "REACH",
    age_min: 18,
    age_max: 65,
    genders: [0],
    interests: [],
    locations: [],
  })

  // Reach estimate
  const [reachEstimate, setReachEstimate] = useState<ReachEstimate | null>(null)
  const [loadingReach, setLoadingReach] = useState(false)

  const buildTargetingSpec = useCallback(() => {
    const spec: Record<string, unknown> = {
      age_min: adSet.age_min,
      age_max: adSet.age_max,
    }

    if (adSet.genders.length > 0 && !adSet.genders.includes(0)) {
      spec.genders = adSet.genders
    }

    if (adSet.locations.length > 0) {
      const countries: string[] = []
      const regions: Array<{ key: string }> = []
      const cities: Array<{ key: string }> = []

      adSet.locations.forEach((loc) => {
        if (loc.type === "country" && loc.country_code) {
          countries.push(loc.country_code)
        } else if (loc.type === "region") {
          regions.push({ key: loc.key })
        } else if (loc.type === "city") {
          cities.push({ key: loc.key })
        }
      })

      const geoLocations: Record<string, unknown> = {}
      if (countries.length > 0) geoLocations.countries = countries
      if (regions.length > 0) geoLocations.regions = regions
      if (cities.length > 0) geoLocations.cities = cities

      if (Object.keys(geoLocations).length > 0) {
        spec.geo_locations = geoLocations
      }
    }

    if (adSet.interests.length > 0) {
      spec.flexible_spec = [
        {
          interests: adSet.interests.map((i) => ({
            id: i.id,
            name: i.name,
          })),
        },
      ]
    }

    return spec
  }, [adSet])

  const fetchReachEstimate = useCallback(async () => {
    const spec = buildTargetingSpec()

    if (!spec.geo_locations && adSet.interests.length === 0) {
      setReachEstimate(null)
      return
    }

    try {
      setLoadingReach(true)
      const response = await analyticsApi.estimateReach(spec, adSet.optimization_goal, adAccountId)
      setReachEstimate(response.estimate)
    } catch {
      setReachEstimate(null)
    } finally {
      setLoadingReach(false)
    }
  }, [buildTargetingSpec, adSet.optimization_goal, adSet.interests.length, adAccountId])

  const handleInterestSelect = (interest: Interest) => {
    setAdSet((prev) => ({ ...prev, interests: [...prev.interests, interest] }))
  }

  const handleInterestRemove = (interestId: string) => {
    setAdSet((prev) => ({ ...prev, interests: prev.interests.filter((i) => i.id !== interestId) }))
  }

  const handleLocationSelect = (location: Location) => {
    setAdSet((prev) => ({ ...prev, locations: [...prev.locations, location] }))
  }

  const handleLocationRemove = (locationKey: string) => {
    setAdSet((prev) => ({ ...prev, locations: prev.locations.filter((l) => l.key !== locationKey) }))
  }

  const isStep1Valid = campaign.name.trim() !== "" && campaign.objective !== ""
  const isStep2Valid = adSet.locations.length > 0 || adSet.interests.length > 0

  const canProceed = () => {
    if (currentStep === 1) return isStep1Valid
    if (currentStep === 2) return isStep2Valid
    return true
  }

  const handleNext = async () => {
    if (currentStep === 2) {
      // Fetch reach estimate when moving to review
      await fetchReachEstimate()
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setError(null)

      // Create campaign
      const campaignData = {
        name: campaign.name,
        objective: campaign.objective,
        daily_budget: campaign.daily_budget,
        status: campaign.status,
      }

      const createdCampaign = await campaignsApi.create(campaignData, adAccountId)

      // Create ad set with targeting from step 2
      const targetingSpec = buildTargetingSpec()
      const adSetName = adSet.name || `${campaign.name} - Conjunto 1`

      await campaignsApi.createAdSet(
        createdCampaign.id,
        {
          name: adSetName,
          daily_budget: adSet.daily_budget || campaign.daily_budget,
          optimization_goal: adSet.optimization_goal,
          billing_event: "IMPRESSIONS",
          targeting: targetingSpec,
          status: campaign.status,
        },
        adAccountId
      )

      router.push(`/campaigns/${createdCampaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar campanha")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="relative">
        <Progress value={(currentStep / 3) * 100} className="h-2" />
        <div className="flex justify-between mt-4">
          {steps.map((step) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2",
                  isActive && "text-primary",
                  isCompleted && "text-green-600",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-green-600 bg-green-600 text-white",
                    !isActive && !isCompleted && "border-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Campaign Info */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Informações da Campanha
            </CardTitle>
            <CardDescription>
              Configure o nome, objetivo e orçamento da sua campanha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da Campanha *</Label>
              <Input
                id="campaign-name"
                value={campaign.name}
                onChange={(e) => setCampaign((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Campanha de Vendas - Janeiro 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Objetivo da Campanha *</Label>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {objectives.map((obj) => (
                  <div
                    key={obj.value}
                    className={cn(
                      "cursor-pointer rounded-lg border p-4 transition-colors hover:border-primary",
                      campaign.objective === obj.value && "border-primary bg-primary/5"
                    )}
                    onClick={() => setCampaign((prev) => ({ ...prev, objective: obj.value }))}
                  >
                    <div className="font-medium">{obj.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{obj.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="campaign-budget">Orçamento Diário (R$)</Label>
                <Input
                  id="campaign-budget"
                  type="number"
                  min="1"
                  value={campaign.daily_budget}
                  onChange={(e) =>
                    setCampaign((prev) => ({
                      ...prev,
                      daily_budget: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-status">Status Inicial</Label>
                <Select
                  value={campaign.status}
                  onValueChange={(v) => setCampaign((prev) => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAUSED">Pausada</SelectItem>
                    <SelectItem value="ACTIVE">Ativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Audience */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Público-Alvo
              </CardTitle>
              <CardDescription>
                Defina quem verá seus anúncios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ad Set Name */}
              <div className="space-y-2">
                <Label htmlFor="adset-name">Nome do Conjunto de Anúncios</Label>
                <Input
                  id="adset-name"
                  value={adSet.name}
                  onChange={(e) => setAdSet((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={`${campaign.name || "Campanha"} - Conjunto 1`}
                />
                <p className="text-xs text-muted-foreground">
                  Se deixar em branco, será usado o nome da campanha + &quot;Conjunto 1&quot;
                </p>
              </div>

              {/* Demographics */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Idade Mínima</Label>
                  <Input
                    type="number"
                    min="13"
                    max="65"
                    value={adSet.age_min}
                    onChange={(e) =>
                      setAdSet((prev) => ({
                        ...prev,
                        age_min: parseInt(e.target.value) || 18,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Idade Máxima</Label>
                  <Input
                    type="number"
                    min="18"
                    max="65"
                    value={adSet.age_max}
                    onChange={(e) =>
                      setAdSet((prev) => ({
                        ...prev,
                        age_max: parseInt(e.target.value) || 65,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select
                    value={adSet.genders[0]?.toString() || "0"}
                    onValueChange={(v) =>
                      setAdSet((prev) => ({
                        ...prev,
                        genders: v === "0" ? [0] : [parseInt(v)],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todos</SelectItem>
                      <SelectItem value="1">Masculino</SelectItem>
                      <SelectItem value="2">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optimization Goal */}
              <div className="space-y-2">
                <Label>Objetivo de Otimização</Label>
                <Select
                  value={adSet.optimization_goal}
                  onValueChange={(v) => setAdSet((prev) => ({ ...prev, optimization_goal: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {optimizationGoals.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value}>
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
              <CardDescription>
                Selecione países, estados ou cidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationSearch
                selectedLocations={adSet.locations}
                onSelect={handleLocationSelect}
                onRemove={handleLocationRemove}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interesses</CardTitle>
              <CardDescription>
                Adicione interesses para segmentar seu público
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InterestSearch
                selectedInterests={adSet.interests}
                onSelect={handleInterestSelect}
                onRemove={handleInterestRemove}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Revisar Campanha
              </CardTitle>
              <CardDescription>
                Verifique as configurações antes de criar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Megaphone className="h-4 w-4" />
                  Campanha
                </h3>
                <div className="grid gap-4 md:grid-cols-2 bg-muted/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{campaign.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Objetivo</p>
                    <p className="font-medium">
                      {objectives.find((o) => o.value === campaign.objective)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Orçamento Diário</p>
                    <p className="font-medium">R$ {campaign.daily_budget.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                      {campaign.status === "ACTIVE" ? "Ativa" : "Pausada"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Audience Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Público-Alvo
                </h3>
                <div className="grid gap-4 md:grid-cols-2 bg-muted/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Idade</p>
                    <p className="font-medium">{adSet.age_min} - {adSet.age_max} anos</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gênero</p>
                    <p className="font-medium">
                      {adSet.genders.includes(0)
                        ? "Todos"
                        : adSet.genders.includes(1)
                        ? "Masculino"
                        : "Feminino"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localizações</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {adSet.locations.length > 0 ? (
                        adSet.locations.map((loc) => (
                          <Badge key={loc.key} variant="outline" className="text-xs">
                            {loc.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interesses</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {adSet.interests.length > 0 ? (
                        adSet.interests.map((interest) => (
                          <Badge key={interest.id} variant="outline" className="text-xs">
                            {interest.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reach Estimate */}
              <div className="space-y-4">
                <h3 className="font-semibold">Estimativa de Alcance</h3>
                <div className="bg-primary/5 rounded-lg p-6 text-center">
                  {loadingReach ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  ) : reachEstimate ? (
                    <>
                      <div className="text-4xl font-bold text-primary">
                        {formatNumber(reachEstimate.users_lower_bound)} -{" "}
                        {formatNumber(reachEstimate.users_upper_bound)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Pessoas que podem ver seus anúncios
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Estimativa não disponível
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {currentStep === 1 ? "Cancelar" : "Voltar"}
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Criar Campanha
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
