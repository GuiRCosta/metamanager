"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AdForm, type AdFormData } from "@/components/features/campaigns/ad-form"
import { campaignsApi } from "@/lib/api"
import { useAdAccount } from "@/contexts/ad-account-context"

export default function NewAdPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const adSetId = params.adSetId as string
  const { selectedAccount } = useAdAccount()

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: AdFormData) => {
    try {
      setError(null)

      await campaignsApi.createAd(
        campaignId,
        adSetId,
        {
          name: data.name,
          creative_id: data.creative_id,
          status: data.status,
        },
        selectedAccount?.account_id || undefined
      )

      toast.success(`Anúncio "${data.name}" criado com sucesso!`)
      router.push(`/campaigns/${campaignId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar anúncio"
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
          <h1 className="text-3xl font-bold tracking-tight">Novo Anúncio</h1>
          <p className="text-muted-foreground">
            Crie um anúncio vinculado a um criativo existente
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <AdForm
        campaignId={campaignId}
        adSetId={adSetId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
