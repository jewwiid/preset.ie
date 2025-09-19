'use client'

import { useState, useEffect, useRef } from 'react'
import { Wand2, Star, Users, Plus, Upload, Image as ImageIcon, X, Sparkles, Loader2, Camera, Film, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AspectRatioSelector from '../ui/AspectRatioSelector'
import PromptAnalysisModal from './PromptAnalysisModal'
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector'
import CinematicPromptLibrary from '../cinematic/CinematicPromptLibrary'
import { CinematicParameters } from '../../../../../packages/types/src/cinematic-parameters'
import CinematicPromptBuilder from '../../../../../packages/services/src/cinematic-prompt-builder'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { useAuth } from '../../../lib/auth-context'
import PresetSelector from './PresetSelector'
import { ImageProviderSelector } from '../ImageProviderSelector'

interface Preset {
  id: string
  name: string
  description?: string
  category: string
  prompt_template: string
  negative_prompt?: string
  style_settings: {
    style: string
    intensity: number
    consistency_level: string
    generation_mode?: 'text-to-image' | 'image-to-image'
  }
  technical_settings: {
    resolution: string
    aspect_ratio: string
    num_images: number
    quality?: string
  }
  ai_metadata: {
    model_version?: string
    generation_mode?: string
    migrated_from_style_preset?: boolean
    original_style_preset_id?: string
  }
  seedream_config: {
    model: string
    steps: number
    guidance_scale: number
    scheduler: string
  }
  usage_count: number
  is_public: boolean
  is_featured: boolean
  created_at: string
  creator: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
  }
}

interface UnifiedImageGenerationPanelProps {
  onGenerate: (params: {
    prompt: string
    style: string
    resolution: string
    consistencyLevel: string
    numImages: number
    customPreset?: Preset
    baseImage?: string
    generationMode?: 'text-to-image' | 'image-to-image'
    intensity?: number
    cinematicParameters?: Partial<CinematicParameters>
    enhancedPrompt?: string
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    selectedProvider?: 'nanobanana' | 'seedream'
  }) => Promise<void>
  onSettingsChange?: (settings: {
    resolution: string
    aspectRatio?: string
    baseImageAspectRatio?: string
    baseImageUrl?: string
    onRemoveBaseImage?: () => void
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
  selectedPreset?: Preset | null
}

export default function UnifiedImageGenerationPanel({ 
  onGenerate, 
  onSettingsChange,
  loading, 
  userCredits, 
  userSubscriptionTier, 
  savedImages = [], 
  onSelectSavedImage,
  selectedPreset
}: UnifiedImageGenerationPanelProps) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  
  const [prompt, setPrompt] = useState('Create a photorealistic image with natural lighting and detailed textures')
  const [style, setStyle] = useState('photorealistic')
  const [resolution, setResolution] = useState('1024')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [consistencyLevel, setConsistencyLevel] = useState('high')
  const [intensity, setIntensity] = useState(1.0)
  const [numImages, setNumImages] = useState(1)
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null)
  
  // Provider selection state
  const [selectedProvider, setSelectedProvider] = useState<'nanobanana' | 'seedream'>('nanobanana')
  const [showProviderSelector, setShowProviderSelector] = useState(false)
  
  // Analysis modal state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  
  // Cinematic mode state
  const [enableCinematicMode, setEnableCinematicMode] = useState(false)
  const [cinematicParameters, setCinematicParameters] = useState<Partial<CinematicParameters>>({})
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [showCinematicPreview, setShowCinematicPreview] = useState(false)
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true)
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true)
  const promptBuilder = useRef(new CinematicPromptBuilder())
  
  // Track if enhanced prompt is being manually edited
  const [isManuallyEditingEnhancedPrompt, setIsManuallyEditingEnhancedPrompt] = useState(false)
  
  // Update enhanced prompt when cinematic parameters change
  useEffect(() => {
    if (enableCinematicMode && prompt.trim() && !isManuallyEditingEnhancedPrompt) {
      const result = promptBuilder.current.constructPrompt({
        basePrompt: prompt,
        cinematicParameters,
        enhancementType: 'generate',
        includeTechnicalDetails,
        includeStyleReferences
      })
      setEnhancedPrompt(result.fullPrompt)
    } else if (!enableCinematicMode) {
      setEnhancedPrompt(prompt)
    }
  }, [prompt, cinematicParameters, enableCinematicMode, includeTechnicalDetails, includeStyleReferences, isManuallyEditingEnhancedPrompt])

  // Handle toggle changes from CinematicParameterSelector
  const handleToggleChange = (technicalDetails: boolean, styleReferences: boolean) => {
    setIncludeTechnicalDetails(technicalDetails)
    setIncludeStyleReferences(styleReferences)
  }
  
  // Context-aware prompts that adapt based on generation mode
  const getStylePrompt = (styleType: string, mode: 'text-to-image' | 'image-to-image') => {
    const prompts = {
      photorealistic: {
        'text-to-image': 'Create a photorealistic image with natural lighting and detailed textures',
        'image-to-image': 'Apply photorealistic rendering with natural lighting and detailed textures'
      },
      artistic: {
        'text-to-image': 'Create an artistic painting with creative brushstrokes and vibrant colors',
        'image-to-image': 'Apply an artistic painting style with creative brushstrokes and vibrant colors'
      },
      cartoon: {
        'text-to-image': 'Create a cartoon-style illustration with bold outlines and bright colors',
        'image-to-image': 'Transform into a cartoon-style illustration with bold outlines and bright colors'
      },
      vintage: {
        'text-to-image': 'Create a vintage aesthetic with retro colors and nostalgic atmosphere',
        'image-to-image': 'Apply a vintage aesthetic with retro colors and nostalgic atmosphere'
      },
      cyberpunk: {
        'text-to-image': 'Create a cyberpunk style with neon lights and futuristic elements',
        'image-to-image': 'Apply cyberpunk style with neon lights and futuristic elements'
      },
      watercolor: {
        'text-to-image': 'Create a watercolor painting with soft, flowing colors and translucent effects',
        'image-to-image': 'Apply watercolor painting technique with soft, flowing colors and translucent effects'
      },
      sketch: {
        'text-to-image': 'Create a pencil sketch with detailed line work and shading',
        'image-to-image': 'Convert to a pencil sketch style with detailed line work and shading'
      },
      oil_painting: {
        'text-to-image': 'Create an oil painting with rich textures and classical art style',
        'image-to-image': 'Apply oil painting technique with rich textures and classical art style'
      }
    }
    
    return prompts[styleType as keyof typeof prompts]?.[mode] || prompts.photorealistic[mode]
  }
  
  const [generationMode, setGenerationMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image')
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [isPromptModified, setIsPromptModified] = useState(false)
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [baseImageSource, setBaseImageSource] = useState<'upload' | 'saved' | 'pexels'>('upload')
  const [baseImageDimensions, setBaseImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
  
  // Use ref to avoid stale closures
  const onSettingsChangeRef = useRef(onSettingsChange)
  onSettingsChangeRef.current = onSettingsChange

  // Initialize original prompt on component mount
  useEffect(() => {
    if (!originalPrompt && prompt) {
      setOriginalPrompt(prompt)
    }
  }, [prompt, originalPrompt])



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
        : aspectRatio
      
      onSettingsChangeRef.current({
        resolution: effectiveResolution,
        aspectRatio,
        baseImageAspectRatio,
        baseImageUrl: baseImage || undefined,
        onRemoveBaseImage: baseImage ? removeBaseImage : undefined
      })
    }
  }, [resolution, userSubscriptionTier, baseImageDimensions, aspectRatio, baseImage])

  // Handle preset selection from parent component (comprehensive Preset)
  useEffect(() => {
    if (selectedPreset) {
      setCurrentPreset(selectedPreset)
      setStyle(selectedPreset.style_settings?.style || 'realistic')
      setPrompt(selectedPreset.prompt_template)
      setOriginalPrompt(selectedPreset.prompt_template)
      setIntensity(selectedPreset.style_settings?.intensity || 1.0)
      setConsistencyLevel(selectedPreset.style_settings?.consistency_level || 'high')
      setAspectRatio(selectedPreset.technical_settings?.aspect_ratio || '1:1')
      setResolution(selectedPreset.technical_settings?.resolution || '1024')
      setNumImages(selectedPreset.technical_settings?.num_images || 1)
      
      // Set generation mode if the preset specifies one
      if (selectedPreset.style_settings?.generation_mode) {
        setGenerationMode(selectedPreset.style_settings.generation_mode)
      }
      
      setIsPromptModified(false)
      
      // Clear the selected preset after applying it to avoid re-applying
      // This will be handled by the parent component
    }
  }, [selectedPreset])

  // Handle preset selection from PresetSelector
  const handlePresetSelect = (preset: Preset | null) => {
    setCurrentPreset(preset)
    
    if (preset) {
      // Apply preset settings
      setPrompt(preset.prompt_template)
      setStyle(preset.style_settings?.style || 'realistic')
      setIntensity(preset.style_settings?.intensity || 1.0)
      setConsistencyLevel(preset.style_settings?.consistency_level || 'high')
      setAspectRatio(preset.technical_settings?.aspect_ratio || '1:1')
      setResolution(preset.technical_settings?.resolution || '1024')
      setNumImages(preset.technical_settings?.num_images || 1)

      // Update settings for parent component
      if (onSettingsChange) {
        onSettingsChange({
          resolution: preset.technical_settings?.resolution || '1024',
          aspectRatio: preset.technical_settings?.aspect_ratio || '1:1'
        })
      }
    }
  }

  // Update prompt when generation mode changes (for regular styles)
  useEffect(() => {
    if (!currentPreset && !isPromptModified) {
      const newPrompt = getStylePrompt(style, generationMode)
      setPrompt(newPrompt)
      setOriginalPrompt(newPrompt)
    }
  }, [generationMode, style, currentPreset, isPromptModified])



  const calculateResolution = (aspectRatioValue: string, baseResolution: string) => {
    const [widthRatio, heightRatio] = aspectRatioValue.split(':').map(Number)
    const baseSize = parseInt(baseResolution)
    
    // Calculate dimensions maintaining the aspect ratio
    const aspectRatioNum = widthRatio / heightRatio
    
    let width: number, height: number
    
    if (aspectRatioNum >= 1) {
      // Landscape or square
      width = baseSize
      height = Math.round(baseSize / aspectRatioNum)
    } else {
      // Portrait
      height = baseSize
      width = Math.round(baseSize * aspectRatioNum)
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
    const calculatedResolution = calculateResolution(aspectRatio, effectiveResolution)
    
    await onGenerate({
      prompt: enableCinematicMode ? enhancedPrompt : prompt,
      style: currentPreset ? currentPreset.style_settings?.style || style : style,
      resolution: calculatedResolution,
      consistencyLevel,
      numImages,
      customPreset: currentPreset || undefined,
      baseImage: generationMode === 'image-to-image' ? baseImage || undefined : undefined,
      generationMode,
      intensity: intensity,
      cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
      enhancedPrompt: enableCinematicMode ? enhancedPrompt : undefined,
      includeTechnicalDetails: enableCinematicMode ? includeTechnicalDetails : undefined,
      includeStyleReferences: enableCinematicMode ? includeStyleReferences : undefined,
      selectedProvider: selectedProvider
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

  // Pexels search functions
  const searchPexels = async (page = 1, append = false) => {
    if (!pexelsQuery.trim()) return
    
    setPexelsLoading(true)
    
    try {
      const response = await fetch('/api/moodboard/pexels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: pexelsQuery,
          page,
          per_page: 12,
          ...(pexelsFilters.orientation && { orientation: pexelsFilters.orientation }),
          ...(pexelsFilters.size && { size: pexelsFilters.size }),
          ...(pexelsFilters.color && { color: pexelsFilters.color })
        })
      })
      
      if (!response.ok) throw new Error('Failed to search Pexels')
      
      const data = await response.json()
      
      if (page === 1 || !append) {
        setPexelsResults(data.photos)
        setPexelsPage(1)
      } else {
        setPexelsResults(prev => [...prev, ...data.photos])
        setPexelsPage(prev => prev + 1)
      }
      
      setPexelsTotalResults(data.total_results)
    } catch (error) {
      console.error('Pexels search error:', error)
    } finally {
      setPexelsLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (!pexelsQuery.trim()) {
      setPexelsResults([])
      setPexelsTotalResults(0)
      return
    }

    const timeoutId = setTimeout(() => {
      searchPexels(1, false)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [pexelsQuery, pexelsFilters])

  const loadMorePexels = () => {
    if (!pexelsLoading && pexelsResults.length < pexelsTotalResults && pexelsQuery.trim()) {
      searchPexels(pexelsPage + 1, true)
    }
  }

  const selectPexelsImage = async (photo: any) => {
    const imageUrl = photo.src.large2x || photo.src.large
    setBaseImage(imageUrl)
    setBaseImageSource('pexels')
    
    // Get image dimensions
    try {
      const dimensions = await getImageDimensions(imageUrl)
      setBaseImageDimensions(dimensions)
      console.log('Pexels base image dimensions:', dimensions)
    } catch (error) {
      console.error('Failed to get Pexels image dimensions:', error)
      setBaseImageDimensions(null)
    }
  }

  // Calculate credits based on selected provider
  const creditsPerImage = selectedProvider === 'seedream' ? 2 : 1
  const totalCredits = numImages * creditsPerImage

  return (
    <>
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
          <div className="mt-2 flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              Style: {currentPreset ? 
                `🎨 ${currentPreset.name}` :
                style === 'photorealistic' ? '📸 Photorealistic' : 
                style === 'artistic' ? '🎨 Artistic' :
                style === 'cartoon' ? '🎭 Cartoon' :
                style === 'vintage' ? '📻 Vintage' :
                style === 'cyberpunk' ? '🤖 Cyberpunk' :
                style === 'watercolor' ? '🎨 Watercolor' :
                style === 'sketch' ? '✏️ Sketch' :
                style === 'oil_painting' ? '🖼️ Oil Painting' : style}
            </Badge>
            {intensity !== 1.0 && (
              <Badge variant="secondary" className="text-xs">
                Intensity: {intensity}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              Provider: {selectedProvider === 'nanobanana' ? '🍌 NanoBanana' : '🌟 Seedream V4'}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      {/* Preset Selector */}
      <CardContent className="pb-4">
        <PresetSelector
          onPresetSelect={handlePresetSelect}
          selectedPreset={currentPreset}
          currentSettings={{
            prompt,
            style,
            resolution,
            aspectRatio,
            consistencyLevel,
            intensity,
            numImages
          }}
        />
      </CardContent>

      {/* Provider Selection */}
      <CardContent className="pb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">AI Provider</h3>
              <p className="text-xs text-muted-foreground">
                Choose your preferred image generation provider
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProviderSelector(!showProviderSelector)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showProviderSelector ? 'Hide' : 'Change'} Provider
            </Button>
          </div>
          
          {/* Current Provider Display */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">
                Using: {selectedProvider === 'nanobanana' ? '🍌 NanoBanana' : '🌟 Seedream V4'}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {creditsPerImage} credit{creditsPerImage !== 1 ? 's' : ''} per image
            </div>
          </div>

          {/* Provider Selection Modal */}
          {showProviderSelector && (
            <div className="p-4 border rounded-lg bg-white">
              <ImageProviderSelector
                selectedProvider={selectedProvider}
                onProviderChange={(provider) => {
                  setSelectedProvider(provider)
                  setShowProviderSelector(false)
                }}
                userCredits={userCredits}
              />
            </div>
          )}
        </div>
      </CardContent>
      
      <CardContent className="space-y-4">
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

        {/* Cinematic Mode Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-purple-600" />
              <Label className="text-base font-medium">Cinematic Mode</Label>
              {enableCinematicMode && (
                <Badge variant="secondary" className="text-xs">
                  <Camera className="h-3 w-3 mr-1" />
                  {Object.values(cinematicParameters).filter(v => v !== undefined).length} params
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Enable professional cinematic parameters for enhanced image generation
            </p>
          </div>
          <Switch
            checked={enableCinematicMode}
            onCheckedChange={setEnableCinematicMode}
          />
        </div>

        {/* Base Image Upload Section for Image-to-Image */}
        {generationMode === 'image-to-image' && (
          <div className="space-y-3">
            <Label>Base Image</Label>
            
            {/* Base Image Source Selection */}
            <div className="grid grid-cols-3 gap-2">
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
              <Button
                variant={baseImageSource === 'pexels' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBaseImageSource('pexels')}
              >
                Pexels
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
                      {savedImages.length === 0 ? (
                        <div className="col-span-full">
                          <p className="text-sm text-gray-500 text-center py-4">
                            No saved images available
                          </p>
                        </div>
                      ) : (
                        savedImages.map((image) => (
                          <div
                            key={image.id}
                            className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-300 transition-all"
                            onClick={() => selectSavedBaseImage(image.image_url)}
                          >
                            <div className="aspect-square bg-gray-100">
                              <img
                                src={image.image_url}
                                alt={image.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            
                            {/* Image title overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <p className="text-xs text-white font-medium truncate w-full">
                                {image.title}
                              </p>
                            </div>
                            
                            {/* Select indicator */}
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Pexels Section */}
                {baseImageSource === 'pexels' && (
                  <div className="space-y-3">
                    {/* Search Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pexelsQuery}
                        onChange={(e) => setPexelsQuery(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="Search for stock photos... (searches as you type)"
                      />
                      {pexelsLoading && (
                        <div className="flex items-center px-3 py-2 text-sm text-purple-600">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Searching...
                        </div>
                      )}
                    </div>
                    
                    {/* Filter Controls */}
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={pexelsFilters.orientation}
                        onChange={(e) => {
                          setPexelsFilters(prev => ({ ...prev, orientation: e.target.value }))
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">All orientations</option>
                        <option value="landscape">Landscape</option>
                        <option value="portrait">Portrait</option>
                        <option value="square">Square</option>
                      </select>
                      
                      <select
                        value={pexelsFilters.size}
                        onChange={(e) => {
                          setPexelsFilters(prev => ({ ...prev, size: e.target.value }))
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">All sizes</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                      
                      <select
                        value={pexelsFilters.color}
                        onChange={(e) => {
                          setPexelsFilters(prev => ({ ...prev, color: e.target.value }))
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                    {pexelsResults.length > 0 && (
                      <div>
                        {/* Results count */}
                        <div className="mb-3 text-sm text-gray-600">
                          Showing {pexelsResults.length} of {pexelsTotalResults.toLocaleString()} results for "{pexelsQuery}"
                        </div>
                        
                        {/* Photo grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                          {pexelsResults.map((photo) => (
                            <div key={photo.id} className="relative group cursor-pointer" onClick={() => selectPexelsImage(photo)}>
                              <div className="aspect-square overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <img
                                  src={photo.src.medium}
                                  alt={photo.alt}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                                  <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">+ Select</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Load more button */}
                        {pexelsResults.length < pexelsTotalResults && (
                          <div className="mt-3 text-center">
                            <Button
                              type="button"
                              onClick={loadMorePexels}
                              disabled={pexelsLoading}
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                              {pexelsLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Loading more...
                                </>
                              ) : (
                                `Load more (${(pexelsTotalResults - pexelsResults.length).toLocaleString()} remaining)`
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* No results message */}
                    {pexelsQuery && pexelsResults.length === 0 && !pexelsLoading && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No images found for "{pexelsQuery}"</p>
                        <p className="text-xs text-gray-400 mt-1">Try different search terms or filters</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-800">
                    Base image {baseImageSource === 'upload' ? 'uploaded' : baseImageSource === 'pexels' ? 'selected from Pexels' : 'selected'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeBaseImage}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Prompt Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt">
              Prompt {enableCinematicMode && (
                <span className="text-xs text-purple-600 ml-2">
                  (Enhanced with Cinematic Parameters)
                </span>
              )}
            </Label>
          </div>
          <Textarea
            id="prompt"
            value={enableCinematicMode ? enhancedPrompt : prompt}
            onChange={(e) => {
              if (enableCinematicMode) {
                setIsManuallyEditingEnhancedPrompt(true)
                setEnhancedPrompt(e.target.value)
                setPrompt(e.target.value)
              } else {
                setPrompt(e.target.value)
              }
              // Track if prompt has been modified from original
              setIsPromptModified(e.target.value !== originalPrompt)
            }}
            placeholder={generationMode === 'text-to-image' ? "Describe the image you want to create..." : "Describe how you want to modify the base image..."}
            rows={3}
          />
          {isPromptModified && (
            <p className="text-xs text-blue-600">
              💡 You've modified the prompt. Click "Save" in the Presets section above to create a comprehensive preset.
            </p>
          )}

          {/* Cinematic Parameters */}
          {enableCinematicMode && (
            <div className="space-y-4">
              <CinematicParameterSelector
                parameters={cinematicParameters}
                onParametersChange={setCinematicParameters}
                onToggleChange={handleToggleChange}
                compact={false}
                showAdvanced={true}
              />
              
              {/* Enhanced Prompt Preview */}
              {enhancedPrompt && enhancedPrompt !== prompt && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Enhanced Prompt (Editable)</Label>
                  <Textarea
                    value={enhancedPrompt}
                    onChange={(e) => {
                      setIsManuallyEditingEnhancedPrompt(true)
                      setEnhancedPrompt(e.target.value)
                      setPrompt(e.target.value) // Update the main prompt field too
                    }}
                    placeholder="Enhanced prompt with cinematic parameters..."
                    rows={3}
                    className="bg-muted"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCinematicPreview(!showCinematicPreview)}
                    >
                      {showCinematicPreview ? 'Hide' : 'Show'} Technical Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsManuallyEditingEnhancedPrompt(false)
                        // This will trigger the useEffect to regenerate the enhanced prompt
                      }}
                    >
                      Regenerate Enhanced Prompt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPrompt(enhancedPrompt)
                        setIsPromptModified(true)
                      }}
                    >
                      Use Enhanced Prompt
                    </Button>
                  </div>
                  
                  {showCinematicPreview && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <strong>Original:</strong> {prompt}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong>Enhanced:</strong> {enhancedPrompt}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong>Active Parameters:</strong> {Object.values(cinematicParameters).filter(v => v !== undefined).length}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cinematic Prompt Library */}
          {enableCinematicMode && (
            <div className="space-y-4">
              <CinematicPromptLibrary
                onTemplateSelect={(template) => {
                  setPrompt(template.base_prompt);
                  setCinematicParameters(template.cinematic_parameters);
                }}
                onDirectorSelect={(director) => {
                  setCinematicParameters(prev => ({
                    ...prev,
                    directorStyle: director.name.toLowerCase().replace(/\s+/g, '-') as any
                  }));
                }}
                onMoodSelect={(mood) => {
                  setCinematicParameters(prev => ({
                    ...prev,
                    sceneMood: mood.name.toLowerCase().replace(/\s+/g, '-') as any,
                    colorPalette: mood.color_palette as any,
                    lightingStyle: mood.lighting_style as any
                  }));
                }}
                compact={true}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select value={style} onValueChange={(value) => {
              setStyle(value)
              setCurrentPreset(null)
              // Prefill prompt with context-aware style prompt
              const newPrompt = getStylePrompt(value, generationMode)
              setPrompt(newPrompt)
              setOriginalPrompt(newPrompt)
              setIsPromptModified(false)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photorealistic">📸 Photorealistic</SelectItem>
                <SelectItem value="artistic">🎨 Artistic</SelectItem>
                <SelectItem value="cartoon">🎭 Cartoon</SelectItem>
                <SelectItem value="vintage">📻 Vintage</SelectItem>
                <SelectItem value="cyberpunk">🤖 Cyberpunk</SelectItem>
                <SelectItem value="watercolor">🎨 Watercolor</SelectItem>
                <SelectItem value="sketch">✏️ Sketch</SelectItem>
                <SelectItem value="oil_painting">🖼️ Oil Painting</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Display context-aware prompt for regular styles */}
            <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs text-gray-600">{getStylePrompt(style, generationMode)}</p>
            </div>
          </div>

          {/* Style Intensity Slider */}
          <div className="space-y-2">
            <Label htmlFor="intensity">Style Intensity: {intensity}</Label>
            <Slider
              value={[intensity]}
              onValueChange={(value) => setIntensity(Array.isArray(value) ? value[0] : value)}
              min={0.1}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtle (0.1)</span>
              <span>Default (1.0)</span>
              <span>Strong (2.0)</span>
            </div>
            <p className="text-xs text-gray-600">
              Controls how strongly the selected style is applied to your image
            </p>
          </div>

          {/* Aspect Ratio Selector */}
          <AspectRatioSelector
            value={aspectRatio}
            onChange={setAspectRatio}
            resolution={userSubscriptionTier === 'FREE' ? '1024' : resolution}
            onCustomDimensionsChange={(width, height) => {
              // Update settings when custom dimensions are used
              if (onSettingsChangeRef.current) {
                onSettingsChangeRef.current({
                  resolution: userSubscriptionTier === 'FREE' ? '1024' : resolution,
                  baseImageAspectRatio: `${width}:${height}`
                })
              }
            }}
          />
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

        </div>
      </CardContent>

      {/* Resolution and Consistency Level - 2 Column Row */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Resolution */}
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

          {/* Consistency Level */}
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
      </div>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex items-center justify-between w-full">
          <Badge variant="secondary" className="text-xs">
            Credits: {userCredits}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Cost: {totalCredits} credits ({numImages} × {creditsPerImage})
          </Badge>
        </div>
        <div className="flex gap-2">
          {/* Analysis Button */}
          {userSubscriptionTier !== 'FREE' && (
            <Button
              onClick={() => setShowAnalysisModal(true)}
              disabled={loading || !prompt.trim()}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Optimize Prompt
            </Button>
          )}
          
          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || userCredits < totalCredits}
            className={userSubscriptionTier !== 'FREE' ? "flex-1" : "w-full"}
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
                <Badge variant="secondary" className="ml-2 text-xs">
                  {aspectRatio}
                </Badge>
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>

    {/* Prompt Analysis Modal */}
    <PromptAnalysisModal
      isOpen={showAnalysisModal}
      onClose={() => setShowAnalysisModal(false)}
      imageUrl={baseImage || undefined}
      originalPrompt={prompt}
      style={currentPreset ? currentPreset.style_settings?.style || style : style}
      resolution={resolution}
      aspectRatio={aspectRatio}
      generationMode={generationMode}
      cinematicParameters={enableCinematicMode ? cinematicParameters : undefined}
      onApplyPrompt={(improvedPrompt) => {
        setPrompt(improvedPrompt)
        setShowAnalysisModal(false)
      }}
      onSaveAsPreset={(analysis) => {
        // Navigate to preset creation page with optimized prompt
        const queryParams = new URLSearchParams({
          name: `Optimized: ${analysis.recommendedPrompt.substring(0, 30)}...`,
          description: 'AI-optimized prompt based on analysis',
          prompt_template: analysis.recommendedPrompt,
          style: currentPreset ? currentPreset.style_settings?.style || style : style,
          resolution: resolution,
          aspect_ratio: aspectRatio,
          consistency_level: consistencyLevel,
          intensity: intensity.toString(),
          num_images: numImages.toString(),
          is_public: 'false'
        }).toString()
        
        window.location.href = `/presets/create?${queryParams}`
        setShowAnalysisModal(false)
      }}
      subscriptionTier={userSubscriptionTier as 'free' | 'plus' | 'pro'}
    />
  </>
  )
}
