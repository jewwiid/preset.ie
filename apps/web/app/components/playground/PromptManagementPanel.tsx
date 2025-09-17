'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Star, Users, Search, Filter, Copy, ExternalLink } from 'lucide-react'
import { useFeedback } from '@/components/feedback/FeedbackContext'
import { useAuth } from '@/lib/auth-context'

interface StylePreset {
  id: string
  name: string
  description?: string
  style_type: string
  prompt_template: string
  intensity: number
  usage_count: number
  is_public: boolean
  user_id?: string
  generation_mode?: 'text-to-image' | 'image-to-image'
  created_at: string
}

interface PromptManagementPanelProps {
  onSelectPreset?: (preset: StylePreset) => void
  selectedPreset?: StylePreset | null
}

const PromptManagementPanel: React.FC<PromptManagementPanelProps> = ({
  onSelectPreset,
  selectedPreset
}) => {
  const { showFeedback } = useFeedback()
  const { user, session } = useAuth()
  const [presets, setPresets] = useState<StylePreset[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPreset, setEditingPreset] = useState<StylePreset | null>(null)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'photorealistic' | 'artistic' | 'cartoon' | 'vintage' | 'cyberpunk' | 'watercolor' | 'sketch' | 'oil_painting'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('usage')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    styleType: '',
    promptTemplate: '',
    intensity: 1.0,
    isPublic: false,
    generationMode: 'text-to-image' as 'text-to-image' | 'image-to-image'
  })
  
  // Duplicate checking state
  const [duplicateCheck, setDuplicateCheck] = useState<{
    isChecking: boolean
    isDuplicate: boolean
    isNameConflict: boolean
    message: string
  }>({
    isChecking: false,
    isDuplicate: false,
    isNameConflict: false,
    message: ''
  })

  // Check for duplicates
  const checkForDuplicates = async (name: string, styleType: string, promptTemplate: string) => {
    if (!user || !session?.access_token || !name || !styleType || !promptTemplate) {
      setDuplicateCheck({
        isChecking: false,
        isDuplicate: false,
        isNameConflict: false,
        message: ''
      })
      return
    }

    setDuplicateCheck(prev => ({ ...prev, isChecking: true }))

    try {
      const response = await fetch('/api/playground/style-presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          styleType,
          promptTemplate: promptTemplate.trim(),
          intensity: formData.intensity,
          isPublic: formData.isPublic,
          generationMode: formData.generationMode,
          checkOnly: true // Special flag to only check, not create
        })
      })

      const result = await response.json()

      if (result.isDuplicate) {
        setDuplicateCheck({
          isChecking: false,
          isDuplicate: true,
          isNameConflict: false,
          message: 'This exact preset already exists'
        })
      } else if (result.isNameConflict) {
        setDuplicateCheck({
          isChecking: false,
          isDuplicate: false,
          isNameConflict: true,
          message: 'A preset with this name already exists'
        })
      } else {
        setDuplicateCheck({
          isChecking: false,
          isDuplicate: false,
          isNameConflict: false,
          message: '✓ No duplicates found'
        })
      }
    } catch (error) {
      setDuplicateCheck({
        isChecking: false,
        isDuplicate: false,
        isNameConflict: false,
        message: ''
      })
    }
  }

  // Fetch presets
  const fetchPresets = async () => {
    if (!user || !session?.access_token) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/style-presets?includePublic=true', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch presets')
      
      const data = await response.json()
      setPresets(data.presets || [])
    } catch (error) {
      console.error('Failed to fetch presets:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Load Presets',
        message: 'Could not load your style presets. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [user, session])

  // Debounced duplicate checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name && formData.styleType && formData.promptTemplate) {
        checkForDuplicates(formData.name, formData.styleType, formData.promptTemplate)
      } else {
        setDuplicateCheck({
          isChecking: false,
          isDuplicate: false,
          isNameConflict: false,
          message: ''
        })
      }
    }, 1000) // 1 second delay

    return () => clearTimeout(timeoutId)
  }, [formData.name, formData.styleType, formData.promptTemplate])

  // Create preset
  const handleCreatePreset = async () => {
    if (!user || !session?.access_token) return
    
    if (!formData.name || !formData.styleType || !formData.promptTemplate) {
      showFeedback({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please fill in all required fields.'
      })
      return
    }

    try {
      const response = await fetch('/api/playground/style-presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (result.isNameConflict) {
          showFeedback({
            type: 'warning',
            title: 'Name Already Exists',
            message: result.suggestion || 'Please choose a different name for your preset.'
          })
          return
        }
        throw new Error(result.error || 'Failed to create preset')
      }
      
      setShowCreateDialog(false)
      resetForm()
      fetchPresets()
      
      // Handle different success cases
      if (result.isDuplicate) {
        showFeedback({
          type: 'info',
          title: 'Preset Already Exists',
          message: 'This exact style preset already exists in your collection.'
        })
      } else {
        showFeedback({
          type: 'success',
          title: 'Preset Created',
          message: 'Style preset created successfully!'
        })
      }
    } catch (error) {
      console.error('Failed to create preset:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Create Preset',
        message: 'Could not create the style preset. Please try again.'
      })
    }
  }

  // Update preset
  const handleUpdatePreset = async () => {
    if (!user || !session?.access_token || !editingPreset) return

    try {
      const response = await fetch('/api/playground/style-presets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          presetId: editingPreset.id,
          ...formData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (result.isNameConflict) {
          showFeedback({
            type: 'warning',
            title: 'Name Already Exists',
            message: result.suggestion || 'Please choose a different name for your preset.'
          })
          return
        }
        throw new Error(result.error || 'Failed to update preset')
      }
      
      setEditingPreset(null)
      resetForm()
      fetchPresets()
      showFeedback({
        type: 'success',
        title: 'Preset Updated',
        message: 'Style preset updated successfully!'
      })
    } catch (error) {
      console.error('Failed to update preset:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Update Preset',
        message: 'Could not update the style preset. Please try again.'
      })
    }
  }

  // Delete preset
  const handleDeletePreset = async (presetId: string) => {
    if (!user || !session?.access_token) return

    if (!confirm('Are you sure you want to delete this preset? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/playground/style-presets?presetId=${presetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete preset')
      
      fetchPresets()
      showFeedback({
        type: 'success',
        title: 'Preset Deleted',
        message: 'Style preset deleted successfully!'
      })
    } catch (error) {
      console.error('Failed to delete preset:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Delete Preset',
        message: 'Could not delete the style preset. Please try again.'
      })
    }
  }

  // Copy prompt to clipboard
  const copyPromptToClipboard = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      showFeedback({
        type: 'success',
        title: 'Copied!',
        message: 'Prompt copied to clipboard.'
      })
    } catch (error) {
      showFeedback({
        type: 'error',
        title: 'Failed to Copy',
        message: 'Could not copy prompt to clipboard.'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      styleType: '',
      promptTemplate: '',
      intensity: 1.0,
      isPublic: false,
      generationMode: 'text-to-image'
    })
  }

  const openEditDialog = (preset: StylePreset) => {
    setEditingPreset(preset)
    setFormData({
      name: preset.name,
      description: preset.description || '',
      styleType: preset.style_type,
      promptTemplate: preset.prompt_template,
      intensity: preset.intensity,
      isPublic: preset.is_public,
      generationMode: preset.generation_mode || 'text-to-image'
    })
  }

  const styleTypes = [
    { value: 'photorealistic', label: '📸 Photorealistic' },
    { value: 'artistic', label: '🎨 Artistic' },
    { value: 'cartoon', label: '🎭 Cartoon' },
    { value: 'vintage', label: '📻 Vintage' },
    { value: 'cyberpunk', label: '🤖 Cyberpunk' },
    { value: 'watercolor', label: '🎨 Watercolor' },
    { value: 'sketch', label: '✏️ Sketch' },
    { value: 'oil_painting', label: '🖼️ Oil Painting' }
  ]

  // Filter and sort presets
  const filteredPresets = presets
    .filter(preset => {
      const matchesSearch = searchQuery === '' || 
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.prompt_template.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesFilter = filterType === 'all' || preset.style_type === filterType
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'usage':
          return b.usage_count - a.usage_count
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
          <p className="text-gray-600">Please sign in to manage your style presets.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prompt Management</h2>
          <p className="text-gray-600">Create, organize, and reuse your custom style prompts</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Preset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Style Preset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Custom Style"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this style..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Style Type *</label>
                <Select value={formData.styleType} onValueChange={(value) => setFormData({ ...formData, styleType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style type" />
                  </SelectTrigger>
                  <SelectContent>
                    {styleTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Generation Mode *</label>
                <Select value={formData.generationMode} onValueChange={(value: 'text-to-image' | 'image-to-image') => setFormData({ ...formData, generationMode: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select generation mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-to-image">📝 Text-to-Image</SelectItem>
                    <SelectItem value="image-to-image">🖼️ Image-to-Image</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-1">
                  Choose the context this prompt was written for
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prompt Template *</label>
                <Textarea
                  value={formData.promptTemplate}
                  onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                  placeholder="Create a {style_type} image with..."
                  rows={3}
                />
                
                {/* Duplicate Check Indicator */}
                {duplicateCheck.message && (
                  <div className={`mt-2 p-2 rounded-md text-xs ${
                    duplicateCheck.isDuplicate 
                      ? 'bg-orange-50 border border-orange-200 text-orange-800' 
                      : duplicateCheck.isNameConflict
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-green-50 border border-green-200 text-green-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {duplicateCheck.isChecking ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                          <span>Checking for duplicates...</span>
                        </>
                      ) : (
                        <>
                          {duplicateCheck.isDuplicate ? (
                            <span>⚠️</span>
                          ) : duplicateCheck.isNameConflict ? (
                            <span>❌</span>
                          ) : (
                            <span>✓</span>
                          )}
                          <span>{duplicateCheck.message}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800 font-medium mb-1">💡 Prompt Writing Tips:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>Text-to-Image:</strong> Use "Create a..." (no existing image)</li>
                    <li>• <strong>Image-to-Image:</strong> Use "Apply..." or "Transform..." (modifying existing image)</li>
                    <li>• Use <code>{'{style_type}'}</code> placeholder for dynamic style names</li>
                    <li>• Be specific about visual characteristics (colors, textures, mood)</li>
                  </ul>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Intensity</label>
                <Input
                  type="number"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={formData.intensity}
                  onChange={(e) => setFormData({ ...formData, intensity: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <label htmlFor="isPublic" className="text-sm">Make public</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePreset}>
                  Create Preset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filter */}
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Styles</SelectItem>
            <SelectItem value="photorealistic">📸 Photorealistic</SelectItem>
            <SelectItem value="artistic">🎨 Artistic</SelectItem>
            <SelectItem value="cartoon">🎭 Cartoon</SelectItem>
            <SelectItem value="vintage">📻 Vintage</SelectItem>
            <SelectItem value="cyberpunk">🤖 Cyberpunk</SelectItem>
            <SelectItem value="watercolor">🎨 Watercolor</SelectItem>
            <SelectItem value="sketch">✏️ Sketch</SelectItem>
            <SelectItem value="oil_painting">🖼️ Oil Painting</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Sort */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usage">Most Used</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="created">Recently Created</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredPresets.length} preset{filteredPresets.length !== 1 ? 's' : ''} found
      </div>

      {/* Presets Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredPresets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No presets found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Create your first style preset to get started.'}
          </p>
          {(!searchQuery && filterType === 'all') && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Preset
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map(preset => (
            <Card 
              key={preset.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPreset?.id === preset.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'
              }`}
              onClick={() => onSelectPreset?.(preset)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm truncate">{preset.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    {preset.is_public && <Users className="h-3 w-3 text-blue-500" />}
                    <Badge variant="outline" className="text-xs">
                      {preset.style_type}
                    </Badge>
                    {preset.generation_mode && (
                      <Badge variant="secondary" className="text-xs">
                        {preset.generation_mode === 'text-to-image' ? '📝 T2I' : '🖼️ I2I'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {preset.description || preset.prompt_template}
                </p>
                
                {/* Prompt Preview */}
                <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 mb-3 line-clamp-3">
                  {preset.prompt_template}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Star className="h-3 w-3" />
                    <span>{preset.usage_count} uses</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyPromptToClipboard(preset.prompt_template)
                      }}
                      title="Copy Prompt"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {/* Only show edit button for user-created presets */}
                    {preset.user_id && !preset.is_public && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(preset)
                        }}
                        title="Edit Preset"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {/* Only show delete button for user-created presets */}
                    {preset.user_id && !preset.is_public && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePreset(preset.id)
                        }}
                        title="Delete Preset"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPreset} onOpenChange={() => setEditingPreset(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Style Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Custom Style"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this style..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Style Type *</label>
              <Select value={formData.styleType} onValueChange={(value) => setFormData({ ...formData, styleType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style type" />
                </SelectTrigger>
                <SelectContent>
                  {styleTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Generation Mode *</label>
              <Select value={formData.generationMode} onValueChange={(value: 'text-to-image' | 'image-to-image') => setFormData({ ...formData, generationMode: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select generation mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-to-image">📝 Text-to-Image</SelectItem>
                  <SelectItem value="image-to-image">🖼️ Image-to-Image</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                Choose the context this prompt was written for
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prompt Template *</label>
              <Textarea
                value={formData.promptTemplate}
                onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                placeholder="Create a {style_type} image with..."
                rows={3}
              />
              
              {/* Duplicate Check Indicator */}
              {duplicateCheck.message && (
                <div className={`mt-2 p-2 rounded-md text-xs ${
                  duplicateCheck.isDuplicate 
                    ? 'bg-orange-50 border border-orange-200 text-orange-800' 
                    : duplicateCheck.isNameConflict
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-green-50 border border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {duplicateCheck.isChecking ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        <span>Checking for duplicates...</span>
                      </>
                    ) : (
                      <>
                        {duplicateCheck.isDuplicate ? (
                          <span>⚠️</span>
                        ) : duplicateCheck.isNameConflict ? (
                          <span>❌</span>
                        ) : (
                          <span>✓</span>
                        )}
                        <span>{duplicateCheck.message}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800 font-medium mb-1">💡 Prompt Writing Tips:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• <strong>Text-to-Image:</strong> Use "Create a..." (no existing image)</li>
                  <li>• <strong>Image-to-Image:</strong> Use "Apply..." or "Transform..." (modifying existing image)</li>
                  <li>• Use <code>{'{style_type}'}</code> placeholder for dynamic style names</li>
                  <li>• Be specific about visual characteristics (colors, textures, mood)</li>
                </ul>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Intensity</label>
              <Input
                type="number"
                min="0.1"
                max="2.0"
                step="0.1"
                value={formData.intensity}
                onChange={(e) => setFormData({ ...formData, intensity: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublicEdit"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <label htmlFor="isPublicEdit" className="text-sm">Make public</label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingPreset(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePreset}>
                Update Preset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PromptManagementPanel
