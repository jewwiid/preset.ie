'use client'

import { useState, useRef, useEffect } from 'react'
import { Wand2, Upload, X, Image as ImageIcon, Search, Loader2 } from 'lucide-react'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AdvancedEditingPanelProps {
  onEdit: (params: {
    imageUrl: string
    editType: string
    editPrompt: string
    strength: number
    referenceImage?: string
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

export default function AdvancedEditingPanel({ 
  onEdit, 
  loading, 
  selectedImage,
  savedImages = [],
  onSelectSavedImage,
  onImageUpload
}: AdvancedEditingPanelProps) {
  const [editType, setEditType] = useState('enhance')
  
  // Clear reference image when edit type changes to one that doesn't require it
  const handleEditTypeChange = (newEditType: string) => {
    setEditType(newEditType)
    if (!requiresReferenceImage(newEditType) && referenceImage) {
      removeReferenceImage()
    }
  }
  const [editPrompt, setEditPrompt] = useState('')
  const [editStrength, setEditStrength] = useState(0.8)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageSource, setReferenceImageSource] = useState<'upload' | 'saved'>('upload')
  const [imageSource, setImageSource] = useState<'upload' | 'saved' | 'pexels'>('saved')
  
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
  const baseImageInputRef = useRef<HTMLInputElement>(null)

  const handleEdit = async () => {
    const imageToEdit = imageSource === 'upload' ? uploadedImage : selectedImage
    if (!imageToEdit || !editPrompt.trim()) {
      return
    }
    
    await onEdit({
      imageUrl: imageToEdit,
      editType,
      editPrompt,
      strength: editStrength,
      referenceImage: referenceImage || undefined
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setReferenceImage(url)
    }
  }

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

  const removeReferenceImage = () => {
    if (referenceImage) {
      if (referenceImageSource === 'upload') {
        URL.revokeObjectURL(referenceImage)
      }
      setReferenceImage(null)
    }
  }

  const selectSavedReferenceImage = (imageUrl: string) => {
    setReferenceImage(imageUrl)
    setReferenceImageSource('saved')
  }

  const removeUploadedImage = () => {
    if (uploadedImage) {
      if (uploadedImage.startsWith('blob:')) {
        URL.revokeObjectURL(uploadedImage)
      }
      setUploadedImage(null)
    }
  }

  const requiresReferenceImage = (type: string) => {
    return ['face_swap', 'style_transfer', 'gender_swap', 'age_progression'].includes(type)
  }

  const getCreditsForEditType = (type: string) => {
    const creditMap: { [key: string]: number } = {
      'enhance': 2,
      'inpaint': 3,
      'outpaint': 3,
      'style_transfer': 2,
      'face_swap': 4,
      'object_removal': 3,
      'background_removal': 2,
      'upscale': 1,
      'color_adjustment': 2,
      'texture_change': 2,
      'lighting_adjustment': 2,
      'perspective_change': 3,
      'composition_change': 3,
      'artistic_filter': 2,
      'age_progression': 3,
      'gender_swap': 4,
      'expression_change': 2
    }
    return creditMap[type] || 2
  }

  const getEditPromptPlaceholder = (type: string) => {
    const placeholders: { [key: string]: string } = {
      'enhance': 'Describe how to enhance the image (sharpness, contrast, quality)...',
      'inpaint': 'Describe what you want to add or remove in specific areas...',
      'outpaint': 'Describe how to extend the image beyond current boundaries...',
      'style_transfer': 'Choose a style (Baroque, Cyberpunk, Anime, Oil Painting, etc.)...',
      'face_swap': 'Describe the target face characteristics...',
      'object_removal': 'Select specific objects to remove...',
      'background_removal': 'Remove background automatically',
      'upscale': 'Enhance image resolution and quality',
      'color_adjustment': 'Describe color changes (warmer, cooler, vintage, etc.)...',
      'texture_change': 'Describe texture modifications (smooth, rough, metallic, etc.)...',
      'lighting_adjustment': 'Describe lighting changes (brighter, darker, golden hour, etc.)...',
      'perspective_change': 'Describe perspective modifications (bird\'s eye, worm\'s eye, etc.)...',
      'composition_change': 'Describe compositional changes (rule of thirds, centered, etc.)...',
      'artistic_filter': 'Choose artistic style (watercolor, sketch, cartoon, etc.)...',
      'age_progression': 'Describe age changes (younger, older, specific age)...',
      'gender_swap': 'Describe gender transformation...',
      'expression_change': 'Describe facial expression changes (happy, sad, surprised, etc.)...'
    }
    return placeholders[type] || 'Describe how you want to modify the image...'
  }

  const getEditTypeDescription = (type: string) => {
    const descriptions: { [key: string]: string } = {
      'enhance': 'Improve overall image quality, sharpness, and contrast',
      'inpaint': 'Add or remove specific elements within the image',
      'outpaint': 'Extend the image beyond its current boundaries',
      'style_transfer': 'Apply artistic styles like paintings or illustrations',
      'face_swap': 'Replace faces while maintaining natural proportions',
      'object_removal': 'Remove unwanted objects and fill the area naturally',
      'background_removal': 'Remove or replace the background',
      'upscale': 'Increase image resolution while maintaining quality',
      'color_adjustment': 'Modify colors, saturation, or color schemes',
      'texture_change': 'Modify surface textures and materials',
      'lighting_adjustment': 'Adjust lighting conditions and atmosphere',
      'perspective_change': 'Change viewing angle and perspective',
      'composition_change': 'Modify image composition and framing',
      'artistic_filter': 'Apply artistic filters and effects',
      'age_progression': 'Change age appearance realistically',
      'gender_swap': 'Transform gender while maintaining identity',
      'expression_change': 'Modify facial expressions and emotions'
    }
    return descriptions[type] || 'Modify the selected image'
  }

  const getEditButtonText = (type: string) => {
    const texts: { [key: string]: string } = {
      'enhance': 'Enhance',
      'inpaint': 'Inpaint',
      'outpaint': 'Outpaint',
      'style_transfer': 'Style Transfer',
      'face_swap': 'Face Swap',
      'object_removal': 'Remove Objects',
      'background_removal': 'Remove Background',
      'upscale': 'Upscale',
      'color_adjustment': 'Adjust Colors',
      'texture_change': 'Change Texture',
      'lighting_adjustment': 'Adjust Lighting',
      'perspective_change': 'Change Perspective',
      'composition_change': 'Change Composition',
      'artistic_filter': 'Apply Filter',
      'age_progression': 'Change Age',
      'gender_swap': 'Gender Swap',
      'expression_change': 'Change Expression'
    }
    return texts[type] || 'Edit'
  }

  // Pexels search functions
  const searchPexels = async (page = 1, append = false) => {
    if (!pexelsQuery.trim()) return

    setPexelsLoading(true)
    try {
      const response = await fetch('/api/moodboard/pexels/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: pexelsQuery,
          page: page,
          per_page: 20,
          ...(pexelsFilters.orientation && { orientation: pexelsFilters.orientation }),
          ...(pexelsFilters.size && { size: pexelsFilters.size }),
          ...(pexelsFilters.color && { color: pexelsFilters.color })
        })
      })

      if (!response.ok) throw new Error('Failed to search Pexels')
      const data = await response.json()

      if (append) {
        setPexelsResults(prev => [...prev, ...data.photos])
        setPexelsPage(prev => prev + 1)
      } else {
        setPexelsResults(data.photos)
        setPexelsPage(1)
      }
      setPexelsTotalResults(data.total_results)
    } catch (error) {
      console.error('Pexels search error:', error)
    } finally {
      setPexelsLoading(false)
    }
  }

  // Auto-search with debounce
  useEffect(() => {
    if (!pexelsQuery.trim()) {
      setPexelsResults([])
      setPexelsTotalResults(0)
      return
    }

    const timeoutId = setTimeout(() => {
      searchPexels(1, false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [pexelsQuery, pexelsFilters])

  const loadMorePexels = () => {
    if (!pexelsLoading && pexelsResults.length < pexelsTotalResults && pexelsQuery.trim()) {
      searchPexels(pexelsPage + 1, true)
    }
  }

  const selectPexelsImage = async (photo: any) => {
    const imageUrl = photo.src.large2x || photo.src.large || photo.src.medium
    setReferenceImage(imageUrl)
    setImageSource('pexels')
    
    try {
      const dimensions = await getImageDimensions(imageUrl)
      console.log('Pexels image dimensions:', dimensions)
    } catch (error) {
      console.error('Failed to get Pexels image dimensions:', error)
    }
  }

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = url
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
        Advanced Editing
      </h2>
      
      {/* Image Source Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Source
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button
            variant={imageSource === 'saved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setImageSource('saved')}
          >
            Saved Images
          </Button>
          <Button
            variant={imageSource === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setImageSource('upload')}
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
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center text-sm text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Image selected from gallery
            </div>
            <div className="mt-1 text-xs text-green-700">
              {savedImages.find(img => img.image_url === selectedImage)?.title || 'Selected image'}
            </div>
          </div>
        )}
        
        {imageSource === 'saved' && !selectedImage && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center text-sm text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Select an image from the gallery to edit
            </div>
          </div>
        )}

        {/* Saved Images Selection */}
        {imageSource === 'saved' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select from Saved Images
            </label>
            {savedImages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No saved images available</p>
                <p className="text-xs text-gray-400 mt-1">Save images from your generations to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {savedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${
                      selectedImage === image.image_url 
                        ? 'border-purple-500 ring-2 ring-purple-200 shadow-lg' 
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                    onClick={() => onSelectSavedImage?.(image.image_url)}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                          <p className="text-xs font-medium truncate">{image.title}</p>
                          <p className="text-xs text-gray-300">{image.width} × {image.height}</p>
                        </div>
                      </div>
                      {selectedImage === image.image_url && (
                        <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-1">
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
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center text-sm text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Image uploaded successfully
            </div>
          </div>
        )}

        {imageSource === 'upload' && !uploadedImage && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center text-sm text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Upload an image to edit
            </div>
          </div>
        )}

        {imageSource === 'pexels' && selectedImage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center text-sm text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Image selected from Pexels
            </div>
            <div className="mt-1 text-xs text-green-700">
              Selected image
            </div>
          </div>
        )}
        
        {imageSource === 'pexels' && !selectedImage && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center text-sm text-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Search and select an image from Pexels to edit
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Section */}
      {imageSource === 'upload' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image to Edit
          </label>
          
          {!uploadedImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                ref={baseImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleBaseImageUpload}
                className="hidden"
              />
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload an image to apply editing functions like background removal, upscale, etc.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => baseImageInputRef.current?.click()}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image to Edit
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Uploaded image for editing"
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
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Uploaded Image
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Image uploaded successfully and ready for editing
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pexels Section */}
      {imageSource === 'pexels' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Pexels Images
          </label>
          
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for images..."
                value={pexelsQuery}
                onChange={(e) => setPexelsQuery(e.target.value)}
                className="pl-10"
              />
              {pexelsLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={pexelsFilters.orientation}
                onValueChange={(value) => setPexelsFilters(prev => ({ ...prev, orientation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={pexelsFilters.size}
                onValueChange={(value) => setPexelsFilters(prev => ({ ...prev, size: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={pexelsFilters.color}
                onValueChange={(value) => setPexelsFilters(prev => ({ ...prev, color: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="turquoise">Turquoise</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results */}
            {pexelsResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Showing {pexelsResults.length} of {pexelsTotalResults.toLocaleString()} results for "{pexelsQuery}"
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {pexelsResults.map((photo) => (
                    <div key={photo.id} className="relative group cursor-pointer" onClick={() => selectPexelsImage(photo)}>
                      <img
                        src={photo.src.medium}
                        alt={photo.alt}
                        className="w-full h-32 object-cover rounded-lg border-2 border-transparent group-hover:border-purple-300 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white rounded-full p-2">
                            <ImageIcon className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pexelsResults.length < pexelsTotalResults && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMorePexels}
                    disabled={pexelsLoading}
                    className="w-full"
                  >
                    {pexelsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      `Load more (${(pexelsTotalResults - pexelsResults.length).toLocaleString()} remaining)`
                    )}
                  </Button>
                )}
              </div>
            )}

            {pexelsQuery && pexelsResults.length === 0 && !pexelsLoading && (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No images found for "{pexelsQuery}"</p>
                <p className="text-xs">Try different keywords or filters</p>
              </div>
            )}

            {!pexelsQuery && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Search for images to edit</p>
                <p className="text-xs">Enter keywords to find stock photos</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edit Type
          </label>
          <select
            value={editType}
            onChange={(e) => handleEditTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="enhance">✨ Enhance (2 credits)</option>
            <option value="inpaint">🎨 Inpaint (3 credits)</option>
            <option value="outpaint">🖼️ Outpaint (3 credits)</option>
            <option value="style_transfer">🎭 Style Transfer (2 credits)</option>
            <option value="face_swap">👤 Face Swap (4 credits)</option>
            <option value="object_removal">🗑️ Remove Objects (3 credits)</option>
            <option value="background_removal">🌅 Remove Background (2 credits)</option>
            <option value="upscale">📈 Upscale (1 credit)</option>
            <option value="color_adjustment">🌈 Adjust Colors (2 credits)</option>
            <option value="texture_change">🧱 Change Texture (2 credits)</option>
            <option value="lighting_adjustment">💡 Adjust Lighting (2 credits)</option>
            <option value="perspective_change">📐 Change Perspective (3 credits)</option>
            <option value="composition_change">🎯 Change Composition (3 credits)</option>
            <option value="artistic_filter">🎨 Apply Filter (2 credits)</option>
            <option value="age_progression">👴 Change Age (3 credits)</option>
            <option value="gender_swap">⚧ Gender Swap (4 credits)</option>
            <option value="expression_change">😊 Change Expression (2 credits)</option>
          </select>
          <p className="mt-1 text-xs text-gray-600">
            {getEditTypeDescription(editType)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edit Prompt
          </label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={getEditPromptPlaceholder(editType)}
            rows={3}
          />
        </div>

        {/* Reference Image Upload Section */}
        {requiresReferenceImage(editType) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Image <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              {editType === 'face_swap' && 'Upload a face image to swap with the main image (different from the image you selected above)'}
              {editType === 'style_transfer' && 'Upload an image with the desired artistic style to apply (different from the image you selected above)'}
              {editType === 'gender_swap' && 'Upload an image showing the target gender appearance (different from the image you selected above)'}
              {editType === 'age_progression' && 'Upload an image showing the target age appearance (different from the image you selected above)'}
            </p>
            
            {/* Reference Image Source Selection */}
            <div className="mb-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={referenceImageSource === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReferenceImageSource('upload')}
                >
                  Upload
                </Button>
                <Button
                  variant={referenceImageSource === 'saved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReferenceImageSource('saved')}
                  disabled={savedImages.length === 0}
                >
                  Saved Images
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {!referenceImage ? (
                <>
                  {/* Upload Section */}
                  {referenceImageSource === 'upload' && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {editType === 'face_swap' && 'Upload a clear face image to swap with the main image. Ensure good lighting and frontal view.'}
                        {editType === 'style_transfer' && 'Upload an image with the artistic style you want to apply. This could be a painting, artwork, or styled photo.'}
                        {editType === 'gender_swap' && 'Upload an image showing the target gender appearance you want to achieve.'}
                        {editType === 'age_progression' && 'Upload an image showing the target age appearance (younger or older).'}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Reference Image
                      </Button>
                    </div>
                  )}

                  {/* Saved Images Section */}
                  {referenceImageSource === 'saved' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select from Saved Images
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {savedImages.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No saved images available
                          </p>
                        ) : (
                          savedImages.map((image) => (
                            <div
                              key={image.id}
                              className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => selectSavedReferenceImage(image.image_url)}
                            >
                              <img
                                src={image.image_url}
                                alt={image.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{image.title}</p>
                              </div>
                              <Button size="sm" variant="outline">
                                Select
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={removeReferenceImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                      {referenceImageSource === 'upload' && 'Uploaded Image'}
                      {referenceImageSource === 'saved' && 'Saved Image'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Reference image {referenceImageSource === 'upload' ? 'uploaded' : 'selected'} successfully
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strength: {editStrength}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={editStrength}
            onChange={(e) => setEditStrength(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>


        <button
          onClick={handleEdit}
          disabled={loading || !editPrompt.trim() || (requiresReferenceImage(editType) && !referenceImage) || (imageSource === 'saved' && !selectedImage) || (imageSource === 'upload' && !uploadedImage) || (imageSource === 'pexels' && !selectedImage)}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Editing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              {getEditButtonText(editType)} ({getCreditsForEditType(editType)} credits)
            </>
          )}
        </button>
      </div>
    </div>
  )
}
