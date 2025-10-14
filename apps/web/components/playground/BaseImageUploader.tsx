'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { SavedImage, ImageDimensions } from '../../lib/types/playground'
import UnifiedImageImportDialog, { ImportedImage } from '@/components/ui/image-import-dialog'

interface BaseImageUploaderProps {
  baseImage: string | null
  baseImageSource: 'upload' | 'saved' | 'pexels' | null
  baseImageDimensions: ImageDimensions | null
  onBaseImageSelected: (image: ImportedImage) => void
  onRemoveBaseImage: () => void
}

export function BaseImageUploader({
  baseImage,
  baseImageSource,
  baseImageDimensions,
  onBaseImageSelected,
  onRemoveBaseImage}: BaseImageUploaderProps) {
  const [showImportDialog, setShowImportDialog] = useState(false)

  const handleImagesSelected = (images: ImportedImage[]) => {
    if (images.length > 0) {
      onBaseImageSelected(images[0]) // Only take first image for base image
    }
  }

  if (baseImage) {
    return (
      <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Base image {baseImageSource === 'upload' ? 'uploaded' : baseImageSource === 'pexels' ? 'from Pexels' : 'selected'}
            {baseImageDimensions && (
              <span className="text-xs text-muted-foreground ml-2">
                {baseImageDimensions.width}×{baseImageDimensions.height}
              </span>
            )}
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
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setShowImportDialog(true)}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Base Image
      </Button>

      <UnifiedImageImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        maxImages={1}
        multiSelect={false}
        onImagesSelected={handleImagesSelected}
        enableFileUpload={true}
        enableUrlImport={true}
        enablePexelsSearch={true}
        enableSavedGallery={true}
        title="Select Base Image"
        description="Choose an image to use as the base for img2img generation"
      />
    </>
  )
}
