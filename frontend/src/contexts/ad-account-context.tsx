"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { accountsApi, settingsApi, type AdAccount } from "@/lib/api"

interface AdAccountContextType {
  accounts: AdAccount[]
  selectedAccount: AdAccount | null
  setSelectedAccount: (account: AdAccount) => void
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const AdAccountContext = createContext<AdAccountContextType | undefined>(undefined)

const STORAGE_KEY = "selectedAdAccountId"

export function AdAccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccountState] = useState<AdAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await accountsApi.getAll()

      // Filter only active accounts (status 1)
      const activeAccounts = response.accounts.filter(acc => acc.account_status === 1)
      setAccounts(activeAccounts)

      // Restore previously selected account from localStorage
      const savedAccountId = localStorage.getItem(STORAGE_KEY)
      if (savedAccountId) {
        const savedAccount = activeAccounts.find(acc => acc.account_id === savedAccountId)
        if (savedAccount) {
          setSelectedAccountState(savedAccount)
          // Sync to backend on restore
          settingsApi.setDefaultAccount(savedAccount.account_id).catch(console.error)
          return
        }
      }

      // Default to first account if none selected
      if (activeAccounts.length > 0 && !selectedAccount) {
        setSelectedAccountState(activeAccounts[0])
        // Sync default selection to backend
        settingsApi.setDefaultAccount(activeAccounts[0].account_id).catch(console.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas")
    } finally {
      setLoading(false)
    }
  }

  const setSelectedAccount = (account: AdAccount, syncToBackend = true) => {
    setSelectedAccountState(account)
    localStorage.setItem(STORAGE_KEY, account.account_id)
    // Sync to backend for scheduler/reports
    if (syncToBackend) {
      settingsApi.setDefaultAccount(account.account_id).catch(console.error)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  return (
    <AdAccountContext.Provider
      value={{
        accounts,
        selectedAccount,
        setSelectedAccount,
        loading,
        error,
        refresh: fetchAccounts,
      }}
    >
      {children}
    </AdAccountContext.Provider>
  )
}

export function useAdAccount() {
  const context = useContext(AdAccountContext)
  if (context === undefined) {
    throw new Error("useAdAccount must be used within an AdAccountProvider")
  }
  return context
}
