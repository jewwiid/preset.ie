'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Check, AlertCircle, Zap, Palette, Camera, Sun, Info, Save, Download, BookOpen, ChevronDown, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface EnhancementMetadata {
  enhancementType: string
  prompt: string
  provider: 'nanobanana' | 'seedream'
  originalImageUrl: string
}

interface EnhancedEnhancementModalProps {
  isOpen: boolean
  onClose: () => void
  onEnhance: (type: string, prompt: string, provider: 'nanobanana' | 'seedream') => Promise<void>
  onSaveToGallery?: (imageUrl: string, caption?: string, metadata?: EnhancementMetadata) => Promise<void>
  itemUrl: string
  itemCaption?: string
  credits: number
  enhancedUrl?: string | null
  isEnhancing?: boolean
  userProviderPreference?: 'nanobanana' | 'seedream'
}

const enhancementTypes = [
  {
    id: 'lighting',
    label: 'Lighting',
    icon: Sun,
    description: 'Adjust lighting and exposure',
    prompts: ['golden hour', 'dramatic shadows', 'soft natural light', 'moody lighting'],
    bestFor: ['nanobanana', 'seedream'] // Both providers good for lighting
  },
  {
    id: 'style',
    label: 'Style',
    icon: Palette,
    description: 'Apply artistic styles',
    prompts: ['film noir', 'watercolor', 'vintage film', 'modern minimalist'],
    bestFor: ['seedream'] // Seedream better for complex styles
  },
  {
    id: 'background',
    label: 'Background',
    icon: Camera,
    description: 'Replace or enhance background',
    prompts: ['urban cityscape', 'beach sunset', 'forest', 'studio backdrop'],
    bestFor: ['seedream'] // Seedream better for background replacement
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: Zap,
    description: 'Change overall atmosphere',
    prompts: ['mysterious', 'uplifting', 'dramatic', 'peaceful'],
    bestFor: ['nanobanana', 'seedream'] // Both providers good for mood
  }
]

const presets = [
  {
    id: 'professional',
    name: 'Professional Headshot',
    description: 'Clean, professional lighting and background',
    type: 'lighting',
    prompt: 'professional headshot lighting, clean background, sharp focus, business portrait style',
    icon: Camera
  },
  {
    id: 'artistic',
    name: 'Artistic Portrait',
    description: 'Creative artistic style with dramatic lighting',
    type: 'style',
    prompt: 'artistic portrait, dramatic lighting, creative composition, painterly style',
    icon: Palette
  },
  {
    id: 'natural',
    name: 'Natural Outdoor',
    description: 'Natural outdoor lighting and environment',
    type: 'background',
    prompt: 'natural outdoor lighting, soft shadows, organic background, golden hour',
    icon: Sun
  },
  {
    id: 'moody',
    name: 'Moody Atmosphere',
    description: 'Dark, moody atmosphere with dramatic tones',
    type: 'mood',
    prompt: 'moody atmosphere, dark tones, dramatic lighting, cinematic style',
    icon: Zap
  },
  {
    id: 'vintage',
    name: 'Vintage Film',
    description: 'Classic vintage film aesthetic',
    type: 'style',
    prompt: 'vintage film aesthetic, warm tones, film grain, retro style',
    icon: BookOpen
  },
  {
    id: 'studio',
    name: 'Studio Quality',
    description: 'High-end studio photography look',
    type: 'lighting',
    prompt: 'studio quality lighting, professional setup, clean background, high-end portrait',
    icon: Camera
  }
]

export default function EnhancedEnhancementModal({
  isOpen,
  onClose,
  onEnhance,
  onSaveToGallery,
  itemUrl,
  itemCaption,
  credits,
  enhancedUrl = null,
  isEnhancing = false,
  userProviderPreference = 'seedream'
}: EnhancedEnhancementModalProps) {
  const [selectedType, setSelectedType] = useState('lighting')
  const [prompt, setPrompt] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<'nanobanana' | 'seedream'>(userProviderPreference)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'polling' | 'completed' | 'failed'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'original' | 'enhanced'>('original')
  const [isSaving, setIsSaving] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [dbQuickPrompts, setDbQuickPrompts] = useState<any>(null)
  const [dbPresets, setDbPresets] = useState<any[]>([])
  const [loadingPresets, setLoadingPresets] = useState(true)

  // Fetch presets from database
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        console.log('Fetching enhancement presets from database...')
        const response = await fetch('/api/enhancement-presets')
        const data = await response.json()
        console.log('Enhancement presets response:', data)
        if (data.success) {
          console.log('✅ Using database presets:', {
            quickPrompts: Object.keys(data.quickPrompts).map(k => `${k}: ${data.quickPrompts[k].length} prompts`),
            presets: `${data.presets.length} presets`
          })
          setDbQuickPrompts(data.quickPrompts)
          setDbPresets(data.presets)
        } else {
          console.log('⚠️ Database fetch failed, using hardcoded presets')
        }
      } catch (error) {
        console.error('❌ Error fetching presets, using hardcoded fallback:', error)
      } finally {
        setLoadingPresets(false)
      }
    }
    fetchPresets()
  }, [])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('Enhanced enhancement modal opened')
      if (enhancedUrl) {
        setStatus('completed')
        setProgress(100)
        setActiveTab('enhanced') // Show enhanced result when available
      } else if (isEnhancing) {
        setStatus('polling')
        setProgress(50)
        setActiveTab('original') // Show original while processing
      } else {
        setStatus('idle')
        setProgress(0)
        setActiveTab('original') // Default to original
      }
      setError(null)
      setIsProcessing(isEnhancing)
      setSelectedProvider(userProviderPreference)
    }
  }, [isOpen, enhancedUrl, isEnhancing, userProviderPreference])

  // Handle saving enhanced image to gallery
  const handleSaveToGallery = async () => {
    if (!enhancedUrl || !onSaveToGallery) return

    setIsSaving(true)
    try {
      const metadata: EnhancementMetadata = {
        enhancementType: selectedType,
        prompt: prompt,
        provider: selectedProvider,
        originalImageUrl: itemUrl
      }
      await onSaveToGallery(enhancedUrl, `Enhanced: ${itemCaption || 'Image'}`, metadata)
      // You could show a success toast here
    } catch (error) {
      console.error('Failed to save to gallery:', error)
      // You could show an error toast here
    } finally {
      setIsSaving(false)
    }
  }

  // Handle preset selection
  const handlePresetSelect = (preset: typeof presets[0]) => {
    setSelectedType(preset.type)
    setPrompt(preset.prompt)
  }

  useEffect(() => {
    if (status === 'processing' || status === 'polling') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (status === 'processing' && prev >= 30) return 30
          if (status === 'polling' && prev >= 90) return 90
          return prev + Math.random() * 5
        })
      }, 1000)
      return () => clearInterval(interval)
    } else if (status === 'completed') {
      setProgress(100)
    }
  }, [status])

  // Auto-select best provider for enhancement type
  useEffect(() => {
    const selectedTypeData = enhancementTypes.find(t => t.id === selectedType)
    if (selectedTypeData?.bestFor.length === 1) {
      setSelectedProvider(selectedTypeData.bestFor[0] as 'nanobanana' | 'seedream')
    }
  }, [selectedType])

  if (!isOpen) return null

  const handleEnhance = async () => {
    if (!prompt.trim() || credits < 1) return

    setIsProcessing(true)
    setStatus('processing')
    setError(null)
    setProgress(10)

    setTimeout(() => {
      setStatus('polling')
      setProgress(30)
    }, 2000)

    try {
      onEnhance(selectedType, prompt, selectedProvider).then(() => {
        // Enhancement started successfully
      }).catch((err) => {
        setStatus('failed')
        setError(err.message || 'Enhancement failed')
        setIsProcessing(false)
      })
    } catch (err: any) {
      setStatus('failed')
      setError(err.message || 'Enhancement failed')
      setIsProcessing(false)
    }
  }

  const selectedTypeData = enhancementTypes.find(t => t.id === selectedType)
  const Icon = selectedTypeData?.icon || Sparkles

  // Calculate cost based on provider
  const costPerEnhancement = selectedProvider === 'seedream' ? 2 : 1
  const canAfford = credits >= costPerEnhancement

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="bg-card rounded-xl shadow-2xl max-w-6xl w-full h-[96vh] md:h-[96vh] overflow-hidden popover-fixed mx-2 flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between bg-muted/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm md:text-base font-semibold text-foreground">AI Image Enhancement</h2>
          </div>

          {/* Provider Info and Credits - Moved to top banner */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-card/80 px-2 md:px-3 py-1.5 rounded-lg border">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {selectedProvider === 'seedream' ? 'Seedream V4' : 'NanoBanana'}
              </span>
              <span className="text-xs text-muted-foreground">
                {credits} {credits === 1 ? 'credit' : 'credits'}
              </span>
              <Badge variant="secondary" className="text-xs hidden md:inline-flex">
                {costPerEnhancement} credit{costPerEnhancement !== 1 ? 's' : ''}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Separator />

        {/* Content - Responsive Layout: Stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Column - Image Preview */}
          <div className="flex-1 p-4 bg-card overflow-y-auto min-h-[400px] md:min-h-0">
            <div className="h-full flex flex-col overflow-y-auto">
              {/* Image Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'original' | 'enhanced')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-3 flex-shrink-0">
                  <TabsTrigger value="original" className="text-sm">Original</TabsTrigger>
                  <TabsTrigger value="enhanced" disabled={!enhancedUrl} className="text-sm">
                    Enhanced {status === 'completed' && <Check className="w-3 h-3 ml-1" />}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="original" className="flex-1 mt-0 min-h-0">
                  <div className="relative h-full bg-muted rounded-lg overflow-hidden">
                    <img
                      src={itemUrl}
                      alt={itemCaption || 'Original image'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="enhanced" className="flex-1 mt-0 min-h-0">
                  <div className="relative h-full bg-muted rounded-lg overflow-hidden">
                    {status === 'idle' && !enhancedUrl && (
                      <div className="h-full flex flex-col items-center justify-center">
                        <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Enhancement preview will appear here</p>
                      </div>
                    )}
                    
                    {enhancedUrl && (
                      <img
                        src={enhancedUrl}
                        alt="Enhanced"
                        className="w-full h-full object-contain"
                        onClick={() => window.open(enhancedUrl, '_blank')}
                        style={{ cursor: 'pointer' }}
                        title="Click to view full size"
                      />
                    )}
                    
                    {(status === 'processing' || status === 'polling') && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                        <div className="relative">
                          <LoadingSpinner size="xl" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                          {status === 'processing' ? 'Initializing enhancement...' : 'Processing with AI...'}
                        </p>
                        <div className="w-64 mt-4">
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    )}

                    {status === 'failed' && (
                      <div className="h-full flex flex-col items-center justify-center p-4">
                        <Alert variant="destructive" className="max-w-md">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {error || 'Enhancement failed'}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                  
                  {/* Save to Gallery Button */}
                  {enhancedUrl && onSaveToGallery && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={handleSaveToGallery}
                        disabled={isSaving}
                        className="flex-1 text-sm h-9"
                        variant="outline"
                      >
                        {isSaving ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-2" />
                            Save to Gallery
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => window.open(enhancedUrl, '_blank')}
                        variant="outline"
                        className="h-9"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden md:block h-auto" />

          {/* Right Column - Controls */}
          <div className="w-full md:w-[420px] p-4 overflow-y-auto bg-card">
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <Label className="text-xs font-medium mb-2 block">AI Provider</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedProvider === 'nanobanana' ? "default" : "outline"}
                    className="flex-1 h-auto py-1.5 px-2.5 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setSelectedProvider('nanobanana')}
                    disabled={isProcessing || credits < 1}
                  >
                    <Zap className="w-3 h-3 mr-1.5" />
                    <span className="font-medium text-xs">NanoBanana</span>
                  </Button>
                  <Button
                    variant={selectedProvider === 'seedream' ? "default" : "outline"}
                    className="flex-1 h-auto py-1.5 px-2.5 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setSelectedProvider('seedream')}
                    disabled={isProcessing || credits < 2}
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    <span className="font-medium text-xs">Seedream V4</span>
                  </Button>
                </div>
              </div>

              {/* Enhancement Type Selection */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Enhancement Type</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {enhancementTypes.map((type) => {
                    const TypeIcon = type.icon
                    const isRecommended = type.bestFor.includes(selectedProvider)
                    return (
                        <Button
                          key={type.id}
                          variant={selectedType === type.id ? "default" : "outline"}
                          className={`h-auto py-1.5 px-2 flex flex-col items-center gap-0.5 relative transition-colors ${
                            selectedType === type.id
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                          onClick={() => setSelectedType(type.id)}
                          disabled={isProcessing}
                        >
                        {isRecommended && (
                          <Badge className="absolute -top-1 -right-1 text-[10px] px-1 py-0 h-4 bg-secondary text-secondary-foreground border border-border">
                            Best
                          </Badge>
                        )}
                        <TypeIcon className="w-3 h-3" />
                        <div className="text-center">
                          <p className="font-medium text-xs">{type.label}</p>
                          <p className={`text-[10px] leading-tight ${
                            selectedType === type.id
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}>{type.description}</p>
                        </div>
                      </Button>
                    )
                  })}
                </div>

                {/* Quick prompts - from database */}
                <div className="mt-2">
                  <Label className="text-[10px] text-muted-foreground mb-1.5 block">Quick prompts:</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {loadingPresets ? (
                      <span className="text-[10px] text-muted-foreground">Loading prompts...</span>
                    ) : (
                      (dbQuickPrompts?.[selectedType] || selectedTypeData?.prompts || []).map((item: any) => {
                        const promptText = typeof item === 'string' ? item : item.prompt
                        return (
                          <Button
                            key={typeof item === 'string' ? item : item.id}
                            variant="outline"
                            size="sm"
                            onClick={() => setPrompt(promptText)}
                            disabled={isProcessing}
                            className="text-[10px] h-6 px-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            {promptText}
                          </Button>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setShowPresets(!showPresets)}
                  className="w-full justify-between p-0 h-auto mb-2 hover:bg-transparent"
                >
                  <Label className="text-xs font-medium">Quick Presets</Label>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
                </Button>
                {showPresets && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {loadingPresets ? (
                      <span className="text-[10px] text-muted-foreground col-span-2">Loading presets...</span>
                    ) : (
                      (dbPresets.length > 0 ? dbPresets : presets).map((preset) => {
                        // Get icon component - handle both string names and components
                        const iconName = typeof preset.icon === 'string' ? preset.icon : 'Camera'
                        const iconMap: any = { Camera, Palette, Sun, Zap, BookOpen }
                        const PresetIcon = iconMap[iconName] || Camera

                        return (
                          <Button
                            key={preset.id}
                            variant="outline"
                            className="h-auto py-1.5 px-1.5 justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => handlePresetSelect(preset)}
                            disabled={isProcessing}
                          >
                            <PresetIcon className="w-2.5 h-2.5 mr-1.5 flex-shrink-0" />
                            <div className="text-left min-w-0 flex-1">
                              <p className="font-medium text-[10px] leading-tight">{preset.name}</p>
                              <p className="text-[9px] text-muted-foreground leading-tight line-clamp-1 hidden sm:block">{preset.description}</p>
                            </div>
                          </Button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Prompt Input */}
              <div>
                <Label htmlFor="enhancement-prompt" className="text-xs font-medium mb-1.5 block">
                  Enhancement Prompt
                </Label>
                <Textarea
                  id="enhancement-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isProcessing}
                  placeholder={`Describe the ${selectedType} enhancement you want...`}
                  className="min-h-[60px] text-xs"
                />
              </div>



            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-muted/50 border-t flex-shrink-0">
          {/* Advanced editing CTA - Hidden on mobile to save space */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const playgroundUrl = `/playground?imageUrl=${encodeURIComponent(itemUrl)}`
                window.open(playgroundUrl, '_blank')
              }}
              disabled={isProcessing}
              className="text-xs h-9 hover:bg-accent hover:text-accent-foreground"
            >
              <Wand2 className="w-3 h-3 mr-1.5" />
              Try Playground
            </Button>
          </div>

          {/* Main action buttons with credit warning */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Credit Warning - Inline with buttons */}
            {!canAfford && (
              <div className="flex items-center gap-1.5 text-destructive text-xs px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>Insufficient credits. Need {costPerEnhancement} credit{costPerEnhancement !== 1 ? 's' : ''} for {selectedProvider === 'seedream' ? 'Seedream V4' : 'NanoBanana'}.</span>
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="text-xs h-9 px-4 flex-1 sm:flex-initial hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnhance}
                disabled={!prompt.trim() || !canAfford || isProcessing}
                className="text-xs h-9 px-4 flex-1 sm:flex-initial"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">Processing</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    <span className="hidden sm:inline">Enhance Image</span>
                    <span className="sm:hidden">Enhance</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
