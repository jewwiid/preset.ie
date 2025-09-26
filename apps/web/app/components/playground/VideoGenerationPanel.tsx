'use client'

import { useState, useRef, useEffect } from 'react'
import { Wand2, Upload, Image as ImageIcon, X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DraggableImagePreview from './DraggableImagePreview'
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector'
import { CinematicParameters } from '../../../../../packages/types/src/cinematic-parameters'

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
}

export default function VideoGenerationPanel({ 
  onGenerateVideo,
  loading, 
  selectedImage,
  aspectRatio = '16:9',
  savedImages = [],
  onSelectSavedImage
}: VideoGenerationPanelProps) {
  const [videoDuration, setVideoDuration] = useState(5)
  const [videoResolution, setVideoResolution] = useState('480p')
  const [motionType, setMotionType] = useState('subtle')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [activeImageSource, setActiveImageSource] = useState<'selected' | 'uploaded' | 'saved'>('selected')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio)
  const [imageYPosition, setImageYPosition] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Cinematic parameters state
  const [enableCinematicMode, setEnableCinematicMode] = useState(false)
  const [cinematicParameters, setCinematicParameters] = useState<Partial<CinematicParameters>>({})
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true)
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')

  // Generate enhanced prompt based on cinematic parameters
  const generateEnhancedPrompt = () => {
    if (!enableCinematicMode || !cinematicParameters || Object.keys(cinematicParameters).length === 0) {
      setEnhancedPrompt(videoPrompt)
      return
    }

    try {
      // Import and use CinematicPromptBuilder
      import('../../../../../packages/services/src/cinematic-prompt-builder').then(({ CinematicPromptBuilder }) => {
        const promptBuilder = new CinematicPromptBuilder()
        const enhanced = promptBuilder.constructPrompt({
          basePrompt: videoPrompt,
          cinematicParameters,
          enhancementType: 'generate',
          includeTechnicalDetails,
          includeStyleReferences
        })
        setEnhancedPrompt(enhanced.fullPrompt)
      }).catch(() => {
        // Fallback if import fails
        setEnhancedPrompt(videoPrompt)
      })
    } catch (error) {
      console.error('Error generating enhanced prompt:', error)
      setEnhancedPrompt(videoPrompt)
    }
  }

  // Update enhanced prompt when parameters change
  useEffect(() => {
    generateEnhancedPrompt()
  }, [videoPrompt, cinematicParameters, includeTechnicalDetails, includeStyleReferences, enableCinematicMode])

  const handleGenerateVideo = async () => {
    const imageToUse = getCurrentImage()
    if (!imageToUse) {
      return
    }
    
    await onGenerateVideo({
      imageUrl: imageToUse,
      duration: videoDuration,
      resolution: videoResolution,
      motionType,
      aspectRatio: selectedAspectRatio,
      prompt: videoPrompt,
      yPosition: imageYPosition,
      cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
      includeTechnicalDetails,
      includeStyleReferences
    })
  }

  const getCurrentImage = () => {
    switch (activeImageSource) {
      case 'uploaded':
        return uploadedImage
      case 'saved':
        return selectedImage // This will be set by parent when saved image is selected
      case 'selected':
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
    setActiveImageSource('selected') // Switch to selected tab after choosing
    setImageYPosition(0) // Reset Y position when changing image
  }

  const handleSaveFraming = (framing: { yPosition: number; dimensions: { width: number; height: number } }) => {
    console.log('Framing saved:', framing)
  }

  const handleImageSourceChange = (source: 'selected' | 'uploaded' | 'saved') => {
    setActiveImageSource(source)
    setImageYPosition(0) // Reset Y position when changing image source
  }

  const getCreditsForVideo = () => {
    const baseCredits = 8
    const durationMultiplier = videoDuration > 3 ? 2 : 1
    const resolutionMultiplier = videoResolution === '720p' ? 2 : 1
    return baseCredits + (durationMultiplier * resolutionMultiplier)
  }

  const convertAspectRatio = (ratio: string): string => {
    switch (ratio) {
      case '1:1': return '1'
      case '16:9': return '16/9'
      case '9:16': return '9/16'
      case '4:3': return '4/3'
      case '3:4': return '3/4'
      case '21:9': return '21/9'
      default: return '1'
    }
  }

  const calculateDimensions = (aspectRatio: string, resolution: string) => {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
    const aspectRatioValue = widthRatio / heightRatio
    
    let width: number, height: number
    
    if (resolution === '720p') {
      if (aspectRatioValue >= 1) {
        width = 1280
        height = Math.round(1280 / aspectRatioValue)
      } else {
        height = 720
        width = Math.round(720 * aspectRatioValue)
      }
    } else { // 480p
      if (aspectRatioValue >= 1) {
        width = 854
        height = Math.round(854 / aspectRatioValue)
      } else {
        height = 480
        width = Math.round(480 * aspectRatioValue)
      }
    }
    
    return { width, height }
  }

  return (
    <div className="bg-background rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Wand2 className="h-5 w-5 mr-2 text-primary" />
        Video Generation
      </h2>
      
      <div className="space-y-4">
        {/* Current Image Preview */}
        {getCurrentImage() && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Current Image
            </label>
            <DraggableImagePreview
              imageUrl={getCurrentImage() || ''}
              aspectRatio={selectedAspectRatio}
              resolution={videoResolution}
              onPositionChange={setImageYPosition}
              onSaveFraming={handleSaveFraming}
              className="mb-2"
            />
            <div className="text-xs text-muted-foreground">
              <div>Target: {calculateDimensions(selectedAspectRatio, videoResolution).width} × {calculateDimensions(selectedAspectRatio, videoResolution).height}</div>
              <div className="text-primary">
                {activeImageSource === 'selected' && 'Selected Image'}
                {activeImageSource === 'uploaded' && 'Uploaded Image'}
                {activeImageSource === 'saved' && 'Saved Image'}
              </div>
            </div>
          </div>
        )}

        {/* Image Source Selection */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
            Image Source
          </label>
          <div className="flex space-x-2">
            <Button
              variant={activeImageSource === 'selected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleImageSourceChange('selected')}
              disabled={!selectedImage}
              className="h-8 px-3"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Selected
            </Button>
            <Button
              variant={activeImageSource === 'uploaded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                handleImageSourceChange('uploaded')
                // Trigger file input if no image uploaded yet
                if (!uploadedImage) {
                  fileInputRef.current?.click()
                }
              }}
              className="h-8 px-3"
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
            <Button
              variant={activeImageSource === 'saved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleImageSourceChange('saved')}
              disabled={savedImages.length === 0}
              className="h-8 px-3"
            >
              <ImageIcon className="h-3 w-3 mr-1" />
              Saved ({savedImages.length})
            </Button>
          </div>
        </div>

        {/* Image Upload Section */}
        {activeImageSource === 'uploaded' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Upload Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {!uploadedImage ? (
              <div 
                className="border-2 border-dashed border-border-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground-400 mb-2" />
                <p className="text-sm text-muted-foreground-600 mb-2">
                  Click to upload an image or drag and drop
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="text-primary-600 border-primary-200 hover:bg-primary-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="w-full bg-muted-200 border-2 border-dashed border-border-300 rounded-lg overflow-hidden transition-all duration-300"
                  style={{ 
                    aspectRatio: 'auto',
                    maxWidth: '100%'
                  }}
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-auto object-contain rounded-lg"
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement
                      const container = img.parentElement
                      if (container && img.naturalWidth && img.naturalHeight) {
                        const aspectRatio = img.naturalWidth / img.naturalHeight
                        container.style.aspectRatio = aspectRatio.toString()
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={removeUploadedImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="mt-2 text-xs text-muted-foreground-500">
                  Image uploaded successfully
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Images Selection */}
        {activeImageSource === 'saved' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select from Saved Images
            </label>
            <p className="text-xs text-muted-foreground-500 mb-3">
              Click on any image or the + button to add it to the video preview
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {savedImages.length === 0 ? (
                <div className="col-span-3 text-center py-8">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground-300 mb-2" />
                  <p className="text-sm text-muted-foreground-500">No saved images available</p>
                  <p className="text-xs text-muted-foreground-400 mt-1">Generate some images first!</p>
                </div>
              ) : (
                savedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`group relative border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${
                      selectedImage === image.image_url ? 'ring-2 ring-primary-primary border-primary-500' : 'border-border-200'
                    }`}
                    onClick={() => selectSavedImage(image.image_url)}
                  >
                    <div className="aspect-square bg-muted-100">
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <p className="text-primary-foreground text-xs font-medium truncate">{image.title}</p>
                    </div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button 
                        size="sm" 
                        variant={selectedImage === image.image_url ? "default" : "secondary"} 
                        className="h-6 w-6 p-0"
                        title="Add to preview"
                      >
                        <span className="text-sm font-bold">+</span>
                      </Button>
                    </div>
                    {selectedImage === image.image_url && (
                      <div className="absolute top-1 left-1 bg-primary-500 text-primary-foreground text-xs px-2 py-1 rounded">
                        Selected
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Aspect Ratio and Resolution */}
        <div className="grid grid-cols-2 gap-4">
          {/* Aspect Ratio */}
          <div>
            <Label htmlFor="aspectRatio" className="text-sm font-medium text-muted-foreground-700 mb-1">
              <Settings className="h-4 w-4 inline mr-1" />
              Aspect Ratio
            </Label>
            <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                <SelectItem value="4:3">4:3 (Traditional)</SelectItem>
                <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground-500 mt-1">
              Target: {calculateDimensions(selectedAspectRatio, videoResolution).width} × {calculateDimensions(selectedAspectRatio, videoResolution).height}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground-700 mb-1">
              Resolution
            </label>
            <select
              value={videoResolution}
              onChange={(e) => setVideoResolution(e.target.value)}
              className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-primary"
            >
              <option value="480p">480p (854x480)</option>
              <option value="720p">720p (1280x720)</option>
            </select>
          </div>
        </div>

        {/* Video Prompt */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground-700 mb-2">
            Video Prompt (Optional)
          </label>
          <textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="Describe the motion, camera movement, or action you want in the video. For example: 'Gentle zoom in on the subject, camera slowly rotates around the scene'"
            className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-primary resize-none"
            rows={3}
            maxLength={2000}
          />
          <div className="text-xs text-muted-foreground-500 mt-1">
            {videoPrompt.length}/2000 characters. Leave empty to use default motion based on your selection.
          </div>
          <div className="text-xs text-muted-foreground-400 mt-2">
            <strong>Tips:</strong> Describe motion, camera movement, or actions. Examples: "Gentle zoom in", "Camera rotates around subject", "Slow pan left", "Dramatic zoom out"
          </div>
          
          {/* Enhanced Prompt Preview */}
          {enableCinematicMode && enhancedPrompt && enhancedPrompt !== videoPrompt && (
            <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="h-4 w-4 text-primary-600" />
                <label className="text-sm font-medium text-primary-700">
                  Enhanced Prompt Preview
                </label>
              </div>
              <div className="text-sm text-muted-foreground-700 bg-background p-2 rounded border">
                {enhancedPrompt}
              </div>
              <div className="text-xs text-primary-600 mt-1">
                This enhanced prompt will be sent to the video generation API
              </div>
            </div>
          )}
        </div>

        {/* Cinematic Mode Toggle */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                <CardTitle className="text-lg">Cinematic Mode</CardTitle>
              </div>
              <Switch
                checked={enableCinematicMode}
                onCheckedChange={setEnableCinematicMode}
              />
            </div>
            <CardDescription>
              Enable professional cinematic parameters for enhanced video generation
            </CardDescription>
          </CardHeader>
          {enableCinematicMode && (
            <CardContent>
              <CinematicParameterSelector
                parameters={cinematicParameters}
                onParametersChange={setCinematicParameters}
                onToggleChange={(includeTechnicalDetails, includeStyleReferences) => {
                  setIncludeTechnicalDetails(includeTechnicalDetails)
                  setIncludeStyleReferences(includeStyleReferences)
                }}
                compact={false}
                showAdvanced={true}
              />
            </CardContent>
          )}
        </Card>

        <div>
          <label className="block text-sm font-medium text-muted-foreground-700 mb-1">
            Duration: {videoDuration}s
          </label>
          <input
            type="range"
            min="5"
            max="10"
            value={videoDuration}
            onChange={(e) => setVideoDuration(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground-500 mt-1">
            <span>5s</span>
            <span>10s</span>
          </div>
        </div>


        <div>
          <label className="block text-sm font-medium text-muted-foreground-700 mb-1">
            Motion Type
          </label>
          <select
            value={motionType}
            onChange={(e) => setMotionType(e.target.value)}
            className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-primary"
          >
            <option value="subtle">Subtle</option>
            <option value="moderate">Moderate</option>
            <option value="dynamic">Dynamic</option>
          </select>
        </div>


        <button
          onClick={handleGenerateVideo}
          disabled={loading || !getCurrentImage()}
          className="w-full bg-destructive-600 text-primary-foreground py-2 px-4 rounded-md hover:bg-destructive-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Video ({getCreditsForVideo()} credits)
            </>
          )}
        </button>
      </div>
    </div>
  )
}
