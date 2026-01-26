"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Users, Target, DollarSign, Calendar, Save } from "lucide-react"
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
import { InterestSearch } from "@/components/features/targeting/interest-search"
import { LocationSearch } from "@/components/features/targeting/location-search"
import { analyticsApi, type Interest, type Location, type ReachEstimate } from "@/lib/api"
import { cn } from "@/lib/utils"

interface AdSetFormProps {
  campaignId: string
  onSubmit?: (data: AdSetFormData) => Promise<void>
  onCancel?: () => void
  initialData?: Partial<AdSetFormData>
  className?: string
}

export interface AdSetFormData {
  name: string
  daily_budget: number
  optimization_goal: string
  billing_event: string
  interests: Interest[]
  locations: Location[]
  age_min: number
  age_max: number
  genders: number[]
}

const optimizationGoals = [
  { value: "REACH", label: "Alcance" },
  { value: "LINK_CLICKS", label: "Cliques no Link" },
  { value: "LANDING_PAGE_VIEWS", label: "Visualizações da Página" },
  { value: "IMPRESSIONS", label: "Impressões" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversões" },
  { value: "LEAD_GENERATION", label: "Geração de Leads" },
]

const billingEvents = [
  { value: "IMPRESSIONS", label: "Por Impressões (CPM)" },
  { value: "LINK_CLICKS", label: "Por Clique (CPC)" },
]

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString("pt-BR")
}

export function AdSetForm({
  campaignId,
  onSubmit,
  onCancel,
  initialData,
  className,
}: AdSetFormProps) {
  const [formData, setFormData] = useState<AdSetFormData>({
    name: initialData?.name || "",
    daily_budget: initialData?.daily_budget || 50,
    optimization_goal: initialData?.optimization_goal || "REACH",
    billing_event: initialData?.billing_event || "IMPRESSIONS",
    interests: initialData?.interests || [],
    locations: initialData?.locations || [],
    age_min: initialData?.age_min || 18,
    age_max: initialData?.age_max || 65,
    genders: initialData?.genders || [0],
  })

  const [reachEstimate, setReachEstimate] = useState<ReachEstimate | null>(null)
  const [loadingReach, setLoadingReach] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const buildTargetingSpec = useCallback(() => {
    const spec: Record<string, unknown> = {
      age_min: formData.age_min,
      age_max: formData.age_max,
    }

    if (formData.genders.length > 0 && !formData.genders.includes(0)) {
      spec.genders = formData.genders
    }

    if (formData.locations.length > 0) {
      const countries: string[] = []
      const regions: Array<{ key: string }> = []
      const cities: Array<{ key: string }> = []

      formData.locations.forEach((loc) => {
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

    if (formData.interests.length > 0) {
      spec.flexible_spec = [
        {
          interests: formData.interests.map((i) => ({
            id: i.id,
            name: i.name,
          })),
        },
      ]
    }

    return spec
  }, [formData])

  useEffect(() => {
    const fetchReachEstimate = async () => {
      const spec = buildTargetingSpec()

      if (!spec.geo_locations && formData.interests.length === 0) {
        setReachEstimate(null)
        return
      }

      try {
        setLoadingReach(true)
        const response = await analyticsApi.estimateReach(spec, formData.optimization_goal)
        setReachEstimate(response.estimate)
      } catch {
        setReachEstimate(null)
      } finally {
        setLoadingReach(false)
      }
    }

    const debounce = setTimeout(fetchReachEstimate, 500)
    return () => clearTimeout(debounce)
  }, [formData.locations, formData.interests, formData.age_min, formData.age_max, formData.genders, formData.optimization_goal, buildTargetingSpec])

  const handleInterestSelect = (interest: Interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: [...prev.interests, interest],
    }))
  }

  const handleInterestRemove = (interestId: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i.id !== interestId),
    }))
  }

  const handleLocationSelect = (location: Location) => {
    setFormData((prev) => ({
      ...prev,
      locations: [...prev.locations, location],
    }))
  }

  const handleLocationRemove = (locationKey: string) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l.key !== locationKey),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onSubmit) return

    try {
      setSubmitting(true)
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = formData.name.trim() !== "" && formData.daily_budget > 0

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Configure o nome e orçamento do conjunto de anúncios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Conjunto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Interesses - Fitness - 25-45"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="daily_budget">Orçamento Diário (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="daily_budget"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.daily_budget}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      daily_budget: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="optimization_goal">Objetivo de Otimização</Label>
              <Select
                value={formData.optimization_goal}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, optimization_goal: v }))}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_event">Cobrança</Label>
            <Select
              value={formData.billing_event}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, billing_event: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {billingEvents.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Público
          </CardTitle>
          <CardDescription>
            Defina idade e gênero do público-alvo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="age_min">Idade Mínima</Label>
              <Input
                id="age_min"
                type="number"
                min="13"
                max="65"
                value={formData.age_min}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    age_min: parseInt(e.target.value) || 18,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age_max">Idade Máxima</Label>
              <Input
                id="age_max"
                type="number"
                min="18"
                max="65"
                value={formData.age_max}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    age_max: parseInt(e.target.value) || 65,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select
                value={formData.genders[0]?.toString() || "0"}
                onValueChange={(v) =>
                  setFormData((prev) => ({
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
        </CardContent>
      </Card>

      {/* Location Targeting */}
      <Card>
        <CardHeader>
          <CardTitle>Localização</CardTitle>
          <CardDescription>
            Selecione países, estados ou cidades para segmentar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationSearch
            selectedLocations={formData.locations}
            onSelect={handleLocationSelect}
            onRemove={handleLocationRemove}
          />
        </CardContent>
      </Card>

      {/* Interest Targeting */}
      <Card>
        <CardHeader>
          <CardTitle>Interesses</CardTitle>
          <CardDescription>
            Adicione interesses para segmentar seu público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InterestSearch
            selectedInterests={formData.interests}
            onSelect={handleInterestSelect}
            onRemove={handleInterestRemove}
          />
        </CardContent>
      </Card>

      {/* Reach Estimate */}
      <Card className={cn(reachEstimate ? "border-primary/50" : "")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estimativa de Alcance
          </CardTitle>
          <CardDescription>
            Tamanho estimado do público com base no targeting selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingReach ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reachEstimate ? (
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">
                {formatNumber(reachEstimate.users_lower_bound)} - {formatNumber(reachEstimate.users_upper_bound)}
              </div>
              <p className="text-sm text-muted-foreground">
                Pessoas que podem ver seus anúncios
              </p>
              {reachEstimate.estimate_ready && (
                <p className="text-xs text-green-600">Estimativa pronta</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Adicione localizações ou interesses para ver a estimativa</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={!isValid || submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Conjunto
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
