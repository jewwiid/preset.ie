/**
 * PexelsSearchPanel Component
 * Search and browse Pexels stock photos with filters and pagination
 */

'use client'

import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { PexelsPhoto, PexelsFilters } from '../lib/moodboardTypes'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface PexelsSearchPanelProps {
  query: string
  results: PexelsPhoto[]
  loading: boolean
  currentPage: number
  totalPages: number
  totalResults: number
  filters: PexelsFilters
  onQueryChange: (query: string) => void
  onFiltersChange: (filters: PexelsFilters) => void
  onSelectPhoto: (photo: PexelsPhoto) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

export const PexelsSearchPanel = ({
  query,
  results,
  loading,
  currentPage,
  totalPages,
  totalResults,
  filters,
  onQueryChange,
  onFiltersChange,
  onSelectPhoto,
  onPreviousPage,
  onNextPage
}: PexelsSearchPanelProps) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            placeholder="Search for stock photos... (searches as you type)"
          />
        </div>
        {loading && (
          <div className="flex items-center px-3 py-2 text-sm text-primary">
            <LoadingSpinner size="sm" />
            Searching...
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-3 gap-2">
        <select
          value={filters.orientation}
          onChange={(e) =>
            onFiltersChange({ ...filters, orientation: e.target.value as any })
          }
          className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="">All orientations</option>
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
          <option value="square">Square</option>
        </select>

        <select
          value={filters.size}
          onChange={(e) =>
            onFiltersChange({ ...filters, size: e.target.value as any })
          }
          className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="">All sizes</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>

        <select
          value={filters.color}
          onChange={(e) =>
            onFiltersChange({ ...filters, color: e.target.value })
          }
          className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
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
        </select>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Results count and pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {results.length} of {totalResults.toLocaleString()} results
              {query && ` for "${query}"`}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="p-2 rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                  {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={onNextPage}
                  disabled={currentPage === totalPages || loading}
                  className="p-2 rounded-md border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {results.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer"
                onClick={() => onSelectPhoto(photo)}
              >
                <div className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <img
                    src={photo.src.medium}
                    alt={photo.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">
                      + Add
                    </span>
                  </div>
                </div>

                {/* Photographer attribution */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-xs text-white truncate">
                    Photo by {photo.photographer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoadingSpinner size="sm" />
                Loading images...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No results found</p>
          <p className="text-sm text-muted-foreground">
            Try different keywords or adjust your filters
          </p>
        </div>
      )}

      {/* Initial state */}
      {!loading && !query && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Start searching for photos</p>
          <p className="text-sm text-muted-foreground">
            Enter a keyword to find free stock photos from Pexels
          </p>
        </div>
      )}

      {/* Pexels attribution */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
        Photos provided by{' '}
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Pexels
        </a>
      </div>
    </div>
  )
}
