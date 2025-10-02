'use client'

import { useState, useEffect, useCallback } from 'react'
import { Wand2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector'
import { CinematicParameters } from '../../../../../packages/types/src/cinematic-parameters'
import { VideoProviderSelector } from '../VideoProviderSelector'
import { VideoImageUploader } from '../../../components/playground/VideoImageUploader'
import { VideoPromptBuilder } from '../../../components/playground/VideoPromptBuilder'
import { VideoSettings } from '../../../components/playground/VideoSettings'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { usePexelsSearch } from '../../../lib/hooks/playground/usePexelsSearch'
import { Input } from '@/components/ui/input'

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
  onAspectRatioChange,
  onResolutionChange
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

  // Auto-generate prompt from subject, style, and image selection
  useEffect(() => {
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
  }, [videoSubject, videoStyle, selectedImage, uploadedImage, activeImageSource])

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

  // Notify parent of prompt changes
  useEffect(() => {
    const currentPrompt = videoSubject || videoPrompt
    if (onPromptChange && currentPrompt) {
      onPromptChange(currentPrompt)
    }
  }, [videoSubject, videoPrompt, onPromptChange])

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

  // Debug: Log savedImages prop
  useEffect(() => {
    console.log('🎬 VideoGenerationPanel received savedImages:', savedImages?.length || 0, savedImages)
  }, [savedImages])

  const getCurrentImage = () => {
    switch (activeImageSource) {
      case 'uploaded':
        return uploadedImage
      case 'saved':
      case 'selected':
      case 'pexels':
      default:
        return selectedImage
    }
  }

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

  const getCreditsForVideo = () => {
    const baseCredits = selectedProvider === 'wan' ? 12 : 8
    const durationMultiplier = videoDuration > 5 ? 1.5 : 1
    const resolutionMultiplier = videoResolution === '720p' ? 1.5 : 1
    return Math.ceil(baseCredits * durationMultiplier * resolutionMultiplier)
  }

  const handleGenerateVideo = async () => {
    const imageToUse = getCurrentImage()
    const promptToUse = videoSubject || videoPrompt || (enableCinematicMode ? enhancedPrompt : '')

    // For Wan: allow text-to-video (no image) or image-to-video
    // For Seedream: require image (image-to-video only)
    if (selectedProvider === 'seedream' && !imageToUse) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Seedream requires an image. Please select or upload an image.'
      })
      return
    }

    if (selectedProvider === 'wan' && !imageToUse && !promptToUse) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Please provide either an image or a text prompt for video generation.'
      })
      return
    }

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

        {/* Subject Input - Only show for text-to-video mode */}
        {!getCurrentImage() && (
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

        {/* Style Selector */}
        <div className="space-y-2">
          <Label htmlFor="videoStyle" className="text-sm">
            Video Style (Optional)
          </Label>
          <Select value={videoStyle || undefined} onValueChange={(value) => setVideoStyle(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a style for your video" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Style</SelectItem>
              <SelectItem value="cinematic">Cinematic</SelectItem>
              <SelectItem value="dreamy">Dreamy</SelectItem>
              <SelectItem value="dramatic">Dramatic</SelectItem>
              <SelectItem value="smooth">Smooth Motion</SelectItem>
              <SelectItem value="fast-paced">Fast-Paced</SelectItem>
              <SelectItem value="slow-motion">Slow Motion</SelectItem>
              <SelectItem value="time-lapse">Time-Lapse</SelectItem>
              <SelectItem value="anime">Anime Style</SelectItem>
              <SelectItem value="vintage">Vintage Film</SelectItem>
              <SelectItem value="glitch">Glitch Effect</SelectItem>
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
              </div>
              <Switch
                checked={enableCinematicMode}
                onCheckedChange={setEnableCinematicMode}
              />
            </div>
            <CardDescription className="text-xs">
              Enable professional cinematic parameters for enhanced video generation
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
        />
      </CardContent>
    </Card>
  )
}
