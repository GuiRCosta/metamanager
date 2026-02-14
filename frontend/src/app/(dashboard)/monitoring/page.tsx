"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  Clock,
  Users,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Server,
  Copy,
  Check,
  Shield,
  Wifi,
  WifiOff,
  Trash2,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  logsApi,
  adminApi,
  type ActivityLog,
  type LogStats,
  type UserHealth,
  type AdminUser,
} from "@/lib/api"

// Fallback static map for when Prisma query fails
const FALLBACK_USER_MAP: Record<string, string> = {
  "8b11cf7d-bcf8-4735-8971-3e8d45b22a97": "gestao@ideva.ai",
  "42481046-de39-4f6f-a82b-bf41d4b10344": "gabrielvidal156@gmail.com",
  "951af360-121c-47cc-a797-bd589c111bf4": "guilhermecostarc@gmail.com",
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": "admin@metamanager.com",
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp + "Z")
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function StatusBadge({ code }: { code: number | null }) {
  if (!code) return <span className="text-muted-foreground">-</span>
  const color =
    code >= 500
      ? "bg-red-500/20 text-red-400"
      : code >= 400
        ? "bg-yellow-500/20 text-yellow-400"
        : code >= 300
          ? "bg-blue-500/20 text-blue-400"
          : "bg-green-500/20 text-green-400"

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {code}
    </span>
  )
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/20 text-blue-400",
    POST: "bg-green-500/20 text-green-400",
    PUT: "bg-yellow-500/20 text-yellow-400",
    PATCH: "bg-orange-500/20 text-orange-400",
    DELETE: "bg-red-500/20 text-red-400",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-medium ${colors[method] || "bg-gray-500/20 text-gray-400"}`}>
      {method}
    </span>
  )
}

export default function MonitoringPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userRole = (session?.user as { role?: string })?.role

  const [stats, setStats] = useState<LogStats | null>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [usersHealth, setUsersHealth] = useState<UserHealth[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<string | null>(null)

  // Filters
  const [filterMethod, setFilterMethod] = useState<string>("all")
  const [filterUser, setFilterUser] = useState<string>("all")
  const [filterPath, setFilterPath] = useState("")
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [statsHours, setStatsHours] = useState(24)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, logsRes, healthRes, usersRes] = await Promise.all([
        logsApi.getStats(statsHours),
        logsApi.getLogs({
          method: filterMethod !== "all" ? filterMethod : undefined,
          user_id: filterUser !== "all" ? filterUser : undefined,
          path_contains: filterPath || undefined,
          errors_only: errorsOnly,
          page,
          limit: 50,
        }),
        adminApi.getUsersHealth(statsHours).catch(() => ({ users: [] })),
        adminApi.getUsers().catch(() => ({ users: [] })),
      ])
      setStats(statsRes)
      setLogs(logsRes.logs)
      setTotalLogs(logsRes.total)
      setUsersHealth(healthRes.users)
      setAdminUsers(usersRes.users)
    } catch {
      // Silently handle errors on monitoring page
    } finally {
      setLoading(false)
    }
  }, [statsHours, filterMethod, filterUser, filterPath, errorsOnly, page])

  useEffect(() => {
    if (userRole !== "superadmin") {
      router.push("/dashboard")
      return
    }
    fetchData()
  }, [userRole, router, fetchData])

  useEffect(() => {
    if (!autoRefresh || userRole !== "superadmin") return
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData, userRole])

  if (userRole !== "superadmin") {
    return null
  }

  // Build dynamic user map from Prisma users (overrides fallback)
  const dynamicUserMap: Record<string, string> = {}
  for (const u of adminUsers) {
    dynamicUserMap[u.id] = u.email
  }
  const userMap = { ...FALLBACK_USER_MAP, ...dynamicUserMap }

  function resolveEmail(userId: string | null): string {
    if (!userId) return "anonymous"
    return userMap[userId] || userId.slice(0, 8)
  }

  function formatLogAsText(log: ActivityLog): string {
    return [
      `[${log.timestamp}] ${log.status_code || "-"} ${log.method} ${log.path}`,
      `  Usuario: ${resolveEmail(log.user_id)}`,
      `  Tempo: ${log.response_time_ms?.toFixed(0) || "-"}ms`,
      `  IP: ${log.ip_address || "-"}`,
      log.query_params ? `  Params: ${log.query_params}` : null,
      log.error_detail ? `  Erro: ${log.error_detail}` : null,
      log.user_agent ? `  UA: ${log.user_agent}` : null,
    ].filter(Boolean).join("\n")
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Merge health + Prisma user data
  const enrichedUsers = usersHealth.map((health) => {
    const prismaUser = adminUsers.find((u) => u.id === health.user_id)
    return {
      ...health,
      email: prismaUser?.email || userMap[health.user_id] || health.user_id.slice(0, 8),
      name: prismaUser?.name || null,
      role: prismaUser?.role || "user",
      createdAt: prismaUser?.createdAt || null,
    }
  })

  async function handleCleanupLogs(days: number) {
    setCleanupLoading(true)
    setCleanupResult(null)
    try {
      const result = await adminApi.cleanupLogs(days)
      setCleanupResult(
        `${result.deleted_count} logs removidos. ${result.remaining_count} restantes.`
      )
      fetchData()
    } catch {
      setCleanupResult("Erro ao limpar logs.")
    } finally {
      setCleanupLoading(false)
    }
  }

  const totalPages = Math.ceil(totalLogs / 50)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento</h1>
          <p className="text-muted-foreground">
            Painel administrativo do MetaManager
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(statsHours)} onValueChange={(v) => setStatsHours(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Ultima hora</SelectItem>
              <SelectItem value="6">Ultimas 6h</SelectItem>
              <SelectItem value="24">Ultimas 24h</SelectItem>
              <SelectItem value="72">Ultimos 3 dias</SelectItem>
              <SelectItem value="168">Ultima semana</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-1" />
            Visao Geral
          </TabsTrigger>
          <TabsTrigger value="users">
            <Shield className="h-4 w-4 mr-1" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Filter className="h-4 w-4 mr-1" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* ==================== OVERVIEW TAB ==================== */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_requests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    nas ultimas {statsHours}h
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Erros</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{stats.error_count}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total_requests > 0
                      ? `${((stats.error_count / stats.total_requests) * 100).toFixed(1)}% error rate`
                      : "sem requests"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Medio</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avg_response_time_ms.toFixed(0)}ms</div>
                  <p className="text-xs text-muted-foreground">response time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active_users.length}</div>
                  <div className="mt-1 space-y-0.5">
                    {stats.active_users.map((u) => (
                      <p key={u.user_id} className="text-xs text-muted-foreground truncate">
                        {resolveEmail(u.user_id)} ({u.request_count} req)
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Status Breakdown + Top Endpoints */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.status_breakdown.map((s) => {
                      const pct = stats.total_requests > 0
                        ? ((s.count / stats.total_requests) * 100).toFixed(1)
                        : "0"
                      const color = s.status_group === "5xx"
                        ? "bg-red-500"
                        : s.status_group === "4xx"
                          ? "bg-yellow-500"
                          : s.status_group === "2xx"
                            ? "bg-green-500"
                            : "bg-blue-500"
                      return (
                        <div key={s.status_group} className="flex items-center gap-3">
                          <span className="text-sm font-mono w-8">{s.status_group}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color} rounded-full`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {s.count} ({pct}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Top Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {stats.top_endpoints.slice(0, 10).map((ep, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <MethodBadge method={ep.method} />
                          <span className="truncate font-mono text-xs">{ep.path}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-muted-foreground">{ep.count}x</span>
                          <span className="text-muted-foreground">{ep.avg_time_ms}ms</span>
                          {ep.error_count > 0 && (
                            <span className="text-red-400">{ep.error_count} err</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Errors */}
          {stats && stats.recent_errors.length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  Erros Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {stats.recent_errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm border-b border-border/50 pb-2">
                      <span className="text-muted-foreground text-xs shrink-0">
                        {formatTime(err.timestamp)}
                      </span>
                      <StatusBadge code={err.status_code} />
                      <MethodBadge method={err.method} />
                      <span className="font-mono text-xs truncate">{err.path}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {resolveEmail(err.user_id)}
                      </span>
                      {err.error_detail && (
                        <span className="text-xs text-red-400 truncate" title={err.error_detail}>
                          {err.error_detail.slice(0, 80)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== USERS TAB ==================== */}
        <TabsContent value="users" className="space-y-4">
          {enrichedUsers.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Saude dos Usuarios ({enrichedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">Usuario</th>
                          <th className="px-3 py-2 text-center font-medium">Meta API</th>
                          <th className="px-3 py-2 text-center font-medium">WhatsApp</th>
                          <th className="px-3 py-2 text-right font-medium">Requests</th>
                          <th className="px-3 py-2 text-right font-medium">Erros</th>
                          <th className="px-3 py-2 text-left font-medium">Ultima Atividade</th>
                          <th className="px-3 py-2 text-left font-medium">Ultimo Erro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrichedUsers.map((user) => {
                          const errorRate = user.total_requests > 0
                            ? (user.error_count / user.total_requests) * 100
                            : 0
                          const healthColor = errorRate > 10
                            ? "bg-red-500/10"
                            : errorRate > 5
                              ? "bg-yellow-500/10"
                              : ""
                          return (
                            <tr key={user.user_id} className={`border-b ${healthColor}`}>
                              <td className="px-3 py-2">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{user.email}</span>
                                  {user.name && (
                                    <span className="text-xs text-muted-foreground">{user.name}</span>
                                  )}
                                  {user.role === "superadmin" && (
                                    <span className="text-xs text-purple-400">superadmin</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {user.has_meta_token && user.has_ad_account ? (
                                  <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                                    <Wifi className="h-3 w-3" /> Conectado
                                  </span>
                                ) : user.has_meta_token ? (
                                  <span className="inline-flex items-center gap-1 text-yellow-400 text-xs">
                                    <Wifi className="h-3 w-3" /> Parcial
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                                    <WifiOff className="h-3 w-3" /> Desconectado
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {user.has_evolution ? (
                                  <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                                    <MessageSquare className="h-3 w-3" /> Ativo
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-xs">
                                {user.total_requests.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {user.error_count > 0 ? (
                                  <span className="text-red-400 font-mono text-xs">
                                    {user.error_count} ({errorRate.toFixed(1)}%)
                                  </span>
                                ) : (
                                  <span className="text-green-400 text-xs">0</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                                {user.last_activity ? formatTime(user.last_activity) : "-"}
                              </td>
                              <td className="px-3 py-2">
                                {user.last_error_detail ? (
                                  <span
                                    className="text-xs text-red-400 truncate block max-w-[200px]"
                                    title={user.last_error_detail}
                                  >
                                    {user.last_error_detail.slice(0, 60)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum usuario encontrado
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== LOGS TAB ==================== */}
        <TabsContent value="logs" className="space-y-4">
          {/* Log Cleanup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Limpeza de Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCleanupLogs(30)}
                  disabled={cleanupLoading}
                >
                  {cleanupLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Limpar +30 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCleanupLogs(7)}
                  disabled={cleanupLoading}
                >
                  Limpar +7 dias
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCleanupLogs(1)}
                  disabled={cleanupLoading}
                >
                  Limpar +1 dia
                </Button>
                {cleanupResult && (
                  <span className="text-sm text-muted-foreground">{cleanupResult}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(userMap).map(([id, email]) => (
                      <SelectItem key={id} value={id}>
                        {email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filtrar por path..."
                  value={filterPath}
                  onChange={(e) => setFilterPath(e.target.value)}
                  className="w-[200px]"
                />

                <Button
                  variant={errorsOnly ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setErrorsOnly(!errorsOnly)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errorsOnly ? "Erros" : "Todos"}
                </Button>

                <Button variant="outline" size="sm" onClick={() => { setPage(1); fetchData() }}>
                  Aplicar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(logs.map(formatLogAsText).join("\n\n"), "all")}
                  disabled={logs.length === 0}
                >
                  {copiedId === "all" ? (
                    <Check className="h-4 w-4 mr-1 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copiedId === "all" ? "Copiado!" : `Copiar Logs (${logs.length})`}
                </Button>
              </div>

              {/* Logs Table */}
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Hora</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Metodo</th>
                        <th className="px-3 py-2 text-left font-medium">Path</th>
                        <th className="px-3 py-2 text-left font-medium">Usuario</th>
                        <th className="px-3 py-2 text-right font-medium">Tempo</th>
                        <th className="px-3 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                            Carregando...
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                            Nenhum log encontrado
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <>
                            <tr
                              key={log.id}
                              className={`border-b hover:bg-muted/30 cursor-pointer ${
                                log.status_code && log.status_code >= 400 ? "bg-red-500/5" : ""
                              }`}
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            >
                              <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                                {formatTime(log.timestamp)}
                              </td>
                              <td className="px-3 py-2">
                                <StatusBadge code={log.status_code} />
                              </td>
                              <td className="px-3 py-2">
                                <MethodBadge method={log.method} />
                              </td>
                              <td className="px-3 py-2 font-mono text-xs max-w-[300px] truncate">
                                {log.path}
                              </td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">
                                {resolveEmail(log.user_id)}
                              </td>
                              <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                                {log.response_time_ms?.toFixed(0)}ms
                              </td>
                              <td className="px-3 py-2">
                                {expandedLog === log.id ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </td>
                            </tr>
                            {expandedLog === log.id && (
                              <tr key={`${log.id}-detail`}>
                                <td colSpan={7} className="px-3 py-3 bg-muted/20">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">IP: </span>
                                      {log.ip_address || "-"}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">User Agent: </span>
                                      <span className="truncate">{log.user_agent || "-"}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Query Params: </span>
                                      <span className="font-mono">{log.query_params || "-"}</span>
                                    </div>
                                    {log.error_detail && (
                                      <div className="col-span-2">
                                        <span className="text-red-400">Erro: </span>
                                        <span className="text-red-300">{log.error_detail}</span>
                                      </div>
                                    )}
                                    <div className="col-span-2 mt-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          copyToClipboard(formatLogAsText(log), String(log.id))
                                        }}
                                      >
                                        {copiedId === String(log.id) ? (
                                          <Check className="h-3 w-3 mr-1 text-green-400" />
                                        ) : (
                                          <Copy className="h-3 w-3 mr-1" />
                                        )}
                                        {copiedId === String(log.id) ? "Copiado!" : "Copiar log"}
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {totalLogs} logs total - Pagina {page} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages}
                    >
                      Proximo
                    </Button>
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
