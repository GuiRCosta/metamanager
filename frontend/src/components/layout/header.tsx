"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCw, Bell, Settings } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AccountSelector } from "@/components/features/account-selector"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { alertsApi } from "@/lib/api"

interface HeaderProps {
  onSync?: () => Promise<void>
}

export function Header({ onSync }: HeaderProps) {
  const { data: session } = useSession()
  const [isSyncing, setIsSyncing] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await alertsApi.getUnreadCount()
      setUnreadAlerts(response.unread_count)
    } catch {
      // Silently fail - alerts count is not critical
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const handleSync = async () => {
    if (!onSync) return
    setIsSyncing(true)
    try {
      await onSync()
    } finally {
      setIsSyncing(false)
    }
  }

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/20 glass-surface-nav px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">iDEVA Campaign Manager</h1>
        <AccountSelector />
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
          />
          {isSyncing ? "Sincronizando..." : "Sincronizar"}
        </Button>

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/alerts">
            <Bell className="h-5 w-5" />
            {unreadAlerts > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {unreadAlerts > 9 ? "9+" : unreadAlerts}
              </Badge>
            )}
          </Link>
        </Button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/alerts">
                <Bell className="mr-2 h-4 w-4" />
                Notificações
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
