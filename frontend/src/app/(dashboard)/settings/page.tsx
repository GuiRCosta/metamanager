"use client"

import { useState, useEffect } from "react"
import { Save, Key, Bell, Target, Loader2, CheckCircle, XCircle, MessageCircle, Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  settingsApi,
  whatsappApi,
  type Settings,
  type BudgetSettings,
  type MetaApiSettings,
  type NotificationSettings,
  type GoalsSettings,
  type EvolutionSettings,
  type WhatsAppSchedulerStatus,
} from "@/lib/api"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ success: boolean; message: string } | null>(null)
  const [newNumber, setNewNumber] = useState("")
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false)
  const [isSendingReport, setIsSendingReport] = useState(false)
  const [whatsappTestResult, setWhatsappTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [schedulerStatus, setSchedulerStatus] = useState<WhatsAppSchedulerStatus | null>(null)

  // Settings state
  const [budget, setBudget] = useState<BudgetSettings>({
    monthly_budget: 5000,
    alerts: {
      alert_50: true,
      alert_80: true,
      alert_100: true,
      projection_excess: true,
    },
  })

  const [metaApi, setMetaApi] = useState<MetaApiSettings>({
    access_token: "",
    business_id: "",
    ad_account_id: "",
    api_version: "v24.0",
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    daily_reports: true,
    immediate_alerts: true,
    optimization_suggestions: true,
    status_changes: true,
    report_time: "09:00",
  })

  const [goals, setGoals] = useState<GoalsSettings>({
    conversion_goal: undefined,
    roas_goal: undefined,
    cpc_max: undefined,
    ctr_min: undefined,
  })

  const [evolution, setEvolution] = useState<EvolutionSettings>({
    api_url: "",
    api_key: "",
    instance: "",
    webhook_secret: "",
    enabled: false,
    allowed_numbers: [],
  })

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setBudget(settings.budget)
        setMetaApi(settings.meta_api)
        setNotifications(settings.notifications)
        setGoals(settings.goals)
        if (settings.evolution) {
          setEvolution(settings.evolution)
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Load scheduler status
  useEffect(() => {
    const loadSchedulerStatus = async () => {
      try {
        const status = await whatsappApi.getSchedulerStatus()
        setSchedulerStatus(status)
      } catch (error) {
        console.error("Erro ao carregar status do scheduler:", error)
      }
    }
    loadSchedulerStatus()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      await settingsApi.update({
        budget,
        meta_api: metaApi,
        notifications,
        goals,
        evolution,
      })
      setSaveMessage({ success: true, message: "Configurações salvas com sucesso!" })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({ success: false, message: "Erro ao salvar configurações" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const result = await settingsApi.testConnection({
        access_token: metaApi.access_token,
        business_id: metaApi.business_id,
      })
      setTestResult({ success: result.success, message: result.message })
    } catch (error) {
      setTestResult({ success: false, message: "Erro ao testar conexão" })
    } finally {
      setIsTesting(false)
    }
  }

  const handleAddNumber = () => {
    if (!newNumber.trim()) return
    const cleanNumber = newNumber.replace(/\D/g, "")
    if (cleanNumber && !evolution.allowed_numbers.includes(cleanNumber)) {
      setEvolution((prev) => ({
        ...prev,
        allowed_numbers: [...prev.allowed_numbers, cleanNumber],
      }))
    }
    setNewNumber("")
  }

  const handleRemoveNumber = (number: string) => {
    setEvolution((prev) => ({
      ...prev,
      allowed_numbers: prev.allowed_numbers.filter((n) => n !== number),
    }))
  }

  const formatPhoneDisplay = (phone: string) => {
    if (phone.length === 13) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`
    }
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`
    }
    return phone
  }

  const handleTestWhatsApp = async (phoneNumber: string) => {
    setIsTestingWhatsApp(true)
    setWhatsappTestResult(null)
    try {
      const result = await whatsappApi.sendTestMessage(phoneNumber)
      setWhatsappTestResult(result)
    } catch (error) {
      setWhatsappTestResult({ success: false, message: "Erro ao enviar mensagem de teste" })
    } finally {
      setIsTestingWhatsApp(false)
    }
  }

  const handleSendReportNow = async () => {
    setIsSendingReport(true)
    setWhatsappTestResult(null)
    try {
      const result = await whatsappApi.sendReportNow()
      setWhatsappTestResult(result)
    } catch (error) {
      setWhatsappTestResult({ success: false, message: "Erro ao enviar relatório" })
    } finally {
      setIsSendingReport(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e integrações
        </p>
      </div>

      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget">Orçamento</TabsTrigger>
          <TabsTrigger value="meta">Meta API</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Configurações de Orçamento
              </CardTitle>
              <CardDescription>
                Defina limites e alertas para seu orçamento de campanhas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="monthlyBudget">Limite de Orçamento Mensal (R$)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  placeholder="5000"
                  value={budget.monthly_budget}
                  onChange={(e) =>
                    setBudget((prev) => ({
                      ...prev,
                      monthly_budget: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Alertas de Orçamento</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Alerta em 50%</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar ao atingir 50% do orçamento
                      </p>
                    </div>
                    <Switch
                      checked={budget.alerts.alert_50}
                      onCheckedChange={(checked) =>
                        setBudget((prev) => ({
                          ...prev,
                          alerts: { ...prev.alerts, alert_50: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Alerta em 80%</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar ao atingir 80% do orçamento
                      </p>
                    </div>
                    <Switch
                      checked={budget.alerts.alert_80}
                      onCheckedChange={(checked) =>
                        setBudget((prev) => ({
                          ...prev,
                          alerts: { ...prev.alerts, alert_80: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Alerta em 100%</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar ao atingir 100% do orçamento
                      </p>
                    </div>
                    <Switch
                      checked={budget.alerts.alert_100}
                      onCheckedChange={(checked) =>
                        setBudget((prev) => ({
                          ...prev,
                          alerts: { ...prev.alerts, alert_100: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Projeção de Excesso</p>
                      <p className="text-sm text-muted-foreground">
                        Alertar se projeção exceder o limite
                      </p>
                    </div>
                    <Switch
                      checked={budget.alerts.projection_excess}
                      onCheckedChange={(checked) =>
                        setBudget((prev) => ({
                          ...prev,
                          alerts: { ...prev.alerts, projection_excess: checked },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Integração Meta API
              </CardTitle>
              <CardDescription>
                Configure suas credenciais do Meta Marketing API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAAxxxxxxx..."
                  value={metaApi.access_token || ""}
                  onChange={(e) =>
                    setMetaApi((prev) => ({ ...prev, access_token: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha em{" "}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Graph API Explorer
                  </a>
                  {" "}com permissões: ads_read, ads_management, business_management
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessId">Business ID</Label>
                <Input
                  id="businessId"
                  placeholder="123456789"
                  value={metaApi.business_id || ""}
                  onChange={(e) =>
                    setMetaApi((prev) => ({ ...prev, business_id: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Encontre em business.facebook.com/settings → URL contém business_id=XXX
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adAccountId">Ad Account ID (padrão)</Label>
                <Input
                  id="adAccountId"
                  placeholder="act_123456789 ou 123456789"
                  value={metaApi.ad_account_id || ""}
                  onChange={(e) =>
                    setMetaApi((prev) => ({ ...prev, ad_account_id: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  ID da conta de anúncios padrão. Encontre em Gerenciador de Anúncios → ID na URL.
                  O seletor no topo ainda permite alternar entre contas.
                </p>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !metaApi.access_token}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    "Testar Conexão"
                  )}
                </Button>

                {testResult && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      testResult.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Integração WhatsApp (Evolution API)
              </CardTitle>
              <CardDescription>
                Configure o acesso ao agente via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Habilitar WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    Ative para permitir acesso ao agente via WhatsApp
                  </p>
                </div>
                <Switch
                  checked={evolution.enabled}
                  onCheckedChange={(checked) =>
                    setEvolution((prev) => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Credenciais da Evolution API</h4>

                <div className="space-y-2">
                  <Label htmlFor="evolutionUrl">URL da API</Label>
                  <Input
                    id="evolutionUrl"
                    placeholder="https://evolution.seudominio.com"
                    value={evolution.api_url || ""}
                    onChange={(e) =>
                      setEvolution((prev) => ({ ...prev, api_url: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evolutionKey">API Key</Label>
                  <Input
                    id="evolutionKey"
                    type="password"
                    placeholder="sua-api-key"
                    value={evolution.api_key || ""}
                    onChange={(e) =>
                      setEvolution((prev) => ({ ...prev, api_key: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evolutionInstance">Nome da Instância</Label>
                  <Input
                    id="evolutionInstance"
                    placeholder="minha-instancia"
                    value={evolution.instance || ""}
                    onChange={(e) =>
                      setEvolution((prev) => ({ ...prev, instance: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret (opcional)</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    placeholder="secret-para-validar-webhooks"
                    value={evolution.webhook_secret || ""}
                    onChange={(e) =>
                      setEvolution((prev) => ({ ...prev, webhook_secret: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Configure na Evolution: Webhook URL = {typeof window !== "undefined" ? window.location.origin.replace(":3000", ":8000") : "http://localhost:8000"}/api/whatsapp/webhook
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Números Permitidos</h4>
                  <p className="text-sm text-muted-foreground">
                    Apenas estes números poderão interagir com o agente. Deixe vazio para permitir todos.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="5511999999999"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddNumber()
                      }
                    }}
                  />
                  <Button variant="outline" onClick={handleAddNumber}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {evolution.allowed_numbers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {evolution.allowed_numbers.map((number) => (
                      <Badge key={number} variant="secondary" className="gap-1 pr-1">
                        {formatPhoneDisplay(number)}
                        <button
                          onClick={() => handleRemoveNumber(number)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {evolution.allowed_numbers.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum número adicionado. Todos os números poderão interagir.
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Testar Integração</h4>
                  <p className="text-sm text-muted-foreground">
                    Envie uma mensagem de teste ou relatório para verificar a configuração
                  </p>
                </div>

                {schedulerStatus && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status do Scheduler:</span>
                        <Badge variant={schedulerStatus.scheduler_running ? "default" : "secondary"}>
                          {schedulerStatus.scheduler_running ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Relatório Diário:</span>
                        <span>{schedulerStatus.daily_reports_enabled ? `Ativo (${schedulerStatus.report_time})` : "Desativado"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Alertas Imediatos:</span>
                        <span>{schedulerStatus.immediate_alerts_enabled ? "Ativados" : "Desativados"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Números Configurados:</span>
                        <span>{schedulerStatus.allowed_numbers_count}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {evolution.allowed_numbers.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => handleTestWhatsApp(evolution.allowed_numbers[0])}
                      disabled={isTestingWhatsApp || !evolution.enabled}
                    >
                      {isTestingWhatsApp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar Mensagem de Teste"
                      )}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleSendReportNow}
                    disabled={isSendingReport || !evolution.enabled || evolution.allowed_numbers.length === 0}
                  >
                    {isSendingReport ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Relatório Agora"
                    )}
                  </Button>
                </div>

                {whatsappTestResult && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      whatsappTestResult.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {whatsappTestResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {whatsappTestResult.message}
                  </div>
                )}

                {!evolution.enabled && (
                  <p className="text-sm text-amber-600">
                    Habilite o WhatsApp acima para testar a integração.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferências de Notificação
              </CardTitle>
              <CardDescription>
                Configure como e quando receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Relatórios Diários</p>
                    <p className="text-sm text-muted-foreground">
                      Receber resumo diário por email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.daily_reports}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, daily_reports: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Alertas Imediatos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar imediatamente sobre problemas
                    </p>
                  </div>
                  <Switch
                    checked={notifications.immediate_alerts}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, immediate_alerts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Sugestões de Otimização</p>
                    <p className="text-sm text-muted-foreground">
                      Receber sugestões de melhoria
                    </p>
                  </div>
                  <Switch
                    checked={notifications.optimization_suggestions}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        optimization_suggestions: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Mudanças de Status</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando campanhas mudarem de status
                    </p>
                  </div>
                  <Switch
                    checked={notifications.status_changes}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, status_changes: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportTime">Horário do Relatório Diário</Label>
                <Input
                  id="reportTime"
                  type="time"
                  value={notifications.report_time}
                  onChange={(e) =>
                    setNotifications((prev) => ({ ...prev, report_time: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Metas e Limites
              </CardTitle>
              <CardDescription>
                Defina metas de performance para suas campanhas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="conversionGoal">Meta de Conversões</Label>
                  <Input
                    id="conversionGoal"
                    type="number"
                    placeholder="100"
                    value={goals.conversion_goal ?? ""}
                    onChange={(e) =>
                      setGoals((prev) => ({
                        ...prev,
                        conversion_goal: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roasGoal">Meta de ROAS</Label>
                  <Input
                    id="roasGoal"
                    type="number"
                    step="0.1"
                    placeholder="3.0"
                    value={goals.roas_goal ?? ""}
                    onChange={(e) =>
                      setGoals((prev) => ({
                        ...prev,
                        roas_goal: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpcMax">CPC Máximo (R$)</Label>
                  <Input
                    id="cpcMax"
                    type="number"
                    step="0.01"
                    placeholder="2.00"
                    value={goals.cpc_max ?? ""}
                    onChange={(e) =>
                      setGoals((prev) => ({
                        ...prev,
                        cpc_max: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctrMin">CTR Mínimo (%)</Label>
                  <Input
                    id="ctrMin"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={goals.ctr_min ?? ""}
                    onChange={(e) =>
                      setGoals((prev) => ({
                        ...prev,
                        ctr_min: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between">
        {saveMessage && (
          <div
            className={`flex items-center gap-2 text-sm ${
              saveMessage.success ? "text-green-600" : "text-red-600"
            }`}
          >
            {saveMessage.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {saveMessage.message}
          </div>
        )}
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
