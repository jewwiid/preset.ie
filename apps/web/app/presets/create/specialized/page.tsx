'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Camera, 
  Package, 
  Wand2, 
  Save, 
  ArrowLeft,
  Lightbulb,
  Settings,
  Palette,
  Target
} from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Label } from '../../../../components/ui/label'
import { Switch } from '../../../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'

interface SpecializedPresetData {
  name: string
  description: string
  category: string
  prompt_template: string
  negative_prompt: string
  style_settings: {
    lighting: string
    background: string
    quality: string
    mood: string
    focus: string
  }
  technical_settings: {
    resolution: string
    steps: number
    guidance_scale: number
    aspect_ratio: string
  }
  ai_metadata: {
    tags: string[]
    specialization: string
    use_case: string
    target_audience: string
  }
  is_public: boolean
  is_featured: boolean
}

const PRESET_TEMPLATES = {
  headshot: {
    name: 'Professional Headshot',
    description: 'Clean, professional headshot with studio lighting',
    prompt_template: 'professional headshot of {subject}, clean background, soft studio lighting, sharp focus, business portrait style, professional attire, confident expression, high quality, detailed',
    negative_prompt: 'casual clothing, messy hair, unprofessional, low quality, blurry, dark lighting, informal',
    style_settings: {
      lighting: 'soft_studio',
      background: 'clean',
      quality: 'high',
      mood: 'professional',
      focus: 'sharp'
    },
    technical_settings: {
      resolution: '1024x1024',
      steps: 30,
      guidance_scale: 8,
      aspect_ratio: '1:1'
    },
    ai_metadata: {
      tags: ['headshot', 'professional', 'portrait', 'business'],
      specialization: 'headshot_photography',
      use_case: 'professional_networking',
      target_audience: 'business_professionals'
    },
    is_public: true,
    is_featured: true
  },
  product: {
    name: 'E-commerce Product Shot',
    description: 'Clean, professional product photography for online catalogs',
    prompt_template: 'professional product photography of {subject}, clean white background, studio lighting, sharp focus, high quality, commercial style, product catalog shot, professional lighting setup',
    negative_prompt: 'cluttered background, poor lighting, low quality, amateur photography, messy setup',
    style_settings: {
      lighting: 'studio_clean',
      background: 'white',
      quality: 'commercial',
      mood: 'clean',
      focus: 'product_detail'
    },
    technical_settings: {
      resolution: '1024x1024',
      steps: 30,
      guidance_scale: 8,
      aspect_ratio: '1:1'
    },
    ai_metadata: {
      tags: ['product', 'ecommerce', 'commercial', 'catalog'],
      specialization: 'product_photography',
      use_case: 'ecommerce_catalog',
      target_audience: 'online_retailers'
    },
    is_public: true,
    is_featured: true
  }
}

const LIGHTING_OPTIONS = {
  headshot: ['soft_studio', 'natural_soft', 'dramatic', 'even', 'rim_lighting'],
  product: ['studio_clean', 'natural_bright', 'soft_diffused', 'high_key', 'controlled']
}

const BACKGROUND_OPTIONS = {
  headshot: ['clean', 'white', 'neutral', 'professional', 'minimal'],
  product: ['white', 'clean', 'neutral', 'lifestyle', 'studio']
}

const QUALITY_OPTIONS = ['high', 'commercial', 'premium', 'professional', 'studio']

const MOOD_OPTIONS = {
  headshot: ['professional', 'confident', 'approachable', 'executive', 'friendly'],
  product: ['clean', 'premium', 'aspirational', 'modern', 'luxury']
}

export default function CreateSpecializedPresetPage() {
  const router = useRouter()
  const { user, session } = useAuth()
  
  const [presetType, setPresetType] = useState<'headshot' | 'product'>('headshot')
  const [presetData, setPresetData] = useState<SpecializedPresetData>(() => ({
    ...PRESET_TEMPLATES.headshot,
    category: 'headshot'
  }))
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const updatePresetData = (updates: Partial<SpecializedPresetData>) => {
    setPresetData(prev => ({ ...prev, ...updates }))
  }

  const updateStyleSettings = (updates: Partial<SpecializedPresetData['style_settings']>) => {
    setPresetData(prev => ({
      ...prev,
      style_settings: { ...prev.style_settings, ...updates }
    }))
  }

  const updateTechnicalSettings = (updates: Partial<SpecializedPresetData['technical_settings']>) => {
    setPresetData(prev => ({
      ...prev,
      technical_settings: { ...prev.technical_settings, ...updates }
    }))
  }

  const updateAiMetadata = (updates: Partial<SpecializedPresetData['ai_metadata']>) => {
    setPresetData(prev => ({
      ...prev,
      ai_metadata: { ...prev.ai_metadata, ...updates }
    }))
  }

  const handlePresetTypeChange = (type: 'headshot' | 'product') => {
    setPresetType(type)
    const template = PRESET_TEMPLATES[type]
    setPresetData({
      ...template,
      category: type === 'headshot' ? 'headshot' : 'product_photography'
    })
  }

  const handleSubmit = async () => {
    if (!user || !session) {
      alert('Please log in to create presets')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/presets/specialized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: presetType,
          presetData: {
            ...presetData,
            user_id: user.id
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${presetType} preset created successfully!`)
        router.push(`/presets/${result.preset.id}`)
      } else {
        const error = await response.json()
        alert(`Failed to create preset: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating preset:', error)
      alert('Failed to create preset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/presets')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Presets
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Create Specialized Preset</h1>
          <p className="text-muted-foreground">
            Create professional presets optimized for headshots or product photography
          </p>
        </div>

        {/* Preset Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Preset Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={presetType === 'headshot' ? 'default' : 'outline'}
                onClick={() => handlePresetTypeChange('headshot')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <Camera className="h-6 w-6 mb-2" />
                <span className="font-medium">Headshot Photography</span>
                <span className="text-sm opacity-75">Professional portraits & business photos</span>
              </Button>
              
              <Button
                variant={presetType === 'product' ? 'default' : 'outline'}
                onClick={() => handlePresetTypeChange('product')}
                className="h-20 flex flex-col items-center justify-center"
              >
                <Package className="h-6 w-6 mb-2" />
                <span className="font-medium">Product Photography</span>
                <span className="text-sm opacity-75">E-commerce & product catalogs</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preset Configuration */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="style">Style Settings</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Preset Name</Label>
                  <Input
                    id="name"
                    value={presetData.name}
                    onChange={(e) => updatePresetData({ name: e.target.value })}
                    placeholder="Enter preset name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={presetData.description}
                    onChange={(e) => updatePresetData({ description: e.target.value })}
                    placeholder="Describe what this preset is optimized for"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="prompt">Prompt Template</Label>
                  <Textarea
                    id="prompt"
                    value={presetData.prompt_template}
                    onChange={(e) => updatePresetData({ prompt_template: e.target.value })}
                    placeholder="Enter the prompt template (use {subject} as placeholder)"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="negative">Negative Prompt</Label>
                  <Textarea
                    id="negative"
                    value={presetData.negative_prompt}
                    onChange={(e) => updatePresetData({ negative_prompt: e.target.value })}
                    placeholder="What to avoid in the generated images"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Style Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lighting">Lighting Style</Label>
                    <Select
                      value={presetData.style_settings.lighting}
                      onValueChange={(value) => updateStyleSettings({ lighting: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIGHTING_OPTIONS[presetType].map(option => (
                          <SelectItem key={option} value={option}>
                            {option.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="background">Background</Label>
                    <Select
                      value={presetData.style_settings.background}
                      onValueChange={(value) => updateStyleSettings({ background: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BACKGROUND_OPTIONS[presetType].map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quality">Quality Level</Label>
                    <Select
                      value={presetData.style_settings.quality}
                      onValueChange={(value) => updateStyleSettings({ quality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUALITY_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mood">Mood</Label>
                    <Select
                      value={presetData.style_settings.mood}
                      onValueChange={(value) => updateStyleSettings({ mood: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MOOD_OPTIONS[presetType].map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Technical Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select
                      value={presetData.technical_settings.resolution}
                      onValueChange={(value) => updateTechnicalSettings({ resolution: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                        <SelectItem value="1024x768">1024x768 (4:3)</SelectItem>
                        <SelectItem value="1024x576">1024x576 (16:9)</SelectItem>
                        <SelectItem value="768x1024">768x1024 (3:4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="steps">Steps</Label>
                    <Input
                      id="steps"
                      type="number"
                      min="10"
                      max="50"
                      value={presetData.technical_settings.steps}
                      onChange={(e) => updateTechnicalSettings({ steps: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="guidance">Guidance Scale</Label>
                    <Input
                      id="guidance"
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      value={presetData.technical_settings.guidance_scale}
                      onChange={(e) => updateTechnicalSettings({ guidance_scale: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="aspect">Aspect Ratio</Label>
                    <Select
                      value={presetData.technical_settings.aspect_ratio}
                      onValueChange={(value) => updateTechnicalSettings({ aspect_ratio: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                        <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                        <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  AI Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={presetData.ai_metadata.specialization}
                      onChange={(e) => updateAiMetadata({ specialization: e.target.value })}
                      placeholder="e.g., headshot_photography"
                    />
                  </div>

                  <div>
                    <Label htmlFor="use_case">Use Case</Label>
                    <Input
                      id="use_case"
                      value={presetData.ai_metadata.use_case}
                      onChange={(e) => updateAiMetadata({ use_case: e.target.value })}
                      placeholder="e.g., professional_networking"
                    />
                  </div>

                  <div>
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      value={presetData.ai_metadata.target_audience}
                      onChange={(e) => updateAiMetadata({ target_audience: e.target.value })}
                      placeholder="e.g., business_professionals"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={presetData.ai_metadata.tags.join(', ')}
                      onChange={(e) => updateAiMetadata({ tags: e.target.value.split(',').map(t => t.trim()) })}
                      placeholder="e.g., headshot, professional, portrait"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="public"
                      checked={presetData.is_public}
                      onCheckedChange={(checked) => updatePresetData({ is_public: checked })}
                    />
                    <Label htmlFor="public">Make Public</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={presetData.is_featured}
                      onCheckedChange={(checked) => updatePresetData({ is_featured: checked })}
                    />
                    <Label htmlFor="featured">Featured Preset</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button variant="outline" onClick={() => router.push('/presets')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Preset
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
