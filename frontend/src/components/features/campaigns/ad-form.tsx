"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2, Save, FileImage, Info, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { campaignsApi, type AdCreative } from "@/lib/api"
import { useAdAccount } from "@/contexts/ad-account-context"

interface AdFormProps {
  campaignId: string
  adSetId: string
  onSubmit?: (data: AdFormData) => Promise<void>
  onCancel?: () => void
  initialData?: Partial<AdFormData>
  className?: string
}

export interface AdFormData {
  name: string
  creative_id: string
  status: string
}

const statusOptions = [
  { value: "PAUSED", label: "Pausado" },
  { value: "ACTIVE", label: "Ativo" },
]

export function AdForm({
  campaignId,
  adSetId,
  onSubmit,
  onCancel,
  initialData,
  className,
}: AdFormProps) {
  const { selectedAccount } = useAdAccount()
  const [formData, setFormData] = useState<AdFormData>({
    name: initialData?.name || "",
    creative_id: initialData?.creative_id || "",
    status: initialData?.status || "PAUSED",
  })

  const [submitting, setSubmitting] = useState(false)
  const [loadingCreatives, setLoadingCreatives] = useState(true)
  const [creatives, setCreatives] = useState<AdCreative[]>([])
  const [useManualInput, setUseManualInput] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function loadCreatives() {
      try {
        setLoadingCreatives(true)
        const response = await campaignsApi.getCreatives(selectedAccount?.account_id)
        setCreatives(response.creatives || [])
        if (response.creatives.length === 0) {
          setUseManualInput(true)
        }
      } catch (error) {
        setUseManualInput(true)
      } finally {
        setLoadingCreatives(false)
      }
    }
    loadCreatives()
  }, [selectedAccount?.account_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onSubmit) return

    try {
      setSubmitting(true)
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = formData.name.trim() !== "" && formData.creative_id.trim() !== ""

  const filteredCreatives = creatives.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm)
  )

  const selectedCreative = creatives.find((c) => c.id === formData.creative_id)

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Informações do Anúncio
          </CardTitle>
          <CardDescription>
            Configure o nome e criativo do anúncio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Anúncio</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Anúncio Principal - Imagem 1"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="creative_id">Criativo</Label>
              {creatives.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => setUseManualInput(!useManualInput)}
                >
                  {useManualInput ? "Selecionar da lista" : "Inserir ID manualmente"}
                </Button>
              )}
            </div>

            {loadingCreatives ? (
              <div className="flex items-center gap-2 py-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando criativos...</span>
              </div>
            ) : useManualInput || creatives.length === 0 ? (
              <>
                <Input
                  id="creative_id"
                  value={formData.creative_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, creative_id: e.target.value }))}
                  placeholder="Ex: 123456789012345"
                />
                <p className="text-xs text-muted-foreground">
                  ID do criativo no Meta Ads Manager
                </p>
                {creatives.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Nenhum criativo encontrado</AlertTitle>
                    <AlertDescription>
                      Não foram encontrados criativos nesta conta.
                      Insira o ID manualmente ou crie criativos no Meta Ads Manager.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar criativos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Creative Grid */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {filteredCreatives.slice(0, 12).map((creative) => (
                    <div
                      key={creative.id}
                      className={cn(
                        "relative cursor-pointer rounded-xl border-2 p-2 transition-all hover:border-primary/50",
                        formData.creative_id === creative.id
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      )}
                      onClick={() => setFormData((prev) => ({ ...prev, creative_id: creative.id }))}
                    >
                      {creative.thumbnail_url || creative.image_url ? (
                        <div className="relative aspect-square overflow-hidden rounded">
                          <Image
                            src={creative.thumbnail_url || creative.image_url || ""}
                            alt={creative.name || "Creative"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded bg-muted">
                          <FileImage className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="mt-2 truncate text-xs font-medium">
                        {creative.name || "Sem nome"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {creative.object_type || "Creative"}
                      </p>
                    </div>
                  ))}
                </div>

                {filteredCreatives.length > 12 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Mostrando 12 de {filteredCreatives.length} criativos. Use a busca para filtrar.
                  </p>
                )}

                {filteredCreatives.length === 0 && searchTerm && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhum criativo encontrado para "{searchTerm}"
                  </p>
                )}

                {/* Selected Creative Info */}
                {selectedCreative && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-sm font-medium">
                      Selecionado: {selectedCreative.name || "Sem nome"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {selectedCreative.id} • Tipo: {selectedCreative.object_type || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Inicial</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={!isValid || submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Criar Anúncio
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
