"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X, Users, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { targetingApi, type Interest } from "@/lib/api"
import { cn } from "@/lib/utils"

interface InterestSearchProps {
  selectedInterests: Interest[]
  onSelect: (interest: Interest) => void
  onRemove: (interestId: string) => void
  className?: string
  placeholder?: string
}

function formatAudienceSize(lower: number, upper: number): string {
  const formatNumber = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toString()
  }

  return `${formatNumber(lower)} - ${formatNumber(upper)}`
}

export function InterestSearch({
  selectedInterests,
  onSelect,
  onRemove,
  className,
  placeholder = "Buscar interesses...",
}: InterestSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Interest[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const searchInterests = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      const response = await targetingApi.searchInterests(searchQuery)
      // Filter out already selected interests
      const selectedIds = new Set(selectedInterests.map((i) => i.id))
      setResults(response.interests.filter((i) => !selectedIds.has(i.id)))
    } catch (err) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [selectedInterests])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchInterests(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, searchInterests])

  const handleSelect = (interest: Interest) => {
    onSelect(interest)
    setQuery("")
    setResults([])
    setShowResults(false)
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedInterests.map((interest) => (
            <Badge
              key={interest.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{interest.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => onRemove(interest.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto shadow-lg">
          <ul className="py-1">
            {results.map((interest) => (
              <li key={interest.id}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                  onClick={() => handleSelect(interest)}
                >
                  <div>
                    <div className="font-medium">{interest.name}</div>
                    {interest.path?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {interest.path.join(" > ")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {formatAudienceSize(
                      interest.audience_size_lower_bound,
                      interest.audience_size_upper_bound
                    )}
                  </div>
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
            Nenhum interesse encontrado para "{query}"
          </div>
        </Card>
      )}
    </div>
  )
}
