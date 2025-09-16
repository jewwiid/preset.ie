'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

interface SequentialGenerationPanelProps {
  onGenerateSequential: (params: {
    prompt: string
    numImages: number
    style: string
    resolution: string
    consistencyLevel: string
  }) => Promise<void>
  onGenerateSequentialEdits: (params: {
    prompt: string
    images: string[]
    numImages: number
    resolution: string
  }) => Promise<void>
  loading: boolean
  selectedImage: string | null
  currentPrompt: string
}

export default function SequentialGenerationPanel({ 
  onGenerateSequential,
  onGenerateSequentialEdits,
  loading, 
  selectedImage,
  currentPrompt
}: SequentialGenerationPanelProps) {
  const [numSequentialImages, setNumSequentialImages] = useState(4)
  const [consistencyLevel, setConsistencyLevel] = useState('high')

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          Sequential Generation
        </CardTitle>
        <CardDescription>
          Generate multiple images with consistent characters and objects
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sequential Image Generation */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Generate Multiple Images</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Number of Images: {numSequentialImages}</Label>
              <Slider
                value={[numSequentialImages]}
                onValueChange={(value) => setNumSequentialImages(Array.isArray(value) ? value[0] : value)}
                min={2}
                max={8}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="consistency">Consistency Level</Label>
              <Select value={consistencyLevel} onValueChange={setConsistencyLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select consistency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (More Variation)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High (Less Variation)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sequential Editing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sequential Editing</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Number of Variations: {numSequentialImages}</Label>
              <Slider
                value={[numSequentialImages]}
                onValueChange={(value) => setNumSequentialImages(Array.isArray(value) ? value[0] : value)}
                min={2}
                max={6}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <Badge variant="outline" className="text-xs">
            Sequential: {numSequentialImages * 3} credits
          </Badge>
          <Badge variant="outline" className="text-xs">
            Editing: {numSequentialImages * 4} credits
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-2 w-full">
          <Button
            onClick={() => onGenerateSequential({
              prompt: currentPrompt,
              numImages: numSequentialImages,
              style: 'realistic',
              resolution: '1024*1024',
              consistencyLevel
            })}
            disabled={loading || !currentPrompt.trim()}
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
                Generate Sequential ({numSequentialImages * 3} credits)
              </>
            )}
          </Button>

          <Button
            onClick={() => onGenerateSequentialEdits({
              prompt: currentPrompt,
              images: selectedImage ? [selectedImage] : [],
              numImages: numSequentialImages,
              resolution: '1024*1024'
            })}
            disabled={loading || !selectedImage || !currentPrompt.trim()}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Editing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Edit Sequential ({numSequentialImages * 4} credits)
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
