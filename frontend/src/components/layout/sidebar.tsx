"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  BookOpen,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Logo } from "@/components/ui/logo"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campanhas", href: "/campaigns", icon: Megaphone },
  { name: "Agente IA (Beta)", href: "/agent", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Alertas", href: "/alerts", icon: Bell },
  { name: "Documentação", href: "/docs", icon: BookOpen },
  { name: "Configurações", href: "/settings", icon: Settings },
]

interface SidebarProps {
  budgetUsed?: number
  budgetLimit?: number
}

export function Sidebar({ budgetUsed = 0, budgetLimit = 5000 }: SidebarProps) {
  const pathname = usePathname()
  const budgetPercentage = budgetLimit > 0 ? (budgetUsed / budgetLimit) * 100 : 0

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="flex h-full w-64 flex-col glass-surface shadow-glass-sm">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href="/dashboard" className="flex items-center">
          <Logo width={100} height={26} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/30 dark:hover:bg-white/10 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 rounded-2xl p-4 bg-card-subtle">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Orçamento Mensal</span>
            <span className="text-muted-foreground">
              {budgetPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={budgetPercentage} className="h-2" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>R$ {budgetUsed.toLocaleString("pt-BR")}</span>
            <span>R$ {budgetLimit.toLocaleString("pt-BR")}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )
}
