'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wand2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector'
import { CinematicParameters } from '../../../../../packages/types/src/cinematic-parameters'
import { VideoProviderSelector } from '../VideoProviderSelector'
import { VideoImageUploader } from '../../../components/playground/VideoImageUploader'
import { VideoPromptBuilder } from '../../../components/playground/VideoPromptBuilder'
import { VideoSettings } from '../../../components/playground/VideoSettings'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { usePexelsSearch } from '../../../lib/hooks/playground/usePexelsSearch'
import { Input } from '@/components/ui/input'
import PresetSelector from './PresetSelector'
import { replaceSubjectInTemplate, getPromptTemplateForMode } from '../../../lib/utils/playground'

interface VideoGenerationPanelProps {
  onGenerateVideo: (params: {
    imageUrl: string
    duration: number
    resolution: string
    motionType: string
    aspectRatio: string
    prompt: string
    yPosition?: number
    cinematicParameters?: Partial<CinematicParameters>
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    selectedProvider?: 'seedream' | 'wan'
  }) => Promise<void>
  loading: boolean
  selectedImage: string | null
  aspectRatio?: string
  savedImages?: Array<{
    id: string
    image_url: string
    title: string
  }>
  onSelectSavedImage?: (imageUrl: string) => void
  userCredits?: number
  userSubscriptionTier?: string
  selectedProvider?: 'seedream' | 'wan'
  onProviderChange?: (provider: 'seedream' | 'wan') => void
  onPromptChange?: (prompt: string) => void
  onAspectRatioChange?: (aspectRatio: string) => void
  onResolutionChange?: (resolution: string) => void
  onActiveImageChange?: (imageUrl: string | null) => void
  selectedPreset?: any
}

export default function VideoGenerationPanel({
  onGenerateVideo,
  loading,
  selectedImage,
  aspectRatio = '16:9',
  savedImages = [],
  onSelectSavedImage,
  userCredits = 0,
  userSubscriptionTier = 'FREE',
  selectedProvider = 'seedream',
  onProviderChange,
  onPromptChange,
  selectedPreset,
  onAspectRatioChange,
  onResolutionChange,
  onActiveImageChange
}: VideoGenerationPanelProps) {
  // Form state
  const [videoDuration, setVideoDuration] = useState(5)
  const [videoResolution, setVideoResolution] = useState('480p')
  const [motionType, setMotionType] = useState('subtle')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio)
  const [imageYPosition, setImageYPosition] = useState(0)
  const [videoStyle, setVideoStyle] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [videoSubject, setVideoSubject] = useState('')
  const [availableStyles, setAvailableStyles] = useState<Array<{ style_name: string; display_name: string }>>([])
  const [loadingStyles, setLoadingStyles] = useState(true)

  // Fetch available styles from database
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        setLoadingStyles(true)
        const response = await fetch('/api/style-prompts')
        if (response.ok) {
          const data = await response.json()
          setAvailableStyles(data.stylePrompts || [])
        } else {
          console.error('Failed to fetch styles')
        }
      } catch (error) {
        console.error('Error fetching styles:', error)
      } finally {
        setLoadingStyles(false)
      }
    }

    fetchStyles()
  }, [])

  // Auto-correct duration when switching to Wan (only allows 5 or 10)
  useEffect(() => {
    if (selectedProvider === 'wan' && videoDuration !== 5 && videoDuration !== 10) {
      // Round to nearest valid value
      const validDuration = videoDuration < 7.5 ? 5 : 10
      console.log(`⚠️ Auto-correcting duration from ${videoDuration}s to ${validDuration}s for Wan`)
      setVideoDuration(validDuration)
    }
  }, [selectedProvider, videoDuration])

  // Image source state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [activeImageSource, setActiveImageSource] = useState<'selected' | 'uploaded' | 'saved' | 'pexels'>('selected')

  // Pexels search state
  const pexelsSearch = usePexelsSearch()

  // Cinematic parameters state
  const [enableCinematicMode, setEnableCinematicMode] = useState(false)
  const [cinematicParameters, setCinematicParameters] = useState<Partial<CinematicParameters>>({})
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true)
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')

  // Load preset when selectedPreset changes
  useEffect(() => {
    if (selectedPreset) {
      console.log('🎬 Loading video preset:', selectedPreset)

      // Set prompt from preset
      if (selectedPreset.prompt_template_video || selectedPreset.prompt_template) {
        const promptToUse = selectedPreset.prompt_template_video || selectedPreset.prompt_template
        setVideoPrompt(promptToUse)
        console.log('🎬 Set video prompt from preset:', promptToUse)
      }

      // Set aspect ratio from preset
      if (selectedPreset.technical_settings?.aspect_ratio) {
        setSelectedAspectRatio(selectedPreset.technical_settings.aspect_ratio)
        onAspectRatioChange?.(selectedPreset.technical_settings.aspect_ratio)
      }

      // Set cinematic parameters if available
      if (selectedPreset.cinematic_settings) {
        setEnableCinematicMode(true)
        setCinematicParameters(selectedPreset.cinematic_settings.cinematicParameters || {})
      }
    }
  }, [selectedPreset])

  // Auto-enable cinematic mode when parameters are selected
  useEffect(() => {
    const hasParameters = Object.keys(cinematicParameters).length > 0 &&
      Object.values(cinematicParameters).some(val => val !== undefined && val !== null && val !== '')

    if (hasParameters && !enableCinematicMode) {
      console.log('🎬 Auto-enabling cinematic mode due to parameter selection')
      setEnableCinematicMode(true)
    }
  }, [cinematicParameters, enableCinematicMode])

  // Preset applied state (selectedPreset now comes from props)
  const [isPresetApplied, setIsPresetApplied] = useState(false)

  // Helper function to get current image
  const getCurrentImage = useCallback(() => {
    switch (activeImageSource) {
      case 'uploaded':
        return uploadedImage
      case 'saved':
      case 'selected':
      case 'pexels':
      default:
        return selectedImage
    }
  }, [activeImageSource, uploadedImage, selectedImage])

  // Update preset prompt when subject or image changes
  useEffect(() => {
    if (!selectedPreset) return

    const currentImage = getCurrentImage()
    const generationMode = currentImage ? 'image-to-video' : 'text-to-video'
    const videoTemplate = getPromptTemplateForMode(selectedPreset, generationMode)

    const finalPrompt = replaceSubjectInTemplate(
      videoTemplate,
      videoSubject,
      generationMode
    )

    setVideoPrompt(finalPrompt)
  }, [videoSubject, selectedPreset, getCurrentImage])

  // Auto-generate prompt from subject, style, and image selection
  useEffect(() => {
    // Don't auto-generate if a preset was just applied
    if (isPresetApplied) {
      setIsPresetApplied(false)
      return
    }

    // Don't auto-generate if a preset is currently selected
    // The preset manages its own prompt
    if (selectedPreset) {
      return
    }

    // Get current image based on active source
    let currentImage: string | null = null
    switch (activeImageSource) {
      case 'uploaded':
        currentImage = uploadedImage
        break
      case 'saved':
      case 'selected':
      case 'pexels':
      default:
        currentImage = selectedImage
        break
    }

    const generateVideoPrompt = async () => {
      let generatedPrompt = ''

      // Build prompt based on context
      if (currentImage && videoSubject) {
        // Image-to-video with subject
        generatedPrompt = videoSubject
      } else if (currentImage && !videoSubject) {
        // Image-to-video without subject - leave empty, will be filled by style or default
        generatedPrompt = ''
      } else if (!currentImage && videoSubject) {
        // Text-to-video with subject
        generatedPrompt = videoSubject
      } else {
        // No image, no subject
        generatedPrompt = ''
      }

      // Add style if selected (fetch style prompt from database)
      if (videoStyle && videoStyle !== 'none') {
        try {
          const response = await fetch('/api/style-prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              styleName: videoStyle,
              generationMode: currentImage ? 'image-to-image' : 'text-to-image'
            })
          })

          if (response.ok) {
            const data = await response.json()
            const baseStylePrompt = data.prompt

            if (baseStylePrompt) {
              // Combine style prompt with subject (same as image generation)
              if (currentImage && generatedPrompt) {
                // Image-to-video with subject: "Apply [style] to this image. [subject]"
                generatedPrompt = `${baseStylePrompt} this image. ${generatedPrompt}`
              } else if (currentImage && !generatedPrompt) {
                // Image-to-video without subject: "Apply [style] to this image"
                generatedPrompt = `${baseStylePrompt} this image`
              } else if (!currentImage && generatedPrompt) {
                // Text-to-video with subject: "[style] of [subject]"
                generatedPrompt = `${baseStylePrompt} of ${generatedPrompt}`
              } else {
                // Text-to-video without subject: just use the style prompt
                generatedPrompt = baseStylePrompt
              }
            } else {
              // Fallback if no style prompt returned
              if (generatedPrompt) {
                generatedPrompt = `${generatedPrompt}. in the style of ${videoStyle}`
              } else {
                generatedPrompt = `Create video in the style of ${videoStyle}`
              }
            }
          } else {
            // Fallback if style not in database
            console.log('⚠️ Style not found in database, using fallback for:', videoStyle)
            if (generatedPrompt) {
              generatedPrompt = `${generatedPrompt}. in the style of ${videoStyle}`
            } else if (currentImage) {
              generatedPrompt = `Add motion with ${videoStyle} style`
            } else {
              generatedPrompt = `Create video in the style of ${videoStyle}`
            }
          }
        } catch (error) {
          console.error('Error fetching style prompt:', error)
          if (generatedPrompt) {
            generatedPrompt = `${generatedPrompt}. in the style of ${videoStyle}`
          } else {
            generatedPrompt = `Create video with ${videoStyle} style`
          }
        }
      } else if (!generatedPrompt && currentImage) {
        // No style and no subject, but have image - use default
        generatedPrompt = 'Add natural motion to the scene'
      }

      // Update the base prompt
      setVideoPrompt(generatedPrompt.trim())
    }

    generateVideoPrompt()
  }, [videoSubject, videoStyle, selectedImage, uploadedImage, activeImageSource, isPresetApplied])

  // Generate enhanced prompt based on cinematic parameters
  useEffect(() => {
    if (!enableCinematicMode || Object.keys(cinematicParameters).length === 0) {
      setEnhancedPrompt(videoPrompt)
      return
    }

    try {
      import('../../../../../packages/services/src/cinematic-prompt-builder').then(
        ({ CinematicPromptBuilder }) => {
          const promptBuilder = new CinematicPromptBuilder()
          const enhanced = promptBuilder.constructPrompt({
            basePrompt: videoPrompt,
            cinematicParameters,
            enhancementType: 'generate',
            includeTechnicalDetails,
            includeStyleReferences
          })
          setEnhancedPrompt(enhanced.fullPrompt)
        }
      )
    } catch (error) {
      setEnhancedPrompt(videoPrompt)
    }
  }, [videoPrompt, cinematicParameters, includeTechnicalDetails, includeStyleReferences, enableCinematicMode])

  // Notify parent of prompt changes - use enhanced prompt if available
  useEffect(() => {
    if (onPromptChange) {
      const currentPrompt = enableCinematicMode && enhancedPrompt
        ? enhancedPrompt
        : videoPrompt || videoSubject
      if (currentPrompt) {
        onPromptChange(currentPrompt)
      }
    }
  }, [videoSubject, videoPrompt, enhancedPrompt, enableCinematicMode, onPromptChange])

  // Notify parent of aspect ratio changes
  useEffect(() => {
    if (onAspectRatioChange) {
      onAspectRatioChange(selectedAspectRatio)
    }
  }, [selectedAspectRatio, onAspectRatioChange])

  // Notify parent of resolution changes
  useEffect(() => {
    if (onResolutionChange) {
      onResolutionChange(videoResolution)
    }
  }, [videoResolution, onResolutionChange])

  // Notify parent of active image changes
  useEffect(() => {
    if (onActiveImageChange) {
      const currentImage = getCurrentImage()
      onActiveImageChange(currentImage)
    }
  }, [uploadedImage, selectedImage, activeImageSource, onActiveImageChange, getCurrentImage])

  // Debug: Log savedImages prop
  useEffect(() => {
    console.log('🎬 VideoGenerationPanel received savedImages:', savedImages?.length || 0, savedImages)
  }, [savedImages])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setUploadedImage(url)
      setActiveImageSource('uploaded')
    }
  }

  const removeUploadedImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage)
      setUploadedImage(null)
      setActiveImageSource('selected')
    }
  }

  const selectSavedImage = (imageUrl: string) => {
    onSelectSavedImage?.(imageUrl)
    setActiveImageSource('selected')
    setImageYPosition(0)
  }

  const handleImageSourceChange = (source: 'selected' | 'uploaded' | 'saved' | 'pexels') => {
    setActiveImageSource(source)
    setImageYPosition(0)
  }

  const handleSelectPexelsImage = useCallback((imageUrl: string) => {
    onSelectSavedImage?.(imageUrl)
    setActiveImageSource('pexels')
    setImageYPosition(0)
  }, [onSelectSavedImage])

  const { showFeedback } = useFeedback()

  const handleAIEnhance = useCallback(async () => {
    setIsEnhancing(true)
    try {
      const currentImage = getCurrentImage()
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          subject: videoSubject,
          generationMode: currentImage ? 'image-to-video' : 'text-to-video',
          style: videoStyle,
          cinematicParameters: enableCinematicMode ? cinematicParameters : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (enableCinematicMode) {
          setEnhancedPrompt(data.enhancedPrompt)
        } else {
          setVideoPrompt(data.enhancedPrompt)
        }
        showFeedback({
          type: 'success',
          title: 'Success',
          message: 'Prompt enhanced successfully!'
        })
      }
    } catch (error) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to enhance prompt'
      })
    } finally {
      setIsEnhancing(false)
    }
  }, [videoPrompt, videoSubject, videoStyle, cinematicParameters, enableCinematicMode, showFeedback])

  const handleClearAll = useCallback(() => {
    setVideoPrompt('')
    setEnhancedPrompt('')
    setVideoStyle('')
    setCinematicParameters({})
    setEnableCinematicMode(false)
    setVideoDuration(5)
    setMotionType('subtle')
    setVideoResolution('480p')
    setSelectedAspectRatio(aspectRatio)

    showFeedback({
      type: 'success',
      title: 'Success',
      message: 'All fields cleared'
    })
  }, [aspectRatio, showFeedback])

  const handlePresetSelect = useCallback((preset: any) => {
    if (!preset) {
      return
    }

    // Apply prompt template with subject replacement
    // Uses video-specific template if available, otherwise adapts image template
    if (preset.prompt_template || preset.prompt_template_video) {
      const currentImage = getCurrentImage()
      const generationMode = currentImage ? 'image-to-video' : 'text-to-video'

      // Get the appropriate template for video generation
      const videoTemplate = getPromptTemplateForMode(preset, generationMode)

      // Replace {subject} placeholder with videoSubject or "this image"
      const finalPrompt = replaceSubjectInTemplate(
        videoTemplate,
        videoSubject,
        generationMode
      )

      setVideoPrompt(finalPrompt)
      setIsPresetApplied(true) // Prevent auto-generate from overwriting
      console.log('🎬 Applied preset prompt:', {
        imageTemplate: preset.prompt_template,
        videoTemplate: preset.prompt_template_video,
        selectedTemplate: videoTemplate,
        subject: videoSubject,
        finalPrompt
      })
    }

    // Apply cinematic settings from preset
    if (preset.cinematic_settings) {
      const { cinematic_settings } = preset

      if (cinematic_settings.enableCinematicMode !== undefined) {
        setEnableCinematicMode(cinematic_settings.enableCinematicMode)
      }

      if (cinematic_settings.cinematicParameters) {
        setCinematicParameters(cinematic_settings.cinematicParameters)
      }

      if (cinematic_settings.includeTechnicalDetails !== undefined) {
        setIncludeTechnicalDetails(cinematic_settings.includeTechnicalDetails)
      }

      if (cinematic_settings.includeStyleReferences !== undefined) {
        setIncludeStyleReferences(cinematic_settings.includeStyleReferences)
      }

      if (cinematic_settings.enhancedPrompt) {
        setEnhancedPrompt(cinematic_settings.enhancedPrompt)
      }
    }

    // Apply style settings if available
    // Note: We don't apply style from preset because it's already in the prompt template
    // Applying it here would trigger auto-generate and overwrite the preset prompt
    if (preset.style_settings?.style && !preset.prompt_template && !preset.prompt_template_video) {
      // Only set style if there's no prompt template (edge case)
      setVideoStyle(preset.style_settings.style)
    }

    // Apply technical settings if available
    if (preset.technical_settings) {
      if (preset.technical_settings.resolution) {
        setVideoResolution(preset.technical_settings.resolution)
      }
      if (preset.technical_settings.aspectRatio) {
        setSelectedAspectRatio(preset.technical_settings.aspectRatio)
      }
    }

    showFeedback({
      type: 'success',
      title: 'Preset Applied',
      message: `Applied preset: ${preset.name}`
    })
  }, [showFeedback, videoSubject])

  const getCreditsForVideo = () => {
    const baseCredits = selectedProvider === 'wan' ? 12 : 8
    const durationMultiplier = videoDuration > 5 ? 1.5 : 1
    const resolutionMultiplier = videoResolution === '720p' ? 1.5 : 1
    return Math.ceil(baseCredits * durationMultiplier * resolutionMultiplier)
  }

  const handleGenerateVideo = async () => {
    const imageToUse = getCurrentImage()
    // Use enhanced prompt if cinematic mode is on, otherwise use video prompt (which includes style)
    // Only fall back to videoSubject if neither are available
    const promptToUse = enableCinematicMode && enhancedPrompt
      ? enhancedPrompt
      : videoPrompt || videoSubject || ''

    // Seedream: image-to-video only (requires image)
    // Wan: supports both text-to-video and image-to-video
    if (selectedProvider === 'seedream' && !imageToUse) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Seedream requires an image. Please select an image or switch to Wan for text-to-video.'
      })
      return
    }

    if (!imageToUse && !promptToUse) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Please provide either an image or a text prompt for video generation.'
      })
      return
    }

    console.log('🎬 Prompt selection:', {
      videoSubject,
      videoPrompt,
      enhancedPrompt,
      enableCinematicMode,
      selectedPrompt: promptToUse,
      hasCinematicParams: Object.keys(cinematicParameters).length > 0
    })

    await onGenerateVideo({
      imageUrl: imageToUse || '', // Can be empty for Wan text-to-video
      duration: videoDuration,
      resolution: videoResolution,
      motionType,
      aspectRatio: selectedAspectRatio,
      prompt: promptToUse,
      yPosition: imageYPosition,
      cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
      includeTechnicalDetails,
      includeStyleReferences,
      selectedProvider
    })
  }

  const totalCredits = getCreditsForVideo()

  // Debug: Check button state
  const currentImage = getCurrentImage()
  // Seedream: image-to-video only (requires image)
  // Wan: supports both text-to-video and image-to-video
  const canGenerate = selectedProvider === 'wan'
    ? (!!currentImage || !!videoSubject.trim() || !!videoPrompt.trim())
    : !!currentImage

  console.log('🎬 Video generation button state:', {
    selectedProvider,
    hasCurrentImage: !!currentImage,
    videoSubject: videoSubject,
    videoSubjectTrimmed: videoSubject.trim(),
    videoPrompt: videoPrompt,
    videoPromptTrimmed: videoPrompt.trim(),
    canGenerate,
    userCredits,
    totalCredits,
    hasEnoughCredits: userCredits >= totalCredits
  })

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Wand2 className="h-5 w-5 mr-2" />
          Video Generation
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Video Provider Selector */}
        <VideoProviderSelector
          selectedProvider={selectedProvider}
          userCredits={userCredits}
          onProviderChange={(provider) => {
            if (onProviderChange) {
              onProviderChange(provider)
            }
          }}
        />

        {/* Preset Selector */}
        <PresetSelector
          onPresetSelect={handlePresetSelect}
          selectedPreset={selectedPreset}
          currentSettings={{
            prompt: videoPrompt,
            style: videoStyle,
            resolution: videoResolution,
            aspectRatio: selectedAspectRatio,
            consistencyLevel: 'high',
            intensity: 1,
            numImages: 1,
            enableCinematicMode,
            cinematicParameters,
            enhancedPrompt,
            includeTechnicalDetails,
            includeStyleReferences,
            generationMode: getCurrentImage() ? 'image-to-image' : 'text-to-image',
            selectedProvider: selectedProvider as 'nanobanana' | 'seedream'
          }}
        />

        {/* Video Mode Badge for Selected Preset */}
        {selectedPreset && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Video Support:</span>
              {(() => {
                const mode = selectedPreset.technical_settings?.generation_mode

                if (mode === 'text-to-image') {
                  return (
                    <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
                      📝 Best for: Text-to-Video
                    </Badge>
                  )
                }

                if (mode === 'image-to-image') {
                  return (
                    <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50">
                      🎬 Best for: Image-to-Video
                    </Badge>
                  )
                }

                // Flexible mode
                return (
                  <>
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                      ✨ Works with Both
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      (Text-to-Video & Image-to-Video)
                    </span>
                  </>
                )
              })()}
            </div>

            {/* Provider Compatibility */}
            <div className="ml-auto text-xs text-muted-foreground">
              {(() => {
                const mode = selectedPreset.technical_settings?.generation_mode

                if (selectedProvider === 'seedream') {
                  if (mode === 'text-to-image') {
                    return '⚠️ Better with Wan'
                  }
                  return '✅ Compatible with Seedream'
                } else {
                  // Wan provider
                  return '✅ Compatible with Wan'
                }
              })()}
            </div>
          </div>
        )}

        {/* Generation Mode Info */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium">
            {getCurrentImage() ? 'Image-to-Video' : 'Text-to-Video'} Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            {getCurrentImage()
              ? 'Animating your selected image with motion effects'
              : 'Generate a video from text description'}
          </p>
        </div>

        {/* Subject Input - Only show for text-to-video mode with Wan provider */}
        {!getCurrentImage() && selectedProvider === 'wan' && (
          <div className="space-y-2">
            <Label htmlFor="videoSubject" className="text-sm">
              What do you want to animate?
            </Label>
            <Input
              id="videoSubject"
              value={videoSubject}
              onChange={(e) => setVideoSubject(e.target.value)}
              placeholder="e.g., a cow in a field, ocean waves, city traffic, dancing character..."
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Describe the scene or subject you want to bring to life with motion
            </p>
          </div>
        )}

        {/* Warning when Seedream is selected without image */}
        {selectedProvider === 'seedream' && !getCurrentImage() && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                Seedream requires an image
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">
                Please select an image from the "Image Source" section below, or switch to Wan provider for text-to-video generation
              </p>
            </div>
          </div>
        )}

        {/* Provider-Aware Preset Hints */}
        {selectedPreset && (() => {
          const mode = selectedPreset.technical_settings?.generation_mode
          const hasImage = !!getCurrentImage()

          // Seedream + text-to-image preset + no image
          if (selectedProvider === 'seedream' && mode === 'text-to-image' && !hasImage) {
            return (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700">
                    💡 Preset Recommendation
                  </p>
                  <p className="text-xs text-blue-600/80 mt-0.5">
                    This preset works best with text prompts, but Seedream requires an image. Switch to <strong>Wan provider</strong> for text-to-video or upload an image below.
                  </p>
                </div>
              </div>
            )
          }

          // Wan + image-to-image preset + no image
          if (selectedProvider === 'wan' && mode === 'image-to-image' && !hasImage) {
            return (
              <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-purple-700">
                    💡 Preset Recommendation
                  </p>
                  <p className="text-xs text-purple-600/80 mt-0.5">
                    This preset is optimized for <strong>image-to-video</strong>. Upload or select an image from the "Image Source" section below for best results.
                  </p>
                </div>
              </div>
            )
          }

          // Any provider + text-to-image preset + has image
          if (mode === 'text-to-image' && hasImage) {
            return (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700">
                    💡 Preset Recommendation
                  </p>
                  <p className="text-xs text-blue-600/80 mt-0.5">
                    This preset works best with <strong>text prompts only</strong>. Consider removing the image or switching to a different preset for image-to-video.
                  </p>
                </div>
              </div>
            )
          }

          // Seedream + flexible preset + no image
          if (selectedProvider === 'seedream' && mode === 'flexible' && !hasImage) {
            return (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Sparkles className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-700">
                    💡 Preset Recommendation
                  </p>
                  <p className="text-xs text-green-600/80 mt-0.5">
                    This flexible preset works with both modes, but Seedream requires an image. Upload an image below or switch to <strong>Wan provider</strong> for text-to-video.
                  </p>
                </div>
              </div>
            )
          }

          return null
        })()}

        {/* Style Selector */}
        <div className="space-y-2">
          <Label htmlFor="videoStyle" className="text-sm">
            Video Style (Optional)
          </Label>
          <Select value={videoStyle || undefined} onValueChange={(value) => setVideoStyle(value)} disabled={loadingStyles}>
            <SelectTrigger>
              <SelectValue placeholder={loadingStyles ? "Loading styles..." : "Select a style for your video"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Style</SelectItem>
              {availableStyles.map((style) => (
                <SelectItem key={style.style_name} value={style.style_name}>
                  {style.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Image Uploader */}
        <VideoImageUploader
          currentImage={getCurrentImage()}
          activeSource={activeImageSource}
          uploadedImage={uploadedImage}
          savedImages={savedImages}
          selectedImage={selectedImage}
          aspectRatio={selectedAspectRatio}
          resolution={videoResolution}
          onSourceChange={handleImageSourceChange}
          onFileUpload={handleFileUpload}
          onRemoveUpload={removeUploadedImage}
          onSelectSaved={selectSavedImage}
          onPositionChange={setImageYPosition}
          pexelsState={{
            query: pexelsSearch.pexelsQuery,
            results: pexelsSearch.pexelsResults,
            loading: pexelsSearch.pexelsLoading,
            page: pexelsSearch.pexelsPage,
            totalResults: pexelsSearch.pexelsTotalResults,
            filters: pexelsSearch.pexelsFilters,
            customHexColor: pexelsSearch.customHexColor,
            showHexInput: pexelsSearch.showHexInput,
            updateQuery: pexelsSearch.updateQuery,
            updateFilters: pexelsSearch.updateFilters,
            updateCustomHexColor: pexelsSearch.updateCustomHexColor,
            toggleHexInput: pexelsSearch.toggleHexInput,
            prevPage: pexelsSearch.prevPage,
            nextPage: pexelsSearch.nextPage,
            goToPage: pexelsSearch.goToPage
          }}
          onSelectPexelsImage={handleSelectPexelsImage}
        />

        {/* Prompt Builder */}
        <VideoPromptBuilder
          prompt={videoPrompt}
          enhancedPrompt={enhancedPrompt}
          enableCinematicMode={enableCinematicMode}
          isEnhancing={isEnhancing}
          onPromptChange={setVideoPrompt}
          onEnhancedPromptChange={setEnhancedPrompt}
          onAIEnhance={handleAIEnhance}
          onClearAll={handleClearAll}
          style={videoStyle}
        />

        {/* Cinematic Mode */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                <CardTitle className="text-sm">Cinematic Mode</CardTitle>
                {enableCinematicMode && (
                  <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <Switch
                checked={enableCinematicMode}
                onCheckedChange={setEnableCinematicMode}
              />
            </div>
            <CardDescription className="text-xs">
              {enableCinematicMode
                ? 'Professional cinematic parameters are active and will enhance your prompt'
                : 'Enable to apply professional cinematic parameters to your video'
              }
            </CardDescription>
          </CardHeader>
          {enableCinematicMode && (
            <CardContent>
              <CinematicParameterSelector
                parameters={cinematicParameters}
                onParametersChange={setCinematicParameters}
                onToggleChange={(technical, style) => {
                  setIncludeTechnicalDetails(technical)
                  setIncludeStyleReferences(style)
                }}
                compact={false}
                showAdvanced={true}
              />
            </CardContent>
          )}
        </Card>

        {/* Video Settings */}
        <VideoSettings
          duration={videoDuration}
          resolution={videoResolution}
          aspectRatio={selectedAspectRatio}
          motionType={motionType}
          loading={loading}
          userCredits={userCredits}
          totalCredits={totalCredits}
          onDurationChange={setVideoDuration}
          onResolutionChange={setVideoResolution}
          onAspectRatioChange={setSelectedAspectRatio}
          onMotionTypeChange={setMotionType}
          onGenerate={handleGenerateVideo}
          hasImage={canGenerate}
          selectedProvider={selectedProvider}
        />
      </CardContent>
    </Card>
  )
}
