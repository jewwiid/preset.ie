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
  cinematic_settings?: {
    enableCinematicMode?: boolean
    cinematicParameters?: any
    enhancedPrompt?: string
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    generationMode?: 'text-to-image' | 'image-to-image'
    selectedProvider?: 'nanobanana' | 'seedream'
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
  currentStyle?: string
  onStyleChange?: (style: string) => void
  generationMode?: 'text-to-image' | 'image-to-image'
  onGenerationModeChange?: (mode: 'text-to-image' | 'image-to-image') => void
  selectedProvider?: string
  onProviderChange?: (provider: string) => void
  consistencyLevel?: string
  onConsistencyChange?: (consistency: string) => void
}

export default function UnifiedImageGenerationPanel({ 
  onGenerate, 
  onSettingsChange,
  loading, 
  userCredits, 
  userSubscriptionTier, 
  savedImages = [], 
  onSelectSavedImage,
  selectedPreset,
  currentStyle,
  onStyleChange,
  generationMode,
  onGenerationModeChange,
  selectedProvider,
  onProviderChange,
  consistencyLevel,
  onConsistencyChange
}: UnifiedImageGenerationPanelProps) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  
  const [prompt, setPrompt] = useState('Create a photorealistic image with natural lighting and detailed textures')
  const [style, setStyle] = useState('photorealistic')
  const [resolution, setResolution] = useState('1024')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  // Use consistency level from props with fallback
  const currentConsistencyLevel = consistencyLevel || 'high'
  const [intensity, setIntensity] = useState(1.0)
  const [numImages, setNumImages] = useState(1)
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null)
  
  // Use provider from props with fallback
  const currentProvider = selectedProvider || 'nanobanana'
  
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
  
  // Handle style changes
  const handleStyleChange = (newStyle: string) => {
    setStyle(newStyle)
    setCurrentPreset(null)
    // Prefill prompt with context-aware style prompt
    const newPrompt = getStylePrompt(newStyle, currentGenerationMode)
    setPrompt(newPrompt)
    setOriginalPrompt(newPrompt)
    setIsPromptModified(false)
    
    // Notify parent component
    if (onStyleChange) {
      onStyleChange(newStyle)
    }
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
  
  const [localGenerationMode, setLocalGenerationMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image')
  
  // Use prop value if provided, otherwise use local state
  const currentGenerationMode = generationMode || localGenerationMode
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
  const [customHexColor, setCustomHexColor] = useState('')
  const [showHexInput, setShowHexInput] = useState(false)
  
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
      if (onConsistencyChange) {
        onConsistencyChange(selectedPreset.style_settings?.consistency_level || 'high')
      }
      setAspectRatio(selectedPreset.technical_settings?.aspect_ratio || '1:1')
      setResolution(selectedPreset.technical_settings?.resolution || '1024')
      setNumImages(selectedPreset.technical_settings?.num_images || 1)
      
      // Set generation mode if the preset specifies one
      if (selectedPreset.style_settings?.generation_mode) {
        if (onGenerationModeChange) {
          onGenerationModeChange(selectedPreset.style_settings.generation_mode)
        } else {
          setLocalGenerationMode(selectedPreset.style_settings.generation_mode)
        }
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
      if (onConsistencyChange) {
        onConsistencyChange(preset.style_settings?.consistency_level || 'high')
      }
      setAspectRatio(preset.technical_settings?.aspect_ratio || '1:1')
      setResolution(preset.technical_settings?.resolution || '1024')
      setNumImages(preset.technical_settings?.num_images || 1)
      
      // Apply cinematic settings if they exist
      if (preset.cinematic_settings) {
        setEnableCinematicMode(preset.cinematic_settings.enableCinematicMode || false)
        setCinematicParameters(preset.cinematic_settings.cinematicParameters || {})
        setEnhancedPrompt(preset.cinematic_settings.enhancedPrompt || '')
        setIncludeTechnicalDetails(preset.cinematic_settings.includeTechnicalDetails ?? true)
        setIncludeStyleReferences(preset.cinematic_settings.includeStyleReferences ?? true)
        if (onGenerationModeChange) {
          onGenerationModeChange(preset.cinematic_settings.generationMode || 'text-to-image')
        } else {
          setLocalGenerationMode(preset.cinematic_settings.generationMode || 'text-to-image')
        }
      }

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
      const newPrompt = getStylePrompt(style, currentGenerationMode)
      setPrompt(newPrompt)
      setOriginalPrompt(newPrompt)
    }
  }, [currentGenerationMode, style, currentPreset, isPromptModified])



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

    if (currentGenerationMode === 'image-to-image' && !baseImage) {
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
      consistencyLevel: currentConsistencyLevel,
      numImages,
      customPreset: currentPreset || undefined,
      baseImage: currentGenerationMode === 'image-to-image' ? baseImage || undefined : undefined,
      generationMode: currentGenerationMode,
      intensity: intensity,
      cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
      enhancedPrompt: enableCinematicMode ? enhancedPrompt : undefined,
      includeTechnicalDetails: enableCinematicMode ? includeTechnicalDetails : undefined,
      includeStyleReferences: enableCinematicMode ? includeStyleReferences : undefined,
      selectedProvider: currentProvider as 'nanobanana' | 'seedream'
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

  // Hex color validation
  const isValidHexColor = (hex: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)
  }

  // Pexels search functions
  const searchPexels = async (page = 1) => {
    if (!pexelsQuery.trim()) return
    
    setPexelsLoading(true)
    
    try {
      // Determine which color to use - custom hex or predefined color
      const colorValue = showHexInput && customHexColor && isValidHexColor(customHexColor) 
        ? customHexColor 
        : pexelsFilters.color

      const response = await fetch('/api/moodboard/pexels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: pexelsQuery,
          page,
          per_page: 8, // Show exactly 8 images (2 rows of 4)
          ...(pexelsFilters.orientation && { orientation: pexelsFilters.orientation }),
          ...(pexelsFilters.size && { size: pexelsFilters.size }),
          ...(colorValue && { color: colorValue })
        })
      })
      
      if (!response.ok) throw new Error('Failed to search Pexels')
      
      const data = await response.json()
      
        setPexelsResults(data.photos)
      setPexelsPage(page)
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
      setPexelsPage(1)
      return
    }

    const timeoutId = setTimeout(() => {
      searchPexels(1)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [pexelsQuery, pexelsFilters, customHexColor, showHexInput])

  // Pagination functions
  const goToPage = (page: number) => {
    if (!pexelsLoading && pexelsQuery.trim()) {
      searchPexels(page)
    }
  }

  const nextPage = () => {
    const totalPages = Math.ceil(pexelsTotalResults / 8)
    if (pexelsPage < totalPages) {
      goToPage(pexelsPage + 1)
    }
  }

  const prevPage = () => {
    if (pexelsPage > 1) {
      goToPage(pexelsPage - 1)
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Generate Images
        </CardTitle>
        <CardDescription>
          Create AI-generated images from text descriptions
        </CardDescription>
          </div>
          {/* Credits Info */}
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs">
              {userCredits} credits
            </Badge>
          </div>
        </div>
        
        {style && (
          <div className="mt-2 flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              Style: {currentPreset ? 
                `🎨 ${currentPreset.name}` :
                (currentStyle || style) === 'photorealistic' ? '📸 Photorealistic' : 
                (currentStyle || style) === 'artistic' ? '🎨 Artistic' :
                (currentStyle || style) === 'cartoon' ? '🎭 Cartoon' :
                (currentStyle || style) === 'vintage' ? '📻 Vintage' :
                (currentStyle || style) === 'cyberpunk' ? '🤖 Cyberpunk' :
                (currentStyle || style) === 'watercolor' ? '🎨 Watercolor' :
                (currentStyle || style) === 'sketch' ? '✏️ Sketch' :
                (currentStyle || style) === 'oil_painting' ? '🖼️ Oil Painting' : (currentStyle || style)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Provider: {currentProvider === 'nanobanana' ? '🍌 NanoBanana' : '🌊 Seedream'}
            </Badge>
            {intensity !== 1.0 && (
              <Badge variant="secondary" className="text-xs">
                Intensity: {intensity}
              </Badge>
            )}
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
            consistencyLevel: currentConsistencyLevel,
            intensity,
            numImages,
            // Cinematic parameters
            enableCinematicMode,
            cinematicParameters,
            enhancedPrompt,
            includeTechnicalDetails,
            includeStyleReferences,
            generationMode,
            selectedProvider: currentProvider as 'nanobanana' | 'seedream'
          }}
        />
      </CardContent>

      
      <CardContent className="space-y-4">
        {/* Top Row: Cinematic Mode + Provider Info */}
        <div className="grid grid-cols-2 gap-4">
          {/* Cinematic Mode */}
        <div className="space-y-2">
            <Label className="text-sm">Cinematic Mode</Label>
            <div className="flex items-center justify-between p-2 border rounded-lg bg-primary/5">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" />
                <span className="text-sm">Professional</span>
              {enableCinematicMode && (
                <Badge variant="secondary" className="text-xs">
                  {Object.values(cinematicParameters).filter(v => v !== undefined).length} params
                </Badge>
              )}
          </div>
          <Switch
            checked={enableCinematicMode}
            onCheckedChange={setEnableCinematicMode}
                className="scale-75"
          />
            </div>
          </div>

        </div>

        {/* Base Image Upload Section for Image-to-Image */}
        {currentGenerationMode === 'image-to-image' && (
          <div className="space-y-3" data-base-image-section>
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
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a base image to modify
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary border-primary/20 hover:bg-primary/5"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Base Image
                    </Button>
                  </div>
                )}

                {/* Saved Images Section */}
                {baseImageSource === 'saved' && (
                  <div>
                    <div className="grid grid-cols-4 gap-3">
                      {savedImages.length === 0 ? (
                        <div className="col-span-4">
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No saved images available
                          </p>
                        </div>
                      ) : (
                        // Show first 8 images in 2 rows of 4
                        savedImages.slice(0, 8).map((image) => (
                          <div
                            key={image.id}
                            className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-border transition-all"
                            onClick={() => selectSavedBaseImage(image.image_url)}
                          >
                            <div className="aspect-square bg-muted">
                              <img
                                src={image.image_url}
                                alt={image.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            
                            {/* Image title overlay */}
                            <div className="absolute inset-0 bg-backdrop opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <p className="text-xs text-foreground font-medium truncate w-full">
                                {image.title}
                              </p>
                            </div>
                            
                            {/* Select indicator */}
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                        className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-ring focus:border-ring text-sm"
                        placeholder="Search for stock photos... (searches as you type)"
                      />
                      {pexelsLoading && (
                        <div className="flex items-center px-3 py-2 text-sm text-primary">
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
                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
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
                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
                      >
                        <option value="">All sizes</option>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                      
                      <div className="relative">
                        {!showHexInput ? (
                      <select
                        value={pexelsFilters.color}
                        onChange={(e) => {
                              if (e.target.value === 'custom') {
                                setShowHexInput(true)
                                setPexelsFilters(prev => ({ ...prev, color: '' }))
                              } else {
                          setPexelsFilters(prev => ({ ...prev, color: e.target.value }))
                                setCustomHexColor('')
                              }
                        }}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
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
                            <option value="custom">Custom Hex</option>
                      </select>
                        ) : (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={customHexColor}
                              onChange={(e) => {
                                let value = e.target.value
                                // Auto-add # if not present
                                if (value && !value.startsWith('#')) {
                                  value = '#' + value
                                }
                                setCustomHexColor(value)
                              }}
                              placeholder="#FF0000"
                              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-ring focus:border-ring"
                              maxLength={7}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                setShowHexInput(false)
                                setCustomHexColor('')
                                setPexelsFilters(prev => ({ ...prev, color: '' }))
                              }}
                              variant="outline"
                              size="sm"
                              className="h-9 px-2"
                            >
                              ×
                            </Button>
                    </div>
                        )}
                        
                        {/* Color preview for custom hex */}
                        {showHexInput && customHexColor && isValidHexColor(customHexColor) && (
                          <div 
                            className="absolute right-10 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded border border-border"
                            style={{ backgroundColor: customHexColor }}
                            title={customHexColor}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Results Container - Fixed Height */}
                    <div className="min-h-[280px]">
                      {/* Results Header with Pagination */}
                      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                    {pexelsResults.length > 0 && (
                            <span>
                              {pexelsTotalResults.toLocaleString()} results for "{pexelsQuery}"
                            </span>
                          )}
                          {pexelsLoading && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Loading...</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Pagination Controls - Top Right */}
                        {pexelsResults.length > 0 && pexelsTotalResults > 8 && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              onClick={prevPage}
                              disabled={pexelsLoading || pexelsPage <= 1}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                            >
                              ←
                            </Button>
                            
                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                              {(() => {
                                const totalPages = Math.ceil(pexelsTotalResults / 8)
                                const maxVisiblePages = 5
                                const startPage = Math.max(1, pexelsPage - Math.floor(maxVisiblePages / 2))
                                const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                                
                                const pages = []
                                for (let i = startPage; i <= endPage; i++) {
                                  pages.push(
                                    <Button
                                      key={i}
                                      type="button"
                                      onClick={() => goToPage(i)}
                                      disabled={pexelsLoading}
                                      variant={i === pexelsPage ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 w-7 p-0 text-xs"
                                    >
                                      {i}
                                    </Button>
                                  )
                                }
                                return pages
                              })()}
                            </div>
                            
                            <Button
                              type="button"
                              onClick={nextPage}
                              disabled={pexelsLoading || pexelsPage >= Math.ceil(pexelsTotalResults / 8)}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                            >
                              →
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Results Content */}
                      {pexelsResults.length > 0 ? (
                        <div className="grid grid-cols-4 gap-3">
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
                      ) : (
                        <div className="flex items-center justify-center h-48 text-center">
                          <div>
                        <p className="text-sm text-muted-foreground">No images found for "{pexelsQuery}"</p>
                        <p className="text-xs text-muted-foreground mt-1">Try different search terms or filters</p>
                          </div>
                      </div>
                    )}
                    </div>
                  </div>
                )}
              </>
            ) : (
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
                  onClick={removeBaseImage}
                  className="text-destructive border-destructive/20 hover:bg-destructive/5"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Compact Prompt Field */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-sm">
              Prompt {enableCinematicMode && (
              <span className="text-xs text-primary ml-1">
                (Enhanced)
                </span>
              )}
            </Label>
          <Textarea
            id="prompt"
            data-prompt-field
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
            rows={2}
            className="text-sm"
          />
          {isPromptModified && (
            <p className="text-xs text-primary">
              💡 Modified prompt - save as preset above
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
                        // Clear the enhanced prompt to force regeneration
                        setEnhancedPrompt('')
                        // The useEffect will regenerate it on the next render
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

        </div>

        {/* Second Row: Style Intensity + Number of Images */}
        <div className="grid grid-cols-2 gap-4">
          {/* Style Intensity */}
          <div className="space-y-2">
            <Label htmlFor="intensity" className="text-sm">Intensity: {intensity}</Label>
            <Slider
              value={[intensity]}
              onValueChange={(value) => setIntensity(Array.isArray(value) ? value[0] : value)}
              min={0.1}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1</span>
              <span>1.0</span>
              <span>2.0</span>
            </div>
          </div>

          {/* Number of Images */}
          <div className="space-y-2">
            <Label className="text-sm">Images: {numImages}</Label>
            <Slider
              value={[numImages]}
              onValueChange={(value) => setNumImages(Array.isArray(value) ? value[0] : value)}
              min={1}
              max={8}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>8</span>
            </div>
          </div>
        </div>

        {/* Third Row: Aspect Ratio */}
        <div className="space-y-2">
          <Label className="text-sm">Aspect Ratio</Label>
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
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3">
        {/* Compact Cost Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Cost: {totalCredits} credits ({numImages} × {creditsPerImage})</span>
          <span>Aspect: {aspectRatio}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Analysis Button */}
          {userSubscriptionTier !== 'FREE' && (
            <Button
              onClick={() => setShowAnalysisModal(true)}
              disabled={loading || !prompt.trim()}
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-9"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Optimize
            </Button>
          )}
          
          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || userCredits < totalCredits}
            className={userSubscriptionTier !== 'FREE' ? "flex-1" : "w-full"}
            size="sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3 mr-2" />
                Generate {numImages} Image{numImages > 1 ? 's' : ''}
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
      generationMode={currentGenerationMode}
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
          consistency_level: currentConsistencyLevel,
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
