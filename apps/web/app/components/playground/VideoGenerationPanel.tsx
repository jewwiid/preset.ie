'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wand2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector'
import { CinematicParameters, AspectRatio } from '@preset/types'
import { VideoProviderSelector } from '../VideoProviderSelector'
import { VideoImageUploader } from '../../../components/playground/VideoImageUploader'
import { VideoPromptBuilder } from '../../../components/playground/VideoPromptBuilder'
import { VideoSettings } from '../../../components/playground/VideoSettings'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { usePexelsSearch } from '../../../lib/hooks/playground/usePexelsSearch'
import { Input } from '@/components/ui/input'
import PresetSelector from './PresetSelector'
import { replaceSubjectInTemplate, getPromptTemplateForMode } from '../../../lib/utils/playground'
import { useVideoGenerationState } from '../../../hooks/useVideoGenerationState'

interface VideoGenerationPanelProps {
  onGenerateVideo: (params: {
    imageUrl: string
    duration: number
    resolution: string
    cameraMovement: string
    aspectRatio: string
    prompt: string
    videoStyle?: string
    yPosition?: number
    cinematicParameters?: Partial<CinematicParameters>
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    selectedProvider?: 'seedream' | 'wan'
    presetId?: string
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
  onStyledImageChange?: (styledImageUrl: string | null) => void
  selectedPreset?: any
  onPresetChange?: (preset: any) => void
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
  onPresetChange,
  onAspectRatioChange,
  onResolutionChange,
  onActiveImageChange,
  onStyledImageChange
}: VideoGenerationPanelProps) {
  // Initialize video generation state hook
  const videoState = useVideoGenerationState({
    initialAspectRatio: aspectRatio,
    selectedProvider,
    selectedPreset,
    onAspectRatioChange,
    onResolutionChange})

  // Additional local state (not managed by hook)
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

  // Debug: Log image state changes
  useEffect(() => {
    console.log('🎬 Image state:', {
      uploadedImage: videoState.uploadedImage ? 'exists' : 'null',
      activeImageSource: videoState.activeImageSource,
      selectedImage: selectedImage ? 'exists' : 'null'
    })
  }, [videoState.uploadedImage, videoState.activeImageSource, selectedImage])

  // Pexels search state
  const pexelsSearch = usePexelsSearch()

  // Feedback hook (needed early for auto-apply style)
  const { showFeedback } = useFeedback()

  // Auto-enable cinematic mode when parameters are selected
  useEffect(() => {
    const hasParameters = Object.keys(videoState.cinematicParameters).length > 0 &&
      Object.values(videoState.cinematicParameters).some(val => val !== undefined && val !== null && val !== '')

    if (hasParameters && !videoState.enableCinematicMode) {
      console.log('🎬 Auto-enabling cinematic mode due to parameter selection')
      videoState.setEnableCinematicMode(true)
    }
  }, [videoState.cinematicParameters, videoState.enableCinematicMode, videoState.setEnableCinematicMode])

  // Sync aspect ratio between cinematic parameters and video settings
  useEffect(() => {
    if (videoState.cinematicParameters.aspectRatio && videoState.cinematicParameters.aspectRatio !== videoState.selectedAspectRatio) {
      console.log('🎬 Syncing aspect ratio from cinematic parameters:', videoState.cinematicParameters.aspectRatio)
      videoState.setSelectedAspectRatio(videoState.cinematicParameters.aspectRatio)
    }
  }, [videoState.cinematicParameters.aspectRatio, videoState.selectedAspectRatio, videoState.setSelectedAspectRatio])

  // Sync aspect ratio changes from video settings to cinematic parameters
  useEffect(() => {
    if (videoState.enableCinematicMode && videoState.selectedAspectRatio && videoState.cinematicParameters.aspectRatio !== videoState.selectedAspectRatio) {
      console.log('🎬 Syncing aspect ratio to cinematic parameters:', videoState.selectedAspectRatio)
      videoState.setCinematicParameters(prev => ({ ...prev, aspectRatio: videoState.selectedAspectRatio as AspectRatio }))
    }
  }, [videoState.selectedAspectRatio, videoState.enableCinematicMode, videoState.cinematicParameters.aspectRatio, videoState.setCinematicParameters])

  // Preset applied state (selectedPreset now comes from props)
  const [isPresetApplied, setIsPresetApplied] = useState(false)

  // Regeneration trigger - increment to force regeneration
  const [regenerationTrigger, setRegenerationTrigger] = useState(0)

  // Helper function to get current image
  const getCurrentImage = useCallback(() => {
    switch (videoState.activeImageSource) {
      case 'uploaded':
        return videoState.uploadedImage
      case 'saved':
      case 'selected':
      case 'pexels':
      default:
        return selectedImage
    }
  }, [videoState.activeImageSource, videoState.uploadedImage, selectedImage])

  // Update preset prompt when subject or image changes
  useEffect(() => {
    if (!selectedPreset) return

    const currentImage = getCurrentImage()
    const generationMode = currentImage ? 'image-to-video' : 'text-to-video'
    const videoTemplate = getPromptTemplateForMode(selectedPreset, generationMode)

    const finalPrompt = replaceSubjectInTemplate(
      videoTemplate,
      videoState.videoSubject,
      generationMode
    )

    videoState.setVideoPrompt(finalPrompt)
  }, [videoState.videoSubject, selectedPreset, getCurrentImage, videoState.setVideoPrompt])

  // Auto-generate prompt from subject, style, and image selection
  useEffect(() => {
    // Don't auto-generate if a preset was just applied
    if (isPresetApplied) {
      setIsPresetApplied(false)
      return
    }

    // Don't auto-generate if a preset is currently selected
    // This prevents overwriting the preset's prompt
    if (selectedPreset) {
      console.log('🎬 Preset selected - skipping auto-generation to preserve preset prompt')
      return
    }

    // Get current image based on active source
    let currentImage: string | null = null
    switch (videoState.activeImageSource) {
      case 'uploaded':
        currentImage = videoState.uploadedImage
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
      if (currentImage && videoState.videoSubject) {
        // Image-to-video with subject
        generatedPrompt = videoState.videoSubject
      } else if (currentImage && !videoState.videoSubject) {
        // Image-to-video without subject - leave empty, will be filled by style or default
        generatedPrompt = ''
      } else if (!currentImage && videoState.videoSubject) {
        // Text-to-video with subject
        generatedPrompt = videoState.videoSubject
      } else {
        // No image, no subject
        generatedPrompt = ''
      }

      // Add style if selected (fetch style prompt from database)
      if (videoState.videoStyle && videoState.videoStyle !== 'none') {
        try {
          const response = await fetch('/api/style-prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              styleName: videoState.videoStyle,
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
                generatedPrompt = `${generatedPrompt}. in the style of ${videoState.videoStyle}`
              } else {
                generatedPrompt = `Create video in the style of ${videoState.videoStyle}`
              }
            }
          } else {
            // Fallback if style not in database
            console.log('⚠️ Style not found in database, using fallback for:', videoState.videoStyle)
            if (generatedPrompt) {
              generatedPrompt = `${generatedPrompt}. in the style of ${videoState.videoStyle}`
            } else if (currentImage) {
              generatedPrompt = `Add motion with ${videoState.videoStyle} style`
            } else {
              generatedPrompt = `Create video in the style of ${videoState.videoStyle}`
            }
          }
        } catch (error) {
          console.error('Error fetching style prompt:', error)
          if (generatedPrompt) {
            generatedPrompt = `${generatedPrompt}. in the style of ${videoState.videoStyle}`
          } else {
            generatedPrompt = `Create video with ${videoState.videoStyle} style`
          }
        }
      }

      // Add camera movement description from database
      // Fetch camera movement description if motionType is set
      if (videoState.motionType) {
        try {
          const response = await fetch('/api/cinematic-parameters?category=camera_movements')
          const data = await response.json()
          if (data.success && data.parameters) {
            const movement = data.parameters.find((m: any) => m.value === videoState.motionType)
            if (movement) {
              const movementPrompt = `Add ${movement.label.toLowerCase()}: ${movement.description}`

              // For image-to-video with no prompt, use movement description as the base
              if (currentImage && !generatedPrompt) {
                generatedPrompt = movementPrompt
                console.log(`🎬 Using camera movement "${videoState.motionType}" as base prompt for image-to-video`)
              } else if (generatedPrompt) {
                // For prompts with content, append movement description
                generatedPrompt = `${generatedPrompt}. ${movementPrompt}`
                console.log(`🎬 Applied camera movement "${videoState.motionType}" to prompt`)
              }
            }
          }
        } catch (error) {
          console.error('Error fetching camera movement description:', error)
        }
      }

      // Fallback: If still no prompt after all logic, use default
      if (!generatedPrompt && currentImage) {
        generatedPrompt = 'Add natural motion to the scene'
      }

      // Update the base prompt
      videoState.setVideoPrompt(generatedPrompt?.trim() || '')
      console.log('🎬 Updated video prompt:', generatedPrompt?.trim()?.substring(0, 100) + '...')
    }

    generateVideoPrompt()
  }, [videoState.videoSubject, videoState.videoStyle, selectedImage, videoState.uploadedImage, videoState.activeImageSource, isPresetApplied, videoState.motionType, selectedPreset, regenerationTrigger, videoState.setVideoPrompt])

  // Generate enhanced prompt based on cinematic parameters
  useEffect(() => {
    if (!videoState.enableCinematicMode || Object.keys(videoState.cinematicParameters).length === 0) {
      videoState.setEnhancedPrompt(videoState.videoPrompt)
      return
    }

    try {
      import('../../../../../packages/services/src/cinematic-prompt-builder').then(
        ({ CinematicPromptBuilder }) => {
          const promptBuilder = new CinematicPromptBuilder()
          const enhanced = promptBuilder.constructPrompt({
            basePrompt: videoState.videoPrompt,
            cinematicParameters: videoState.cinematicParameters,
            enhancementType: 'generate',
            includeTechnicalDetails: videoState.includeTechnicalDetails,
            includeStyleReferences: videoState.includeStyleReferences
          })
          videoState.setEnhancedPrompt(enhanced.fullPrompt)
        }
      )
    } catch (error) {
      videoState.setEnhancedPrompt(videoState.videoPrompt)
    }
  }, [videoState.videoPrompt, videoState.cinematicParameters, videoState.includeTechnicalDetails, videoState.includeStyleReferences, videoState.enableCinematicMode, videoState.setEnhancedPrompt])

  // Notify parent of prompt changes - use enhanced prompt if available
  useEffect(() => {
    if (onPromptChange) {
      const currentPrompt = videoState.enableCinematicMode && videoState.enhancedPrompt
        ? videoState.enhancedPrompt
        : videoState.videoPrompt || videoState.videoSubject
      if (currentPrompt) {
        onPromptChange(currentPrompt)
      }
    }
  }, [videoState.videoSubject, videoState.videoPrompt, videoState.enhancedPrompt, videoState.enableCinematicMode, onPromptChange])

  // Notify parent of aspect ratio changes
  useEffect(() => {
    if (onAspectRatioChange) {
      onAspectRatioChange(videoState.selectedAspectRatio)
    }
  }, [videoState.selectedAspectRatio, onAspectRatioChange])

  // Notify parent of resolution changes
  useEffect(() => {
    if (onResolutionChange) {
      onResolutionChange(videoState.videoResolution)
    }
  }, [videoState.videoResolution, onResolutionChange])

  // Notify parent of active image changes
  useEffect(() => {
    if (onActiveImageChange) {
      const currentImage = getCurrentImage()
      onActiveImageChange(currentImage)
    }
  }, [videoState.uploadedImage, selectedImage, videoState.activeImageSource, onActiveImageChange, getCurrentImage])

  // Debug: Log savedImages prop
  useEffect(() => {
    console.log('🎬 VideoGenerationPanel received savedImages:', savedImages?.length || 0, savedImages)
  }, [savedImages])

  // Notify parent when styled image changes
  useEffect(() => {
    if (onStyledImageChange) {
      onStyledImageChange(videoState.styledImageUrl)
    }
  }, [videoState.styledImageUrl, onStyledImageChange])

  // Auto-apply style when videoStyle changes (Option 1 implementation)
  useEffect(() => {
    const applyStyle = async () => {
      const currentImage = getCurrentImage()

      // Only apply style if:
      // 1. There's a style selected (not empty or 'none')
      // 2. There's an image to apply it to
      // 3. Not currently applying a style
      // 4. Not in a loading state
      if (!videoState.videoStyle || videoState.videoStyle === '' || videoState.videoStyle.toLowerCase() === 'none' || !currentImage || videoState.applyingStyle || loading) {
        // Clear styled image if no style selected
        if ((!videoState.videoStyle || videoState.videoStyle === '' || videoState.videoStyle.toLowerCase() === 'none') && videoState.styledImageUrl) {
          console.log('🎨 Clearing styled image (no style selected)')
          videoState.setStyledImageUrl(null)
        }
        return
      }

      console.log('🎨 Auto-applying style:', videoState.videoStyle)
      videoState.setApplyingStyle(true)

      try {
        // Get auth token from supabase client
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
        const supabase = createClientComponentClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          console.error('❌ No auth session found')
          showFeedback({
            type: 'error',
            title: 'Authentication Error',
            message: 'Please log in to apply styles'
          })
          return
        }

        const response = await fetch('/api/playground/apply-style', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            imageUrl: currentImage,
            videoStyle: videoState.videoStyle,
            aspectRatio: videoState.selectedAspectRatio,
            resolution: videoState.videoResolution,
            prompt: videoState.videoPrompt || videoState.videoSubject || ''
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to apply style')
        }

        const data = await response.json()
        console.log('✅ Style applied successfully:', data.styledImageUrl)
        videoState.setStyledImageUrl(data.styledImageUrl)

        showFeedback({
          type: 'success',
          title: 'Style Applied',
          message: `${videoState.videoStyle} style applied (${data.creditsUsed} credits)`
        })
      } catch (error: any) {
        console.error('❌ Error applying style:', error)
        showFeedback({
          type: 'error',
          title: 'Style Application Failed',
          message: error.message || 'Failed to apply style'
        })
        // Clear styled image on error
        videoState.setStyledImageUrl(null)
      } finally {
        videoState.setApplyingStyle(false)
      }
    }

    applyStyle()
  }, [videoState.videoStyle, getCurrentImage, videoState.selectedAspectRatio, videoState.videoResolution, videoState.videoPrompt, videoState.videoSubject, videoState.applyingStyle, loading, videoState.styledImageUrl, showFeedback, videoState.setStyledImageUrl, videoState.setApplyingStyle])

  // Store the file object instead of uploading immediately
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      console.log('🎬 File selected:', { filename: file.name, size: file.size })

      // Store the file object and create a local preview URL
      setUploadedFile(file)
      const previewUrl = URL.createObjectURL(file)
      videoState.setUploadedImage(previewUrl)

      // Auto-switch to uploaded tab
      videoState.setActiveImageSource('uploaded')
      console.log('🎬 File ready for upload - will upload during video generation')
    }
  }

  // Upload file to Supabase when actually generating video
  const uploadFileToStorage = async (file: File): Promise<string> => {
    console.log('🎬 Uploading file to storage:', { filename: file.name, size: file.size })

    // Get auth token
    const { supabase } = await import('../../../lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('User not authenticated')
    }

    // Upload via API endpoint (uses service role to bypass RLS)
    const formData = new FormData()
    formData.append('file', file)

    const uploadResponse = await fetch('/api/playground/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await uploadResponse.json()
    console.log('🎬 File uploaded to storage:', {
      filename: file.name,
      publicUrl: result.url
    })

    return result.url
  }

  const removeUploadedImage = () => {
    if (videoState.uploadedImage) {
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(videoState.uploadedImage)
      videoState.setUploadedImage(null)
      setUploadedFile(null)
      videoState.setActiveImageSource('selected')
    }
  }

  const selectSavedImage = (imageUrl: string) => {
    onSelectSavedImage?.(imageUrl)
    videoState.setActiveImageSource('selected')
    videoState.setImageYPosition(0)
  }

  const handleImageSourceChange = (source: 'selected' | 'uploaded' | 'saved' | 'pexels') => {
    videoState.setActiveImageSource(source)
    videoState.setImageYPosition(0)
  }

  const handleSelectPexelsImage = useCallback((photo: any) => {
    const imageUrl = photo.src.large2x || photo.src.large || photo.src.medium
    onSelectSavedImage?.(imageUrl)
    videoState.setActiveImageSource('pexels')
    videoState.setImageYPosition(0)
    
    // Store attribution information in video state
    videoState.setImageAttribution({
      source: 'pexels',
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      photographer_id: photo.photographer_id,
      original_url: photo.url})
    
    console.log('Pexels attribution stored:', {
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      photographer_id: photo.photographer_id
    })
  }, [onSelectSavedImage, videoState])

  const handleAIEnhance = useCallback(async () => {
    videoState.setIsEnhancing(true)
    try {
      const currentImage = getCurrentImage()
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoState.videoPrompt,
          subject: videoState.videoSubject,
          generationMode: currentImage ? 'image-to-video' : 'text-to-video',
          style: videoState.videoStyle,
          cinematicParameters: videoState.enableCinematicMode ? videoState.cinematicParameters : undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (videoState.enableCinematicMode) {
          videoState.setEnhancedPrompt(data.enhancedPrompt)
        } else {
          videoState.setVideoPrompt(data.enhancedPrompt)
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
      videoState.setIsEnhancing(false)
    }
  }, [videoState, getCurrentImage, showFeedback])

  const handleRegeneratePrompt = useCallback(() => {
    // Force regeneration by incrementing trigger
    setRegenerationTrigger(prev => prev + 1)

    // Show visual feedback
    showFeedback({
      type: 'info',
      title: 'Regenerating Prompt',
      message: 'Prompt is being regenerated based on current settings...'
    })

    console.log('🔄 Manual prompt regeneration triggered')
    console.log('Current settings:', { videoSubject: videoState.videoSubject, videoStyle: videoState.videoStyle, motionType: videoState.motionType, enableCinematicMode: videoState.enableCinematicMode })
  }, [videoState, showFeedback])

  const handleClearAll = useCallback(() => {
    videoState.setVideoPrompt('')
    videoState.setEnhancedPrompt('')
    videoState.setVideoStyle('')
    videoState.setCinematicParameters({})
    videoState.setEnableCinematicMode(false)
    videoState.setVideoDuration(5)
    videoState.setMotionType('subtle')
    videoState.setVideoResolution('480p')
    videoState.setSelectedAspectRatio(aspectRatio)

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
        videoState.videoSubject,
        generationMode
      )

      videoState.setVideoPrompt(finalPrompt)
      setIsPresetApplied(true) // Prevent auto-generate from overwriting
      console.log('🎬 Applied preset prompt:', {
        imageTemplate: preset.prompt_template,
        videoTemplate: preset.prompt_template_video,
        selectedTemplate: videoTemplate,
        subject: videoState.videoSubject,
        finalPrompt
      })
    }

    // Apply cinematic settings from preset
    if (preset.cinematic_settings) {
      const { cinematic_settings } = preset

      if (cinematic_settings.enableCinematicMode !== undefined) {
        videoState.setEnableCinematicMode(cinematic_settings.enableCinematicMode)
      }

      if (cinematic_settings.cinematicParameters) {
        videoState.setCinematicParameters(cinematic_settings.cinematicParameters)
      }

      if (cinematic_settings.includeTechnicalDetails !== undefined) {
        videoState.setIncludeTechnicalDetails(cinematic_settings.includeTechnicalDetails)
      }

      if (cinematic_settings.includeStyleReferences !== undefined) {
        videoState.setIncludeStyleReferences(cinematic_settings.includeStyleReferences)
      }

      if (cinematic_settings.enhancedPrompt) {
        videoState.setEnhancedPrompt(cinematic_settings.enhancedPrompt)
      }
    }

    // Apply style settings if available
    // Note: We don't apply style from preset because it's already in the prompt template
    // Applying it here would trigger auto-generate and overwrite the preset prompt
    if (preset.style_settings?.style && !preset.prompt_template && !preset.prompt_template_video) {
      // Only set style if there's no prompt template (edge case)
      videoState.setVideoStyle(preset.style_settings.style)
    }

    // Apply technical settings if available
    if (preset.technical_settings) {
      if (preset.technical_settings.resolution) {
        videoState.setVideoResolution(preset.technical_settings.resolution)
      }
      if (preset.technical_settings.aspectRatio) {
        videoState.setSelectedAspectRatio(preset.technical_settings.aspectRatio)
      }
    }

    showFeedback({
      type: 'success',
      title: 'Preset Applied',
      message: `Applied preset: ${preset.name}`
    })
  }, [showFeedback, videoState.videoSubject])

  const getCreditsForVideo = () => {
    const baseCredits = selectedProvider === 'wan' ? 12 : 8
    const durationMultiplier = videoState.videoDuration > 5 ? 1.5 : 1
    const resolutionMultiplier = videoState.videoResolution === '720p' ? 1.5 : 1
    return Math.ceil(baseCredits * durationMultiplier * resolutionMultiplier)
  }

  const handleGenerateVideo = async () => {
    // Upload file to storage if user uploaded a file
    let actualImageUrl = getCurrentImage()

    if (uploadedFile && videoState.activeImageSource === 'uploaded') {
      try {
        console.log('🎬 Uploading file before video generation...')
        actualImageUrl = await uploadFileToStorage(uploadedFile)
        // Update the uploadedImage state with the permanent URL
        videoState.setUploadedImage(actualImageUrl)
        // Clear the file object as it's no longer needed
        setUploadedFile(null)
      } catch (error) {
        console.error('❌ Failed to upload file:', error)
        showFeedback({
          type: 'error',
          title: 'Upload Failed',
          message: 'Failed to upload image. Please try again.'
        })
        return // Don't proceed with video generation
      }
    }

    // Use styled image if available (from auto-apply), otherwise use uploaded/selected image
    const imageToUse = videoState.styledImageUrl || actualImageUrl

    console.log('🎬 Image URL Debug:', {
      actualImageUrl,
      styledImageUrl: videoState.styledImageUrl,
      imageToUse,
      uploadedFile: uploadedFile?.name,
      uploadedImage: videoState.uploadedImage,
      selectedImage,
      activeImageSource: videoState.activeImageSource,
      imageToUseLength: imageToUse?.length,
      imageToUseStartsWith: imageToUse?.substring(0, 50)
    })

    // Use enhanced prompt if cinematic mode is on, otherwise use video prompt (which includes style)
    // Only fall back to videoSubject if neither are available
    const promptToUse = videoState.enableCinematicMode && videoState.enhancedPrompt
      ? videoState.enhancedPrompt
      : videoState.videoPrompt || videoState.videoSubject || ''

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
      videoSubject: videoState.videoSubject,
      videoPrompt: videoState.videoPrompt,
      enhancedPrompt: videoState.enhancedPrompt,
      enableCinematicMode: videoState.enableCinematicMode,
      selectedPrompt: promptToUse,
      hasCinematicParams: Object.keys(videoState.cinematicParameters).length > 0
    })

    console.log('🎬 Image selection:', {
      styledImageUrl: videoState.styledImageUrl,
      currentImage: getCurrentImage(),
      usingStyledImage: !!videoState.styledImageUrl,
      imageToUse
    })

    await onGenerateVideo({
      imageUrl: imageToUse || '', // Can be empty for Wan text-to-video
      duration: videoState.videoDuration,
      resolution: videoState.videoResolution,
      cameraMovement: videoState.motionType,
      aspectRatio: videoState.selectedAspectRatio,
      prompt: promptToUse,
      videoStyle: videoState.styledImageUrl ? undefined : (videoState.videoStyle || undefined), // Don't pass style if already applied
      yPosition: videoState.imageYPosition,
      cinematicParameters: videoState.enableCinematicMode ? videoState.cinematicParameters : undefined,
      includeTechnicalDetails: videoState.includeTechnicalDetails,
      includeStyleReferences: videoState.includeStyleReferences,
      selectedProvider,
      presetId: selectedPreset?.id && selectedPreset.id !== 'local-preset' ? selectedPreset.id : undefined
    })
  }

  const totalCredits = getCreditsForVideo()

  // Debug: Check button state
  const currentImage = getCurrentImage()
  // Seedream: image-to-video only (requires image)
  // Wan: supports both text-to-video and image-to-video
  const canGenerate = selectedProvider === 'wan'
    ? (!!currentImage || !!videoState.videoSubject.trim() || !!videoState.videoPrompt.trim())
    : !!currentImage

  console.log('🎬 Video generation button state:', {
    selectedProvider,
    hasCurrentImage: !!currentImage,
    videoSubject: videoState.videoSubject,
    videoSubjectTrimmed: videoState.videoSubject.trim(),
    videoPrompt: videoState.videoPrompt,
    videoPromptTrimmed: videoState.videoPrompt.trim(),
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
          onPresetSelect={(preset) => {
            if (preset) {
              handlePresetSelect(preset)
              onPresetChange?.(preset)
            } else {
              // Clear preset
              videoState.setVideoPrompt('')
              videoState.setEnhancedPrompt('')
              videoState.setVideoStyle('')
              videoState.setCinematicParameters({})
              videoState.setEnableCinematicMode(false)
              onPresetChange?.(null)
            }
          }}
          selectedPreset={selectedPreset}
          currentSettings={{
            prompt: videoState.videoPrompt,
            style: videoState.videoStyle,
            resolution: videoState.videoResolution,
            aspectRatio: videoState.selectedAspectRatio,
            consistencyLevel: 'high',
            intensity: 1,
            numImages: 1,
            enableCinematicMode: videoState.enableCinematicMode,
            cinematicParameters: videoState.cinematicParameters,
            enhancedPrompt: videoState.enhancedPrompt,
            includeTechnicalDetails: videoState.includeTechnicalDetails,
            includeStyleReferences: videoState.includeStyleReferences,
            generationMode: getCurrentImage() ? 'image-to-image' : 'text-to-image',
            selectedProvider: selectedProvider as 'nanobanana' | 'seedream',
            // Video-specific settings
            motionType: videoState.motionType,
            videoStyle: videoState.videoStyle,
            duration: videoState.videoDuration,
            videoResolution: videoState.videoResolution
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
                    <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                      📝 Best for: Text-to-Video
                    </Badge>
                  )
                }

                if (mode === 'image-to-image') {
                  return (
                    <Badge variant="outline" className="border-primary text-primary bg-primary/10">
                      🎬 Best for: Image-to-Video
                    </Badge>
                  )
                }

                // Flexible mode
                return (
                  <>
                    <Badge variant="outline" className="border-primary text-primary bg-primary/10">
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
              value={videoState.videoSubject}
              onChange={(e) => videoState.setVideoSubject(e.target.value)}
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
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary rounded-lg">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-primary">
                    💡 Preset Recommendation
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This preset works best with text prompts, but Seedream requires an image. Switch to <strong>Wan provider</strong> for text-to-video or upload an image below.
                  </p>
                </div>
              </div>
            )
          }

          // Wan + image-to-image preset + no image
          if (selectedProvider === 'wan' && mode === 'image-to-image' && !hasImage) {
            return (
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary rounded-lg">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-primary">
                    💡 Preset Recommendation
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This preset is optimized for <strong>image-to-video</strong>. Upload or select an image from the "Image Source" section below for best results.
                  </p>
                </div>
              </div>
            )
          }

          // Any provider + text-to-image preset + has image
          if (mode === 'text-to-image' && hasImage) {
            return (
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary rounded-lg">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-primary">
                    💡 Preset Recommendation
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This preset works best with <strong>text prompts only</strong>. Consider removing the image or switching to a different preset for image-to-video.
                  </p>
                </div>
              </div>
            )
          }

          // Seedream + flexible preset + no image
          if (selectedProvider === 'seedream' && mode === 'flexible' && !hasImage) {
            return (
              <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary rounded-lg">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-primary">
                    💡 Preset Recommendation
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
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
          <Select value={videoState.videoStyle || undefined} onValueChange={(value) => videoState.setVideoStyle(value)} disabled={loadingStyles}>
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
          activeSource={videoState.activeImageSource}
          uploadedImage={videoState.uploadedImage}
          savedImages={savedImages}
          selectedImage={selectedImage}
          aspectRatio={videoState.selectedAspectRatio}
          resolution={videoState.videoResolution}
          onSourceChange={(source) => {
            console.log('🎬 Image source changed to:', source)
            handleImageSourceChange(source)
          }}
          onFileUpload={handleFileUpload}
          onRemoveUpload={removeUploadedImage}
          onSelectSaved={selectSavedImage}
          onPositionChange={videoState.setImageYPosition}
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
          prompt={videoState.videoPrompt}
          enhancedPrompt={videoState.enhancedPrompt}
          enableCinematicMode={videoState.enableCinematicMode}
          isEnhancing={videoState.isEnhancing}
          onPromptChange={videoState.setVideoPrompt}
          onEnhancedPromptChange={videoState.setEnhancedPrompt}
          onAIEnhance={handleAIEnhance}
          onClearAll={handleClearAll}
          onRegeneratePrompt={handleRegeneratePrompt}
          style={videoState.videoStyle}
        />

        {/* Cinematic Mode */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                <CardTitle className="text-sm">Cinematic Mode</CardTitle>
                {videoState.enableCinematicMode && (
                  <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <Switch
                checked={videoState.enableCinematicMode}
                onCheckedChange={videoState.setEnableCinematicMode}
              />
            </div>
            <CardDescription className="text-xs">
              {videoState.enableCinematicMode
                ? 'Professional cinematic parameters are active and will enhance your prompt'
                : 'Enable to apply professional cinematic parameters to your video'
              }
            </CardDescription>
          </CardHeader>
          {videoState.enableCinematicMode && (
            <CardContent>
              <CinematicParameterSelector
                parameters={videoState.cinematicParameters}
                onParametersChange={videoState.setCinematicParameters}
                onToggleChange={(technical, style) => {
                  videoState.setIncludeTechnicalDetails(technical)
                  videoState.setIncludeStyleReferences(style)
                }}
                compact={false}
                showAdvanced={true}
              />
            </CardContent>
          )}
        </Card>

        {/* Video Settings */}
        <VideoSettings
          duration={videoState.videoDuration}
          resolution={videoState.videoResolution}
          aspectRatio={videoState.selectedAspectRatio}
          motionType={videoState.motionType}
          loading={loading}
          userCredits={userCredits}
          totalCredits={totalCredits}
          onDurationChange={videoState.setVideoDuration}
          onResolutionChange={(resolution) => {
            console.log('🎬 Resolution changed to:', resolution)
            videoState.setVideoResolution(resolution)
            onResolutionChange?.(resolution)
          }}
          onAspectRatioChange={(ratio) => {
            console.log('🎬 Aspect ratio changed to:', ratio)
            videoState.setSelectedAspectRatio(ratio)
            onAspectRatioChange?.(ratio)
          }}
          onMotionTypeChange={videoState.setMotionType}
          onGenerate={handleGenerateVideo}
          hasImage={canGenerate}
          selectedProvider={selectedProvider}
        />
      </CardContent>
    </Card>
  )
}
