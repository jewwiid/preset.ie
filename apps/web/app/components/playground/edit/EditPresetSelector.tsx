'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Loader2, Sparkles } from 'lucide-react'

interface EditPreset {
  id: string
  preset_name: string
  description: string
  edit_type_key: string
  default_prompt: string
  default_strength: number
  sort_order: number
  edit_type: {
    type_key: string
    display_name: string
    description: string
    credit_cost: number
    requires_reference_image: boolean
    icon_emoji: string
    category_key: string
  }
}

interface EditPresetSelectorProps {
  onPresetSelect: (preset: EditPreset) => void
  className?: string
}

export default function EditPresetSelector({ 
  onPresetSelect, 
  className = '' 
}: EditPresetSelectorProps) {
  const [presets, setPresets] = useState<EditPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/edit/presets')
      
      if (!response.ok) {
        throw new Error('Failed to fetch edit presets')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setPresets(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch edit presets')
      }
    } catch (err) {
      console.error('Error fetching edit presets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch edit presets')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Edit Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-muted-foreground">Loading presets...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Edit Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
            <button 
              onClick={fetchPresets}
              className="text-xs text-destructive underline mt-1 hover:no-underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (presets.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Edit Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">No presets available</p>
            <p className="text-xs">Check back later for new presets</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="h-5 w-5 mr-2" />
          Edit Presets
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Quick-start templates for common editing tasks
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className="h-auto p-3 justify-start text-left"
              onClick={() => onPresetSelect(preset)}
            >
              <div className="flex items-start gap-3 w-full">
                {preset.edit_type.icon_emoji && <span className="text-lg">{preset.edit_type.icon_emoji}</span>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{preset.preset_name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {preset.edit_type.credit_cost} credits
                    </Badge>
                    {preset.edit_type.requires_reference_image && (
                      <Badge variant="outline" className="text-xs">
                        Reference
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
                  {preset.default_prompt && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      "{preset.default_prompt}"
                    </p>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
