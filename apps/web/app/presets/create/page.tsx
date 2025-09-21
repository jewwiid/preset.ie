'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { Palette, Wand2, Save, Eye, Upload, X, Plus, Settings, Info } from 'lucide-react'
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
}

const CATEGORIES = [
  { value: 'photography', label: 'Photography', icon: '📸' },
  { value: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { value: 'artistic', label: 'Artistic', icon: '🎨' },
  { value: 'portrait', label: 'Portrait', icon: '👤' },
  { value: 'landscape', label: 'Landscape', icon: '🏞️' },
  { value: 'commercial', label: 'Commercial', icon: '💼' },
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
  const { user, session } = useAuth()
  
  const [presetData, setPresetData] = useState<PresetData>({
    name: '',
    description: '',
    category: 'photography',
    prompt_template: '',
    negative_prompt: '',
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
    is_featured: false
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)
  const [currentTag, setCurrentTag] = useState('')

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
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(presetData)
      })

      if (response.ok) {
        const { id } = await response.json()
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to create presets.</p>
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
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
                              className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
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
                          <p className="text-sm text-gray-500">Allow others to discover and use this preset</p>
                        </div>
                        <Switch
                          checked={presetData.is_public}
                          onCheckedChange={(checked) => setPresetData(prev => ({ ...prev, is_public: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Featured</Label>
                          <p className="text-sm text-gray-500">Highlight this preset (requires approval)</p>
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
                <Card>
                  <CardHeader>
                    <CardTitle>Prompt Templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="prompt_template">Prompt Template *</Label>
                      <Textarea
                        id="prompt_template"
                        value={presetData.prompt_template}
                        onChange={(e) => setPresetData(prev => ({ ...prev, prompt_template: e.target.value }))}
                        placeholder="Enter your prompt template. Use {subject}, {style}, {mood} as placeholders..."
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Use placeholders like {'{subject}'}, {'{style}'}, {'{mood}'} for dynamic content
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="negative_prompt">Negative Prompt</Label>
                      <Textarea
                        id="negative_prompt"
                        value={presetData.negative_prompt}
                        onChange={(e) => setPresetData(prev => ({ ...prev, negative_prompt: e.target.value }))}
                        placeholder="What to avoid in the generation..."
                        rows={2}
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Prompt Tips:</p>
                          <ul className="mt-1 space-y-1">
                            <li>• Be specific about style and mood</li>
                            <li>• Include technical terms for better results</li>
                            <li>• Use placeholders for flexibility</li>
                            <li>• Test your prompt in the playground first</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview Generation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
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

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                        <div className="text-sm text-yellow-800">
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
                  <span className="text-sm text-gray-600">Category:</span>
                  <Badge variant="secondary">
                    {CATEGORIES.find(c => c.value === presetData.category)?.icon} {CATEGORIES.find(c => c.value === presetData.category)?.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Style:</span>
                  <span className="text-sm font-medium">{presetData.ai_metadata.style}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mood:</span>
                  <span className="text-sm font-medium">{presetData.ai_metadata.mood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Resolution:</span>
                  <span className="text-sm font-medium">{presetData.technical_settings.width}x{presetData.technical_settings.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Visibility:</span>
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
                <div className="space-y-2 text-sm text-gray-600">
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