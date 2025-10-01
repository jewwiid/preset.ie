'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Wand2, Star, Users, Plus, Upload, Image as ImageIcon, X, Sparkles, Loader2, Camera, Film, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  likes_count: number
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
    customStylePreset?: Preset
    baseImage?: string
    generationMode?: 'text-to-image' | 'image-to-image'
    intensity?: number
    cinematicParameters?: Partial<CinematicParameters>
    enhancedPrompt?: string
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    selectedProvider?: 'nanobanana' | 'seedream'
    replaceLatestImages?: boolean
    userSubject?: string
  }) => Promise<void>
  onSettingsChange?: (settings: {
    resolution: string
    aspectRatio?: string
    baseImageAspectRatio?: string
    baseImageUrl?: string
    onRemoveBaseImage?: () => void
    // Additional context for regeneration
    generationMode?: 'text-to-image' | 'image-to-image'
    style?: string
    selectedProvider?: string
    consistencyLevel?: string
    prompt?: string
    enhancedPrompt?: string
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
  onPresetApplied?: () => void
  currentStyle?: string
  onStyleChange?: (style: string) => void
  generationMode?: 'text-to-image' | 'image-to-image'
  onGenerationModeChange?: (mode: 'text-to-image' | 'image-to-image') => void
  selectedProvider?: string
  onProviderChange?: (provider: string) => void
  consistencyLevel?: string
  onConsistencyChange?: (consistency: string) => void
  aspectRatio?: string
  onPromptChange?: (prompt: string) => void
  onEnhancedPromptChange?: (enhancedPrompt: string) => void
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
  onPresetApplied,
  currentStyle,
  onStyleChange,
  generationMode,
  onGenerationModeChange,
  selectedProvider,
  onProviderChange,
  consistencyLevel,
  onConsistencyChange,
  aspectRatio: propAspectRatio,
  onPromptChange,
  onEnhancedPromptChange
}: UnifiedImageGenerationPanelProps) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  
  const [prompt, setPromptState] = useState('')
  const [style, setStyle] = useState('')
  const [userSubject, setUserSubject] = useState<string>('')
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null)
  
  // Wrapper function for setPrompt that also calls onPromptChange
  const setPrompt = useCallback((newPrompt: string) => {
    setPromptState(newPrompt)
    if (onPromptChange) {
      onPromptChange(newPrompt)
    }
  }, [onPromptChange])
  
  // Force prompt to be empty on mount to override any state persistence
  useEffect(() => {
    console.log('🎯 Forcing prompt to empty on mount, current prompt:', prompt)
    // Only clear simple cinematic preset prompts, not enhanced ones
    if (prompt.includes('Cinematic preset:') && !prompt.includes('enhance the image with')) {
      console.log('🎯 Detected simple cinematic preset prompt, clearing it')
      setPrompt('')
    }
  }, [])
  
  // Additional override to ensure prompt stays empty (but not enhanced prompts)
  useEffect(() => {
    // Only clear if it's a simple cinematic preset prompt, not an enhanced one
    if (prompt.includes('Cinematic preset:') && !prompt.includes('enhance the image with')) {
      console.log('🎯 Additional override: clearing simple cinematic preset prompt')
      setPrompt('')
    }
  }, [prompt])

  // Check for preset from localStorage or URL parameters on mount
  useEffect(() => {
    const storedPreset = localStorage.getItem('selectedPreset')
    const urlParams = new URLSearchParams(window.location.search)
    const presetId = urlParams.get('preset')
    const presetName = urlParams.get('name')
    
    if (storedPreset) {
      try {
        const presetData = JSON.parse(storedPreset)
        console.log('🎯 Found stored preset:', presetData.name)
        
        // Create a Preset object from the stored data
        const presetObject: Preset = {
          id: presetData.id || 'local-preset',
          name: presetData.name || 'Unknown Preset',
          description: presetData.description || '',
          category: presetData.category || 'style',
          prompt_template: presetData.prompt_template || '',
          negative_prompt: presetData.negative_prompt || '',
          style_settings: presetData.style_settings || { style: '', intensity: 1.0, consistency_level: 'medium' },
          technical_settings: presetData.technical_settings || { resolution: '1024x1024', aspect_ratio: '1:1', num_images: 1 },
          ai_metadata: presetData.ai_metadata || {},
          seedream_config: presetData.seedream_config || { model: 'sd3', steps: 25, guidance_scale: 7.5, scheduler: 'ddim' },
          usage_count: presetData.usage_count || 0,
          likes_count: presetData.likes_count || 0,
          is_public: presetData.is_public || true,
          is_featured: presetData.is_featured || false,
          created_at: presetData.created_at || new Date().toISOString(),
          creator: presetData.creator || { id: 'system', display_name: 'System', handle: 'system' }
        }
        
        // Set the current preset
        setCurrentPreset(presetObject)
        
        // Apply the preset with subject replacement
        if (presetData.prompt_template) {
          let finalPrompt = presetData.prompt_template
          
          // Handle preset application based on generation mode
          if (currentGenerationMode === 'image-to-image') {
            // For image-to-image, replace {subject} with "this image" or remove it entirely
            if (presetData.prompt_template.includes('{subject}')) {
              finalPrompt = presetData.prompt_template.replace(/\{subject\}/g, 'this image')
            } else {
              finalPrompt = `${presetData.prompt_template} this image`
            }
          } else if (userSubject.trim() && presetData.prompt_template.includes('{subject}')) {
            // For text-to-image, replace {subject} placeholder with user's input ONLY if preset supports it
            finalPrompt = presetData.prompt_template.replace(/\{subject\}/g, userSubject.trim())
          }
          
          setPrompt(finalPrompt)
          setOriginalPrompt(finalPrompt)
        }
        
            if (presetData.style_settings?.style) {
              console.log('🎯 Setting style from preset:', presetData.style_settings.style)
              setStyle(presetData.style_settings.style)
              // Notify parent component
              if (onStyleChange) {
                onStyleChange(presetData.style_settings.style)
              }
            }
        
        if (presetData.technical_settings?.resolution) {
          setResolution(presetData.technical_settings.resolution)
        }
        
        if (presetData.technical_settings?.aspect_ratio) {
          setAspectRatio(presetData.technical_settings.aspect_ratio)
        }
        
        if (presetData.style_settings?.intensity) {
          setIntensity(presetData.style_settings.intensity)
        }
        
        if (presetData.style_settings?.consistency_level && onConsistencyChange) {
          onConsistencyChange(presetData.style_settings.consistency_level)
        }
        
        // Clear the stored preset so it doesn't apply again
        localStorage.removeItem('selectedPreset')
        
        console.log('🎯 Applied preset from localStorage:', presetData.name)
      } catch (error) {
        console.error('Error parsing stored preset:', error)
        localStorage.removeItem('selectedPreset')
      }
    } else if (presetId && presetName) {
      // Fetch preset data from API when URL parameters are present
      console.log('🎯 Found preset in URL, fetching from API:', { presetId, presetName })
      
      fetch('/api/presets')
        .then(response => response.json())
        .then(data => {
          if (data.presets) {
            const presetData = data.presets.find((p: any) => p.id === presetId)
            if (presetData) {
            console.log('🎯 Fetched preset from API:', presetData.name)
            
            // Create a Preset object from the API data
            const presetObject: Preset = {
              id: presetData.id,
              name: presetData.name,
              description: presetData.description || '',
              category: presetData.category || 'style',
              prompt_template: presetData.prompt_template || '',
              negative_prompt: presetData.negative_prompt || '',
              style_settings: presetData.style_settings || { style: '', intensity: 1.0, consistency_level: 'medium' },
              technical_settings: presetData.technical_settings || { resolution: '1024x1024', aspect_ratio: '1:1', num_images: 1 },
              ai_metadata: presetData.ai_metadata || {},
              seedream_config: presetData.seedream_config || { model: 'sd3', steps: 25, guidance_scale: 7.5, scheduler: 'ddim' },
              usage_count: presetData.usage_count || 0,
              likes_count: presetData.likes_count || 0,
              is_public: presetData.is_public || true,
              is_featured: presetData.is_featured || false,
              created_at: presetData.created_at || new Date().toISOString(),
              creator: presetData.creator || { id: 'system', display_name: 'System', handle: 'system' }
            }
            
            // Set the current preset
            setCurrentPreset(presetObject)
            
            // Apply the preset with subject replacement
            if (presetData.prompt_template) {
              let finalPrompt = presetData.prompt_template
              
              // Handle preset application based on generation mode
              if (currentGenerationMode === 'image-to-image') {
                // For image-to-image, replace {subject} with "this image" or remove it entirely
                if (presetData.prompt_template.includes('{subject}')) {
                  finalPrompt = presetData.prompt_template.replace(/\{subject\}/g, 'this image')
                } else {
                  finalPrompt = `${presetData.prompt_template} this image`
                }
              } else if (userSubject.trim() && presetData.prompt_template.includes('{subject}')) {
                // For text-to-image, replace {subject} placeholder with user's input ONLY if preset supports it
                finalPrompt = presetData.prompt_template.replace(/\{subject\}/g, userSubject.trim())
              }
              
              setPrompt(finalPrompt)
              setOriginalPrompt(finalPrompt)
            }
            
            if (presetData.style_settings?.style) {
              console.log('🎯 Setting style from API preset:', presetData.style_settings.style)
              setStyle(presetData.style_settings.style)
              // Notify parent component
              if (onStyleChange) {
                onStyleChange(presetData.style_settings.style)
              }
            }
            
            if (presetData.technical_settings?.resolution) {
              setResolution(presetData.technical_settings.resolution)
            }
            
            if (presetData.technical_settings?.aspect_ratio) {
              setAspectRatio(presetData.technical_settings.aspect_ratio)
            }
            
            if (presetData.style_settings?.intensity) {
              setIntensity(presetData.style_settings.intensity)
            }
            
            if (presetData.style_settings?.consistency_level && onConsistencyChange) {
              onConsistencyChange(presetData.style_settings.consistency_level)
            }
            
            console.log('🎯 Applied preset from API:', presetData.name)
            } else {
              console.error('Preset not found in API response:', presetId)
            }
          }
        })
        .catch(error => {
          console.error('Error fetching preset from API:', error)
        })
    }
  }, [onConsistencyChange, userSubject])

  // This useEffect will be moved after isUserTypingSubject is declared
  const [resolution, setResolution] = useState('1024')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  
  // Debug: Log when aspect ratio changes
  useEffect(() => {
    console.log('🎯 Aspect ratio state changed to:', aspectRatio)
  }, [aspectRatio])
  // Use consistency level from props with fallback
  const currentConsistencyLevel = consistencyLevel || 'high'
  const [intensity, setIntensity] = useState(1.0)
  const [numImages, setNumImages] = useState(1)
  const [replaceLatestImages, setReplaceLatestImages] = useState(true)
  
  // Use provider from props with fallback
  const currentProvider = selectedProvider || 'nanobanana'
  
  // Analysis modal state
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  
  // Cinematic mode state
  const [enableCinematicMode, setEnableCinematicMode] = useState(false)
  const [cinematicParameters, setCinematicParameters] = useState<Partial<CinematicParameters>>({})
  
  // Debug: Log when cinematic parameters change
  useEffect(() => {
    console.log('🎯 Cinematic parameters changed:', cinematicParameters)
  }, [cinematicParameters])

  // Use refs to prevent infinite loops
  const isUpdatingFromCinematic = useRef(false)
  const isUpdatingFromMain = useRef(false)

  // Sync cinematic aspect ratio with main aspect ratio selector
  useEffect(() => {
    if (enableCinematicMode && cinematicParameters.aspectRatio && cinematicParameters.aspectRatio !== aspectRatio && !isUpdatingFromMain.current) {
      console.log('🎯 Syncing main aspect ratio from cinematic parameters:', cinematicParameters.aspectRatio)
      isUpdatingFromCinematic.current = true
      setAspectRatio(cinematicParameters.aspectRatio)
      // Reset flag after state update
      setTimeout(() => {
        isUpdatingFromCinematic.current = false
      }, 0)
    }
  }, [cinematicParameters.aspectRatio, enableCinematicMode])

  // Sync main aspect ratio with cinematic parameters when cinematic mode is enabled
  useEffect(() => {
    if (enableCinematicMode && aspectRatio && cinematicParameters.aspectRatio !== aspectRatio && !isUpdatingFromCinematic.current) {
      console.log('🎯 Syncing cinematic aspect ratio from main selector:', aspectRatio)
      isUpdatingFromMain.current = true
      setCinematicParameters(prev => ({
        ...prev,
        aspectRatio: aspectRatio as any // Type assertion needed due to string vs AspectRatio type mismatch
      }))
      // Reset flag after state update
      setTimeout(() => {
        isUpdatingFromMain.current = false
      }, 0)
    }
  }, [aspectRatio, enableCinematicMode])

  // Wrapper function to handle aspect ratio changes from the main selector
  const handleAspectRatioChange = (newAspectRatio: string) => {
    console.log('🎯 Main aspect ratio selector changed to:', newAspectRatio)
    setAspectRatio(newAspectRatio)
    
    // If cinematic mode is enabled, also update cinematic parameters
    if (enableCinematicMode && !isUpdatingFromCinematic.current) {
      console.log('🎯 Also updating cinematic parameters with new aspect ratio:', newAspectRatio)
      isUpdatingFromMain.current = true
      setCinematicParameters(prev => ({
        ...prev,
        aspectRatio: newAspectRatio as any
      }))
      setTimeout(() => {
        isUpdatingFromMain.current = false
      }, 0)
    }
  }

  // Wrapper function to handle cinematic parameter changes
  const handleCinematicParametersChange = (newParameters: Partial<CinematicParameters>) => {
    console.log('🎯 Cinematic parameters changed:', newParameters)
    setCinematicParameters(newParameters)
    
    // If aspect ratio changed in cinematic parameters, also update main aspect ratio
    if (newParameters.aspectRatio && newParameters.aspectRatio !== aspectRatio && !isUpdatingFromMain.current) {
      console.log('🎯 Also updating main aspect ratio from cinematic parameters:', newParameters.aspectRatio)
      isUpdatingFromCinematic.current = true
      setAspectRatio(newParameters.aspectRatio as string)
      setTimeout(() => {
        isUpdatingFromCinematic.current = false
      }, 0)
    }
  }
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [showCinematicPreview, setShowCinematicPreview] = useState(false)
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true)
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true)
  const [hasInitializedPrompt, setHasInitializedPrompt] = useState(false)
  const promptBuilder = useRef(new CinematicPromptBuilder())

  // Sync aspect ratio from parent
  useEffect(() => {
    if (propAspectRatio && propAspectRatio !== aspectRatio) {
      console.log('🎯 Syncing aspect ratio from parent:', propAspectRatio, 'current internal:', aspectRatio)
      setAspectRatio(propAspectRatio)
    }
  }, [propAspectRatio]) // Removed aspectRatio from dependencies to prevent infinite loop

  
  // Track if enhanced prompt is being manually edited
  const [isManuallyEditingEnhancedPrompt, setIsManuallyEditingEnhancedPrompt] = useState(false)
  const [isPromptUpdating, setIsPromptUpdating] = useState(false)

  // Subject detection and enhancement
  const [detectedSubject, setDetectedSubject] = useState<string | null>(null)
  const [subjectContext, setSubjectContext] = useState<string | null>(null)
  const [isSubjectUpdating, setIsSubjectUpdating] = useState(false)
  const [isUserTypingSubject, setIsUserTypingSubject] = useState(false)
  const subjectUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // AI Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)

  // Track if prompt has been manually modified
  const [isPromptModified, setIsPromptModified] = useState(false)
  const [originalPrompt, setOriginalPrompt] = useState('')

  // Generation mode state
  const [localGenerationMode, setLocalGenerationMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image')

  // Use prop value if provided, otherwise use local state
  const currentGenerationMode = generationMode || localGenerationMode

  // Format style name for display in prompts
  const formatStyleName = (style: string): string => {
    return style
      .replace(/_/g, ' ')           // Replace underscores with spaces
      .replace(/-/g, ' ')           // Replace hyphens with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .split(' ')                   // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
      .join(' ')                    // Join back with spaces
  }

  // Generate simple prompt that combines style + user subject
  const generateEnhancedPrompt = useCallback(async (style: string, userPrompt: string, generationMode: 'text-to-image' | 'image-to-image') => {
    try {
      console.log('🎯 Fetching style prompt for:', { style, generationMode, userPrompt })

      // Get base style prompt from database
      const response = await fetch('/api/style-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          styleName: style,
          generationMode: generationMode
        })
      })

      if (!response.ok) {
        // Only log error if it's not a 404 (style not found), which is expected for some styles
        if (response.status !== 404) {
          console.warn('Failed to fetch style prompt from database:', {
            status: response.status,
            statusText: response.statusText,
            style,
            generationMode
          })
        }
        // Fallback to basic prompt - include subject if provided
        const formattedStyle = formatStyleName(style)
        if (userPrompt.trim()) {
          return generationMode === 'text-to-image'
            ? `Create a ${formattedStyle} image with natural lighting and detailed textures of ${userPrompt.trim()}`
            : `Apply ${formattedStyle} rendering with natural lighting and detailed textures to ${userPrompt.trim()}`
        }
        return generationMode === 'text-to-image'
          ? `Create a ${formattedStyle} image with natural lighting and detailed textures`
          : `Apply ${formattedStyle} rendering with natural lighting and detailed textures`
      }

      const data = await response.json()
      const { prompt: baseStylePrompt } = data

      if (!baseStylePrompt) {
        console.error('No prompt returned from API:', data)
        // Fallback to basic prompt - include subject if provided
        const formattedStyle = formatStyleName(style)
        if (userPrompt.trim()) {
          return generationMode === 'text-to-image'
            ? `Create a ${formattedStyle} image with natural lighting and detailed textures of ${userPrompt.trim()}`
            : `Apply ${formattedStyle} rendering with natural lighting and detailed textures to ${userPrompt.trim()}`
        }
        return generationMode === 'text-to-image'
          ? `Create a ${formattedStyle} image with natural lighting and detailed textures`
          : `Apply ${formattedStyle} rendering with natural lighting and detailed textures`
      }

      // Handle subject integration based on generation mode
      if (generationMode === 'image-to-image') {
        // For image-to-image, use "this image" instead of user subject
        const simplePrompt = `${baseStylePrompt} this image`
        console.log('🎯 Image-to-image prompt generated:', {
          baseStylePrompt,
          simplePrompt
        })
        return simplePrompt
      } else if (userPrompt.trim()) {
        // For text-to-image, always generate a new prompt with the subject
        // Add subject to the base style prompt with proper grammar
        const simplePrompt = `${baseStylePrompt} of ${userPrompt.trim()}`
        console.log('🎯 Simple prompt generated:', {
          baseStylePrompt,
          userPrompt: userPrompt.trim(),
          simplePrompt
        })
        return simplePrompt
      }

      // If no user subject, return base style prompt
      return baseStylePrompt

    } catch (error) {
      console.warn('Error generating enhanced prompt (using fallback):', error)
      // Fallback to basic prompt - include subject if provided
      const formattedStyle = formatStyleName(style)
      if (userPrompt.trim()) {
        return generationMode === 'text-to-image'
          ? `Create a ${formattedStyle} image with natural lighting and detailed textures of ${userPrompt.trim()}`
          : `Apply ${formattedStyle} rendering with natural lighting and detailed textures to ${userPrompt.trim()}`
      }
      return generationMode === 'text-to-image'
        ? `Create a ${formattedStyle} image with natural lighting and detailed textures`
        : `Apply ${formattedStyle} rendering with natural lighting and detailed textures`
    }
  }, [])

  // Update prompt when userSubject changes
  useEffect(() => {
    // Don't update if user is still typing or if prompt has been manually modified
    if (isUserTypingSubject || isPromptModified) {
      return
    }

    // If a preset is active with {subject} placeholder, replace it
    if (currentPreset && userSubject.trim() && currentPreset.prompt_template.includes('{subject}')) {
      const finalPrompt = currentPreset.prompt_template.replace(/\{subject\}/g, userSubject.trim())
      setPrompt(finalPrompt)
      setOriginalPrompt(finalPrompt)
      return
    }

    // If no preset but we have a style and subject, generate prompt
    if (!currentPreset && style && userSubject.trim()) {
      setIsSubjectUpdating(true)
      generateEnhancedPrompt(style, userSubject, currentGenerationMode).then((newPrompt: string) => {
        setPrompt(newPrompt)
        setOriginalPrompt(newPrompt)
        setIsSubjectUpdating(false)
      }).catch(() => {
        setIsSubjectUpdating(false)
      })
      return
    }

    // If no style but we have a subject, create a basic prompt
    if (!currentPreset && !style && userSubject.trim()) {
      const basicPrompt = currentGenerationMode === 'text-to-image'
        ? `Create an image of ${userSubject.trim()}`
        : `Transform this image with ${userSubject.trim()}`
      setPrompt(basicPrompt)
      setOriginalPrompt(basicPrompt)
      return
    }

    // If subject is cleared and we have a style, update prompt accordingly
    if (!userSubject.trim() && style) {
      setIsSubjectUpdating(true)
      generateEnhancedPrompt(style, '', currentGenerationMode).then((newPrompt: string) => {
        setPrompt(newPrompt)
        setOriginalPrompt(newPrompt)
        setIsSubjectUpdating(false)
      }).catch(() => {
        setIsSubjectUpdating(false)
      })
      return
    }

    // If both subject and style are cleared, clear the prompt
    if (!userSubject.trim() && !style && !currentPreset) {
      setPrompt('')
      setOriginalPrompt('')
    }
  }, [userSubject, currentPreset, isUserTypingSubject, isPromptModified, style, currentGenerationMode, generateEnhancedPrompt])

  
  // Detect subject and context from user input
  const detectSubjectAndContext = (promptText: string) => {
    const text = promptText.toLowerCase().trim()
    
    // Subject categories with their keywords and context
    const subjectCategories = {
      portrait: {
        keywords: ['portrait', 'person', 'face', 'headshot', 'selfie', 'profile', 'close-up', 'head and shoulders'],
        context: 'portrait photography with focus on facial features and expression'
      },
      landscape: {
        keywords: ['landscape', 'nature', 'mountain', 'forest', 'beach', 'ocean', 'sky', 'sunset', 'sunrise', 'valley', 'hill', 'field'],
        context: 'landscape photography with natural lighting and environmental details'
      },
      architecture: {
        keywords: ['building', 'house', 'skyscraper', 'bridge', 'tower', 'church', 'temple', 'monument', 'facade', 'interior', 'room'],
        context: 'architectural photography with clean lines and structural details'
      },
      product: {
        keywords: ['product', 'object', 'item', 'gadget', 'tool', 'device', 'furniture', 'clothing', 'shoe', 'bag', 'watch', 'phone'],
        context: 'product photography with clean background and professional lighting'
      },
      character: {
        keywords: ['character', 'figure', 'person', 'warrior', 'knight', 'wizard', 'hero', 'villain', 'fantasy', 'sci-fi', 'robot'],
        context: 'character design with detailed features and personality'
      },
      vehicle: {
        keywords: ['car', 'truck', 'motorcycle', 'bike', 'plane', 'boat', 'ship', 'train', 'vehicle', 'automobile'],
        context: 'vehicle photography with dynamic angles and clean presentation'
      },
      food: {
        keywords: ['food', 'meal', 'dish', 'recipe', 'cooking', 'restaurant', 'chef', 'ingredient', 'plate', 'bowl'],
        context: 'food photography with appetizing presentation and natural lighting'
      },
      animal: {
        keywords: ['animal', 'pet', 'dog', 'cat', 'bird', 'wildlife', 'creature', 'beast', 'mammal', 'reptile'],
        context: 'animal photography with natural behavior and environmental context'
      },
      abstract: {
        keywords: ['abstract', 'pattern', 'texture', 'shape', 'form', 'color', 'design', 'art', 'concept'],
        context: 'abstract art with bold compositions and visual interest'
      },
      scene: {
        keywords: ['scene', 'setting', 'environment', 'place', 'location', 'street', 'city', 'town', 'village', 'market'],
        context: 'environmental storytelling with atmospheric details'
      }
    }
    
    // Find the best matching subject category
    let bestMatch = null
    let maxMatches = 0
    
    for (const [category, data] of Object.entries(subjectCategories)) {
      const matches = data.keywords.filter(keyword => text.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        bestMatch = { category, context: data.context }
      }
    }
    
    // If no specific subject detected, try to extract from the beginning of the prompt
    if (!bestMatch && text.length > 0) {
      const firstWords = text.split(' ').slice(0, 3).join(' ')
      if (firstWords.length > 0) {
        bestMatch = { 
          category: 'custom', 
          context: `custom subject: ${firstWords}` 
        }
      }
    }
    
    console.log('🎯 Subject detection:', { 
      promptText, 
      detectedSubject: bestMatch?.category, 
      context: bestMatch?.context,
      matches: maxMatches
    })
    
    return bestMatch
  }

  // Update enhanced prompt when cinematic parameters change
  useEffect(() => {
    console.log('🎯 Cinematic useEffect running:', {
      enableCinematicMode,
      prompt: prompt?.trim() || '',
      isManuallyEditingEnhancedPrompt,
      cinematicParameters
    })
    
    if (enableCinematicMode && ((prompt?.trim() || '') || userSubject.trim()) && !isManuallyEditingEnhancedPrompt) {
      console.log('🎯 Generating enhanced prompt with parameters:', {
        cinematicParameters,
        currentPrompt: prompt,
        userSubject,
        isManuallyEditingEnhancedPrompt
      })
      
      // For cinematic generation, we need to pass both the base prompt and the subject
      // The base prompt should be the template with {subject} placeholder
      // The subject should be extracted from userSubject for cinematic adjustments
      const basePrompt = prompt?.trim() || ''
      const subjectForCinematic = userSubject.trim() || ''
      
      console.log('🎯 Using base prompt for cinematic generation:', basePrompt)
      console.log('🎯 Subject for cinematic adjustments:', subjectForCinematic)
      
      const result = promptBuilder.current.constructPrompt({
        basePrompt: basePrompt,
        cinematicParameters,
        enhancementType: 'generate',
        includeTechnicalDetails,
        includeStyleReferences,
        subject: subjectForCinematic // Pass the subject for cinematic adjustments
      })
      console.log('🎯 Generated enhanced prompt:', result.fullPrompt)
      setEnhancedPrompt(result.fullPrompt)
    } else if (!enableCinematicMode) {
      console.log('🎯 Cinematic mode disabled, setting enhanced prompt to main prompt')
      setEnhancedPrompt(prompt)
    } else {
      console.log('🎯 Conditions not met for enhanced prompt generation')
    }
  }, [prompt, userSubject, cinematicParameters, enableCinematicMode, includeTechnicalDetails, includeStyleReferences, isManuallyEditingEnhancedPrompt])

  // Call enhanced prompt callback when enhanced prompt changes
  useEffect(() => {
    if (onEnhancedPromptChange) {
      onEnhancedPromptChange(enhancedPrompt)
    }
  }, [enhancedPrompt, onEnhancedPromptChange])

  // Handle toggle changes from CinematicParameterSelector
  const handleToggleChange = (technicalDetails: boolean, styleReferences: boolean) => {
    setIncludeTechnicalDetails(technicalDetails)
    setIncludeStyleReferences(styleReferences)
  }

  // AI Enhance Prompt handler
  const handleAIEnhancePrompt = async () => {
    setIsEnhancing(true)
    try {
      // Determine subject category
      const subjectCategory = userSubject ? detectSubjectCategory(userSubject) : undefined

      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enableCinematicMode ? enhancedPrompt : prompt,
          subject: userSubject,
          style,
          subjectCategory,
          cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
          generationMode: currentGenerationMode
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enhance prompt')
      }

      const data = await response.json()

      if (enableCinematicMode) {
        setEnhancedPrompt(data.enhancedPrompt)
        setIsManuallyEditingEnhancedPrompt(true)
      } else {
        setPrompt(data.enhancedPrompt)
        setOriginalPrompt(data.enhancedPrompt)
      }

      showFeedback({
        type: 'success',
        title: 'Success',
        message: 'Prompt enhanced successfully!'
      })
    } catch (error) {
      console.error('Error enhancing prompt:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to enhance prompt'
      })
    } finally {
      setIsEnhancing(false)
    }
  }

  // Detect subject category for AI enhancement
  const detectSubjectCategory = (subject: string): string => {
    const subjectLower = subject.toLowerCase()
    if (subjectLower.match(/person|man|woman|child|portrait|face|people/)) return 'person'
    if (subjectLower.match(/cat|dog|bird|animal|pet|wildlife/)) return 'animal'
    if (subjectLower.match(/landscape|mountain|forest|ocean|nature|scenery/)) return 'landscape'
    if (subjectLower.match(/building|house|architecture|structure|interior/)) return 'architecture'
    if (subjectLower.match(/product|bottle|phone|watch|gadget/)) return 'product'
    if (subjectLower.match(/abstract|art|painting|design/)) return 'abstract'
    return 'general'
  }

  // Clear/Reset handler
  const handleClearAll = () => {
    setPrompt('')
    setOriginalPrompt('')
    setEnhancedPrompt('')
    setUserSubject('')
    setStyle('')
    setCurrentPreset(null)
    setCinematicParameters({})
    setIsPromptModified(false)
    setIsManuallyEditingEnhancedPrompt(false)
    showFeedback({
      type: 'success',
      title: 'Success',
      message: 'All fields cleared'
    })
  }

  // Save Preset handler
  const handleSavePreset = () => {
    setShowSavePresetDialog(true)
  }

  // Update prompt when generation mode changes and a preset is applied
  useEffect(() => {
    if (currentPreset && currentPreset.prompt_template) {
      let finalPrompt = currentPreset.prompt_template
      
      // Handle preset application based on generation mode
      if (currentGenerationMode === 'image-to-image') {
        // For image-to-image, replace {subject} with "this image" or remove it entirely
        if (currentPreset.prompt_template.includes('{subject}')) {
          finalPrompt = currentPreset.prompt_template.replace(/\{subject\}/g, 'this image')
        } else {
          finalPrompt = `${currentPreset.prompt_template} this image`
        }
      } else if (userSubject.trim() && currentPreset.prompt_template.includes('{subject}')) {
        // For text-to-image, replace {subject} placeholder with user's input ONLY if preset supports it
        finalPrompt = currentPreset.prompt_template.replace(/\{subject\}/g, userSubject.trim())
      }
      
      setPrompt(finalPrompt)
      setOriginalPrompt(finalPrompt)
    }
  }, [currentGenerationMode, currentPreset, userSubject])
  
  // Handle style changes
  const handleStyleChange = useCallback((newStyle: string) => {
    console.log('🎯 handleStyleChange called with:', newStyle, 'current style:', style, 'current prompt:', prompt, 'currentPreset:', currentPreset)
    setStyle(newStyle)
    
    // Only clear preset if we're not applying a preset (preset should override style changes)
    if (!currentPreset) {
      setCurrentPreset(null)
    } else {
      console.log('🎯 Preset is active, not clearing preset on style change:', currentPreset.name)
    }
    
    // Check if current prompt is a default style prompt
    const isDefaultPrompt = (promptText: string) => {
      // Check for common patterns in database prompts
      const defaultPatterns = [
        'Create a photorealistic image',
        'Create an artistic painting',
        'Create a cartoon-style illustration',
        'Create a vintage aesthetic',
        'Create a cyberpunk style',
        'Create a watercolor painting',
        'Create a pencil sketch',
        'Create an oil painting',
        'Create a professional portrait',
        'Create a fashion photography',
        'Create an editorial photography',
        'Create a commercial photography',
        'Create a lifestyle photography',
        'Create a street photography',
        'Create an architectural photography',
        'Create a nature photography',
        'Create an abstract artwork',
        'Create a surreal artwork',
        'Create a minimalist artwork',
        'Create a maximalist artwork',
        'Create an impressionist painting',
        'Create a Renaissance-style artwork',
        'Create a Baroque-style artwork',
        'Create an Art Deco style',
        'Create a Pop Art style',
        'Create a graffiti art style',
        'Create a digital art style',
        'Create a concept art style',
        'Create a fantasy art style',
        'Create a sci-fi art style',
        'Create a steampunk style',
        'Create a gothic art style',
        'Create a cinematic image',
        'Create a film noir style',
        'Create a dramatic image',
        'Create a moody image',
        'Create a bright, cheerful image',
        'Create a monochrome image',
        'Create a sepia-toned image',
        'Create an HDR image'
      ]
      
      const trimmedPrompt = promptText.trim()
      const isDefault = defaultPatterns.some(pattern => trimmedPrompt.startsWith(pattern))
      console.log('🎯 isDefaultPrompt check (style change):', { 
        promptText: trimmedPrompt, 
        isDefault, 
        matchingPattern: defaultPatterns.find(pattern => trimmedPrompt.startsWith(pattern))
      })
      return isDefault
    }
    
    // Update prompt if it's empty OR if it's a default prompt that should be updated
    // Allow updates even when preset is active, as long as the prompt hasn't been manually modified
    const shouldUpdatePrompt = !isPromptModified && (!prompt?.trim() || isDefaultPrompt(prompt) || !!currentPreset)
    console.log('🎯 Prompt update check:', {
      newStyle,
      currentPrompt: prompt,
      isEmpty: !prompt?.trim(),
      isDefault: isDefaultPrompt(prompt),
      hasPreset: !!currentPreset,
      isManuallyModified: isPromptModified,
      shouldUpdate: shouldUpdatePrompt
    })
    
    if (shouldUpdatePrompt) {
      console.log('🎯 Updating prompt with new style:', newStyle, 'userSubject:', userSubject, 'isDefaultPrompt:', isDefaultPrompt(prompt))
      setIsPromptUpdating(true)

      // Use enhanced prompt generation that considers subject + style
      // Only generate if there's a style selected
      if (newStyle.trim()) {
        // Pass userSubject instead of prompt to ensure subject is included
        generateEnhancedPrompt(newStyle, userSubject, currentGenerationMode).then((newPrompt: string) => {
          setPrompt(newPrompt)
          setOriginalPrompt(newPrompt)
          setIsPromptModified(false)

          // Don't focus the prompt field to avoid disrupting user experience
          setTimeout(() => {
            setIsPromptUpdating(false)
          }, 100)
        })
      } else {
        // No style selected, create basic prompt with subject
        if (userSubject.trim()) {
          const basicPrompt = currentGenerationMode === 'text-to-image'
            ? `Create an image of ${userSubject.trim()}`
            : `Transform this image with ${userSubject.trim()}`
          setPrompt(basicPrompt)
          setOriginalPrompt(basicPrompt)
        } else {
          setPrompt('')
          setOriginalPrompt('')
        }
        setIsPromptModified(false)
        setTimeout(() => {
          setIsPromptUpdating(false)
        }, 100)
      }
    } else {
      // Don't focus the prompt field to avoid disrupting user experience
      console.log('🎯 Style change: no prompt update needed')
    }
    
    // Notify parent component
    if (onStyleChange) {
      onStyleChange(newStyle)
    }
  }, [style, prompt, currentGenerationMode, userSubject, onStyleChange, generateEnhancedPrompt, currentPreset])
  
  // Sync style from parent
  useEffect(() => {
    console.log('🎯 Style sync useEffect running:', { currentStyle, style, prompt })
    if (currentStyle && currentStyle !== style) {
      console.log('🎯 Syncing style from parent:', currentStyle, 'current internal:', style)
      setStyle(currentStyle)
    } else {
      console.log('🎯 No style sync needed:', { currentStyle, style, areEqual: currentStyle === style })
    }
  }, [currentStyle, style, prompt]) // Removed handleStyleChange to prevent infinite loop
  
  // Fetch style prompt from database
  const getStylePrompt = async (styleType: string, mode: 'text-to-image' | 'image-to-image') => {
    try {
      const response = await fetch('/api/style-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          styleName: styleType,
          generationMode: mode
        })
      })

      if (!response.ok) {
        console.error('Failed to fetch style prompt from database')
        // Fallback to default photorealistic prompt
        return mode === 'text-to-image' 
          ? 'Create a photorealistic image with natural lighting and detailed textures'
          : 'Apply photorealistic rendering with natural lighting and detailed textures'
      }

      const { prompt } = await response.json()
      return prompt
    } catch (error) {
      console.error('Error fetching style prompt:', error)
      // Fallback to default photorealistic prompt
      return mode === 'text-to-image' 
        ? 'Create a photorealistic image with natural lighting and detailed textures'
        : 'Apply photorealistic rendering with natural lighting and detailed textures'
    }
  }
  
  
  
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [baseImageSource, setBaseImageSource] = useState<'upload' | 'saved' | 'pexels'>('upload')
  const [baseImageDimensions, setBaseImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)
  
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
        onRemoveBaseImage: baseImage ? removeBaseImage : undefined,
        // Include additional context for regeneration
        generationMode: currentGenerationMode,
        style: style,
        selectedProvider: currentProvider,
        consistencyLevel: currentConsistencyLevel,
        prompt: prompt,
        enhancedPrompt: enableCinematicMode ? enhancedPrompt : undefined
      })
    }
  }, [resolution, userSubscriptionTier, baseImageDimensions, aspectRatio, baseImage, currentGenerationMode, style, currentProvider, currentConsistencyLevel, prompt, enhancedPrompt, enableCinematicMode])

  // Handle preset selection from parent component (comprehensive Preset)
  useEffect(() => {
    console.log('🎯 selectedPreset useEffect running:', selectedPreset)
    
    if (selectedPreset) {
      console.log('🎯 Applying preset:', selectedPreset.name || selectedPreset.id, 'prompt:', selectedPreset.prompt_template)
      setCurrentPreset(selectedPreset)
      setStyle(selectedPreset.style_settings?.style || 'realistic')
      
      // Handle preset application based on generation mode
      let finalPrompt = selectedPreset.prompt_template
      if (currentGenerationMode === 'image-to-image') {
        // For image-to-image, replace {subject} with "this image" or remove it entirely
        if (selectedPreset.prompt_template.includes('{subject}')) {
          finalPrompt = selectedPreset.prompt_template.replace(/\{subject\}/g, 'this image')
        } else {
          finalPrompt = `${selectedPreset.prompt_template} this image`
        }
      } else if (userSubject.trim() && selectedPreset.prompt_template.includes('{subject}')) {
        // For text-to-image, replace {subject} placeholder with user's input ONLY if preset supports it
        finalPrompt = selectedPreset.prompt_template.replace(/\{subject\}/g, userSubject.trim())
      }
      
      setPrompt(finalPrompt)
      setOriginalPrompt(finalPrompt)
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
      if (onPresetApplied) {
        onPresetApplied()
      }
    }
  }, [selectedPreset, onPresetApplied])

  // Handle preset selection from PresetSelector
  const handlePresetSelect = (preset: Preset | null) => {
    setCurrentPreset(preset)
    
    if (preset) {
      // Apply preset settings based on generation mode
      let finalPrompt = preset.prompt_template
      if (currentGenerationMode === 'image-to-image') {
        // For image-to-image, replace {subject} with "this image" or remove it entirely
        if (preset.prompt_template.includes('{subject}')) {
          finalPrompt = preset.prompt_template.replace(/\{subject\}/g, 'this image')
        } else {
          finalPrompt = `${preset.prompt_template} this image`
        }
      } else if (userSubject.trim() && preset.prompt_template.includes('{subject}')) {
        // For text-to-image, replace {subject} placeholder with user's input ONLY if preset supports it
        finalPrompt = preset.prompt_template.replace(/\{subject\}/g, userSubject.trim())
      }
      
      setPrompt(finalPrompt)
      setStyle(preset.style_settings?.style || 'realistic')
      setIntensity(preset.style_settings?.intensity || 1.0)
      if (onConsistencyChange) {
        onConsistencyChange(preset.style_settings?.consistency_level || 'high')
      }
      setAspectRatio(preset.technical_settings?.aspect_ratio || '1:1')
      setResolution(preset.technical_settings?.resolution || '1024')
      setNumImages(preset.technical_settings?.num_images || 1)
      
      // Apply cinematic settings ONLY if they exist and are explicitly enabled
      if (preset.cinematic_settings && preset.cinematic_settings.enableCinematicMode) {
        setEnableCinematicMode(true)
        setCinematicParameters(preset.cinematic_settings.cinematicParameters || {})
        setEnhancedPrompt(preset.cinematic_settings.enhancedPrompt || '')
        setIncludeTechnicalDetails(preset.cinematic_settings.includeTechnicalDetails ?? true)
        setIncludeStyleReferences(preset.cinematic_settings.includeStyleReferences ?? true)
        if (onGenerationModeChange) {
          onGenerationModeChange(preset.cinematic_settings.generationMode || 'text-to-image')
        } else {
          setLocalGenerationMode(preset.cinematic_settings.generationMode || 'text-to-image')
        }
      } else {
        // For regular presets, disable cinematic mode
        setEnableCinematicMode(false)
        setCinematicParameters({})
        setEnhancedPrompt('')
        setIncludeTechnicalDetails(false)
        setIncludeStyleReferences(false)
      }

      // Update settings for parent component
      if (onSettingsChange) {
        onSettingsChange({
          resolution: preset.technical_settings?.resolution || '1024',
          aspectRatio: preset.technical_settings?.aspect_ratio || '1:1'
        })
      }
    } else {
      // Clear preset - reset to defaults but preserve user subject
      console.log('🎯 Clearing preset, resetting to defaults')

      // If user has a subject, create basic prompt, otherwise clear
      if (userSubject.trim()) {
        const basicPrompt = currentGenerationMode === 'text-to-image'
          ? `Create an image of ${userSubject.trim()}`
          : `Transform this image with ${userSubject.trim()}`
        setPrompt(basicPrompt)
      } else {
        setPrompt('')
      }
      
      setStyle('')
      setIntensity(1.0)
      if (onConsistencyChange) {
        onConsistencyChange('high')
      }
      setAspectRatio('1:1')
      setResolution('1024')
      setNumImages(1)
      setEnableCinematicMode(false)
      setCinematicParameters({})
      setEnhancedPrompt('')
      setIncludeTechnicalDetails(true)
      setIncludeStyleReferences(true)
      setIsPromptModified(false)
      
      // Update settings for parent component
      if (onSettingsChange) {
        onSettingsChange({
          resolution: '1024',
          aspectRatio: '1:1'
        })
      }
    }
  }

  // Update prompt when generation mode changes (for regular styles)
  useEffect(() => {
    console.log('🎯 useEffect running:', {
      hasInitialized,
      currentPreset,
      isPromptModified,
      prompt: prompt?.trim() || '',
      style,
      currentGenerationMode
    })
    
    if (!hasInitialized) {
      console.log('🎯 First run, setting initialized to true')
      setHasInitialized(true)
      return
    }
    
    // Check if current prompt is a default style prompt
    const isDefaultPrompt = (promptText: string) => {
      // Check for common patterns in database prompts
      const defaultPatterns = [
        'Create an image of',
        'Transform this image with',
        'Create a photorealistic image',
        'Create an artistic painting',
        'Create a cartoon-style illustration',
        'Create a vintage aesthetic',
        'Create a cyberpunk style',
        'Create a watercolor painting',
        'Create a pencil sketch',
        'Create an oil painting',
        'Create a professional portrait',
        'Create a fashion photography',
        'Create an editorial photography',
        'Create a commercial photography',
        'Create a lifestyle photography',
        'Create a street photography',
        'Create an architectural photography',
        'Create a nature photography',
        'Create an abstract artwork',
        'Create a surreal artwork',
        'Create a minimalist artwork',
        'Create a maximalist artwork',
        'Create an impressionist painting',
        'Create a Renaissance-style artwork',
        'Create a Baroque-style artwork',
        'Create an Art Deco style',
        'Create a Pop Art style',
        'Create a graffiti art style',
        'Create a digital art style',
        'Create a concept art style',
        'Create a fantasy art style',
        'Create a sci-fi art style',
        'Create a steampunk style',
        'Create a gothic art style',
        'Create a cinematic image',
        'Create a film noir style',
        'Create a dramatic image',
        'Create a moody image',
        'Create a bright, cheerful image',
        'Create a monochrome image',
        'Create a sepia-toned image',
        'Create an HDR image',
        'Apply photorealistic rendering',
        'Apply an artistic painting style',
        'Transform into a cartoon-style illustration',
        'Apply a vintage aesthetic',
        'Apply cyberpunk style',
        'Apply watercolor painting technique',
        'Convert to a pencil sketch style',
        'Apply oil painting technique',
        'Transform into a professional portrait',
        'Apply fashion photography style',
        'Apply editorial photography style',
        'Apply commercial photography style',
        'Apply lifestyle photography style',
        'Apply street photography style',
        'Apply architectural photography style',
        'Apply nature photography style',
        'Transform into an abstract artwork',
        'Transform into a surreal artwork',
        'Apply minimalist style',
        'Apply maximalist style',
        'Apply impressionist painting technique',
        'Apply Renaissance painting technique',
        'Apply Baroque painting technique',
        'Apply Art Deco style',
        'Transform into Pop Art style',
        'Apply graffiti art style',
        'Apply digital art style',
        'Apply concept art style',
        'Transform into fantasy art style',
        'Apply sci-fi art style',
        'Apply steampunk style',
        'Apply gothic art style',
        'Apply cinematic style',
        'Apply film noir style',
        'Apply dramatic style',
        'Apply moody style',
        'Apply bright, cheerful style',
        'Convert to monochrome style',
        'Apply sepia tone',
        'Apply HDR processing'
      ]
      
      const trimmedPrompt = promptText.trim()
      const isDefault = defaultPatterns.some(pattern => trimmedPrompt.startsWith(pattern))
      console.log('🎯 isDefaultPrompt check (generation mode):', { 
        promptText: trimmedPrompt, 
        isDefault, 
        matchingPattern: defaultPatterns.find(pattern => trimmedPrompt.startsWith(pattern))
      })
      return isDefault
    }
    
    // Update prompt if:
    // 1. No current preset is selected
    // 2. Prompt is a default prompt that should be updated (or empty)
    // 3. Either style is selected OR we have a subject
    const shouldUpdatePrompt = !currentPreset && (!prompt?.trim() || isDefaultPrompt(prompt))

    if (shouldUpdatePrompt) {
      console.log('🎯 Updating prompt for generation mode change:', {
        style,
        userSubject,
        generationMode: currentGenerationMode,
        isDefaultPrompt: isDefaultPrompt(prompt)
      })

      if (style.trim()) {
        // Use enhanced prompt generation with subject + style
        generateEnhancedPrompt(style, userSubject, currentGenerationMode).then((newPrompt: string) => {
          setPrompt(newPrompt)
          setOriginalPrompt(newPrompt)
          setIsPromptModified(false)
          console.log('🎯 Prompt updated from generation mode change (with style)')
        })
      } else if (userSubject.trim()) {
        // No style but have subject - create basic prompt
        const basicPrompt = currentGenerationMode === 'text-to-image'
          ? `Create an image of ${userSubject.trim()}`
          : `Transform this image with ${userSubject.trim()}`
        setPrompt(basicPrompt)
        setOriginalPrompt(basicPrompt)
        setIsPromptModified(false)
        console.log('🎯 Prompt updated from generation mode change (no style)')
      }
    }
  }, [currentGenerationMode, style, currentPreset, isPromptModified, prompt, userSubject, hasInitialized])

  // Update prompt when subject changes (debounced updates) - only for text-to-image mode
  useEffect(() => {
    if (currentGenerationMode === 'text-to-image' && userSubject.trim() && !isPromptModified && !isSubjectUpdating && !isUserTypingSubject) {
      console.log('🎯 Subject changed, updating prompt (user finished typing):', userSubject)
      setIsSubjectUpdating(true)
      
      // If a preset is active, use the preset template with subject replacement
      if (currentPreset) {
        // Only update if the preset template contains {subject} placeholder
        if (currentPreset.prompt_template.includes('{subject}')) {
          const finalPrompt = currentPreset.prompt_template.replace(/\{subject\}/g, userSubject.trim())
          console.log('🎯 Using preset template with subject replacement:', {
            userSubject,
            presetTemplate: currentPreset.prompt_template,
            finalPrompt
          })
          setPrompt(finalPrompt)
          setOriginalPrompt(finalPrompt)
          setIsPromptModified(false)
        } else {
          // Preset doesn't have {subject} placeholder, don't modify the preset's prompt
          console.log('🎯 Preset does not contain {subject} placeholder, keeping original prompt:', currentPreset.prompt_template)
        }
        setIsSubjectUpdating(false)
      } else {
        // Generate enhanced prompt with current style and subject (no preset active)
        // Only generate if there's a style selected
        if (style.trim()) {
          generateEnhancedPrompt(style, userSubject, currentGenerationMode).then((newPrompt: string) => {
            console.log('🎯 Generated new prompt from subject:', {
              userSubject,
              currentPrompt: prompt,
              newPrompt,
              isDifferent: newPrompt !== prompt
            })
            
            // Always update the prompt when subject changes, regardless of whether it's different
            setPrompt(newPrompt)
            setOriginalPrompt(newPrompt)
            setIsPromptModified(false)
            setIsSubjectUpdating(false)
          }).catch((error) => {
            console.error('🎯 Error generating prompt from subject:', error)
            setIsSubjectUpdating(false)
          })
        } else {
          // No style selected, just use the subject as the prompt
          const simplePrompt = userSubject.trim()
          setPrompt(simplePrompt)
          setOriginalPrompt(simplePrompt)
          setIsPromptModified(false)
          setIsSubjectUpdating(false)
        }
      }
    }
  }, [userSubject, style, currentGenerationMode, isPromptModified, isUserTypingSubject, generateEnhancedPrompt, currentPreset])


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (subjectUpdateTimeoutRef.current) {
        clearTimeout(subjectUpdateTimeoutRef.current)
      }
    }
  }, [])

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
    
    const result = `${width}*${height}`
    
    // Debug logging for aspect ratio calculation
    console.log('🎯 Aspect Ratio Calculation:', {
      aspectRatio: aspectRatioValue,
      baseResolution,
      widthRatio,
      heightRatio,
      aspectRatioNum: aspectRatioNum.toFixed(3),
      calculatedWidth: width,
      calculatedHeight: height,
      finalResolution: result
    })
    
    return result
  }

  const handleGenerate = async () => {
    if (!prompt?.trim()) {
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
    
    // Use cinematic aspect ratio if available, otherwise use UI aspect ratio
    const effectiveAspectRatio = enableCinematicMode && cinematicParameters.aspectRatio 
      ? cinematicParameters.aspectRatio 
      : aspectRatio
    
    const calculatedResolution = calculateResolution(effectiveAspectRatio, effectiveResolution)
    
    console.log('🚀 Generation Request:', {
      uiAspectRatio: aspectRatio,
      cinematicAspectRatio: enableCinematicMode ? cinematicParameters.aspectRatio : 'disabled',
      effectiveAspectRatio,
      baseResolution: resolution,
      effectiveResolution,
      calculatedResolution,
      userSubscriptionTier,
      currentGenerationMode,
      enableCinematicMode,
      cinematicParameters: enableCinematicMode ? cinematicParameters : 'disabled'
    })
    
    await onGenerate({
      prompt: enableCinematicMode ? enhancedPrompt : prompt,
      style: currentPreset ? currentPreset.style_settings?.style || style : style,
      resolution: calculatedResolution,
      consistencyLevel: currentConsistencyLevel,
      numImages,
      customStylePreset: currentPreset || undefined,
      baseImage: currentGenerationMode === 'image-to-image' ? baseImage || undefined : undefined,
      generationMode: currentGenerationMode,
      intensity: intensity,
      cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
      enhancedPrompt: enableCinematicMode ? enhancedPrompt : undefined,
      includeTechnicalDetails: enableCinematicMode ? includeTechnicalDetails : undefined,
      includeStyleReferences: enableCinematicMode ? includeStyleReferences : undefined,
      selectedProvider: currentProvider as 'nanobanana' | 'seedream',
      replaceLatestImages: replaceLatestImages,
      userSubject: currentGenerationMode === 'image-to-image' ? 'image' : (userSubject.trim() || undefined)
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
              Style: {(() => {
                // Get the effective style - prioritize preset style over current style
                const effectiveStyle = currentPreset?.style_settings?.style || currentStyle || style
                console.log('🎯 Style badge debug:', { 
                  presetStyle: currentPreset?.style_settings?.style, 
                  currentStyle, 
                  style, 
                  effectiveStyle 
                })
                
                if (effectiveStyle === 'photorealistic') return '📸 Photorealistic'
                if (effectiveStyle === 'artistic') return '🎨 Artistic'
                if (effectiveStyle === 'cartoon') return '🎭 Cartoon'
                if (effectiveStyle === 'vintage') return '📻 Vintage'
                if (effectiveStyle === 'cyberpunk') return '🤖 Cyberpunk'
                if (effectiveStyle === 'watercolor') return '🎨 Watercolor'
                if (effectiveStyle === 'graffiti') return '🎨 Graffiti'
                if (effectiveStyle === 'cinematic') return '🎬 Cinematic'
                if (effectiveStyle === 'technical') return '📊 Technical'
                if (effectiveStyle === 'impressionist') return '🎨 Impressionist'
                if (effectiveStyle === 'renaissance') return '🏛️ Renaissance'
                if (effectiveStyle === 'baroque') return '🎭 Baroque'
                if (effectiveStyle === 'art_deco') return '✨ Art Deco'
                if (effectiveStyle === 'pop_art') return '🎪 Pop Art'
                if (effectiveStyle === 'digital_art') return '💻 Digital Art'
                if (effectiveStyle === 'concept_art') return '🎮 Concept Art'
                if (effectiveStyle === 'fantasy') return '🧙 Fantasy'
                if (effectiveStyle === 'sci_fi') return '🚀 Sci-Fi'
                if (effectiveStyle === 'maximalist') return '🌈 Maximalist'
                if (effectiveStyle === 'surreal') return '🌌 Surreal'
                if (effectiveStyle === 'minimalist') return '⚪ Minimalist'
                if (effectiveStyle === 'abstract') return '🎭 Abstract'
                if (effectiveStyle === 'sketch') return '✏️ Sketch'
                if (effectiveStyle === 'oil_painting') return '🖼️ Oil Painting'
                return effectiveStyle
              })()}
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
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 border border-border-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                                  <span className="text-primary-foreground opacity-0 group-hover:opacity-100 font-medium text-sm">+ Select</span>
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
          {/* Subject Input */}
          {/* Subject Input Field - Only show for text-to-image mode */}
          {currentGenerationMode === 'text-to-image' && (
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                What are you creating?
              </Label>
              <Input
                id="subject"
                value={userSubject}
                onChange={(e) => {
                  const newValue = e.target.value
                  console.log('🎯 Subject input changed:', {
                    newValue,
                    currentUserSubject: userSubject,
                    isPromptModified,
                    isSubjectUpdating,
                    isUserTypingSubject
                  })
                  setUserSubject(newValue)
                  setIsUserTypingSubject(true)
                  
                  // Clear existing timeout
                  if (subjectUpdateTimeoutRef.current) {
                    clearTimeout(subjectUpdateTimeoutRef.current)
                  }
                  
                  // Debounce the prompt update - only update after user stops typing
                  subjectUpdateTimeoutRef.current = setTimeout(() => {
                    console.log('🎯 Subject debounce timeout completed, setting isUserTypingSubject to false')
                    setIsUserTypingSubject(false)
                  }, 1000) // Wait 1 second after user stops typing
                }}
                placeholder="e.g., portrait of a person, mountain landscape, product shot, character design..."
                className="text-sm"
              />
              {isUserTypingSubject && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                  Typing... (will update when you pause)
                </div>
              )}
              {isSubjectUpdating && !isUserTypingSubject && (
                <div className="text-xs text-primary flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  Updating prompt...
                </div>
              )}
              {currentPreset && !currentPreset.prompt_template.includes('{subject}') && (
                <div className="text-xs text-primary-600 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                  Preset active - subject won't modify prompt
                </div>
              )}
            </div>
          )}
          

          {/* Image-to-image mode indicator */}
          {currentGenerationMode === 'image-to-image' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Image-to-Image Mode
              </Label>
              {baseImage ? (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Base image loaded - will be modified with the selected style
                  </div>
                  <div className="relative inline-block">
                    <img
                      src={baseImage}
                      alt="Base image for modification"
                      className="w-24 h-24 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={removeBaseImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                      title="Remove base image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Upload a base image above to modify it with the selected style
                </div>
              )}
            </div>
          )}

          <Label htmlFor="prompt" className="text-sm">
              Prompt {enableCinematicMode && (
              <span className="text-xs text-muted-foreground ml-1">
                (Generated - edit below to customize)
                </span>
              )}
            </Label>
          <div
            className={`text-sm bg-muted/30 border border-border rounded-md p-3 min-h-[60px] ${enableCinematicMode ? 'min-h-[100px]' : ''} ${isPromptUpdating || isSubjectUpdating ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
          >
            <div className="whitespace-pre-wrap break-words">
              {(() => {
                const currentPrompt = enableCinematicMode ? enhancedPrompt : prompt

                if (!currentPrompt) {
                  return (
                    <span className="text-muted-foreground italic">
                      {generationMode === 'text-to-image'
                        ? "Prompt will be generated based on your selections..."
                        : "Prompt will be generated based on your selections..."}
                    </span>
                  )
                }

                // Syntax highlighting function
                const highlightPrompt = (text: string) => {
                  const parts: React.ReactNode[] = []
                  let lastIndex = 0

                  // Define patterns
                  const patterns = [
                    // Subject after "of" - captures subject anywhere in prompt
                    { regex: /\bof (a |an |the )?([\w\s]+?)(?=\.|,|\s+in\s+the\s+style)/gi, groups: [1, 2], colors: ['text-foreground/70', 'text-primary font-semibold'] },
                    // Style references
                    { regex: /(in the style of )([^.,]+)/gi, groups: [1, 2], colors: ['text-foreground/70', 'text-violet-500 dark:text-violet-400 font-medium'] },
                    // Aspect ratios
                    { regex: /\b(\d+:\d+)\b/g, groups: [1], colors: ['text-amber-500 dark:text-amber-400 font-medium'] },
                    // Multi-word cinematic parameters (must come before single words)
                    { regex: /\b(portrait lighting|natural lighting|dramatic lighting|soft lighting|hard lighting|ambient lighting|portrait framing|tight framing|loose framing|depth of field|shallow depth|deep depth|aspect ratio|eye contact|rule of thirds|golden hour|blue hour|eye-level shot|low-angle shot|high-angle shot|dutch angle)\b/gi, groups: [1], colors: ['text-blue-500 dark:text-blue-400 font-medium'] },
                    // Single word technical terms
                    { regex: /\b(shot|lens|camera|lighting|framing|widescreen|atmosphere|saturation|resolution|portrait|film|instant|4k|8k|hd|uhd|bokeh|exposure|contrast)\b/gi, groups: [1], colors: ['text-blue-500 dark:text-blue-400'] }
                  ]

                  // Find all matches
                  const matches: Array<{start: number, end: number, content: React.ReactNode}> = []

                  patterns.forEach(pattern => {
                    let match: RegExpExecArray | null
                    const regex = new RegExp(pattern.regex)
                    while ((match = regex.exec(text)) !== null) {
                      const fullMatch = match[0]
                      const matchStart = match.index

                      // Build colored content for this match
                      const coloredParts: React.ReactNode[] = []
                      let offset = 0

                      pattern.groups.forEach((groupIdx: number, i: number) => {
                        const groupText = match![groupIdx]
                        const groupStart = fullMatch.indexOf(groupText, offset)

                        // Add text before this group if any
                        if (groupStart > offset) {
                          coloredParts.push(
                            <span key={`before-${i}`} className="text-foreground/70">
                              {fullMatch.substring(offset, groupStart)}
                            </span>
                          )
                        }

                        // Add colored group
                        coloredParts.push(
                          <span key={`group-${i}`} className={pattern.colors[i]}>
                            {groupText}
                          </span>
                        )

                        offset = groupStart + groupText.length
                      })

                      // Add any remaining text
                      if (offset < fullMatch.length) {
                        coloredParts.push(
                          <span key="after" className="text-foreground/70">
                            {fullMatch.substring(offset)}
                          </span>
                        )
                      }

                      matches.push({
                        start: matchStart,
                        end: matchStart + fullMatch.length,
                        content: <span key={`match-${matchStart}`}>{coloredParts}</span>
                      })
                    }
                  })

                  // Sort and remove overlapping matches
                  matches.sort((a, b) => a.start - b.start)
                  const filteredMatches: Array<{start: number, end: number, content: React.ReactNode}> = matches.reduce((acc: Array<{start: number, end: number, content: React.ReactNode}>, m: {start: number, end: number, content: React.ReactNode}) => {
                    if (acc.length === 0) return [m]
                    const prev = acc[acc.length - 1]
                    if (m.start >= prev.end) {
                      acc.push(m)
                    }
                    return acc
                  }, [])

                  // Build final output
                  filteredMatches.forEach((m: {start: number, end: number, content: React.ReactNode}) => {
                    // Add text before match
                    if (m.start > lastIndex) {
                      parts.push(
                        <span key={`text-${lastIndex}`} className="text-foreground/70">
                          {text.substring(lastIndex, m.start)}
                        </span>
                      )
                    }

                    // Add match
                    parts.push(m.content)
                    lastIndex = m.end
                  })

                  // Add remaining text
                  if (lastIndex < text.length) {
                    parts.push(
                      <span key={`text-end`} className="text-foreground/70">
                        {text.substring(lastIndex)}
                      </span>
                    )
                  }

                  return <>{parts}</>
                }

                return highlightPrompt(currentPrompt)
              })()}
            </div>
          </div>
          {isPromptUpdating && (
            <div className="text-xs text-primary flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              Updating prompt...
            </div>
          )}

          {/* Enhanced Prompt - Editable Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Enhanced Prompt (Editable)
              <span className="text-xs text-muted-foreground ml-2">
                Edit this prompt to customize your generation
              </span>
            </Label>
            <Textarea
              value={enableCinematicMode ? enhancedPrompt : prompt}
              onChange={(e) => {
                const newPrompt = e.target.value

                // Mark that user is manually editing
                setIsPromptModified(true)

                if (enableCinematicMode) {
                  setIsManuallyEditingEnhancedPrompt(true)
                  setEnhancedPrompt(newPrompt)
                } else {
                  setPrompt(newPrompt)
                }

                // Extract aspect ratio from prompt text
                const extractAspectRatioFromPrompt = (prompt: string): string | null => {
                  const aspectRatioPatterns = [
                    { pattern: /(\d+):(\d+)\s*(?:widescreen|aspect|ratio)/gi, name: 'explicit' },
                    { pattern: /16:9|16\s*:\s*9/gi, name: '16:9' },
                    { pattern: /9:16|9\s*:\s*16/gi, name: '9:16' },
                    { pattern: /4:3|4\s*:\s*3/gi, name: '4:3' },
                    { pattern: /3:4|3\s*:\s*4/gi, name: '3:4' },
                    { pattern: /1:1|1\s*:\s*1|square/gi, name: '1:1' },
                    { pattern: /21:9|21\s*:\s*9/gi, name: '21:9' },
                    { pattern: /3:2|3\s*:\s*2/gi, name: '3:2' },
                    { pattern: /2:3|2\s*:\s*3/gi, name: '2:3' }
                  ]

                  for (const { pattern, name } of aspectRatioPatterns) {
                    const match = prompt.match(pattern)
                    if (match) {
                      if (name === 'explicit') {
                        const [, width, height] = match[0].match(/(\d+):(\d+)/) || []
                        if (width && height) return `${width}:${height}`
                      } else {
                        return name
                      }
                    }
                  }

                  return null
                }

                // Auto-adjust aspect ratio if found in prompt
                const extractedAspectRatio = extractAspectRatioFromPrompt(newPrompt)
                if (extractedAspectRatio && extractedAspectRatio !== aspectRatio) {
                  setAspectRatio(extractedAspectRatio)

                  if (onSettingsChange) {
                    onSettingsChange({
                      resolution: resolution,
                      aspectRatio: extractedAspectRatio,
                      baseImageAspectRatio: baseImageDimensions
                        ? calculateAspectRatio(baseImageDimensions.width, baseImageDimensions.height)
                        : aspectRatio,
                      baseImageUrl: baseImage || undefined,
                      onRemoveBaseImage: baseImage ? removeBaseImage : undefined
                    })
                  }
                }

                // Track if prompt has been modified from original
                setIsPromptModified(newPrompt !== originalPrompt)
              }}
              placeholder="Edit the generated prompt or write your own custom prompt..."
              rows={3}
              className="text-sm"
            />
            {isPromptModified && (
              <p className="text-xs text-primary">
                💡 Modified prompt - save as preset above
              </p>
            )}
            {isPromptModified && userSubject.trim() && (
              <p className="text-xs text-muted-foreground">
                ⚠️ Manual editing detected - subject field updates disabled
              </p>
            )}
          </div>

          {/* Prompt Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleAIEnhancePrompt}
              disabled={isEnhancing || (!prompt && !userSubject)}
              className="flex items-center gap-1"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  AI Enhance
                </>
              )}
            </Button>

            {enableCinematicMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsManuallyEditingEnhancedPrompt(false)
                    setCinematicParameters({...cinematicParameters})
                  }}
                >
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCinematicPreview(!showCinematicPreview)}
                >
                  {showCinematicPreview ? 'Hide' : 'Show'} Details
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={!prompt && !userSubject && !style}
              className="flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear All
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSavePreset}
              disabled={!prompt || !style}
              className="flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              Save Preset
            </Button>
          </div>

          {/* Technical Details Preview */}
          {enableCinematicMode && showCinematicPreview && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="text-xs text-muted-foreground">
                <strong>Base Prompt:</strong> {prompt}
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

        {/* Cinematic Parameters */}
        {enableCinematicMode && (
          <div className="space-y-4">
            <CinematicParameterSelector
              parameters={cinematicParameters}
              onParametersChange={handleCinematicParametersChange}
              onToggleChange={handleToggleChange}
              compact={false}
              showAdvanced={true}
            />
          </div>
        )}

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
            onChange={handleAspectRatioChange}
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
          <div className="flex items-center gap-2">
            <span>Aspect: {aspectRatio}</span>
            {enableCinematicMode && cinematicParameters.aspectRatio && cinematicParameters.aspectRatio !== aspectRatio && (
              <span className="text-primary-500" title="Aspect ratio mismatch between main selector and cinematic parameters">
                ⚠️ Sync
              </span>
            )}
          </div>
        </div>
        
        {/* Image Replacement Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="replace-images" className="text-xs text-muted-foreground">
            Replace latest images
          </Label>
          <Switch
            id="replace-images"
            checked={replaceLatestImages}
            onCheckedChange={setReplaceLatestImages}
            className="scale-75"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Analysis Button */}
          {userSubscriptionTier !== 'FREE' && (
            <Button
              onClick={() => setShowAnalysisModal(true)}
              disabled={loading || !prompt || !prompt.trim()}
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
            disabled={loading || !prompt?.trim() || userCredits < totalCredits}
            className={userSubscriptionTier !== 'FREE' ? "flex-1" : "w-full"}
            size="sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-border mr-2"></div>
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
      enhancedPrompt={enhancedPrompt}
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

    {/* Save Preset Dialog */}
    <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Preset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Save your current prompt, style, and parameters as a reusable preset.
          </p>
          <div className="space-y-2">
            <Label>Current Configuration</Label>
            <div className="text-sm space-y-1">
              <div><strong>Prompt:</strong> {(enableCinematicMode ? enhancedPrompt : prompt).substring(0, 100)}...</div>
              {userSubject && <div><strong>Subject:</strong> {userSubject}</div>}
              {style && <div><strong>Style:</strong> {style}</div>}
              {enableCinematicMode && Object.keys(cinematicParameters).length > 0 && (
                <div><strong>Cinematic Parameters:</strong> {Object.keys(cinematicParameters).length} active</div>
              )}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              const queryParams = new URLSearchParams({
                name: userSubject ? `${style} ${userSubject}` : `${style} preset`,
                description: `Preset with ${style} style${userSubject ? ` for ${userSubject}` : ''}`,
                prompt_template: enableCinematicMode ? enhancedPrompt : prompt,
                style: style,
                resolution: resolution,
                aspect_ratio: aspectRatio,
                consistency_level: currentConsistencyLevel,
                intensity: intensity.toString(),
                num_images: numImages.toString(),
                is_public: 'false',
                ...(userSubject && { subject: userSubject }),
                ...(enableCinematicMode && Object.keys(cinematicParameters).length > 0 ? {
                  cinematic_parameters: JSON.stringify(cinematicParameters),
                  enable_cinematic_mode: 'true'
                } : {})
              }).toString()

              window.location.href = `/presets/create?${queryParams}`
              setShowSavePresetDialog(false)
            }}
          >
            Continue to Save Preset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  )
}
