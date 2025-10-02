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
  onPromptChange
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
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          enhancementType: 'video',
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
  }, [videoPrompt, videoStyle, cinematicParameters, enableCinematicMode, showFeedback])

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
    if (!imageToUse) return

    await onGenerateVideo({
      imageUrl: imageToUse,
      duration: videoDuration,
      resolution: videoResolution,
      motionType,
      aspectRatio: selectedAspectRatio,
      prompt: enableCinematicMode ? enhancedPrompt : videoPrompt,
      yPosition: imageYPosition,
      cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
      includeTechnicalDetails,
      includeStyleReferences,
      selectedProvider
    })
  }

  const totalCredits = getCreditsForVideo()

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
          hasImage={!!getCurrentImage()}
        />
      </CardContent>
    </Card>
  )
}
