"use client"

import { useState, useEffect, useCallback } from "react"
import { MapPin, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { targetingApi, type Location } from "@/lib/api"
import { cn } from "@/lib/utils"

interface LocationSearchProps {
  selectedLocations: Location[]
  onSelect: (location: Location) => void
  onRemove: (locationKey: string) => void
  className?: string
  placeholder?: string
}

const locationTypeLabels: Record<string, string> = {
  country: "País",
  region: "Estado",
  city: "Cidade",
  zip: "CEP",
  geo_market: "Mercado",
}

const locationTypeFilters = [
  { value: "all", label: "Todos os tipos" },
  { value: "country", label: "Países" },
  { value: "region", label: "Estados/Regiões" },
  { value: "city", label: "Cidades" },
]

export function LocationSearch({
  selectedLocations,
  onSelect,
  onRemove,
  className,
  placeholder = "Buscar localização...",
}: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const searchLocations = useCallback(async (searchQuery: string, types?: string[]) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      const response = await targetingApi.searchLocations(searchQuery, types)
      // Filter out already selected locations
      const selectedKeys = new Set(selectedLocations.map((l) => l.key))
      setResults(response.locations.filter((l) => !selectedKeys.has(l.key)))
    } catch (err) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [selectedLocations])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const types = typeFilter === "all" ? undefined : [typeFilter]
      searchLocations(query, types)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, typeFilter, searchLocations])

  const handleSelect = (location: Location) => {
    onSelect(location)
    setQuery("")
    setResults([])
    setShowResults(false)
  }

  const formatLocationDisplay = (location: Location): string => {
    const parts = [location.name]
    if (location.region && location.type === "city") {
      parts.push(location.region)
    }
    if (location.country_name && location.type !== "country") {
      parts.push(location.country_name)
    }
    return parts.join(", ")
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Locations */}
      {selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLocations.map((location) => (
            <Badge
              key={location.key}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <MapPin className="h-3 w-3" />
              <span>{formatLocationDisplay(location)}</span>
              <span className="text-xs text-muted-foreground">
                ({locationTypeLabels[location.type] || location.type})
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => onRemove(location.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder={placeholder}
            className="pl-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locationTypeFilters.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto shadow-lg">
          <ul className="py-1">
            {results.map((location) => (
              <li key={location.key}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                  onClick={() => handleSelect(location)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{location.name}</div>
                      {(location.region || location.country_name) && (
                        <div className="text-xs text-muted-foreground">
                          {[location.region, location.country_name]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {locationTypeLabels[location.type] || location.type}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* No Results */}
      {showResults && query.length >= 2 && !loading && results.length === 0 && (
        <Card className="absolute z-50 mt-1 w-full shadow-lg">
          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
            Nenhuma localização encontrada para "{query}"
          </div>
        </Card>
      )}
    </div>
  )
}
