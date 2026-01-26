"use client"

import { useState, useEffect } from "react"
import { Save, Key, Bell, Target, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  settingsApi,
  type Settings,
  type BudgetSettings,
  type MetaApiSettings,
  type NotificationSettings,
  type GoalsSettings,
} from "@/lib/api"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ success: boolean; message: string } | null>(null)

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

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setBudget(settings.budget)
        setMetaApi(settings.meta_api)
        setNotifications(settings.notifications)
        setGoals(settings.goals)
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
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

              <Separator />

              <p className="text-sm text-muted-foreground">
                As contas de anúncio são carregadas automaticamente do Business Manager.
                Use o seletor no topo da página para alternar entre elas.
              </p>

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
