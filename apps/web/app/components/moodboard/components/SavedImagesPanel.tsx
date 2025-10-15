/**
 * SavedImagesPanel Component
 * Browse and select from user's saved images
 */

'use client'

import { ImageIcon, Loader2 } from 'lucide-react'
import { SavedImage } from '../lib/moodboardTypes'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
interface SavedImagesPanelProps {
  images: SavedImage[]
  loading: boolean
  onSelectImage: (image: SavedImage) => void
}

export const SavedImagesPanel = ({
  images,
  loading,
  onSelectImage
}: SavedImagesPanelProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
        <span className="text-muted-foreground">Loading saved images...</span>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-foreground font-medium mb-2">No saved images yet</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Generate images in the playground or upload your own to see them here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Select from your {images.length} saved image{images.length !== 1 ? 's' : ''}
      </div>

      {/* Images grid */}
      <ScrollArea className="max-h-96">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
          {images.map((image) => (
          <div
            key={image.id}
            className="relative group cursor-pointer"
            onClick={() => onSelectImage(image)}
          >
            <AspectRatio ratio={1} className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-lg flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">
                  + Add
                </span>
              </div>
            </AspectRatio>

            {/* Image title */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-white truncate cursor-help">
                      {image.title}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{image.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
        </div>
      </ScrollArea>
    </div>
  )
}
