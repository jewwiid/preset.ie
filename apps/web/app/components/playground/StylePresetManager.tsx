'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Plus, Edit, Trash2, Star, Users } from 'lucide-react'
import { useFeedback } from '../../../components/feedback/FeedbackContext'

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
  created_at: string
}

interface StylePresetManagerProps {
  onSelectPreset?: (preset: StylePreset) => void
  selectedPreset?: StylePreset | null
  sessionToken?: string
}

const StylePresetManager: React.FC<StylePresetManagerProps> = ({
  onSelectPreset,
  selectedPreset,
  sessionToken
}) => {
  const { showFeedback } = useFeedback()
  const [presets, setPresets] = useState<StylePreset[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPreset, setEditingPreset] = useState<StylePreset | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    styleType: '',
    promptTemplate: '',
    intensity: 1.0,
    isPublic: false
  })

  useEffect(() => {
    if (sessionToken) {
      fetchPresets()
    }
  }, [sessionToken])

  const fetchPresets = async () => {
    if (!sessionToken) {
      showFeedback({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to load style presets.'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/presets?category=style&sort=popular', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch presets')
      
      const { presets: fetchedPresets } = await response.json()
      setPresets(fetchedPresets)
    } catch (error) {
      console.error('Failed to fetch presets:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Load Presets',
        message: 'Could not load style presets. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePreset = async () => {
    if (!sessionToken) {
      showFeedback({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to create style presets.'
      })
      return
    }

    if (!formData.name || !formData.styleType || !formData.promptTemplate) {
      showFeedback({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please fill in all required fields (Name, Style Type, Prompt Template).'
      })
      return
    }

    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create preset')
      
      setShowCreateDialog(false)
      resetForm()
      fetchPresets()
      showFeedback({
        type: 'success',
        title: 'Preset Created',
        message: 'Style preset created successfully!'
      })
    } catch (error) {
      console.error('Failed to create preset:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Create Preset',
        message: 'Could not create the style preset. Please try again.'
      })
    }
  }

  const handleUpdatePreset = async () => {
    if (!editingPreset) return

    if (!sessionToken) {
      showFeedback({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to update style presets.'
      })
      return
    }

    try {
      const response = await fetch('/api/presets', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          presetId: editingPreset.id,
          ...formData
        })
      })

      if (!response.ok) throw new Error('Failed to update preset')
      
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

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return

    if (!sessionToken) {
      showFeedback({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to delete style presets.'
      })
      return
    }

    try {
      const response = await fetch(`/api/presets/${presetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      styleType: '',
      promptTemplate: '',
      intensity: 1.0,
      isPublic: false
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
      isPublic: preset.is_public
    })
  }

  const styleTypes = [
    { value: 'photorealistic', label: 'Photorealistic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'watercolor', label: 'Watercolor' },
    { value: 'sketch', label: 'Sketch' },
    { value: 'oil_painting', label: 'Oil Painting' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Style Presets</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
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
                <label className="block text-sm font-medium mb-1">Prompt Template *</label>
                <Textarea
                  value={formData.promptTemplate}
                  onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                  placeholder="Apply {style_type} style to this image..."
                  rows={3}
                />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {presets.map(preset => (
          <Card 
            key={preset.id} 
            className={`cursor-pointer transition-colors ${
              selectedPreset?.id === preset.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
            }`}
            onClick={() => onSelectPreset?.(preset)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{preset.name}</CardTitle>
                <div className="flex items-center space-x-1">
                  {preset.is_public && <Users className="h-3 w-3 text-primary" />}
                  <Badge variant="outline" className="text-xs">
                    {preset.style_type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {preset.description || preset.prompt_template}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" />
                  <span>{preset.usage_count} uses</span>
                </div>
                <div className="flex space-x-1">
                  {/* Only show edit button for user-created presets */}
                  {preset.user_id && !preset.is_public && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditDialog(preset)
                      }}
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
              <label className="block text-sm font-medium mb-1">Prompt Template *</label>
              <Textarea
                value={formData.promptTemplate}
                onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                placeholder="Apply {style_type} style to this image..."
                rows={3}
              />
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

export default StylePresetManager
