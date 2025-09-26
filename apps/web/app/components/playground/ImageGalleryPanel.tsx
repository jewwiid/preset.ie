'use client'

import { useState } from 'react'
import { Wand2, Download, Save } from 'lucide-react'

interface GeneratedImage {
  url: string
  width: number
  height: number
  generated_at: string
  type?: string
}

interface ImageGalleryPanelProps {
  images: GeneratedImage[]
  selectedImage: string | null
  onSelectImage: (url: string | null) => void
  onSaveToGallery: (imageUrl: string) => Promise<void>
  savingImage: string | null
}

export default function ImageGalleryPanel({ 
  images,
  selectedImage,
  onSelectImage,
  onSaveToGallery,
  savingImage 
}: ImageGalleryPanelProps) {
  return (
    <div className="bg-background rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Generated Images</h2>
      
      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div 
              key={index}
              className={`relative group cursor-pointer rounded-lg overflow-hidden ${
                selectedImage === image.url ? 'ring-2 ring-primary-primary' : ''
              }`}
              onClick={() => onSelectImage(image.url)}
            >
              <img
                src={image.url}
                alt={`Generated image ${index + 1}`}
                className="w-full h-64 object-cover"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSaveToGallery(image.url)
                    }}
                    disabled={savingImage === image.url}
                    className="bg-background text-muted-foreground-800 px-3 py-1 rounded-md text-sm hover:bg-muted-100 flex items-center disabled:opacity-50"
                  >
                    {savingImage === image.url ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border-800 mr-1"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </button>
                  <a
                    href={image.url}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background text-muted-foreground-800 px-3 py-1 rounded-md text-sm hover:bg-muted-100 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </div>
              </div>

              {/* Image info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-primary-foreground p-2 text-xs">
                <div>{image.width} × {image.height}</div>
                <div>{image.type === 'video' ? 'Video' : 'Image'}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground-500">
          <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground-300" />
          <p>No images generated yet. Create your first image!</p>
        </div>
      )}
    </div>
  )
}
