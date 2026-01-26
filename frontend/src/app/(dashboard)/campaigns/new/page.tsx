"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CampaignWizard } from "@/components/features/campaigns/campaign-wizard"
import { useAdAccount } from "@/contexts/ad-account-context"

export default function NewCampaignPage() {
  const router = useRouter()
  const { selectedAccount } = useAdAccount()

  const handleCancel = () => {
    router.push("/campaigns")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Campanha</h1>
          <p className="text-muted-foreground">
            {selectedAccount
              ? `Conta: ${selectedAccount.name}`
              : "Selecione uma conta de anúncios"}
          </p>
        </div>
      </div>

      {!selectedAccount ? (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-700 dark:text-yellow-400">
          Selecione uma conta de anúncios no menu superior para criar uma campanha.
        </div>
      ) : (
        <CampaignWizard
          adAccountId={selectedAccount.account_id}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
