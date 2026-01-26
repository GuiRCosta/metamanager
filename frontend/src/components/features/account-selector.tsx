"use client"

import { Check, ChevronDown, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAdAccount } from "@/contexts/ad-account-context"

function formatCurrency(amountCents: string): string {
  const amount = parseInt(amountCents) / 100
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

export function AccountSelector() {
  const { accounts, selectedAccount, setSelectedAccount, loading } = useAdAccount()

  if (loading) {
    return (
      <Button variant="outline" className="w-[200px] justify-between" disabled>
        <span className="truncate">Carregando...</span>
      </Button>
    )
  }

  if (accounts.length === 0) {
    return (
      <Button variant="outline" className="w-[200px] justify-between" disabled>
        <span className="truncate">Sem contas</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[220px] justify-between">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selectedAccount?.name || "Selecionar conta"}</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px]" align="start">
        <DropdownMenuLabel>Contas de Anúncio</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.account_id}
            onClick={() => setSelectedAccount(account)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{account.name}</span>
              <span className="text-xs text-muted-foreground">
                Gasto total: {formatCurrency(account.amount_spent)}
              </span>
            </div>
            {selectedAccount?.account_id === account.account_id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
