'use client'

import { useState, useEffect } from 'react'
import { Palette, Search, Star, Users, Eye, Plus, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { useAuth } from '../../../lib/auth-context'
import { useFeedback } from '../../../components/feedback/FeedbackContext'

interface Preset {
  id: string
  name: string
  description?: string
  category: string
  prompt_template: string
  negative_prompt?: string
  style_settings: any
  technical_settings: any
  ai_metadata: any
  seedream_config: any
  usage_count: number
  is_public: boolean
  is_featured: boolean
  created_at: string
  creator: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
  }
}

interface PresetSelectorProps {
  onPresetSelect: (preset: Preset | null) => void
  selectedPreset?: Preset | null
  onSaveAsPreset?: (presetData: any) => void
  currentSettings?: {
    prompt: string
    style: string
    resolution: string
    aspectRatio: string
    consistencyLevel: string
    intensity: number
    numImages: number
  }
}

export default function PresetSelector({ 
  onPresetSelect, 
  selectedPreset,
  onSaveAsPreset,
  currentSettings
}: PresetSelectorProps) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    is_public: false
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'photography', label: 'Photography' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'custom', label: 'Custom' }
  ]

  useEffect(() => {
    if (user && session) {
      fetchPresets()
    }
  }, [user, session, selectedCategory])

  const fetchPresets = async () => {
    if (!session?.access_token) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)
      params.append('sort', 'popular')
      params.append('limit', '20')

      const response = await fetch(`/api/presets?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch presets')

      const data = await response.json()
      setPresets(data.presets || [])
    } catch (error) {
      console.error('Error fetching presets:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Load Presets',
        message: 'Could not load presets. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePresetSelect = (preset: Preset) => {
    onPresetSelect(preset)
    setShowPresetDialog(false)
    
    showFeedback({
      type: 'success',
      title: 'Preset Applied',
      message: `Applied "${preset.name}" preset to your settings.`
    })
  }

  const handleSaveAsPreset = async () => {
    if (!currentSettings || !session?.access_token) return

    if (!saveFormData.name) {
      showFeedback({
        type: 'warning',
        title: 'Missing Name',
        message: 'Please enter a name for your preset.'
      })
      return
    }

    try {
      const presetData = {
        name: saveFormData.name,
        description: saveFormData.description,
        category: saveFormData.category,
        prompt_template: currentSettings.prompt,
        style_settings: {
          style: currentSettings.style,
          intensity: currentSettings.intensity,
          consistency_level: currentSettings.consistencyLevel
        },
        technical_settings: {
          aspect_ratio: currentSettings.aspectRatio,
          resolution: currentSettings.resolution,
          num_images: currentSettings.numImages
        },
        is_public: saveFormData.is_public
      }

      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(presetData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save preset')
      }

      setShowSaveDialog(false)
      setSaveFormData({ name: '', description: '', category: 'custom', is_public: false })
      
      showFeedback({
        type: 'success',
        title: 'Preset Saved!',
        message: 'Your preset has been saved successfully.'
      })

      // Refresh presets list
      fetchPresets()
    } catch (error) {
      console.error('Failed to save preset:', error)
      showFeedback({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save preset'
      })
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      photography: 'bg-blue-100 text-blue-800',
      cinematic: 'bg-purple-100 text-purple-800',
      artistic: 'bg-pink-100 text-pink-800',
      custom: 'bg-green-100 text-green-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-4">
      {/* Preset Selector Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-preset-500" />
          <span className="font-medium">Presets</span>
          {selectedPreset && (
            <Badge variant="secondary" className="text-xs">
              {selectedPreset.name}
            </Badge>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Search className="h-4 w-4 mr-1" />
                Browse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Select Preset</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchPresets} size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Presets Grid */}
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading presets...</span>
                    </div>
                  ) : presets.length === 0 ? (
                    <div className="text-center py-8">
                      <Palette className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No presets found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {presets.map(preset => (
                        <Card 
                          key={preset.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handlePresetSelect(preset)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-sm">{preset.name}</CardTitle>
                              <div className="flex items-center space-x-1">
                                {preset.is_featured && (
                                  <Star className="h-3 w-3 text-yellow-500" />
                                )}
                                {preset.is_public && (
                                  <Users className="h-3 w-3 text-blue-500" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getCategoryColor(preset.category)}`}>
                                {preset.category}
                              </Badge>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Eye className="h-3 w-3" />
                                <span>{preset.usage_count}</span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {preset.description && (
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {preset.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              by @{preset.creator.handle}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {currentSettings && (
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Save as Preset</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <Input
                      value={saveFormData.name}
                      onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
                      placeholder="My Awesome Preset"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={saveFormData.description}
                      onChange={(e) => setSaveFormData({ ...saveFormData, description: e.target.value })}
                      placeholder="Describe this preset..."
                      className="w-full p-2 border rounded-md text-sm"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Select value={saveFormData.category} onValueChange={(value) => setSaveFormData({ ...saveFormData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={saveFormData.is_public}
                      onChange={(e) => setSaveFormData({ ...saveFormData, is_public: e.target.checked })}
                    />
                    <label htmlFor="is_public" className="text-sm">Make public</label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveAsPreset}>
                      Save Preset
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Selected Preset Info */}
      {selectedPreset && (
        <Card className="bg-preset-50 border-preset-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{selectedPreset.name}</p>
                <p className="text-xs text-gray-600">
                  {selectedPreset.description || 'No description'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPresetSelect(null)}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
