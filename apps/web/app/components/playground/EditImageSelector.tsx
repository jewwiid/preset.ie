'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit3, Heart, Download, X } from 'lucide-react'
import { downloadImageWithWatermark } from '../../../lib/watermark-utils'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PlaygroundProject {
  id: string
  title: string
  prompt: string
  generated_images: Array<{
    url: string
    width: number
    height: number
  }>
}

interface EditImageSelectorProps {
  currentProject: PlaygroundProject | null
  selectedImage: string | null
  onSelectImage: (url: string | null) => void
  onSaveToGallery?: (url: string) => Promise<void>
  savingImage?: string | null
  subscriptionTier?: 'free' | 'plus' | 'pro'
}

export default function EditImageSelector({
  currentProject,
  selectedImage,
  onSelectImage,
  onSaveToGallery,
  savingImage = null,
  subscriptionTier = 'free'
}: EditImageSelectorProps) {
  const currentProjectImages = currentProject?.generated_images || []
  const hasCurrentImages = currentProjectImages.length > 0
  const { showSuccess, showError } = useToast()

  const handleSaveToGallery = async (imageUrl: string) => {
    if (!onSaveToGallery) return
    
    try {
      await onSaveToGallery(imageUrl)
      showSuccess(
        'Image Saved! 💖',
        'Your image has been saved to your gallery.',
        {
          label: 'View Gallery',
          onClick: () => {
            const galleryElement = document.querySelector('[data-saved-gallery]')
            if (galleryElement) {
              galleryElement.scrollIntoView({ behavior: 'smooth' })
            }
          }
        }
      )
    } catch (error) {
      showError(
        'Save Failed',
        'There was an error saving your image. Please try again.',
        {
          label: 'Retry',
          onClick: () => handleSaveToGallery(imageUrl)
        }
      )
    }
  }

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const watermarkSvg = await fetch('/brandkit-watermark.svg').then(res => res.text()).catch(() => '')
      const isPaidUser = subscriptionTier === 'plus' || subscriptionTier === 'pro'
      
      await downloadImageWithWatermark(
        imageUrl,
        filename,
        isPaidUser,
        watermarkSvg
      )
      
      showSuccess(
        'Download Complete! 📥',
        isPaidUser 
          ? 'Image downloaded successfully!' 
          : 'Image downloaded with watermark (upgrade to remove watermark)'
      )
    } catch (error) {
      console.error('Error downloading image:', error)
      showError(
        'Download Failed',
        'There was an error downloading the image. Please try again.'
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Image to Edit</CardTitle>
        <CardDescription>
          Choose an image from your current generation to edit
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasCurrentImages ? (
          <div className="space-y-4">
            {/* Unified Image Grid */}
            <div className="grid grid-cols-2 gap-4">
              {currentProjectImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative bg-muted border-2 border-dashed border-border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                    selectedImage === image.url 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'hover:ring-1 hover:ring-border'
                  }`}
                  style={{ 
                    aspectRatio: '1/1',
                    minHeight: '200px'
                  }}
                  onClick={() => onSelectImage(image.url)}
                >
                  <img
                    src={image.url}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image number badge */}
                  <div className="absolute top-2 left-2 bg-backdrop text-foreground text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                  
                  {/* Action buttons - always visible */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {onSaveToGallery && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveToGallery(image.url)
                        }}
                        disabled={savingImage === image.url}
                        title="Save to Gallery"
                      >
                        {savingImage === image.url ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadImage(image.url, `generated-image-${index + 1}.png`)
                      }}
                      title="Download Image"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {selectedImage === image.url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectImage(null)
                        }}
                        title="Deselect Image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {selectedImage === image.url && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="default" className="bg-primary">Selected</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <span>Dimensions: {currentProjectImages.find(img => img.url === selectedImage)?.width || 1024} × {currentProjectImages.find(img => img.url === selectedImage)?.height || 1024}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                <span>{currentProjectImages.length} image{currentProjectImages.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Edit3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>No images available for editing</p>
            <p className="text-sm">Generate some images first!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
