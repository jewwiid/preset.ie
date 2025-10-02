'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Image as ImageIcon, X } from 'lucide-react'
import DraggableImagePreview from '../../app/components/playground/DraggableImagePreview'
import { PexelsSearchPanel } from './PexelsSearchPanel'

interface VideoImageUploaderProps {
  currentImage: string | null
  activeSource: 'selected' | 'uploaded' | 'saved' | 'pexels'
  uploadedImage: string | null
  savedImages: Array<{
    id: string
    image_url: string
    title: string
  }>
  selectedImage: string | null
  aspectRatio: string
  resolution: string
  onSourceChange: (source: 'selected' | 'uploaded' | 'saved' | 'pexels') => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveUpload: () => void
  onSelectSaved: (imageUrl: string) => void
  onPositionChange?: (yPosition: number) => void
  pexelsState?: {
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
  onSelectPexelsImage?: (photoUrl: string) => void
}

export function VideoImageUploader({
  currentImage,
  activeSource,
  uploadedImage,
  savedImages,
  selectedImage,
  aspectRatio,
  resolution,
  onSourceChange,
  onFileUpload,
  onRemoveUpload,
  onSelectSaved,
  onPositionChange,
  pexelsState,
  onSelectPexelsImage
}: VideoImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      {/* Image Source Selection with Tabs */}
      <div className="space-y-2">
        <Label className="text-sm">Image Source</Label>
        <Tabs
          value={activeSource}
          onValueChange={(value) => onSourceChange(value as 'selected' | 'uploaded' | 'saved' | 'pexels')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="selected" disabled={!selectedImage}>
              Selected
            </TabsTrigger>
            <TabsTrigger value="uploaded">Upload</TabsTrigger>
            <TabsTrigger value="saved">
              Saved ({savedImages.length})
            </TabsTrigger>
            <TabsTrigger value="pexels">Pexels</TabsTrigger>
          </TabsList>

          {/* Selected Tab */}
          <TabsContent value="selected" className="mt-3">
            {selectedImage ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Using selected image for video generation
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                No image currently selected
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="uploaded" className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileUpload}
              className="hidden"
            />
            {!uploadedImage ? (
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Click to upload image
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  JPG, PNG, or WEBP (max 10MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-auto object-contain rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={onRemoveUpload}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Saved Images Tab */}
          <TabsContent value="saved" className="mt-3">
            <div className="grid grid-cols-4 gap-3">
              {savedImages.length === 0 ? (
                <div className="col-span-4 text-center py-8">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No saved images available</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate some images first!</p>
                </div>
              ) : (
                savedImages.slice(0, 8).map((image) => (
                  <div
                    key={image.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                      currentImage === image.image_url
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-transparent hover:border-border'
                    } transition-all`}
                    onClick={() => onSelectSaved(image.image_url)}
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
                    {currentImage === image.image_url && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Selected
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {savedImages.length > 8 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Showing 8 of {savedImages.length} saved images
              </p>
            )}
          </TabsContent>

          {/* Pexels Tab */}
          <TabsContent value="pexels" className="mt-3">
            {pexelsState && onSelectPexelsImage ? (
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
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Pexels search not available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
