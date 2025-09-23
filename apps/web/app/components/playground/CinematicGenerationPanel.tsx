'use client'

import { useState, useEffect, useRef } from 'react'
import { Wand2, Star, Users, Plus, Upload, Image as ImageIcon, X, Sparkles, Loader2, Camera, Film } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import AspectRatioSelector from '../ui/AspectRatioSelector'
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector'
import { CinematicParameters } from '../../../../../packages/types/src/cinematic-parameters'
import CinematicPromptBuilder from '../../../../../packages/services/src/cinematic-prompt-builder'

interface StylePreset {
  id: string
  name: string
  description?: string
  style_type: string
  prompt_template: string
  intensity: number
  usage_count: number
  is_public: boolean
  generation_mode?: 'text-to-image' | 'image-to-image'
}

interface CinematicGenerationPanelProps {
  onGenerate: (params: {
    prompt: string
    style: string
    resolution: string
    consistencyLevel: string
    numImages: number
    customStylePreset?: StylePreset
    baseImage?: string
    generationMode?: 'text-to-image' | 'image-to-image'
    intensity?: number
    cinematicParameters?: Partial<CinematicParameters>
    enhancedPrompt?: string
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
  }) => Promise<void>
  onSettingsChange?: (settings: {
    resolution: string
    aspectRatio?: string
    baseImageAspectRatio?: string
    baseImageUrl?: string
    onRemoveBaseImage?: () => void
  }) => void
  loading: boolean
  userCredits?: number
  stylePresets?: StylePreset[]
  onStylePresetSelect?: (preset: StylePreset) => void
  selectedStylePreset?: StylePreset | null
  onRemoveStylePreset?: () => void
  baseImageUrl?: string
  onRemoveBaseImage?: () => void
  aspectRatio?: string
  baseImageAspectRatio?: string
}

export default function CinematicGenerationPanel({
  onGenerate,
  onSettingsChange,
  loading,
  userCredits = 0,
  stylePresets = [],
  onStylePresetSelect,
  selectedStylePreset,
  onRemoveStylePreset,
  baseImageUrl,
  onRemoveBaseImage,
  aspectRatio,
  baseImageAspectRatio
}: CinematicGenerationPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [resolution, setResolution] = useState('1024x1024')
  const [consistencyLevel, setConsistencyLevel] = useState('balanced')
  const [numImages, setNumImages] = useState(1)
  const [intensity, setIntensity] = useState(0.8)
  const [generationMode, setGenerationMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image')
  
  // Cinematic parameters state
  const [cinematicParameters, setCinematicParameters] = useState<Partial<CinematicParameters>>({})
  const [enableCinematicMode, setEnableCinematicMode] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [showCinematicPreview, setShowCinematicPreview] = useState(false)
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true)
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true)
  
  const promptBuilder = useRef(new CinematicPromptBuilder())

  // Update enhanced prompt when cinematic parameters change
  useEffect(() => {
    if (enableCinematicMode && prompt.trim() && Object.keys(cinematicParameters).length > 0) {
      const result = promptBuilder.current.constructPrompt({
        basePrompt: prompt,
        cinematicParameters,
        enhancementType: generationMode === 'image-to-image' ? 'style' : 'generate',
        includeTechnicalDetails,
        includeStyleReferences
      })
      setEnhancedPrompt(result.fullPrompt)
    } else if (!enableCinematicMode || Object.keys(cinematicParameters).length === 0) {
      setEnhancedPrompt('')
    } else {
      setEnhancedPrompt(prompt)
    }
  }, [prompt, cinematicParameters, enableCinematicMode, generationMode, includeTechnicalDetails, includeStyleReferences])

  // Handle toggle changes from CinematicParameterSelector
  const handleToggleChange = (technicalDetails: boolean, styleReferences: boolean) => {
    setIncludeTechnicalDetails(technicalDetails)
    setIncludeStyleReferences(styleReferences)
  }

  // Clear cinematic parameters and enhanced prompt
  const clearCinematicSettings = () => {
    setEnableCinematicMode(false)
    setCinematicParameters({})
    setEnhancedPrompt('')
  }

  const handleGenerate = async () => {
    const finalPrompt = enableCinematicMode ? enhancedPrompt : prompt
    
    await onGenerate({
      prompt: finalPrompt,
      style,
      resolution,
      consistencyLevel,
      numImages,
      baseImage: baseImageUrl,
      generationMode,
      intensity,
      cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
      enhancedPrompt: enableCinematicMode ? enhancedPrompt : undefined,
      includeTechnicalDetails: enableCinematicMode ? includeTechnicalDetails : undefined,
      includeStyleReferences: enableCinematicMode ? includeStyleReferences : undefined
    })
  }

  const handleCinematicTemplate = (category: string, mood: string, style?: string) => {
    const templates = {
      portrait: {
        cameraAngle: 'eye-level' as const,
        lensType: 'portrait-85mm' as const,
        shotSize: 'close-up' as const,
        depthOfField: 'shallow-focus' as const,
        lightingStyle: 'soft-light' as const,
        sceneMood: mood as any,
        directorStyle: style as any
      },
      landscape: {
        cameraAngle: 'eye-level' as const,
        lensType: 'wide-angle-24mm' as const,
        shotSize: 'wide-shot' as const,
        depthOfField: 'deep-focus' as const,
        lightingStyle: 'natural-light' as const,
        sceneMood: mood as any,
        directorStyle: style as any
      },
      cinematic: {
        cameraAngle: 'low-angle' as const,
        lensType: 'anamorphic' as const,
        shotSize: 'wide-shot' as const,
        depthOfField: 'shallow-focus' as const,
        lightingStyle: 'chiaroscuro' as const,
        sceneMood: mood as any,
        directorStyle: style as any,
        aspectRatio: '2.39:1' as const
      }
    }

    setCinematicParameters(templates[category as keyof typeof templates] || {})
    setEnableCinematicMode(true)
  }

  const getActiveParameterCount = () => {
    return Object.values(cinematicParameters).filter(value => value !== undefined && value !== null).length
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Cinematic Generation
          {enableCinematicMode && (
            <Badge variant="secondary" className="ml-2">
              <Film className="h-3 w-3 mr-1" />
              {getActiveParameterCount()} params
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Generate images with professional cinematic parameters
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="cinematic">Cinematic</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Basic Generation Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photorealistic">Photorealistic</SelectItem>
                      <SelectItem value="artistic">Artistic</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">1024x1024</SelectItem>
                      <SelectItem value="1152x896">1152x896</SelectItem>
                      <SelectItem value="896x1152">896x1152</SelectItem>
                      <SelectItem value="1216x832">1216x832</SelectItem>
                      <SelectItem value="832x1216">832x1216</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consistency">Consistency</Label>
                  <Select value={consistencyLevel} onValueChange={setConsistencyLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numImages">Number of Images</Label>
                  <Select value={numImages.toString()} onValueChange={(value) => setNumImages(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intensity">Intensity: {Math.round(intensity * 100)}%</Label>
                <Slider
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={[intensity]}
                  onValueChange={(value) => setIntensity(Array.isArray(value) ? value[0] : value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cinematic" className="space-y-4">
            {/* Cinematic Mode Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Cinematic Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable professional cinematic parameters for enhanced image generation
                </p>
              </div>
              <Switch
                checked={enableCinematicMode}
                onCheckedChange={setEnableCinematicMode}
              />
            </div>

            {enableCinematicMode && (
              <>
                {/* Cinematic Parameters */}
                <CinematicParameterSelector
                  parameters={cinematicParameters}
                  onParametersChange={setCinematicParameters}
                  onGenerateTemplate={handleCinematicTemplate}
                  onToggleChange={handleToggleChange}
                  onClear={clearCinematicSettings}
                  compact={false}
                  showAdvanced={true}
                />

                {/* Enhanced Prompt Preview */}
                {enhancedPrompt && enhancedPrompt !== prompt && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Enhanced Prompt Preview</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCinematicSettings}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{enhancedPrompt}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCinematicPreview(!showCinematicPreview)}
                    >
                      {showCinematicPreview ? 'Hide' : 'Show'} Technical Details
                    </Button>
                    
                    {showCinematicPreview && (
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="text-xs text-muted-foreground">
                          <strong>Original:</strong> {prompt}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <strong>Enhanced:</strong> {enhancedPrompt}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <strong>Active Parameters:</strong> {getActiveParameterCount()}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Templates */}
                <div className="space-y-2">
                  <Label>Quick Templates</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCinematicTemplate('portrait', 'romantic', 'sofia-coppola')}
                    >
                      Portrait
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCinematicTemplate('landscape', 'peaceful', 'roger-deakins')}
                    >
                      Landscape
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCinematicTemplate('cinematic', 'dramatic', 'david-fincher')}
                    >
                      Cinematic
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCinematicTemplate('cinematic', 'nostalgic', 'wes-anderson')}
                    >
                      Wes Anderson
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Base Image Section */}
        {baseImageUrl && (
          <div className="space-y-2">
            <Label>Base Image</Label>
            <div className="relative">
              <img
                src={baseImageUrl}
                alt="Base image"
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={onRemoveBaseImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Style Presets */}
        {stylePresets.length > 0 && (
          <div className="space-y-2">
            <Label>Style Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {stylePresets.slice(0, 4).map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedStylePreset?.id === preset.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onStylePresetSelect?.(preset)}
                  className="justify-start"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {preset.name}
                </Button>
              ))}
            </div>
            {selectedStylePreset && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedStylePreset.name}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveStylePreset}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim() || userCredits < numImages}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate {numImages} Image{numImages > 1 ? 's' : ''} ({numImages} credit{numImages > 1 ? 's' : ''})
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
