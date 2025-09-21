'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Check, AlertCircle, Zap, Palette, Camera, Sun, Info, Save, Download, BookOpen, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface EnhancedEnhancementModalProps {
  isOpen: boolean
  onClose: () => void
  onEnhance: (type: string, prompt: string, provider: 'nanobanana' | 'seedream') => Promise<void>
  onSaveToGallery?: (imageUrl: string, caption?: string) => Promise<void>
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
      await onSaveToGallery(enhancedUrl, `Enhanced: ${itemCaption || 'Image'}`)
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
        className="bg-card rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden popover-fixed mx-4"
        onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">AI Image Enhancement</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <Separator />

        {/* Content - 2 Column Layout */}
        <div className="flex h-[calc(95vh-120px)]">
          {/* Left Column - Image Preview */}
          <div className="flex-1 p-6 bg-card">
            <div className="h-full flex flex-col overflow-y-auto">
              {/* Image Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'original' | 'enhanced')} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4 flex-shrink-0">
                  <TabsTrigger value="original">Original</TabsTrigger>
                  <TabsTrigger value="enhanced" disabled={!enhancedUrl}>
                    Enhanced {status === 'completed' && <Check className="w-4 h-4 ml-1" />}
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
                          <Loader2 className="w-16 h-16 text-primary animate-spin" />
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
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={handleSaveToGallery}
                        disabled={isSaving}
                        className="flex-1"
                        variant="outline"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save to Gallery
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => window.open(enhancedUrl, '_blank')}
                        variant="outline"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <Separator orientation="vertical" className="h-auto" />

          {/* Right Column - Controls */}
          <div className="flex-1 p-6 overflow-y-auto bg-card">
            <div className="space-y-6">
              {/* Provider Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">AI Provider</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedProvider === 'nanobanana' ? "default" : "outline"}
                    className="flex-1 h-auto py-2 px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setSelectedProvider('nanobanana')}
                    disabled={isProcessing || credits < 1}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">NanoBanana</span>
                  </Button>
                  <Button
                    variant={selectedProvider === 'seedream' ? "default" : "outline"}
                    className="flex-1 h-auto py-2 px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setSelectedProvider('seedream')}
                    disabled={isProcessing || credits < 2}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span className="font-medium text-sm">Seedream V4</span>
                  </Button>
                </div>
                {selectedProvider === 'seedream' && credits < 2 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Insufficient credits. Need 2 credits for Seedream V4.
                    </AlertDescription>
                  </Alert>
                )}
                {selectedProvider === 'nanobanana' && credits < 1 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Insufficient credits. Need 1 credit for NanoBanana.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Enhancement Type Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Enhancement Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {enhancementTypes.map((type) => {
                    const TypeIcon = type.icon
                    const isRecommended = type.bestFor.includes(selectedProvider)
                    return (
                        <Button
                          key={type.id}
                          variant={selectedType === type.id ? "default" : "outline"}
                          className={`h-auto py-2 px-3 flex flex-col items-center gap-1 relative transition-colors ${
                            selectedType === type.id 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                          onClick={() => setSelectedType(type.id)}
                          disabled={isProcessing}
                        >
                        {isRecommended && (
                          <Badge className="absolute -top-1 -right-1 text-xs bg-secondary text-secondary-foreground border border-border">
                            Best
                          </Badge>
                        )}
                        <TypeIcon className="w-4 h-4" />
                        <div className="text-center">
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className={`text-xs leading-tight ${
                            selectedType === type.id 
                              ? "text-primary-foreground/80" 
                              : "text-muted-foreground"
                          }`}>{type.description}</p>
                        </div>
                      </Button>
                    )
                  })}
                </div>
                
                {/* Quick prompts */}
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground mb-2 block">Quick prompts:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTypeData?.prompts.map((quickPrompt) => (
                      <Button
                        key={quickPrompt}
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt(quickPrompt)}
                        disabled={isProcessing}
                        className="text-xs h-8 px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {quickPrompt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setShowPresets(!showPresets)}
                  className="w-full justify-between p-0 h-auto mb-3 hover:bg-transparent"
                >
                  <Label className="text-sm font-medium">Quick Presets</Label>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
                </Button>
                {showPresets && (
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => {
                      const PresetIcon = preset.icon
                      return (
                        <Button
                          key={preset.id}
                          variant="outline"
                          className="h-auto py-2 px-2 justify-start hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => handlePresetSelect(preset)}
                          disabled={isProcessing}
                        >
                          <PresetIcon className="w-3 h-3 mr-2 flex-shrink-0" />
                          <div className="text-left min-w-0 flex-1">
                            <p className="font-medium text-xs leading-tight">{preset.name}</p>
                            <p className="text-xs text-muted-foreground leading-tight line-clamp-2">{preset.description}</p>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Prompt Input */}
              <div>
                <Label htmlFor="enhancement-prompt" className="text-sm font-medium mb-2 block">
                  Enhancement Prompt
                </Label>
                <Textarea
                  id="enhancement-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isProcessing}
                  placeholder={`Describe the ${selectedType} enhancement you want...`}
                  className="min-h-[80px]"
                />
              </div>

              {/* Provider Info and Credits */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {selectedProvider === 'seedream' ? 'Seedream V4' : 'NanoBanana'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Available: {credits} credits
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {costPerEnhancement} credit{costPerEnhancement !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {!canAfford && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        Insufficient credits. Need {costPerEnhancement} credit{costPerEnhancement !== 1 ? 's' : ''} for this provider.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="pt-6 flex items-center justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="min-w-[80px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEnhance}
                  disabled={!prompt.trim() || !canAfford || isProcessing}
                  className="min-w-[120px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Enhance Image
                    </>
                  )}
                </Button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
