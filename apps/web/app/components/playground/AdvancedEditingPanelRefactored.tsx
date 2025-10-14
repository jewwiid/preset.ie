'use client'

import { useState, useRef, useEffect } from 'react'
import { Wand2, Upload, X, Image as ImageIcon, Search, Loader2 } from 'lucide-react'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import UnifiedImageImportDialog, { ImportedImage } from '@/components/ui/image-import-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import EditControlPanel from './edit/EditControlPanel'

interface AdvancedEditingPanelProps {
  onEdit: (params: {
    imageUrl: string
    editType: string
    editPrompt: string
    strength: number
    referenceImage?: string
    attribution?: {
      source: 'pexels' | 'url' | 'upload' | 'saved';
      photographer?: string;
      photographer_url?: string;
      photographer_id?: number;
      original_url?: string;
    } | null
  }) => Promise<void>
  loading: boolean
  selectedImage: string | null
  savedImages?: Array<{
    id: string
    image_url: string
    title: string
    width: number
    height: number
  }>
  onSelectSavedImage?: (imageUrl: string) => void
  onImageUpload?: (file: File) => Promise<string>
}

export default function AdvancedEditingPanelRefactored({ 
  onEdit, 
  loading, 
  selectedImage,
  savedImages = [],
  onSelectSavedImage,
  onImageUpload
}: AdvancedEditingPanelProps) {
  const [editType, setEditType] = useState('enhance')
  const [editPrompt, setEditPrompt] = useState('')
  const [editStrength, setEditStrength] = useState(0.8)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageSource, setReferenceImageSource] = useState<'upload' | 'saved'>('upload')
  const [imageSource, setImageSource] = useState<'upload' | 'saved' | 'pexels'>('saved')
  const [imageAttribution, setImageAttribution] = useState<{
    source: 'pexels' | 'url' | 'upload' | 'saved';
    photographer?: string;
    photographer_url?: string;
    photographer_id?: number;
    original_url?: string;
  } | null>(null)
  
  // Pexels state
  const [pexelsQuery, setPexelsQuery] = useState('')
  const [pexelsResults, setPexelsResults] = useState<any[]>([])
  const [pexelsPage, setPexelsPage] = useState(1)
  const [pexelsLoading, setPexelsLoading] = useState(false)
  const [pexelsTotalResults, setPexelsTotalResults] = useState(0)
  const [pexelsFilters, setPexelsFilters] = useState({
    orientation: '',
    size: '',
    color: ''
  })
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Import dialog state
  const [showBaseImageImport, setShowBaseImageImport] = useState(false)
  const [showReferenceImageImport, setShowReferenceImageImport] = useState(false)

  // Create source images for mention system
  const sourceImages = [
    ...savedImages.map(img => ({
      id: img.id,
      url: img.image_url,
      type: 'saved',
      label: img.title
    })),
    ...(uploadedImage ? [{
      id: 'uploaded',
      url: uploadedImage,
      type: 'uploaded',
      label: 'Uploaded Image'
    }] : [])
  ]

  const handleBaseImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    if (!onImageUpload) {
      // Fallback to local URL if no upload handler provided
      const url = URL.createObjectURL(file)
      setUploadedImage(url)
      return
    }

    try {
      setUploadingImage(true)
      const uploadedUrl = await onImageUpload(file)
      setUploadedImage(uploadedUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      // Fallback to local URL
      const url = URL.createObjectURL(file)
      setUploadedImage(url)
    } finally {
      setUploadingImage(false)
    }
  }

  const removeUploadedImage = () => {
    if (uploadedImage) {
      if (uploadedImage.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage)
      }
      setUploadedImage(null)
    }
  }

  // Handle imported base image
  const handleBaseImageImported = (images: ImportedImage[]) => {
    if (images.length > 0) {
      const image = images[0]
      setUploadedImage(image.url)
      setImageSource(image.source === 'url' ? 'upload' : image.source)
      setImageAttribution(image.attribution || null)
    }
  }

  // Handle imported reference image
  const handleReferenceImageImported = (images: ImportedImage[]) => {
    if (images.length > 0) {
      const image = images[0]
      setReferenceImage(image.url)
      setReferenceImageSource(image.source === 'saved' ? 'saved' : 'upload')
    }
  }

  const selectPexelsImage = async (photo: any) => {
    const imageUrl = photo.src.large2x || photo.src.large || photo.src.medium
    setUploadedImage(imageUrl)
    setImageSource('pexels')
    
    // Store attribution information
    setImageAttribution({
      source: 'pexels',
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      photographer_id: photo.photographer_id,
      original_url: photo.url,
    })
  }

  return (
    <>
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Wand2 className="h-5 w-5 mr-2" />
          Advanced Editing
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Image Source Selection */}
        <div className="space-y-2">
          <Label className="text-sm">Image Source</Label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button
            variant={imageSource === 'saved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setImageSource('saved')
              setImageAttribution(null)
            }}
          >
            Saved Images
          </Button>
          <Button
            variant={imageSource === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setImageSource('upload')
              setImageAttribution(null)
            }}
          >
            Upload Image
          </Button>
          <Button
            variant={imageSource === 'pexels' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setImageSource('pexels')}
          >
            Pexels
          </Button>
        </div>

        {/* Image Status */}
        {imageSource === 'saved' && selectedImage && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center text-sm text-primary">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Image selected from gallery
            </div>
            <div className="mt-1 text-xs text-primary">
              {savedImages.find(img => img.image_url === selectedImage)?.title || 'Selected image'}
            </div>
          </div>
        )}
        
        {imageSource === 'saved' && !selectedImage && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center text-sm text-primary">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Select an image from the gallery to edit
            </div>
          </div>
        )}

        {/* Saved Images Selection */}
        {imageSource === 'saved' && (
          <div className="mb-4">
            <Label className="text-sm">
              Select from Saved Images
            </Label>
            {savedImages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-border rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">No saved images available</p>
                <p className="text-xs text-muted-foreground mt-1">Save images from your generations to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {savedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${
                      selectedImage === image.image_url 
                        ? 'border-primary-500 ring-2 ring-primary-primary/30 shadow-lg' 
                        : 'border-border-200 hover:border-primary-300 hover:shadow-md'
                    }`}
                    onClick={() => onSelectSavedImage?.(image.image_url)}
                  >
                    <div 
                      className="relative"
                      style={{ 
                        aspectRatio: `${image.width}/${image.height}`,
                        maxHeight: '200px'
                      }}
                    >
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-primary-foreground">
                          <p className="text-xs font-medium truncate">{image.title}</p>
                          <p className="text-xs text-muted-foreground-300">{image.width} × {image.height}</p>
                        </div>
                      </div>
                      {selectedImage === image.image_url && (
                        <div className="absolute top-2 right-2 bg-primary-500 text-primary-foreground rounded-full p-1">
                          <ImageIcon className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {imageSource === 'upload' && uploadedImage && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center text-sm text-primary">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Image uploaded successfully
            </div>
          </div>
        )}

        {imageSource === 'upload' && !uploadedImage && (
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-md">
            <div className="flex items-center text-sm text-primary-800">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
              Upload an image to edit
            </div>
          </div>
        )}

        {imageSource === 'pexels' && uploadedImage && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center text-sm text-primary">
              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
              Image selected from Pexels
            </div>
            <div className="mt-1 text-xs text-primary">
              Selected image
            </div>
            {imageAttribution?.photographer && (
              <div className="mt-1 text-xs text-muted-foreground">
                Photo by {imageAttribution.photographer}
              </div>
            )}
          </div>
        )}
        
        {imageSource === 'pexels' && !uploadedImage && (
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-md">
            <div className="flex items-center text-sm text-primary-800">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
              Search and select an image from Pexels to edit
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Section */}
      {imageSource === 'upload' && (
        <div className="mb-4">
          <Label className="text-sm">
            Import Image to Edit
          </Label>

          {!uploadedImage ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowBaseImageImport(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Image to Edit
            </Button>
          ) : (
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Imported image for editing"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={removeUploadedImage}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute top-2 left-2">
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Imported Image
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground-500">
                Image imported successfully and ready for editing
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pexels Section - Keep existing implementation for now */}
      {imageSource === 'pexels' && (
        <div className="mb-4">
          <Label className="text-sm">
            Search Pexels Images
          </Label>
          
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground-400" />
              <Input
                type="text"
                placeholder="Search for images..."
                value={pexelsQuery}
                onChange={(e) => setPexelsQuery(e.target.value)}
                className="pl-10"
              />
              {pexelsLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            {/* Results */}
            {pexelsResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground-600">
                  Showing {pexelsResults.length} of {pexelsTotalResults.toLocaleString()} results for "{pexelsQuery}"
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {pexelsResults.map((photo) => (
                    <div key={photo.id} className="relative group cursor-pointer" onClick={() => selectPexelsImage(photo)}>
                      <img
                        src={photo.src.medium}
                        alt={photo.alt}
                        className="w-full h-32 object-cover rounded-lg border-2 border-transparent group-hover:border-primary-300 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-background rounded-full p-2">
                            <ImageIcon className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pexelsQuery && pexelsResults.length === 0 && !pexelsLoading && (
              <div className="text-center py-8 text-muted-foreground-500">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground-300" />
                <p className="text-sm">No images found for "{pexelsQuery}"</p>
                <p className="text-xs">Try different keywords or filters</p>
              </div>
            )}

            {!pexelsQuery && (
              <div className="text-center py-8 text-muted-foreground-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground-300" />
                <p className="text-sm">Search for images to edit</p>
                <p className="text-xs">Enter keywords to find stock photos</p>
              </div>
            )}
          </div>
        </div>
      )}
      </CardContent>
    </Card>

    {/* New Edit Control Panel */}
    <EditControlPanel
      onEdit={onEdit}
      loading={loading}
      selectedImage={selectedImage}
      uploadedImage={uploadedImage}
      referenceImage={referenceImage}
      editType={editType}
      editPrompt={editPrompt}
      editStrength={editStrength}
      onTypeChange={setEditType}
      onPromptChange={setEditPrompt}
      onStrengthChange={setEditStrength}
      onReferenceImageChange={setReferenceImage}
      sourceImages={sourceImages}
      attribution={imageAttribution}
    />

    {/* Base Image Import Dialog */}
    <UnifiedImageImportDialog
      open={showBaseImageImport}
      onOpenChange={setShowBaseImageImport}
      maxImages={1}
      multiSelect={false}
      onImagesSelected={handleBaseImageImported}
      enableFileUpload={true}
      enableUrlImport={true}
      enablePexelsSearch={true}
      enableSavedGallery={true}
      title="Import Base Image"
      description="Select an image to edit"
    />

    {/* Reference Image Import Dialog */}
    <UnifiedImageImportDialog
      open={showReferenceImageImport}
      onOpenChange={setShowReferenceImageImport}
      maxImages={1}
      multiSelect={false}
      onImagesSelected={handleReferenceImageImported}
      enableFileUpload={true}
      enableUrlImport={true}
      enablePexelsSearch={true}
      enableSavedGallery={true}
      title="Import Reference Image"
      description="Select a reference image for style transfer or face swap"
    />
    </>
  )
}
