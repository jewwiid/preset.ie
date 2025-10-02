'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, X } from 'lucide-react'
import { SavedImage, ImageDimensions } from '../../lib/types/playground'
import { PexelsSearchPanel } from './PexelsSearchPanel'

interface BaseImageUploaderProps {
  baseImage: string | null
  baseImageSource: 'upload' | 'saved' | 'pexels' | null
  baseImageDimensions: ImageDimensions | null
  savedImages: SavedImage[]
  uploading: boolean
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveBaseImage: () => void
  onSelectSavedImage: (imageUrl: string) => void
  onSelectBaseImageSource: (source: 'upload' | 'saved' | 'pexels') => void
  pexelsState: {
    query: string
    results: any[]
    loading: boolean
    page: number
    totalResults: number
    filters: any
    customHexColor: string
    showHexInput: boolean
    updateQuery: (query: string) => void
    updateFilters: (filters: any) => void
    updateCustomHexColor: (color: string) => void
    toggleHexInput: (show: boolean) => void
    prevPage: () => void
    nextPage: () => void
    goToPage: (page: number) => void
  }
  onSelectPexelsImage: (photoUrl: string) => void
}

export function BaseImageUploader({
  baseImage,
  baseImageSource,
  baseImageDimensions,
  savedImages,
  uploading,
  onFileUpload,
  onRemoveBaseImage,
  onSelectSavedImage,
  onSelectBaseImageSource,
  pexelsState,
  onSelectPexelsImage
}: BaseImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (baseImage) {
    return (
      <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-sm font-medium text-primary">
            Base image {baseImageSource === 'upload' ? 'uploaded' : baseImageSource === 'pexels' ? 'selected from Pexels' : 'selected'}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRemoveBaseImage}
          className="text-destructive border-destructive/20 hover:bg-destructive/5"
        >
          <X className="h-3 w-3 mr-1" />
          Remove
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Tabs
        value={baseImageSource || 'upload'}
        onValueChange={(value) => onSelectBaseImageSource(value as 'upload' | 'saved' | 'pexels')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedImages.length})</TabsTrigger>
          <TabsTrigger value="pexels">Pexels</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileUpload}
            className="hidden"
          />
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">
              {uploading ? 'Uploading...' : 'Click to upload base image'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or WEBP (max 10MB)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Base Image
          </Button>
        </TabsContent>

        {/* Saved Images Tab */}
        <TabsContent value="saved">
          <div>
            <div className="grid grid-cols-4 gap-3">
              {savedImages.length === 0 ? (
                <div className="col-span-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No saved images available
                  </p>
                </div>
              ) : (
                savedImages.slice(0, 8).map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-border transition-all"
                    onClick={() => onSelectSavedImage(image.image_url)}
                  >
                    <div className="aspect-square bg-muted">
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-backdrop opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-xs text-foreground font-medium truncate w-full">
                        {image.title}
                      </p>
                    </div>
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 border border-border-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
            {savedImages.length > 8 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Showing 8 of {savedImages.length} saved images
              </p>
            )}
          </div>
        </TabsContent>

        {/* Pexels Tab */}
        <TabsContent value="pexels">
          <PexelsSearchPanel
            query={pexelsState.query}
            results={pexelsState.results}
            loading={pexelsState.loading}
            page={pexelsState.page}
            totalResults={pexelsState.totalResults}
            filters={pexelsState.filters}
            customHexColor={pexelsState.customHexColor}
            showHexInput={pexelsState.showHexInput}
            onQueryChange={pexelsState.updateQuery}
            onFiltersChange={pexelsState.updateFilters}
            onCustomHexColorChange={pexelsState.updateCustomHexColor}
            onToggleHexInput={pexelsState.toggleHexInput}
            onSelectPhoto={onSelectPexelsImage}
            onPrevPage={pexelsState.prevPage}
            onNextPage={pexelsState.nextPage}
            onGoToPage={pexelsState.goToPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
