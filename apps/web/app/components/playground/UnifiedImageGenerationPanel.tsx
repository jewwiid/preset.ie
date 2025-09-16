'use client'

import { useState, useEffect, useRef } from 'react'
import { Wand2, Star, Users, Plus, Upload, Image as ImageIcon, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { useAuth } from '../../../lib/auth-context'

interface StylePreset {
  id: string
  name: string
  description?: string
  style_type: string
  prompt_template: string
  intensity: number
  usage_count: number
  is_public: boolean
}

interface UnifiedImageGenerationPanelProps {
  onGenerate: (params: {
    prompt: string
    style: string
    resolution: string
    consistencyLevel: string
    numImages: number
    customStylePreset?: StylePreset
    baseImage?: string
    generationMode?: 'text-to-image' | 'image-to-image'
  }) => Promise<void>
  onSettingsChange?: (settings: {
    resolution: string
    baseImageAspectRatio?: string
  }) => void
  loading: boolean
  userCredits: number
  userSubscriptionTier: string
  savedImages?: Array<{
    id: string
    image_url: string
    title: string
  }>
  onSelectSavedImage?: (imageUrl: string) => void
}

export default function UnifiedImageGenerationPanel({ 
  onGenerate, 
  onSettingsChange,
  loading, 
  userCredits,
  userSubscriptionTier,
  savedImages = [],
  onSelectSavedImage
}: UnifiedImageGenerationPanelProps) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [resolution, setResolution] = useState('1024')
  const [consistencyLevel, setConsistencyLevel] = useState('high')
  const [numImages, setNumImages] = useState(1)
  const [stylePresets, setStylePresets] = useState<StylePreset[]>([])
  const [selectedCustomPreset, setSelectedCustomPreset] = useState<StylePreset | null>(null)
  const [showCustomStyles, setShowCustomStyles] = useState(false)
  const [showCreateStyleDialog, setShowCreateStyleDialog] = useState(false)
  const [customStyleForm, setCustomStyleForm] = useState({
    name: '',
    description: '',
    styleType: '',
    promptTemplate: '',
    intensity: 1.0,
    isPublic: false
  })
  const [generationMode, setGenerationMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image')
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [baseImageSource, setBaseImageSource] = useState<'upload' | 'saved'>('upload')
  const [baseImageDimensions, setBaseImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Use ref to avoid stale closures
  const onSettingsChangeRef = useRef(onSettingsChange)
  onSettingsChangeRef.current = onSettingsChange

  useEffect(() => {
    if (user && session?.access_token) {
      fetchStylePresets()
    }
  }, [user, session])

  // Function to get image dimensions
  const getImageDimensions = (imageUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      img.src = imageUrl
    })
  }

  // Function to calculate aspect ratio from dimensions
  const calculateAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(width, height)
    const ratioWidth = width / divisor
    const ratioHeight = height / divisor
    
    // Handle common aspect ratios
    if (ratioWidth === ratioHeight) return '1:1'
    if (ratioWidth === 4 && ratioHeight === 3) return '4:3'
    if (ratioWidth === 3 && ratioHeight === 4) return '3:4'
    if (ratioWidth === 16 && ratioHeight === 9) return '16:9'
    if (ratioWidth === 9 && ratioHeight === 16) return '9:16'
    if (ratioWidth === 3 && ratioHeight === 2) return '3:2'
    if (ratioWidth === 2 && ratioHeight === 3) return '2:3'
    if (ratioWidth === 21 && ratioHeight === 9) return '21:9'
    
    return `${ratioWidth}:${ratioHeight}`
  }

  // Notify parent component when settings change
  useEffect(() => {
    if (onSettingsChangeRef.current) {
      const effectiveResolution = userSubscriptionTier === 'FREE' ? '1024' : resolution
      const baseImageAspectRatio = baseImageDimensions 
        ? calculateAspectRatio(baseImageDimensions.width, baseImageDimensions.height)
        : undefined
      
      onSettingsChangeRef.current({
        resolution: effectiveResolution,
        baseImageAspectRatio
      })
    }
  }, [resolution, userSubscriptionTier, baseImageDimensions])

  const fetchStylePresets = async () => {
    try {
      const response = await fetch('/api/playground/style-presets?includePublic=true', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      if (response.ok) {
        const { presets } = await response.json()
        setStylePresets(presets || [])
      }
    } catch (error) {
      console.error('Failed to fetch style presets:', error)
    }
  }

  const handleCreateCustomStyle = async () => {
    if (!session?.access_token) {
      showFeedback({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to create style presets.'
      })
      return
    }

    if (!customStyleForm.name || !customStyleForm.styleType || !customStyleForm.promptTemplate) {
      showFeedback({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please fill in all required fields (Name, Style Type, Prompt Template).'
      })
      return
    }

    try {
      const response = await fetch('/api/playground/style-presets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(customStyleForm)
      })

      if (!response.ok) throw new Error('Failed to create preset')
      
      setShowCreateStyleDialog(false)
      setCustomStyleForm({
        name: '',
        description: '',
        styleType: '',
        promptTemplate: '',
        intensity: 1.0,
        isPublic: false
      })
      fetchStylePresets()
      showFeedback({
        type: 'success',
        title: 'Preset Created',
        message: 'Style preset created successfully!'
      })
    } catch (error) {
      console.error('Failed to create preset:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Create Preset',
        message: 'Could not create the style preset. Please try again.'
      })
    }
  }

  const calculateResolution = (aspectRatio: string, baseResolution: string) => {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
    const baseSize = parseInt(baseResolution)
    
    // Calculate dimensions maintaining the aspect ratio
    const aspectRatioValue = widthRatio / heightRatio
    
    let width: number, height: number
    
    if (aspectRatioValue >= 1) {
      // Landscape or square
      width = baseSize
      height = Math.round(baseSize / aspectRatioValue)
    } else {
      // Portrait
      height = baseSize
      width = Math.round(baseSize * aspectRatioValue)
    }
    
    return `${width}*${height}`
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return
    }

    if (generationMode === 'image-to-image' && !baseImage) {
      showFeedback({
        type: 'error',
        title: 'Missing Base Image',
        message: 'Please upload or select a base image for image-to-image generation'
      })
      return
    }
    
    const effectiveResolution = userSubscriptionTier === 'FREE' ? '1024' : resolution
    const calculatedResolution = calculateResolution('1:1', effectiveResolution) // Always use 1:1 for generation
    
    await onGenerate({
      prompt,
      style: selectedCustomPreset ? selectedCustomPreset.style_type : style,
      resolution: calculatedResolution,
      consistencyLevel,
      numImages,
      customStylePreset: selectedCustomPreset || undefined,
      baseImage: generationMode === 'image-to-image' ? baseImage || undefined : undefined,
      generationMode
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      // Upload file to temporary storage for API compatibility
      try {
        const formData = new FormData()
        formData.append('image', file)
        
        const response = await fetch('/api/playground/upload-base-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('Failed to upload base image')
        }
        
        const { imageUrl } = await response.json()
        setBaseImage(imageUrl)
        setBaseImageSource('upload')
        
        // Get image dimensions
        try {
          const dimensions = await getImageDimensions(imageUrl)
          setBaseImageDimensions(dimensions)
          console.log('Base image dimensions:', dimensions)
        } catch (error) {
          console.error('Failed to get image dimensions:', error)
          setBaseImageDimensions(null)
        }
      } catch (error) {
        console.error('Failed to upload base image:', error)
        // Fallback to blob URL for preview
        const url = URL.createObjectURL(file)
        setBaseImage(url)
        setBaseImageSource('upload')
        
        try {
          const dimensions = await getImageDimensions(url)
          setBaseImageDimensions(dimensions)
          console.log('Base image dimensions:', dimensions)
        } catch (error) {
          console.error('Failed to get image dimensions:', error)
          setBaseImageDimensions(null)
        }
      }
    }
  }

  const removeBaseImage = async () => {
    if (baseImage) {
      // If it's an uploaded image (not a blob URL), we could clean it up
      // For now, just clear the state
      setBaseImage(null)
      setBaseImageDimensions(null)
    }
  }

  const selectSavedBaseImage = async (imageUrl: string) => {
    setBaseImage(imageUrl)
    setBaseImageSource('saved')
    
    // Get image dimensions for saved images too
    try {
      const dimensions = await getImageDimensions(imageUrl)
      setBaseImageDimensions(dimensions)
      console.log('Saved base image dimensions:', dimensions)
    } catch (error) {
      console.error('Failed to get saved image dimensions:', error)
      setBaseImageDimensions(null)
    }
  }

  const totalCredits = numImages * 2

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          Generate Images
        </CardTitle>
        <CardDescription>
          Create AI-generated images from text descriptions
        </CardDescription>
        {style && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Style: {selectedCustomPreset ? 
                `🎨 ${selectedCustomPreset.name}` :
                style === 'realistic' ? '📸 Realistic' : 
                style === 'artistic' ? '🎨 Artistic' :
                style === 'cartoon' ? '🎭 Cartoon' :
                style === 'anime' ? '🌸 Anime' :
                style === 'fantasy' ? '✨ Fantasy' : style}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={generationMode === 'text-to-image' ? "Describe the image you want to create..." : "Describe how you want to modify the base image..."}
            rows={3}
          />
        </div>

        {/* Generation Mode Selection */}
        <div className="space-y-2">
          <Label>Generation Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={generationMode === 'text-to-image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenerationMode('text-to-image')}
            >
              Text to Image
            </Button>
            <Button
              variant={generationMode === 'image-to-image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenerationMode('image-to-image')}
            >
              Image to Image
            </Button>
          </div>
        </div>

        {/* Base Image Upload Section for Image-to-Image */}
        {generationMode === 'image-to-image' && (
          <div className="space-y-3">
            <Label>Base Image</Label>
            
            {/* Base Image Source Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={baseImageSource === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBaseImageSource('upload')}
              >
                Upload
              </Button>
              <Button
                variant={baseImageSource === 'saved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBaseImageSource('saved')}
                disabled={savedImages.length === 0}
              >
                Saved Images
              </Button>
            </div>

            {!baseImage ? (
              <>
                {/* Upload Section */}
                {baseImageSource === 'upload' && (
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
                      Upload a base image to modify
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Base Image
                    </Button>
                  </div>
                )}

                {/* Saved Images Section */}
                {baseImageSource === 'saved' && (
                  <div>
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
                            onClick={() => selectSavedBaseImage(image.image_url)}
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
                <div 
                  className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ 
                    aspectRatio: baseImageDimensions 
                      ? `${baseImageDimensions.width} / ${baseImageDimensions.height}`
                      : '1 / 1',
                    maxWidth: '100%',
                    width: '100%'
                  }}
                >
                  <img
                    src={baseImage}
                    alt="Base"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 z-10"
                  onClick={removeBaseImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute top-2 left-2 z-10">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                    {baseImageSource === 'upload' && 'Uploaded Image'}
                    {baseImageSource === 'saved' && 'Saved Image'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Base image {baseImageSource === 'upload' ? 'uploaded' : 'selected'} successfully
                  {baseImageDimensions && (
                    <span className="ml-2 font-medium">
                      ({baseImageDimensions.width} × {baseImageDimensions.height})
                    </span>
                  )}
                  {baseImageDimensions && (
                    <div className="mt-1 text-xs text-gray-400">
                      Aspect ratio: {calculateAspectRatio(baseImageDimensions.width, baseImageDimensions.height)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="style">Style</Label>
              <div className="flex gap-2">
                {userSubscriptionTier !== 'FREE' && (
                  <Dialog open={showCreateStyleDialog} onOpenChange={setShowCreateStyleDialog}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Custom Style</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <Input
                          value={customStyleForm.name}
                          onChange={(e) => setCustomStyleForm({ ...customStyleForm, name: e.target.value })}
                          placeholder="My Custom Style"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={customStyleForm.description}
                          onChange={(e) => setCustomStyleForm({ ...customStyleForm, description: e.target.value })}
                          placeholder="Describe this style..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Style Type *</label>
                        <Select value={customStyleForm.styleType} onValueChange={(value) => setCustomStyleForm({ ...customStyleForm, styleType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photorealistic">Photorealistic</SelectItem>
                            <SelectItem value="artistic">Artistic</SelectItem>
                            <SelectItem value="cartoon">Cartoon</SelectItem>
                            <SelectItem value="vintage">Vintage</SelectItem>
                            <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                            <SelectItem value="watercolor">Watercolor</SelectItem>
                            <SelectItem value="sketch">Sketch</SelectItem>
                            <SelectItem value="oil_painting">Oil Painting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Prompt Template *</label>
                        <Textarea
                          value={customStyleForm.promptTemplate}
                          onChange={(e) => setCustomStyleForm({ ...customStyleForm, promptTemplate: e.target.value })}
                          placeholder="Apply {style_type} style to this image..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Intensity</label>
                        <Input
                          type="number"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={customStyleForm.intensity}
                          onChange={(e) => setCustomStyleForm({ ...customStyleForm, intensity: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={customStyleForm.isPublic}
                          onChange={(e) => setCustomStyleForm({ ...customStyleForm, isPublic: e.target.checked })}
                        />
                        <label htmlFor="isPublic" className="text-sm">Make public</label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateStyleDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCustomStyle}>
                          Create Style
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                )}
                {userSubscriptionTier === 'FREE' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => showFeedback({
                      type: 'info',
                      title: 'Premium Feature',
                      message: 'Custom style creation is available for Plus and Pro subscribers. Upgrade to create your own styles!'
                    })}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create (Premium)
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomStyles(!showCustomStyles)}
                  className="text-xs"
                >
                  {showCustomStyles ? 'Hide' : 'Show'} Custom
                </Button>
              </div>
            </div>
            
            {!showCustomStyles ? (
              <Select value={style} onValueChange={(value) => {
                setStyle(value)
                setSelectedCustomPreset(null)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">📸 Realistic</SelectItem>
                  <SelectItem value="artistic">🎨 Artistic</SelectItem>
                  <SelectItem value="cartoon">🎭 Cartoon</SelectItem>
                  <SelectItem value="anime">🌸 Anime</SelectItem>
                  <SelectItem value="fantasy">✨ Fantasy</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <Select 
                  value={selectedCustomPreset?.id || ''} 
                  onValueChange={(value) => {
                    const preset = stylePresets.find(p => p.id === value)
                    setSelectedCustomPreset(preset || null)
                    if (preset) {
                      setStyle(preset.style_type)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select custom style preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {stylePresets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        <div className="flex items-center space-x-2">
                          <span>{preset.name}</span>
                          {preset.is_public && <Users className="h-3 w-3 text-blue-500" />}
                          <Badge variant="outline" className="text-xs">
                            {preset.style_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedCustomPreset && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800 font-medium">{selectedCustomPreset.name}</p>
                    <p className="text-xs text-blue-600">{selectedCustomPreset.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-blue-600">{selectedCustomPreset.usage_count} uses</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution</Label>
            {userSubscriptionTier !== 'FREE' ? (
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1024px (Standard)</SelectItem>
                  <SelectItem value="1536">1536px (High Quality)</SelectItem>
                  <SelectItem value="2048">2048px (Ultra Quality)</SelectItem>
                  <SelectItem value="3072">3072px (4K Quality)</SelectItem>
                  <SelectItem value="4096">4096px (Maximum Quality)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                  <span className="text-sm text-gray-600">1024px (Standard)</span>
                  <Badge variant="secondary" className="text-xs">
                    Free Tier
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs w-full"
                  onClick={() => showFeedback({
                    type: 'info',
                    title: 'Premium Feature',
                    message: 'Higher resolution options (1536px, 2048px, 3072px, 4096px) are available for Plus and Pro subscribers. Upgrade for better image quality!'
                  })}
                >
                  Upgrade for Higher Resolutions
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Number of Images: {numImages}</Label>
            <Slider
              value={[numImages]}
              onValueChange={(value) => setNumImages(Array.isArray(value) ? value[0] : value)}
              min={1}
              max={8}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Single</span>
              <span>Multiple</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consistency">Consistency Level</Label>
            <Select value={consistencyLevel} onValueChange={setConsistencyLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select consistency level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🎲 Low (More Variation)</SelectItem>
                <SelectItem value="medium">⚖️ Medium</SelectItem>
                <SelectItem value="high">🎯 High (Less Variation)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600">
              {consistencyLevel === 'low' && 'More creative variation, less predictable results'}
              {consistencyLevel === 'medium' && 'Balanced creativity and consistency'}
              {consistencyLevel === 'high' && 'More consistent results, less variation'}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex items-center justify-between w-full">
          <Badge variant="secondary" className="text-xs">
            Credits: {userCredits}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Cost: {totalCredits} credits ({numImages} × 2)
          </Badge>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim() || userCredits < totalCredits}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating... (5-30s)
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate {numImages} Image{numImages > 1 ? 's' : ''} ({totalCredits} credits)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
