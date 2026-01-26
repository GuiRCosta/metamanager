"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AdSetForm, type AdSetFormData } from "@/components/features/campaigns/ad-set-form"
import { campaignsApi } from "@/lib/api"
import { useAdAccount } from "@/contexts/ad-account-context"

export default function NewAdSetPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const { selectedAccount } = useAdAccount()

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: AdSetFormData) => {
    try {
      setError(null)

      // Build targeting spec for API
      const targetingSpec: Record<string, unknown> = {
        age_min: data.age_min,
        age_max: data.age_max,
      }

      if (data.genders.length > 0 && !data.genders.includes(0)) {
        targetingSpec.genders = data.genders
      }

      if (data.locations.length > 0) {
        const countries: string[] = []
        const regions: Array<{ key: string }> = []
        const cities: Array<{ key: string }> = []

        data.locations.forEach((loc) => {
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
          targetingSpec.geo_locations = geoLocations
        }
      }

      if (data.interests.length > 0) {
        targetingSpec.flexible_spec = [
          {
            interests: data.interests.map((i) => ({
              id: i.id,
              name: i.name,
            })),
          },
        ]
      }

      // Call API to create ad set
      await campaignsApi.createAdSet(
        campaignId,
        {
          name: data.name,
          daily_budget: data.daily_budget,
          optimization_goal: data.optimization_goal,
          billing_event: data.billing_event,
          targeting: targetingSpec,
          status: "PAUSED",
        },
        selectedAccount?.account_id || undefined
      )

      toast.success(`Conjunto de anúncios "${data.name}" criado com sucesso!`)
      router.push(`/campaigns/${campaignId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar conjunto de anúncios"
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/campaigns/${campaignId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Conjunto de Anúncios</h1>
          <p className="text-muted-foreground">
            Configure o targeting e orçamento do seu conjunto
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <AdSetForm
        campaignId={campaignId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
