'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Loader2 } from 'lucide-react'

interface EditType {
  id: string
  type_key: string
  display_name: string
  description: string
  category_key: string
  credit_cost: number
  requires_reference_image: boolean
  prompt_placeholder: string
  icon_emoji: string
  sort_order: number
  category: {
    category_key: string
    display_name: string
    description: string
    sort_order: number
  }
}

interface EditTypeSelectorProps {
  selectedType: string
  onTypeChange: (typeKey: string) => void
  className?: string
}

export default function EditTypeSelector({ 
  selectedType, 
  onTypeChange, 
  className = '' 
}: EditTypeSelectorProps) {
  const [editTypes, setEditTypes] = useState<EditType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEditTypes()
  }, [])

  const fetchEditTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/edit/types')
      
      if (!response.ok) {
        throw new Error('Failed to fetch edit types')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setEditTypes(result.data.all_types)
      } else {
        throw new Error(result.error || 'Failed to fetch edit types')
      }
    } catch (err) {
      console.error('Error fetching edit types:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch edit types')
    } finally {
      setLoading(false)
    }
  }

  const getEditTypeInfo = (typeKey: string) => {
    return editTypes.find(type => type.type_key === typeKey)
  }

  const selectedTypeInfo = getEditTypeInfo(selectedType)

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm">Edit Type</Label>
        <div className="flex items-center justify-center p-4 border border-border rounded-md">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted-foreground">Loading edit types...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm">Edit Type</Label>
        <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
          <button 
            onClick={fetchEditTypes}
            className="text-xs text-destructive underline mt-1 hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm">Edit Type</Label>
      
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select edit type">
            {selectedTypeInfo && (
              <div className="flex items-center gap-2">
                {selectedTypeInfo.icon_emoji && <span>{selectedTypeInfo.icon_emoji}</span>}
                <span>{selectedTypeInfo.display_name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {selectedTypeInfo.credit_cost} credits
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {editTypes.map((type) => (
            <SelectItem key={type.type_key} value={type.type_key}>
              <div className="flex items-center gap-2 w-full">
                {type.icon_emoji && <span>{type.icon_emoji}</span>}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{type.display_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {type.credit_cost} credits
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {type.description}
                  </p>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTypeInfo && (
        <div className="p-3 bg-muted/50 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{selectedTypeInfo.display_name}</span>
            <Badge variant="secondary" className="text-xs">
              {selectedTypeInfo.credit_cost} credits
            </Badge>
            {selectedTypeInfo.requires_reference_image && (
              <Badge variant="outline" className="text-xs">
                Requires Reference
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedTypeInfo.description}
          </p>
        </div>
      )}
    </div>
  )
}
