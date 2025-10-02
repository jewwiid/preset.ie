'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { PexelsPhoto } from '../../lib/types/playground'
import { isValidHexColor } from '../../lib/utils/playground'

interface PexelsSearchPanelProps {
  query: string
  results: PexelsPhoto[]
  loading: boolean
  page: number
  totalResults: number
  filters: {
    orientation: string
    size: string
    color: string
  }
  customHexColor: string
  showHexInput: boolean
  onQueryChange: (query: string) => void
  onFiltersChange: (filters: { orientation?: string; size?: string; color?: string }) => void
  onCustomHexColorChange: (color: string) => void
  onToggleHexInput: (show: boolean) => void
  onSelectPhoto: (photoUrl: string) => void
  onPrevPage: () => void
  onNextPage: () => void
  onGoToPage: (page: number) => void
}

export function PexelsSearchPanel({
  query,
  results,
  loading,
  page,
  totalResults,
  filters,
  customHexColor,
  showHexInput,
  onQueryChange,
  onFiltersChange,
  onCustomHexColorChange,
  onToggleHexInput,
  onSelectPhoto,
  onPrevPage,
  onNextPage,
  onGoToPage
}: PexelsSearchPanelProps) {
  const totalPages = Math.ceil(totalResults / 8)
  const maxVisiblePages = 5
  const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  const pages = []
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-ring focus:border-ring text-sm"
          placeholder="Search for stock photos... (searches as you type)"
        />
        {loading && (
          <div className="flex items-center px-3 py-2 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Searching...
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-3 gap-2">
        {/* Orientation Filter */}
        <select
          value={filters.orientation}
          onChange={(e) => onFiltersChange({ orientation: e.target.value })}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
        >
          <option value="">All orientations</option>
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
          <option value="square">Square</option>
        </select>

        {/* Size Filter */}
        <select
          value={filters.size}
          onChange={(e) => onFiltersChange({ size: e.target.value })}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
        >
          <option value="">All sizes</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>

        {/* Color Filter */}
        <div className="relative">
          {!showHexInput ? (
            <select
              value={filters.color}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  onToggleHexInput(true)
                  onFiltersChange({ color: '' })
                } else {
                  onFiltersChange({ color: e.target.value })
                  onCustomHexColorChange('')
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
            >
              <option value="">All colors</option>
              <option value="red">Red</option>
              <option value="orange">Orange</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
              <option value="turquoise">Turquoise</option>
              <option value="blue">Blue</option>
              <option value="violet">Violet</option>
              <option value="pink">Pink</option>
              <option value="brown">Brown</option>
              <option value="black">Black</option>
              <option value="gray">Gray</option>
              <option value="white">White</option>
              <option value="custom">Custom Hex</option>
            </select>
          ) : (
            <div className="flex gap-1">
              <input
                type="text"
                value={customHexColor}
                onChange={(e) => {
                  let value = e.target.value
                  if (value && !value.startsWith('#')) {
                    value = '#' + value
                  }
                  onCustomHexColorChange(value)
                }}
                placeholder="#FF0000"
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
                maxLength={7}
              />
              <Button
                type="button"
                onClick={() => {
                  onToggleHexInput(false)
                  onCustomHexColorChange('')
                  onFiltersChange({ color: '' })
                }}
                variant="outline"
                size="sm"
                className="h-9 px-2"
              >
                ×
              </Button>
            </div>
          )}

          {/* Color preview for custom hex */}
          {showHexInput && customHexColor && isValidHexColor(customHexColor) && (
            <div
              className="absolute right-10 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded border border-border"
              style={{ backgroundColor: customHexColor }}
              title={customHexColor}
            />
          )}
        </div>
      </div>

      {/* Results Container */}
      <div className="min-h-[280px]">
        {/* Results Header with Pagination */}
        <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <span>
                {totalResults.toLocaleString()} results for "{query}"
              </span>
            )}
            {loading && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {results.length > 0 && totalResults > 8 && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                onClick={onPrevPage}
                disabled={loading || page <= 1}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                ←
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {pages.map((i) => (
                  <Button
                    key={i}
                    type="button"
                    onClick={() => onGoToPage(i)}
                    disabled={loading}
                    variant={i === page ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                  >
                    {i}
                  </Button>
                ))}
              </div>

              <Button
                type="button"
                onClick={onNextPage}
                disabled={loading || page >= totalPages}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                →
              </Button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {results.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer"
                onClick={() => onSelectPhoto(photo.src.large2x || photo.src.large)}
              >
                <div className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <img
                    src={photo.src.medium}
                    alt={photo.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground opacity-0 group-hover:opacity-100 font-medium text-sm">
                      + Select
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="flex items-center justify-center h-48 text-center">
            <div>
              <p className="text-sm text-muted-foreground">No images found for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try different search terms or filters
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
