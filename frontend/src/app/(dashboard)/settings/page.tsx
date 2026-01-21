"use client"

import { useState } from "react"
import { Save, Key, Bell, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Implement save settings
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
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
                  defaultValue="5000"
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
                    <Input type="checkbox" className="h-5 w-5" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Alerta em 80%</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar ao atingir 80% do orçamento
                      </p>
                    </div>
                    <Input type="checkbox" className="h-5 w-5" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Alerta em 100%</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar ao atingir 100% do orçamento
                      </p>
                    </div>
                    <Input type="checkbox" className="h-5 w-5" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Projeção de Excesso</p>
                      <p className="text-sm text-muted-foreground">
                        Alertar se projeção exceder o limite
                      </p>
                    </div>
                    <Input type="checkbox" className="h-5 w-5" defaultChecked />
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
                />
                <p className="text-xs text-muted-foreground">
                  Obtenha seu token em developers.facebook.com
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adAccountId">ID da Conta de Anúncios</Label>
                <Input
                  id="adAccountId"
                  placeholder="act_123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageId">ID da Página</Label>
                <Input
                  id="pageId"
                  placeholder="123456789"
                />
              </div>

              <Button variant="outline">
                Testar Conexão
              </Button>
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
                  <Input type="checkbox" className="h-5 w-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Alertas Imediatos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar imediatamente sobre problemas
                    </p>
                  </div>
                  <Input type="checkbox" className="h-5 w-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Sugestões de Otimização</p>
                    <p className="text-sm text-muted-foreground">
                      Receber sugestões de melhoria
                    </p>
                  </div>
                  <Input type="checkbox" className="h-5 w-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Mudanças de Status</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando campanhas mudarem de status
                    </p>
                  </div>
                  <Input type="checkbox" className="h-5 w-5" defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportTime">Horário do Relatório Diário</Label>
                <Input
                  id="reportTime"
                  type="time"
                  defaultValue="09:00"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roasGoal">Meta de ROAS</Label>
                  <Input
                    id="roasGoal"
                    type="number"
                    step="0.1"
                    placeholder="3.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpcMax">CPC Máximo (R$)</Label>
                  <Input
                    id="cpcMax"
                    type="number"
                    step="0.01"
                    placeholder="2.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctrMin">CTR Mínimo (%)</Label>
                  <Input
                    id="ctrMin"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
