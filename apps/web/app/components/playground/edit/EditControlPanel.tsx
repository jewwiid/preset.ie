'use client'

import { useState, useMemo } from 'react'
import { Wand2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Settings } from 'lucide-react'
import EditTypeSelector from './EditTypeSelector'
import EditPresetSelector from './EditPresetSelector'
import { MentionInput } from '../../ui/mention-input'
import { MentionableItem } from '../../../../hooks/useMentionSystem'

interface EditControlPanelProps {
  onEdit: (params: {
    imageUrl: string
    editType: string
    editPrompt: string
    strength: number
    referenceImage?: string
    attribution?: {
      source: 'pexels' | 'url' | 'upload' | 'saved';
      photographer?: string;
      photographer_url?: string;
      photographer_id?: number;
      original_url?: string;
    } | null
  }) => Promise<void>
  loading: boolean
  selectedImage: string | null
  uploadedImage: string | null
  referenceImage: string | null
  editType: string
  editPrompt: string
  editStrength: number
  onTypeChange: (type: string) => void
  onPromptChange: (prompt: string) => void
  onStrengthChange: (strength: number) => void
  onReferenceImageChange: (image: string | null) => void
  sourceImages?: Array<{
    id: string
    url: string
    type: string
    label: string
  }>
  attribution?: {
    source: 'pexels' | 'url' | 'upload' | 'saved';
    photographer?: string;
    photographer_url?: string;
    photographer_id?: number;
    original_url?: string;
  } | null
}

export default function EditControlPanel({
  onEdit,
  loading,
  selectedImage,
  uploadedImage,
  referenceImage,
  editType,
  editPrompt,
  editStrength,
  onTypeChange,
  onPromptChange,
  onStrengthChange,
  onReferenceImageChange,
  sourceImages = [],
  attribution
}: EditControlPanelProps) {
  const [showPresets, setShowPresets] = useState(false)

  // Create mentionable items from source images
  const mentionableItems = useMemo(() => {
    return sourceImages.map(img => ({
      id: img.id,
      label: img.label,
      type: img.type,
      thumbnail: img.url,
      description: `${img.type} - ${img.label}`
    }))
  }, [sourceImages])

  const handleEdit = async () => {
    const imageToEdit = uploadedImage || selectedImage
    if (!imageToEdit || !editPrompt.trim()) {
      return
    }
    
    await onEdit({
      imageUrl: imageToEdit,
      editType,
      editPrompt,
      strength: editStrength,
      referenceImage: referenceImage || undefined,
      attribution
    })
  }

  const handlePresetSelect = (preset: any) => {
    onTypeChange(preset.edit_type_key)
    if (preset.default_prompt) {
      onPromptChange(preset.default_prompt)
    }
    if (preset.default_strength) {
      onStrengthChange(preset.default_strength)
    }
    setShowPresets(false)
  }

  const canEdit = !loading && 
    editPrompt.trim() && 
    (uploadedImage || selectedImage) &&
    editType

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Wand2 className="h-5 w-5 mr-2" />
          Edit Settings & Presets
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Edit Presets */}
        <Collapsible open={showPresets} onOpenChange={setShowPresets}>
          <CollapsibleTrigger className="w-full p-3 text-left bg-muted hover:bg-muted/80 rounded-lg transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Edit Presets</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <EditPresetSelector onPresetSelect={handlePresetSelect} />
          </CollapsibleContent>
        </Collapsible>

        {/* Edit Type Selection */}
        <EditTypeSelector
          selectedType={editType}
          onTypeChange={onTypeChange}
        />

        {/* Edit Prompt with Mention Support */}
        <div className="space-y-2">
          <Label className="text-sm">Edit Prompt</Label>
          {sourceImages.length > 0 ? (
            <MentionInput
              value={editPrompt}
              onChange={onPromptChange}
              placeholder="Describe how you want to edit the image..."
              mentionableItems={mentionableItems}
              className="min-h-[100px]"
            />
          ) : (
            <Textarea
              value={editPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe how you want to edit the image..."
              className="min-h-[100px]"
            />
          )}
        </div>

        {/* Strength Slider */}
        <div className="space-y-2">
          <Label className="text-sm">Strength: {editStrength}</Label>
          <Slider
            value={[editStrength]}
            onValueChange={(value) => onStrengthChange(value[0])}
            min={0.1}
            max={1.0}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Higher values apply more dramatic changes
          </p>
        </div>

        {/* Reference Image Section */}
        {editType && (
          <div className="space-y-2">
            <Label className="text-sm">Reference Image</Label>
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                {referenceImage 
                  ? 'Reference image selected' 
                  : 'No reference image required for this edit type'
                }
              </p>
            </div>
          </div>
        )}

        {/* Attribution Display */}
        {attribution && (
          <div className="space-y-2">
            <Label className="text-sm">Image Attribution</Label>
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                {attribution.source === 'pexels' && attribution.photographer && (
                  <>Photo by {attribution.photographer} on Pexels</>
                )}
                {attribution.source === 'url' && (
                  <>Imported from URL</>
                )}
                {attribution.source === 'upload' && (
                  <>Uploaded image</>
                )}
                {attribution.source === 'saved' && (
                  <>From saved gallery</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Edit Button */}
        <Button
          onClick={handleEdit}
          disabled={!canEdit}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Editing...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Apply Edit
            </>
          )}
        </Button>

        {/* Cost Display */}
        <div className="p-3 bg-muted/50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credits Required:</span>
            <span className="font-medium">
              {editType ? 'Loading...' : 'Select edit type'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
