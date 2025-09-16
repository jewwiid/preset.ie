'use client'

import { useState } from 'react'
import { Wand2, Users, Star, Edit, Trash2, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import StylePresetManager from './StylePresetManager'

interface StyleVariationsPanelProps {
  onGenerateStyleVariations: (params: {
    imageUrl: string
    styles: string[]
  }) => Promise<void>
  loading: boolean
  selectedImage: string | null
  sessionToken?: string
}

export default function StyleVariationsPanel({ 
  onGenerateStyleVariations,
  loading, 
  selectedImage,
  sessionToken
}: StyleVariationsPanelProps) {
  const [selectedStyles, setSelectedStyles] = useState(['photorealistic', 'artistic'])
  const [selectedStylePreset, setSelectedStylePreset] = useState<any>(null)

  const handleGenerateStyleVariations = async () => {
    if (!selectedImage) {
      return
    }
    
    // Use selected style preset if available, otherwise use selected styles
    const stylesToUse = selectedStylePreset ? [selectedStylePreset.style_type] : selectedStyles
    
    if (stylesToUse.length === 0) {
      return
    }
    
    await onGenerateStyleVariations({
      imageUrl: selectedImage,
      styles: stylesToUse
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          Style Variations
        </CardTitle>
        <CardDescription>
          Apply different artistic styles to your images using presets or custom selections
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Style Preset Manager */}
        <div>
          <StylePresetManager
            onSelectPreset={setSelectedStylePreset}
            selectedPreset={selectedStylePreset}
            sessionToken={sessionToken}
          />
        </div>

        {/* Style Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Select Styles</Label>
          <div className="grid grid-cols-2 gap-3">
            {['photorealistic', 'artistic', 'cartoon', 'vintage', 'cyberpunk', 'watercolor'].map(style => (
              <div key={style} className="flex items-center space-x-2">
                <Checkbox
                  id={style}
                  checked={selectedStyles.includes(style)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStyles([...selectedStyles, style])
                    } else {
                      setSelectedStyles(selectedStyles.filter(s => s !== style))
                    }
                  }}
                />
                <Label 
                  htmlFor={style} 
                  className="text-sm font-normal cursor-pointer capitalize"
                >
                  {style}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleGenerateStyleVariations}
          disabled={loading || !selectedImage || (selectedStyles.length === 0 && !selectedStylePreset)}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Styles ({(selectedStylePreset ? 1 : selectedStyles.length) * 2} credits)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
