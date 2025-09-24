'use client'

import { useState, useEffect, useMemo } from 'react'
import { Wand2, Download, Heart, Settings, X, Sparkles, Grid3X3, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { downloadImageWithWatermark } from '../../../lib/watermark-utils'
import DraggableImagePreview from './DraggableImagePreview'

interface DynamicPreviewAreaProps {
  aspectRatio: string
  resolution: string
  images: Array<{
    url: string
    width: number
    height: number
    generated_at: string
    type?: string
  }>
  selectedImage: string | null
  onSelectImage: (url: string | null) => void
  onSaveToGallery: (url: string) => Promise<void>
  savingImage: string | null
  loading?: boolean
  subscriptionTier?: 'free' | 'plus' | 'pro'
  onRemoveBaseImage?: () => void
  fullWidth?: boolean
  // Style selector props
  currentStyle?: string
  onStyleChange?: (style: string) => void
  // Generation mode props
  generationMode?: 'text-to-image' | 'image-to-image'
  onGenerationModeChange?: (mode: 'text-to-image' | 'image-to-image') => void
  // Prompt prop
  prompt?: string
  // Resolution props
  userSubscriptionTier?: string
  onResolutionChange?: (resolution: string) => void
  // Provider props
  selectedProvider?: string
  onProviderChange?: (provider: string) => void
  // Consistency props
  consistencyLevel?: string
  onConsistencyChange?: (consistency: string) => void
  // Generation action props
  onRegenerate?: () => void
  onClearImages?: () => void
}

export default function DynamicPreviewArea({
  aspectRatio,
  resolution,
  images,
  selectedImage,
  onSelectImage,
  onSaveToGallery,
  savingImage,
  loading = false,
  subscriptionTier = 'free',
  onRemoveBaseImage,
  fullWidth = false,
  currentStyle,
  onStyleChange,
  generationMode,
  onGenerationModeChange,
  prompt,
  userSubscriptionTier,
  onResolutionChange,
  selectedProvider,
  onProviderChange,
  consistencyLevel,
  onConsistencyChange,
  onRegenerate,
  onClearImages
}: DynamicPreviewAreaProps) {
  const { showSuccess, showError } = useToast()
  const [showBaseImage, setShowBaseImage] = useState(false) // Default to showing generated images
  const [showGridOverlay, setShowGridOverlay] = useState(true)
  const [gridType, setGridType] = useState<'horizontal' | 'rule-of-thirds'>('horizontal')
  
  // Use the aspect ratio from parent instead of local state
  const displayAspectRatio = aspectRatio || '1:1'
  const previewAspectRatio = displayAspectRatio.replace(':', '/')
  
  // Separate base images from generated images - memoized to prevent infinite loops
  const baseImages = useMemo(() => images.filter(img => img.type === 'base'), [images])
  const generatedImages = useMemo(() => images.filter(img => img.type !== 'base'), [images])
  
  // Auto-show base image when it exists and no generated images are present
  useEffect(() => {
    const hasBaseImages = baseImages.length > 0
    const hasGeneratedImages = generatedImages.length > 0
    
    // If there are base images but no generated images, show base images by default
    if (hasBaseImages && !hasGeneratedImages) {
      setShowBaseImage(true)
    }
    // If there are generated images, show them by default
    else if (hasGeneratedImages) {
      setShowBaseImage(false)
    }
  }, [baseImages, generatedImages])
  
  // Show generated images by default when they exist, otherwise show base images
  const imagesToDisplay = showBaseImage ? baseImages : generatedImages.length > 0 ? generatedImages : baseImages
  
  // Debug logging (only when needed)
  // console.log('🔍 DynamicPreviewArea Debug:', {
  //   totalImages: images.length,
  //   baseImagesCount: baseImages.length,
  //   generatedImagesCount: generatedImages.length,
  //   showBaseImage,
  //   imagesToDisplayCount: imagesToDisplay.length,
  //   imagesToDisplay: imagesToDisplay.map(img => ({ url: img.url.substring(0, 50) + '...', type: img.type }))
  // })

  const handleSaveToGallery = async (imageUrl: string) => {
    try {
      await onSaveToGallery(imageUrl)
      showSuccess(
        'Image Saved! 💖',
        'Your image has been saved to your gallery. You can find it in the "Saved Images" section below and use it later in moodboards, showcases, or as profile images.',
        {
          label: 'View Gallery',
          onClick: () => {
            // Scroll to the saved images gallery
            const galleryElement = document.querySelector('[data-saved-gallery]')
            if (galleryElement) {
              galleryElement.scrollIntoView({ behavior: 'smooth' })
            }
          }
        }
      )
    } catch (error) {
      showError(
        'Save Failed',
        'There was an error saving your image. Please try again.',
        {
          label: 'Retry',
          onClick: () => handleSaveToGallery(imageUrl)
        }
      )
    }
  }


  const calculateDimensions = (aspectRatio: string, baseResolution: string) => {
    // Default to 1:1 if aspectRatio is undefined or invalid
    const safeAspectRatio = aspectRatio || '1:1'
    const [widthRatio, heightRatio] = safeAspectRatio.split(':').map(Number)
    const baseSize = parseInt(baseResolution)
    
    const aspectRatioValue = widthRatio / heightRatio
    
    let width: number, height: number
    
    if (aspectRatioValue >= 1) {
      width = baseSize
      height = Math.round(baseSize / aspectRatioValue)
    } else {
      height = baseSize
      width = Math.round(baseSize * aspectRatioValue)
    }
    
    return { width, height }
  }

  const dimensions = calculateDimensions(aspectRatio, resolution)

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      // Load watermark SVG from brandkit
          const watermarkSvg = await fetch('/brandkit-watermark.svg').then(res => res.text()).catch(() => '')
      
      const isPaidUser = subscriptionTier === 'plus' || subscriptionTier === 'pro'
      
      await downloadImageWithWatermark(
        imageUrl,
        filename,
        isPaidUser,
        watermarkSvg
      )
      
      showSuccess(
        'Download Complete! 📥',
        isPaidUser 
          ? 'Image downloaded successfully!' 
          : 'Image downloaded with watermark (upgrade to remove watermark)'
      )
    } catch (error) {
      console.error('Error downloading image:', error)
      showError(
        'Download Failed',
        'There was an error downloading the image. Please try again.'
      )
    }
  }

  const handleDownloadVideo = async (videoUrl: string, filename: string) => {
    try {
      const response = await fetch(videoUrl)
      if (!response.ok) throw new Error('Failed to fetch video')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showSuccess(
        'Download Complete! 📥',
        'Video downloaded successfully!'
      )
    } catch (error) {
      console.error('Error downloading video:', error)
      showError(
        'Download Failed',
        'There was an error downloading the video. Please try again.'
      )
    }
  }

  // Side-by-side layout for full width mode
  if (fullWidth) {
    return (
      <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Content</CardTitle>
              <CardDescription>
                Preview and generated images side-by-side
              </CardDescription>
            </div>
            {/* Style and Provider Selectors */}
            <div className="flex items-center gap-4">
              {/* Style Selector */}
              {onStyleChange && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="style-selector" className="text-sm font-medium">Style:</Label>
                  <Select value={currentStyle || ''} onValueChange={onStyleChange}>
                    <SelectTrigger className="w-[160px] h-8 text-sm">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                  <SelectContent>
                    {/* Original Styles */}
                    <SelectItem value="photorealistic">Photorealistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                    <SelectItem value="watercolor">Watercolor</SelectItem>
                    <SelectItem value="impressionist">Impressionist</SelectItem>
                    <SelectItem value="renaissance">Renaissance</SelectItem>
                    <SelectItem value="baroque">Baroque</SelectItem>
                    <SelectItem value="art_deco">Art Deco</SelectItem>
                    <SelectItem value="pop_art">Pop Art</SelectItem>
                    <SelectItem value="digital_art">Digital Art</SelectItem>
                    <SelectItem value="concept_art">Concept Art</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="sci_fi">Sci-Fi</SelectItem>
                    <SelectItem value="maximalist">Maximalist</SelectItem>
                    <SelectItem value="surreal">Surreal</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="sketch">Sketch</SelectItem>
                    <SelectItem value="oil_painting">Oil Painting</SelectItem>
                    
                    {/* Photography Styles */}
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="editorial">Editorial</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="street">Street</SelectItem>
                    <SelectItem value="architecture">Architecture</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    
                    {/* Additional Artistic Styles */}
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    
                    {/* Creative Styles */}
                    <SelectItem value="pop_art">Pop Art</SelectItem>
                    <SelectItem value="graffiti">Graffiti</SelectItem>
                    <SelectItem value="digital_art">Digital Art</SelectItem>
                    <SelectItem value="concept_art">Concept Art</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="sci_fi">Sci-Fi</SelectItem>
                    <SelectItem value="steampunk">Steampunk</SelectItem>
                    <SelectItem value="gothic">Gothic</SelectItem>
                    
                    {/* Cinematic Styles */}
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="film_noir">Film Noir</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                    <SelectItem value="moody">Moody</SelectItem>
                    <SelectItem value="bright">Bright</SelectItem>
                    <SelectItem value="monochrome">Monochrome</SelectItem>
                    <SelectItem value="sepia">Sepia</SelectItem>
                    <SelectItem value="hdr">HDR</SelectItem>
                    
                    {/* Technical Styles */}
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              )}
              
              {/* Provider Selector */}
              {onProviderChange && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="provider-selector" className="text-sm font-medium">Provider:</Label>
                  <Select value={selectedProvider || 'nanobanana'} onValueChange={onProviderChange}>
                    <SelectTrigger className="w-[140px] h-8 text-sm">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nanobanana">🍌 NanoBanana</SelectItem>
                      <SelectItem value="seedream">🌊 Seedream</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Base Image Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Base Image Preview</Label>
                {/* Generation Mode Controls - Inline with header for symmetry */}
                {onGenerationModeChange && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Mode:</Label>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={generationMode === 'text-to-image' ? 'default' : 'outline'}
                        onClick={() => {
                          onGenerationModeChange('text-to-image')
                          // Scroll to prompt field
                          setTimeout(() => {
                            const promptField = document.querySelector('[data-prompt-field]')
                            if (promptField) {
                              promptField.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }
                          }, 100)
                        }}
                        className="h-7 px-3 text-xs"
                      >
                        Text to Image
                      </Button>
                      <Button
                        size="sm"
                        variant={generationMode === 'image-to-image' ? 'default' : 'outline'}
                        onClick={() => {
                          onGenerationModeChange('image-to-image')
                          // Scroll to base image source selector
                          setTimeout(() => {
                            const baseImageSection = document.querySelector('[data-base-image-section]')
                            if (baseImageSection) {
                              baseImageSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }
                          }, 100)
                        }}
                        className="h-7 px-3 text-xs"
                      >
                        Image to Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {baseImages.length > 0 ? (
                <div className="space-y-3">
                  {/* Grid Overlay Controls */}
                  <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="grid-overlay" className="text-sm font-medium">
                          Grid Overlay
                        </Label>
                        <Switch
                          id="grid-overlay"
                          checked={showGridOverlay}
                          onCheckedChange={setShowGridOverlay}
                        />
                      </div>
                      
                      {showGridOverlay && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Type:</Label>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={gridType === 'horizontal' ? 'default' : 'outline'}
                              onClick={() => setGridType('horizontal')}
                              className="h-8 px-3 text-xs"
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              Horizontal
                            </Button>
                            <Button
                              size="sm"
                              variant={gridType === 'rule-of-thirds' ? 'default' : 'outline'}
                              onClick={() => setGridType('rule-of-thirds')}
                              className="h-8 px-3 text-xs"
                            >
                              <Grid3X3 className="h-3 w-3 mr-1" />
                              Rule of Thirds
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Base Image Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (onRemoveBaseImage) {
                          onRemoveBaseImage()
                        } else {
                          // Fallback: clear the base image from the images array
                          setShowBaseImage(false)
                        }
                      }}
                      className="h-8 px-3 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <DraggableImagePreview
                    imageUrl={baseImages[0].url}
                    aspectRatio={aspectRatio}
                    resolution={resolution}
                    onPositionChange={(yPosition) => {
                      console.log('Base image position changed:', yPosition)
                    }}
                    onSaveFraming={(framing) => {
                      console.log('Base image framing saved:', framing)
                    }}
                    className="w-full"
                    showGridOverlay={showGridOverlay}
                    gridType={gridType}
                  />
                  
                  {/* Action buttons for base image */}
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 bg-background/90 hover:bg-background shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveToGallery(baseImages[0].url)
                      }}
                      disabled={savingImage === baseImages[0].url}
                      title="Save to Gallery"
                    >
                      {savingImage === baseImages[0].url ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                      ) : (
                        <Heart className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 bg-background/90 hover:bg-background shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadImage(baseImages[0].url, `base-image.png`)
                      }}
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    {onRemoveBaseImage && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 w-7 p-0 bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveBaseImage()
                        }}
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              ) : (
                <div 
                  className="w-full bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center"
                  style={{ 
                    aspectRatio: previewAspectRatio,
                    minHeight: '300px'
                  }}
                >
                  <div className="text-center p-6">
                    {generationMode === 'text-to-image' ? (
                      <>
                        <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm font-medium text-foreground mb-2">Current prompt for generation</p>
                        <div className="bg-background/50 rounded-lg p-4 border border-border max-w-md mx-auto">
                          <p className="text-sm text-foreground leading-relaxed italic">
                            "{prompt || 'No prompt entered yet'}"
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No base image</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload or select an image to use as base
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Resolution and Consistency - Side by Side */}
              {(onResolutionChange || onConsistencyChange) && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {/* Resolution Dropdown */}
                  {onResolutionChange && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="resolution" className="text-sm font-medium">Resolution</Label>
                        {userSubscriptionTier === 'FREE' && (
                          <Badge variant="secondary" className="text-xs">Free tier</Badge>
                        )}
                      </div>
                      {userSubscriptionTier !== 'FREE' ? (
                        <Select value={resolution} onValueChange={onResolutionChange}>
                          <SelectTrigger className="h-8 text-sm mt-1">
                            <SelectValue placeholder="Select resolution" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1024">1024px</SelectItem>
                            <SelectItem value="1536">1536px</SelectItem>
                            <SelectItem value="2048">2048px</SelectItem>
                            <SelectItem value="3072">3072px</SelectItem>
                            <SelectItem value="4096">4096px</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-muted rounded-md border mt-1">
                          <span className="text-sm text-muted-foreground">1024px</span>
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Consistency Level */}
                  {onConsistencyChange && (
                    <div>
                      <Label htmlFor="consistency" className="text-sm font-medium">Consistency</Label>
                      <Select value={consistencyLevel} onValueChange={onConsistencyChange}>
                        <SelectTrigger className="h-8 text-sm mt-1">
                          <SelectValue placeholder="Select consistency level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🎲 Low Variation</SelectItem>
                          <SelectItem value="medium">⚖️ Medium</SelectItem>
                          <SelectItem value="high">🎯 High Consistency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Generated Images */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Generated Images</Label>
                {generatedImages.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={onRegenerate}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-3"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Re-generate
                    </Button>
                    <Button
                      onClick={onClearImages}
                      disabled={loading}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-3 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              
              {generatedImages.length > 0 ? (
                <div className="space-y-3">
                  {generatedImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`relative w-full bg-muted border-2 rounded-lg overflow-hidden transition-all duration-300 ${
                        selectedImage === image.url 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ 
                        aspectRatio: previewAspectRatio,
                        minHeight: '200px'
                      }}
                    >
                      <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => onSelectImage(image.url)}
                      >
                        {image.type === 'video' ? (
                          <video
                            src={image.url}
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            loop
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={image.url}
                            alt={`Generated image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0 bg-background/90 hover:bg-background shadow-md"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveToGallery(image.url)
                            }}
                            disabled={savingImage === image.url}
                            title="Save to Gallery"
                          >
                            {savingImage === image.url ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                            ) : (
                              <Heart className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0 bg-background/90 hover:bg-background shadow-md"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadImage(image.url, `generated-image-${index + 1}.png`)
                            }}
                            title="Download"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : loading ? (
                <div 
                  className="w-full bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center"
                  style={{ 
                    aspectRatio: previewAspectRatio,
                    minHeight: '300px'
                  }}
                >
                  <div className="text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="font-medium">Generating your image...</p>
                    <p className="text-sm">This usually takes 5-30 seconds</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Preview area: {aspectRatio} ({calculateDimensions(aspectRatio, resolution).width}×{calculateDimensions(aspectRatio, resolution).height})
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="w-full bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center"
                  style={{ 
                    aspectRatio: previewAspectRatio,
                    minHeight: '300px'
                  }}
                >
                  <div className="text-center">
                    <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No images generated yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create your first image!
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Preview area: {aspectRatio} ({calculateDimensions(aspectRatio, resolution).width}×{calculateDimensions(aspectRatio, resolution).height})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </>
    )
  }

  // Original single-column layout for non-full-width mode
  return (
    <>
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Generated Content</CardTitle>
          <CardDescription>
            {images.length > 0 
              ? 'Preview area will appear here when images are generated'
              : 'Preview area will appear here when images are generated'
            }
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {imagesToDisplay.length > 0 ? (
          <div className="space-y-4">
            {/* Toggle between Base Image and Generated Images */}
            {baseImages.length > 0 && generatedImages.length > 0 && (
              <div className="flex items-center justify-end gap-2">
                <Label className="text-sm font-medium">View:</Label>
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={showBaseImage ? "default" : "ghost"}
                    onClick={() => setShowBaseImage(true)}
                    className="text-xs px-3 py-1"
                  >
                    Base Image
                  </Button>
                  <Button
                    size="sm"
                    variant={!showBaseImage ? "default" : "ghost"}
                    onClick={() => setShowBaseImage(false)}
                    className="text-xs px-3 py-1"
                  >
                    Generated
                  </Button>
                </div>
              </div>
            )}
            
            {/* Dynamic Preview Container */}
            {imagesToDisplay.length === 1 ? (
              // Single image - full size
              imagesToDisplay[0].type === 'base' ? (
                // Base image - use draggable preview
                <div className="space-y-3">
                  {/* Grid Overlay Controls */}
                  <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="grid-overlay-2" className="text-sm font-medium">
                          Grid Overlay
                        </Label>
                        <Switch
                          id="grid-overlay-2"
                          checked={showGridOverlay}
                          onCheckedChange={setShowGridOverlay}
                        />
                      </div>
                      
                      {showGridOverlay && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Type:</Label>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={gridType === 'horizontal' ? 'default' : 'outline'}
                              onClick={() => setGridType('horizontal')}
                              className="h-8 px-3 text-xs"
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              Horizontal
                            </Button>
                            <Button
                              size="sm"
                              variant={gridType === 'rule-of-thirds' ? 'default' : 'outline'}
                              onClick={() => setGridType('rule-of-thirds')}
                              className="h-8 px-3 text-xs"
                            >
                              <Grid3X3 className="h-3 w-3 mr-1" />
                              Rule of Thirds
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Remove Base Image Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (onRemoveBaseImage) {
                          onRemoveBaseImage()
                        } else {
                          // Fallback: clear the base image from the images array
                          setShowBaseImage(false)
                        }
                      }}
                      className="h-8 px-3 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <DraggableImagePreview
                    imageUrl={imagesToDisplay[0].url}
                    aspectRatio={aspectRatio}
                    resolution={resolution}
                    onPositionChange={(yPosition) => {
                      // Store the position for potential use in generation
                      console.log('Base image position changed:', yPosition)
                    }}
                    onSaveFraming={(framing) => {
                      // Store the framing data for potential use in generation
                      console.log('Base image framing saved:', framing)
                    }}
                    className="w-full"
                    showGridOverlay={showGridOverlay}
                    gridType={gridType}
                  />
                  
                  {/* Action buttons overlay for base image */}
                  <div className="absolute top-2 right-2 flex gap-1 z-10">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveToGallery(imagesToDisplay[0].url)
                      }}
                      disabled={savingImage === imagesToDisplay[0].url}
                      title="Save to Gallery"
                    >
                      {savingImage === imagesToDisplay[0].url ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadImage(imagesToDisplay[0].url, `base-image.png`)
                      }}
                      title="Download Base Image"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {onRemoveBaseImage && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveBaseImage()
                        }}
                        title="Remove Base Image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              ) : (
                // Generated image or video - regular display
                <div 
                  className="relative w-full bg-muted border-2 border-dashed border-border rounded-lg overflow-hidden transition-all duration-300"
                  style={{ 
                    aspectRatio: previewAspectRatio,
                    minHeight: '300px',
                    maxHeight: '500px'
                  }}
                >
                  <div
                    className={`absolute inset-0 cursor-pointer transition-all duration-200 ${
                      selectedImage === imagesToDisplay[0].url 
                        ? 'ring-2 ring-purple-500 ring-offset-2' 
                        : 'hover:ring-1 hover:ring-gray-400'
                    }`}
                    onClick={() => onSelectImage(imagesToDisplay[0].url)}
                  >
                    {imagesToDisplay[0].type === 'video' ? (
                      <video
                        src={imagesToDisplay[0].url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        loop
                        poster={imagesToDisplay[0].url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={imagesToDisplay[0].url}
                        alt="Generated image"
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Action buttons - always visible */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveToGallery(imagesToDisplay[0].url)
                        }}
                        disabled={savingImage === imagesToDisplay[0].url}
                        title="Save to Gallery"
                      >
                        {savingImage === imagesToDisplay[0].url ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (imagesToDisplay[0].type === 'video') {
                            handleDownloadVideo(imagesToDisplay[0].url, `generated-video.mp4`)
                          } else {
                            handleDownloadImage(imagesToDisplay[0].url, `generated-image.png`)
                          }
                        }}
                        title={imagesToDisplay[0].type === 'video' ? "Download Video" : "Download Image"}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {selectedImage === imagesToDisplay[0].url ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectImage(null)
                          }}
                          title="Deselect Image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>

                    {/* Selection indicator */}
                    {selectedImage === imagesToDisplay[0].url && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default" className="bg-primary">Selected</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              // Multiple images - grid layout
              <div className="grid grid-cols-2 gap-4">
                {imagesToDisplay.map((image, index) => (
                  <div
                    key={index}
                    className={`relative bg-muted border-2 border-dashed border-border rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                      selectedImage === image.url 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:ring-1 hover:ring-border'
                    }`}
                    style={{ 
                      aspectRatio: previewAspectRatio,
                      minHeight: '200px'
                    }}
                    onClick={() => onSelectImage(image.url)}
                  >
                    {image.type === 'video' ? (
                      <video
                        src={image.url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        loop
                        poster={image.url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={image.url}
                        alt={`Generated ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Image number badge */}
                    <div className="absolute top-2 left-2 bg-backdrop text-foreground text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    
                    {/* Action buttons - always visible */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveToGallery(image.url)
                        }}
                        disabled={savingImage === image.url}
                        title="Save to Gallery"
                      >
                        {savingImage === image.url ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-md"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (image.type === 'video') {
                            handleDownloadVideo(image.url, `generated-video-${index + 1}.mp4`)
                          } else {
                            handleDownloadImage(image.url, `generated-image-${index + 1}.png`)
                          }
                        }}
                        title={image.type === 'video' ? "Download Video" : "Download Image"}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {image.type === 'base' && onRemoveBaseImage ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveBaseImage()
                          }}
                          title="Remove Base Image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : selectedImage === image.url ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectImage(null)
                          }}
                          title="Deselect Image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>

                    {/* Selection indicator */}
                    {selectedImage === image.url && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="default" className="bg-primary">Selected</Badge>
                      </div>
                    )}
                    
                    {/* Base image indicator */}
                    {image.type === 'base' && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="default" className="bg-primary">Base Image</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Controls and Info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <span>Dimensions: {dimensions.width} × {dimensions.height}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                <span>{imagesToDisplay.length} {showBaseImage ? 'base' : 'generated'} image{imagesToDisplay.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-foreground">
                  <Settings className="h-4 w-4 inline mr-1" />
                  Aspect Ratio:
                </Label>
                <Badge variant="outline" className="text-xs">
                  {displayAspectRatio}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="relative w-full bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center transition-all duration-300"
            style={{ 
              aspectRatio: previewAspectRatio,
              minHeight: '300px',
              maxHeight: '500px'
            }}
          >
            {loading ? (
              <div className="text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="font-medium">Generating your image...</p>
                <p className="text-sm">This usually takes 5-30 seconds</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Preview area: {aspectRatio} ({dimensions.width} × {dimensions.height})
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">
                  {showBaseImage ? 'No base image selected' : 'No images generated yet'}
                </p>
                <p className="text-sm">
                  {showBaseImage ? 'Select a base image to get started' : 'Create your first image!'}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Preview area: {aspectRatio} ({dimensions.width} × {dimensions.height})
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    </>
  )
}
