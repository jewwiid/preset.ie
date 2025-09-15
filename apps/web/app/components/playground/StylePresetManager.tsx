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

interface StylePreset {
  id: string
  name: string
  description?: string
  style_type: string
  prompt_template: string
  intensity: number
  usage_count: number
  is_public: boolean
  created_at: string
}

interface StylePresetManagerProps {
  onSelectPreset?: (preset: StylePreset) => void
  selectedPreset?: StylePreset | null
}

const StylePresetManager: React.FC<StylePresetManagerProps> = ({
  onSelectPreset,
  selectedPreset
}) => {
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
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/playground/style-presets?includePublic=true')
      if (!response.ok) throw new Error('Failed to fetch presets')
      
      const { presets: fetchedPresets } = await response.json()
      setPresets(fetchedPresets)
    } catch (error) {
      console.error('Failed to fetch presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePreset = async () => {
    if (!formData.name || !formData.styleType || !formData.promptTemplate) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/playground/style-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to create preset')
      
      setShowCreateDialog(false)
      resetForm()
      fetchPresets()
    } catch (error) {
      console.error('Failed to create preset:', error)
      alert('Failed to create preset')
    }
  }

  const handleUpdatePreset = async () => {
    if (!editingPreset) return

    try {
      const response = await fetch('/api/playground/style-presets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetId: editingPreset.id,
          ...formData
        })
      })

      if (!response.ok) throw new Error('Failed to update preset')
      
      setEditingPreset(null)
      resetForm()
      fetchPresets()
    } catch (error) {
      console.error('Failed to update preset:', error)
      alert('Failed to update preset')
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return

    try {
      const response = await fetch(`/api/playground/style-presets?presetId=${presetId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete preset')
      
      fetchPresets()
    } catch (error) {
      console.error('Failed to delete preset:', error)
      alert('Failed to delete preset')
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
              selectedPreset?.id === preset.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectPreset?.(preset)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{preset.name}</CardTitle>
                <div className="flex items-center space-x-1">
                  {preset.is_public && <Users className="h-3 w-3 text-blue-500" />}
                  <Badge variant="outline" className="text-xs">
                    {preset.style_type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {preset.description || preset.prompt_template}
              </p>
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
                      openEditDialog(preset)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
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
