'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { Palette, Wand2, Save, Eye, Upload, X, Plus, Settings, Info, Store, Copy, RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'

interface PresetData {
  name: string
  description: string
  category: string
  prompt_template: string
  negative_prompt?: string
  // Dynamic prompt fields
  prompt_subject: string
  prompt_image_url?: string
  enhanced_prompt: string
  style_settings: {
    model: string
    steps: number
    guidance_scale: number
    seed?: number
  }
  technical_settings: {
    width: number
    height: number
    batch_size: number
    scheduler: string
  }
  ai_metadata: {
    tags: string[]
    mood: string
    style: string
    complexity: string
  }
  seedream_config: {
    model_version: string
    enhancement_settings: any
  }
  is_public: boolean
  is_featured: boolean
  // Marketplace fields
  is_for_sale: boolean
  sale_price: number
  marketplace_title: string
  marketplace_description: string
  marketplace_tags: string[]
}

const CATEGORIES = [
  { value: 'photography', label: 'Photography', icon: '📸' },
  { value: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { value: 'artistic', label: 'Artistic', icon: '🎨' },
  { value: 'portrait', label: 'Portrait', icon: '👤' },
  { value: 'landscape', label: 'Landscape', icon: '🏞️' },
  { value: 'commercial', label: 'Commercial', icon: '💼' },
  { value: 'headshot', label: 'Headshot', icon: '📷' },
  { value: 'product_photography', label: 'Product Photography', icon: '📦' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { value: 'corporate_portrait', label: 'Corporate Portrait', icon: '👔' },
  { value: 'linkedin_photo', label: 'LinkedIn Photo', icon: '💼' },
  { value: 'professional_portrait', label: 'Professional Portrait', icon: '👤' },
  { value: 'business_headshot', label: 'Business Headshot', icon: '📸' },
  { value: 'product_catalog', label: 'Product Catalog', icon: '📋' },
  { value: 'product_lifestyle', label: 'Product Lifestyle', icon: '🏠' },
  { value: 'product_studio', label: 'Product Studio', icon: '🎬' },
  { value: 'abstract', label: 'Abstract', icon: '🌀' },
  { value: 'custom', label: 'Custom', icon: '⚙️' }
]

const MOODS = [
  'Dramatic', 'Ethereal', 'Moody', 'Bright', 'Dark', 'Vibrant', 
  'Minimal', 'Maximal', 'Futuristic', 'Vintage', 'Natural', 'Surreal'
]

const STYLES = [
  'Realistic', 'Photorealistic', 'Painterly', 'Illustration', 'Sketch', 
  'Watercolor', 'Oil Painting', 'Digital Art', 'Concept Art', 'Cinematic'
]

export default function CreatePresetPage() {
  const router = useRouter()
  const { user, session, userRole } = useAuth()
  
  const [presetData, setPresetData] = useState<PresetData>({
    name: '',
    description: '',
    category: 'photography',
    prompt_template: '',
    negative_prompt: '',
    // Dynamic prompt fields
    prompt_subject: '',
    prompt_image_url: '',
    enhanced_prompt: '',
    style_settings: {
      model: 'seedream-v4',
      steps: 20,
      guidance_scale: 7.5,
    },
    technical_settings: {
      width: 1024,
      height: 1024,
      batch_size: 1,
      scheduler: 'DPMSolverMultistepScheduler'
    },
    ai_metadata: {
      tags: [],
      mood: 'Dramatic',
      style: 'Realistic',
      complexity: 'Medium'
    },
    seedream_config: {
      model_version: 'v4',
      enhancement_settings: {}
    },
    is_public: false,
    is_featured: false,
    // Marketplace fields
    is_for_sale: false,
    sale_price: 0,
    marketplace_title: '',
    marketplace_description: '',
    marketplace_tags: []
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)

  // Generate enhanced prompt by replacing placeholders
  const generateEnhancedPrompt = () => {
    let enhancedPrompt = presetData.prompt_template;
    
    // Replace placeholders with actual values from Basic Info tab
    enhancedPrompt = enhancedPrompt.replace(/\{subject\}/g, presetData.prompt_subject || '{subject}');
    enhancedPrompt = enhancedPrompt.replace(/\{style\}/g, presetData.ai_metadata.style || '{style}');
    enhancedPrompt = enhancedPrompt.replace(/\{mood\}/g, presetData.ai_metadata.mood || '{mood}');
    
    // Add image reference if provided
    if (presetData.prompt_image_url) {
      enhancedPrompt += ` [Image: ${presetData.prompt_image_url}]`;
    }
    
    setPresetData(prev => ({ ...prev, enhanced_prompt: enhancedPrompt }));
  }
  const [currentTag, setCurrentTag] = useState('')

  // Generate enhanced prompt on component mount and when template changes
  useEffect(() => {
    generateEnhancedPrompt();
  }, [presetData.prompt_template, presetData.prompt_subject, presetData.ai_metadata.style, presetData.ai_metadata.mood, presetData.prompt_image_url])

  const addTag = () => {
    if (currentTag.trim() && !presetData.ai_metadata.tags.includes(currentTag.trim())) {
      setPresetData(prev => ({
        ...prev,
        ai_metadata: {
          ...prev.ai_metadata,
          tags: [...prev.ai_metadata.tags, currentTag.trim()]
        }
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setPresetData(prev => ({
      ...prev,
      ai_metadata: {
        ...prev.ai_metadata,
        tags: prev.ai_metadata.tags.filter(tag => tag !== tagToRemove)
      }
    }))
  }

  const generatePreview = async () => {
    if (!presetData.prompt_template.trim()) {
      alert('Please enter a prompt template first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          prompt: presetData.prompt_template,
          style: presetData.ai_metadata.style.toLowerCase(),
          resolution: `${presetData.technical_settings.width}x${presetData.technical_settings.height}`,
          maxImages: 1,
          consistencyLevel: 'high',
          customStylePreset: {
            name: presetData.name,
            settings: presetData.style_settings,
            technical: presetData.technical_settings
          }
        })
      })

      if (response.ok) {
        const { images } = await response.json()
        if (images && images.length > 0) {
          setGeneratedPreview(images[0].url || images[0])
        }
      } else {
        throw new Error('Failed to generate preview')
      }
    } catch (error) {
      console.error('Preview generation failed:', error)
      alert('Failed to generate preview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const savePreset = async () => {
    if (!presetData.name.trim() || !presetData.prompt_template.trim()) {
      alert('Please fill in the name and prompt template')
      return
    }

    setSaving(true)
    try {
      // First, save the preset (without featured status)
      const presetToSave = {
        ...presetData,
        is_featured: false // Always save as non-featured initially
      }

      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(presetToSave)
      })

      if (response.ok) {
        const { id } = await response.json()
        
        // If user requested featured status, submit a featured request
        if (presetData.is_featured) {
          try {
            const featuredResponse = await fetch('/api/presets/featured-requests', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify({
                preset_id: id,
                requester_id: user?.id
              })
            })

            if (featuredResponse.ok) {
              alert('Preset saved successfully! Your featured request has been submitted for review.')
            } else {
              alert('Preset saved successfully! However, there was an issue submitting your featured request. You can request featured status later.')
            }
          } catch (featuredError) {
            console.error('Featured request failed:', featuredError)
            alert('Preset saved successfully! However, there was an issue submitting your featured request. You can request featured status later.')
          }
        } else {
          alert('Preset saved successfully!')
        }

        // If user wants to sell the preset, create marketplace listing (admin only)
        if (userRole?.isAdmin && presetData.is_for_sale && presetData.sale_price > 0 && presetData.marketplace_title.trim()) {
          try {
            const marketplaceResponse = await fetch('/api/marketplace/listings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify({
                presetId: id,
                salePrice: presetData.sale_price,
                marketplaceTitle: presetData.marketplace_title,
                marketplaceDescription: presetData.marketplace_description,
                tags: presetData.marketplace_tags
              })
            })

            if (marketplaceResponse.ok) {
              alert('Preset saved and marketplace listing created successfully! Your listing is pending review.')
            } else {
              const errorData = await marketplaceResponse.json()
              alert(`Preset saved successfully! However, there was an issue creating your marketplace listing: ${errorData.error}`)
            }
          } catch (marketplaceError) {
            console.error('Marketplace listing creation failed:', marketplaceError)
            alert('Preset saved successfully! However, there was an issue creating your marketplace listing. You can create it later.')
          }
        }
        
        router.push(`/presets/${id}`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save preset')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to save preset')
    } finally {
      setSaving(false)
    }
  }

  const loadFromPlayground = () => {
    // This would load the last generation settings from the playground
    const lastGeneration = localStorage.getItem('lastPlaygroundGeneration')
    if (lastGeneration) {
      try {
        const data = JSON.parse(lastGeneration)
        setPresetData(prev => ({
          ...prev,
          prompt_template: data.prompt || '',
          style_settings: {
            ...prev.style_settings,
            ...data.settings
          },
          technical_settings: {
            ...prev.technical_settings,
            ...data.technical
          },
          ai_metadata: {
            ...prev.ai_metadata,
            style: data.style || 'Realistic',
            mood: data.mood || 'Dramatic'
          }
        }))
        alert('Settings loaded from last playground generation!')
      } catch (error) {
        console.error('Failed to load from playground:', error)
        alert('Failed to load playground settings')
      }
    } else {
      alert('No playground generation found. Generate some images first!')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
            <p className="text-muted-foreground-600 mb-4">Please sign in to create presets.</p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl p-8 border border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Palette className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-5xl font-bold text-primary mb-2">Create Preset</h1>
                <p className="text-xl text-muted-foreground">Create and share AI generation presets</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button size="lg" className="px-8 py-3 text-lg font-semibold" onClick={savePreset} disabled={saving}>
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save Preset'}
              </Button>
            </div>
          </div>
        </div>

        <main>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full ${userRole?.isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                {userRole?.isAdmin && (
                  <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                )}
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Preset Name *</Label>
                      <Input
                        id="name"
                        value={presetData.name}
                        onChange={(e) => setPresetData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter a descriptive name for your preset..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={presetData.description}
                        onChange={(e) => setPresetData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this preset creates and when to use it..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={presetData.category} 
                        onValueChange={(value) => setPresetData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              <span className="mr-2">{category.icon}</span>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mood">Mood</Label>
                        <Select 
                          value={presetData.ai_metadata.mood} 
                          onValueChange={(value) => setPresetData(prev => ({ 
                            ...prev, 
                            ai_metadata: { ...prev.ai_metadata, mood: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MOODS.map(mood => (
                              <SelectItem key={mood} value={mood}>
                                {mood}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="style">Style</Label>
                        <Select 
                          value={presetData.ai_metadata.style} 
                          onValueChange={(value) => setPresetData(prev => ({ 
                            ...prev, 
                            ai_metadata: { ...prev.ai_metadata, style: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STYLES.map(style => (
                              <SelectItem key={style} value={style}>
                                {style}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Input
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          placeholder="Add a tag..."
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button size="sm" onClick={addTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {presetData.ai_metadata.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:bg-muted-300 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Visibility Settings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Make Public</Label>
                          <p className="text-sm text-muted-foreground-500">Allow others to discover and use this preset</p>
                        </div>
                        <Switch
                          checked={presetData.is_public}
                          onCheckedChange={(checked) => setPresetData(prev => ({ ...prev, is_public: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Featured</Label>
                          <p className="text-sm text-muted-foreground-500">Highlight this preset (requires approval)</p>
                        </div>
                        <Switch
                          checked={presetData.is_featured}
                          onCheckedChange={(checked) => setPresetData(prev => ({ ...prev, is_featured: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prompts Tab */}
              <TabsContent value="prompts" className="space-y-6">
                {/* Prompt Template */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prompt Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="prompt_template">Base Prompt Template *</Label>
                      <Textarea
                        id="prompt_template"
                        value={presetData.prompt_template}
                        onChange={(e) => {
                          setPresetData(prev => ({ ...prev, prompt_template: e.target.value }));
                          generateEnhancedPrompt();
                        }}
                        placeholder="Enter your base prompt template. Use {subject}, {style}, {mood} as placeholders..."
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Use placeholders like {'{subject}'}, {'{style}'}, {'{mood}'} for dynamic content
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Dynamic Fields */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dynamic Prompt Fields</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="prompt_subject">Subject</Label>
                        <Input
                          id="prompt_subject"
                          value={presetData.prompt_subject}
                          onChange={(e) => {
                            setPresetData(prev => ({ ...prev, prompt_subject: e.target.value }));
                            generateEnhancedPrompt();
                          }}
                          placeholder="e.g., portrait, landscape, object"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Main subject of your prompt
                        </p>
                      </div>

                      {/* Image Insertion for Text-to-Image */}
                      <div>
                        <Label htmlFor="prompt_image_url">Reference Image URL (Optional)</Label>
                        <Input
                          id="prompt_image_url"
                          value={presetData.prompt_image_url || ''}
                          onChange={(e) => {
                            setPresetData(prev => ({ ...prev, prompt_image_url: e.target.value }));
                            generateEnhancedPrompt();
                          }}
                          placeholder="https://example.com/image.jpg"
                          type="url"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Add a reference image URL for text-to-image prompts
                        </p>
                      </div>
                    </div>

                    {/* Info about using Basic Info fields */}
                    <div className="bg-primary-50 dark:bg-primary-950/20 p-3 rounded-lg border border-primary-200 dark:border-primary-800">
                      <div className="flex items-start">
                        <Info className="h-4 w-4 text-primary mt-0.5 mr-2" />
                        <div className="text-sm text-primary-800 dark:text-primary-200">
                          <p className="font-medium">Using Basic Info Fields:</p>
                          <p className="mt-1">
                            Style and Mood are automatically pulled from the Basic Info tab. 
                            Use {'{style}'} and {'{mood}'} placeholders in your template to include them.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Prompt Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>Enhanced Prompt Preview</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="enhanced_prompt">Final Enhanced Prompt</Label>
                      <Textarea
                        id="enhanced_prompt"
                        value={presetData.enhanced_prompt}
                        readOnly
                        className="bg-muted/50 border-dashed"
                        rows={4}
                        placeholder="Enhanced prompt will appear here..."
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        This is the final prompt that will be used for generation
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(presetData.enhanced_prompt);
                          alert('Enhanced prompt copied to clipboard!');
                        }}
                        disabled={!presetData.enhanced_prompt}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Prompt
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateEnhancedPrompt}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Negative Prompt */}
                <Card>
                  <CardHeader>
                    <CardTitle>Negative Prompt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="negative_prompt">What to Avoid</Label>
                      <Textarea
                        id="negative_prompt"
                        value={presetData.negative_prompt}
                        onChange={(e) => setPresetData(prev => ({ ...prev, negative_prompt: e.target.value }))}
                        placeholder="What to avoid in the generation..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                <div className="bg-primary-50 dark:bg-primary-950/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-primary mt-0.5 mr-2" />
                    <div className="text-sm text-primary-800 dark:text-primary-200">
                      <p className="font-medium">Enhanced Prompt Tips:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Fill in the dynamic fields to see your enhanced prompt</li>
                        <li>• The system automatically replaces placeholders with your values</li>
                        <li>• Add reference images for better text-to-image results</li>
                        <li>• Use specific, descriptive terms for better AI understanding</li>
                        <li>• Test your enhanced prompt in the playground before saving</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Style Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="steps">Steps</Label>
                        <Input
                          id="steps"
                          type="number"
                          value={presetData.style_settings.steps}
                          onChange={(e) => setPresetData(prev => ({
                            ...prev,
                            style_settings: { ...prev.style_settings, steps: parseInt(e.target.value) || 20 }
                          }))}
                          min="1"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="guidance_scale">Guidance Scale</Label>
                        <Input
                          id="guidance_scale"
                          type="number"
                          step="0.1"
                          value={presetData.style_settings.guidance_scale}
                          onChange={(e) => setPresetData(prev => ({
                            ...prev,
                            style_settings: { ...prev.style_settings, guidance_scale: parseFloat(e.target.value) || 7.5 }
                          }))}
                          min="1"
                          max="20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="width">Width</Label>
                        <Input
                          id="width"
                          type="number"
                          value={presetData.technical_settings.width}
                          onChange={(e) => setPresetData(prev => ({
                            ...prev,
                            technical_settings: { ...prev.technical_settings, width: parseInt(e.target.value) || 1024 }
                          }))}
                          min="256"
                          max="2048"
                          step="64"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          type="number"
                          value={presetData.technical_settings.height}
                          onChange={(e) => setPresetData(prev => ({
                            ...prev,
                            technical_settings: { ...prev.technical_settings, height: parseInt(e.target.value) || 1024 }
                          }))}
                          min="256"
                          max="2048"
                          step="64"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Marketplace Tab - Admin Only */}
              {userRole?.isAdmin && (
                <TabsContent value="marketplace" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Store className="h-5 w-5" />
                      <span>Marketplace Listing</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Enable Marketplace Toggle */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-for-sale"
                        checked={presetData.is_for_sale}
                        onCheckedChange={(checked) => 
                          setPresetData(prev => ({ 
                            ...prev, 
                            is_for_sale: checked,
                            marketplace_title: checked && !prev.marketplace_title ? prev.name : prev.marketplace_title,
                            marketplace_description: checked && !prev.marketplace_description ? prev.description : prev.marketplace_description
                          }))
                        }
                      />
                      <Label htmlFor="is-for-sale">Put this preset up for sale</Label>
                    </div>

                    {presetData.is_for_sale && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        {/* Sale Price */}
                        <div>
                          <Label htmlFor="sale-price">Sale Price (Credits)</Label>
                          <Input
                            id="sale-price"
                            type="number"
                            min="1"
                            max="1000"
                            value={presetData.sale_price}
                            onChange={(e) => setPresetData(prev => ({ 
                              ...prev, 
                              sale_price: parseInt(e.target.value) || 0 
                            }))}
                            placeholder="Enter price in credits"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Minimum 1 credit, maximum 1000 credits
                          </p>
                        </div>

                        {/* Marketplace Title */}
                        <div>
                          <Label htmlFor="marketplace-title">Marketplace Title</Label>
                          <Input
                            id="marketplace-title"
                            value={presetData.marketplace_title}
                            onChange={(e) => setPresetData(prev => ({ 
                              ...prev, 
                              marketplace_title: e.target.value 
                            }))}
                            placeholder="Enter a compelling title for the marketplace"
                            maxLength={150}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {presetData.marketplace_title.length}/150 characters
                          </p>
                        </div>

                        {/* Marketplace Description */}
                        <div>
                          <Label htmlFor="marketplace-description">Marketplace Description</Label>
                          <Textarea
                            id="marketplace-description"
                            value={presetData.marketplace_description}
                            onChange={(e) => setPresetData(prev => ({ 
                              ...prev, 
                              marketplace_description: e.target.value 
                            }))}
                            placeholder="Describe what makes this preset special and how to use it"
                            rows={4}
                          />
                        </div>

                        {/* Marketplace Tags */}
                        <div>
                          <Label htmlFor="marketplace-tags">Tags (comma-separated)</Label>
                          <Input
                            id="marketplace-tags"
                            value={presetData.marketplace_tags.join(', ')}
                            onChange={(e) => {
                              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                              setPresetData(prev => ({ 
                                ...prev, 
                                marketplace_tags: tags 
                              }));
                            }}
                            placeholder="e.g., portrait, professional, studio"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Add relevant tags to help buyers find your preset
                          </p>
                        </div>

                        {/* Marketplace Info */}
                        <div className="p-3 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-primary mt-0.5" />
                            <div className="text-sm text-primary-800 dark:text-primary-200">
                              <p className="font-medium">Marketplace Guidelines:</p>
                              <ul className="mt-1 space-y-1 text-xs">
                                <li>• Your preset will be reviewed before going live</li>
                                <li>• You'll earn credits when someone purchases your preset</li>
                                <li>• Set a fair price based on quality and uniqueness</li>
                                <li>• Provide clear descriptions and helpful tags</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </TabsContent>
              )}

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview Generation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground-600">
                          Generate a preview image to test your preset settings
                        </p>
                      </div>
                      <Button onClick={generatePreview} disabled={loading}>
                        <Wand2 className="h-4 w-4 mr-2" />
                        {loading ? 'Generating...' : 'Generate Preview'}
                      </Button>
                    </div>

                    {generatedPreview && (
                      <div className="border rounded-lg p-4">
                        <img
                          src={generatedPreview}
                          alt="Preset preview"
                          className="w-full max-w-md mx-auto rounded"
                        />
                      </div>
                    )}

                    <div className="bg-primary-50 p-4 rounded-lg">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-primary-600 mt-0.5 mr-2" />
                        <div className="text-sm text-primary-800">
                          <p className="font-medium">Preview Note:</p>
                          <p>This will use your current credits. Make sure your preset settings are correct before generating.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={loadFromPlayground}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Load from Playground
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/playground')}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Test in Playground
                </Button>
              </CardContent>
            </Card>

            {/* Preset Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Preset Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-600">Category:</span>
                  <Badge variant="secondary">
                    {CATEGORIES.find(c => c.value === presetData.category)?.icon} {CATEGORIES.find(c => c.value === presetData.category)?.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-600">Style:</span>
                  <span className="text-sm font-medium">{presetData.ai_metadata.style}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-600">Mood:</span>
                  <span className="text-sm font-medium">{presetData.ai_metadata.mood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-600">Resolution:</span>
                  <span className="text-sm font-medium">{presetData.technical_settings.width}x{presetData.technical_settings.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-600">Visibility:</span>
                  <Badge variant={presetData.is_public ? "default" : "secondary"}>
                    {presetData.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground-600">
                  <p>• Test your preset in the playground before saving</p>
                  <p>• Use descriptive names and tags for discoverability</p>
                  <p>• Include helpful descriptions for other users</p>
                  <p>• Start with proven settings and iterate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}