"use client"

import { useState, useEffect, useRef } from "react"
import { Upload, ImageIcon, Grid3X3, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { campaignsApi, pagesApi, type AdCreative, type PageItem } from "@/lib/api"

export interface CreativeData {
  mode: "upload" | "existing"
  imageFile: File | null
  imagePreview: string | null
  page_id: string
  message: string
  headline: string
  link: string
  creative_id: string
  ad_name: string
}

interface CreativeStepProps {
  adAccountId: string
  creative: CreativeData
  onCreativeChange: (creative: CreativeData) => void
}

export function CreativeStep({ adAccountId, creative, onCreativeChange }: CreativeStepProps) {
  const [pages, setPages] = useState<PageItem[]>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [existingCreatives, setExistingCreatives] = useState<AdCreative[]>([])
  const [loadingCreatives, setLoadingCreatives] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPages()
  }, [])

  useEffect(() => {
    if (creative.mode === "existing") {
      fetchCreatives()
    }
  }, [creative.mode])

  const fetchPages = async () => {
    try {
      setLoadingPages(true)
      const response = await pagesApi.getAll()
      setPages(response.pages)
      if (response.pages.length === 1 && !creative.page_id) {
        onCreativeChange({ ...creative, page_id: response.pages[0].id })
      }
    } catch {
      // Pages may not be available
    } finally {
      setLoadingPages(false)
    }
  }

  const fetchCreatives = async () => {
    try {
      setLoadingCreatives(true)
      const response = await campaignsApi.getCreatives(adAccountId)
      setExistingCreatives(response.creatives)
    } catch {
      // Creatives may not be available
    } finally {
      setLoadingCreatives(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    onCreativeChange({
      ...creative,
      imageFile: file,
      imagePreview: preview,
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return

    const preview = URL.createObjectURL(file)
    onCreativeChange({
      ...creative,
      imageFile: file,
      imagePreview: preview,
    })
  }

  const handleRemoveImage = () => {
    if (creative.imagePreview) {
      URL.revokeObjectURL(creative.imagePreview)
    }
    onCreativeChange({
      ...creative,
      imageFile: null,
      imagePreview: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCreativeSelect = (c: AdCreative) => {
    onCreativeChange({
      ...creative,
      creative_id: c.id,
      ad_name: creative.ad_name || c.name || "",
    })
  }

  const filteredCreatives = existingCreatives.filter(
    (c) =>
      !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={creative.mode === "upload" ? "default" : "outline"}
          onClick={() => onCreativeChange({ ...creative, mode: "upload" })}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Novo Criativo
        </Button>
        <Button
          type="button"
          variant={creative.mode === "existing" ? "default" : "outline"}
          onClick={() => onCreativeChange({ ...creative, mode: "existing" })}
          className="flex-1"
        >
          <Grid3X3 className="h-4 w-4 mr-2" />
          Criativo Existente
        </Button>
      </div>

      {/* Ad Name (common to both modes) */}
      <div className="space-y-2">
        <Label htmlFor="ad_name">Nome do Anuncio</Label>
        <Input
          id="ad_name"
          value={creative.ad_name}
          onChange={(e) => onCreativeChange({ ...creative, ad_name: e.target.value })}
          placeholder="Ex: Anuncio Principal - Imagem 1"
        />
      </div>

      {creative.mode === "upload" ? (
        <div className="space-y-4">
          {/* Page Selector */}
          <div className="space-y-2">
            <Label>Pagina do Facebook</Label>
            {loadingPages ? (
              <div className="text-sm text-muted-foreground">Carregando paginas...</div>
            ) : pages.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhuma pagina encontrada. Verifique suas permissoes do Facebook.
              </div>
            ) : (
              <Select
                value={creative.page_id}
                onValueChange={(value) => onCreativeChange({ ...creative, page_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pagina" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Imagem do Anuncio</Label>
            {creative.imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-glass-border">
                <img
                  src={creative.imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-glass-border p-8 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arraste uma imagem ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG ou WebP (max 8 MB)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Ad Text Fields */}
          <div className="space-y-2">
            <Label htmlFor="message">Texto do Anuncio</Label>
            <Textarea
              id="message"
              value={creative.message}
              onChange={(e) => onCreativeChange({ ...creative, message: e.target.value })}
              placeholder="Texto principal que aparece acima da imagem..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Titulo (headline)</Label>
            <Input
              id="headline"
              value={creative.headline}
              onChange={(e) => onCreativeChange({ ...creative, headline: e.target.value })}
              placeholder="Titulo exibido abaixo da imagem"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link de Destino</Label>
            <Input
              id="link"
              type="url"
              value={creative.link}
              onChange={(e) => onCreativeChange({ ...creative, link: e.target.value })}
              placeholder="https://seusite.com/pagina"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar criativo por nome ou ID..."
              className="pl-10"
            />
          </div>

          {/* Creatives Grid */}
          {loadingCreatives ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Carregando criativos...
            </div>
          ) : filteredCreatives.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhum criativo encontrado. Crie um novo usando a opcao &quot;Novo Criativo&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
              {filteredCreatives.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCreativeSelect(c)}
                  className={`relative rounded-lg border-2 overflow-hidden transition-colors ${
                    creative.creative_id === c.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-glass-border hover:border-primary/50"
                  }`}
                >
                  {c.thumbnail_url || c.image_url ? (
                    <img
                      src={c.thumbnail_url || c.image_url}
                      alt={c.name || "Criativo"}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-24 bg-muted">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-1.5 text-xs truncate">{c.name || c.id}</div>
                </button>
              ))}
            </div>
          )}

          {/* Manual ID Input */}
          <div className="space-y-2">
            <Label htmlFor="creative_id">Ou insira o ID do criativo</Label>
            <Input
              id="creative_id"
              value={creative.creative_id}
              onChange={(e) => onCreativeChange({ ...creative, creative_id: e.target.value })}
              placeholder="ID do criativo existente"
            />
          </div>
        </div>
      )}
    </div>
  )
}
