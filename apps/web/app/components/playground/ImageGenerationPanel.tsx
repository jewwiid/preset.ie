'use client'

import { useState, useEffect } from 'react'
import { Wand2, Star, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { useAuth } from '../../../lib/auth-context'

interface StylePreset {
  id: string
  name: string
  description?: string
  style_type: string
  prompt_template: string
  intensity: number
  usage_count: number
  is_public: boolean
}

interface ImageGenerationPanelProps {
  onGenerate: (params: {
    prompt: string
    style: string
    aspectRatio: string
    resolution: string
    consistencyLevel: string
    customStylePreset?: StylePreset
  }) => Promise<void>
  loading: boolean
  userCredits: number
}

export default function ImageGenerationPanel({ 
  onGenerate, 
  loading, 
  userCredits 
}: ImageGenerationPanelProps) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('1024*1024')
  const [consistencyLevel, setConsistencyLevel] = useState('high')
  const [stylePresets, setStylePresets] = useState<StylePreset[]>([])
  const [selectedCustomPreset, setSelectedCustomPreset] = useState<StylePreset | null>(null)
  const [showCustomStyles, setShowCustomStyles] = useState(false)

  useEffect(() => {
    if (user && session?.access_token) {
      fetchStylePresets()
    }
  }, [user, session])

  const fetchStylePresets = async () => {
    try {
      const response = await fetch('/api/playground/style-presets?includePublic=true', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      if (response.ok) {
        const { presets } = await response.json()
        setStylePresets(presets || [])
      }
    } catch (error) {
      console.error('Failed to fetch style presets:', error)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return
    }
    
    await onGenerate({
      prompt,
      style: selectedCustomPreset ? selectedCustomPreset.style_type : style,
      aspectRatio,
      resolution,
      consistencyLevel,
      customStylePreset: selectedCustomPreset || undefined
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          Generate Images
        </CardTitle>
        <CardDescription>
          Create AI-generated images from text descriptions
        </CardDescription>
        {style && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Style: {selectedCustomPreset ? 
                `🎨 ${selectedCustomPreset.name}` :
                style === 'realistic' ? '📸 Realistic' : 
                style === 'artistic' ? '🎨 Artistic' :
                style === 'cartoon' ? '🎭 Cartoon' :
                style === 'anime' ? '🌸 Anime' :
                style === 'fantasy' ? '✨ Fantasy' : style}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="style">Style</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCustomStyles(!showCustomStyles)}
                className="text-xs"
              >
                {showCustomStyles ? 'Hide' : 'Show'} Custom
              </Button>
            </div>
            
            {!showCustomStyles ? (
              <Select value={style} onValueChange={(value) => {
                setStyle(value)
                setSelectedCustomPreset(null)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">📸 Realistic</SelectItem>
                  <SelectItem value="artistic">🎨 Artistic</SelectItem>
                  <SelectItem value="cartoon">🎭 Cartoon</SelectItem>
                  <SelectItem value="anime">🌸 Anime</SelectItem>
                  <SelectItem value="fantasy">✨ Fantasy</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <Select 
                  value={selectedCustomPreset?.id || ''} 
                  onValueChange={(value) => {
                    const preset = stylePresets.find(p => p.id === value)
                    setSelectedCustomPreset(preset || null)
                    if (preset) {
                      setStyle(preset.style_type)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select custom style preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {stylePresets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        <div className="flex items-center space-x-2">
                          <span>{preset.name}</span>
                          {preset.is_public && <Users className="h-3 w-3 text-blue-500" />}
                          <Badge variant="outline" className="text-xs">
                            {preset.style_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedCustomPreset && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800 font-medium">{selectedCustomPreset.name}</p>
                    <p className="text-xs text-blue-600">{selectedCustomPreset.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-blue-600">{selectedCustomPreset.usage_count} uses</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution</Label>
            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger>
                <SelectValue placeholder="Select resolution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024*1024">1024×1024</SelectItem>
                <SelectItem value="2048*2048">2048×2048</SelectItem>
                <SelectItem value="1024*2048">1024×2048</SelectItem>
                <SelectItem value="2048*1024">2048×1024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="consistency">Consistency Level</Label>
          <Select value={consistencyLevel} onValueChange={setConsistencyLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select consistency level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">🎲 Low (More Variation)</SelectItem>
              <SelectItem value="medium">⚖️ Medium</SelectItem>
              <SelectItem value="high">🎯 High (Less Variation)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600">
            {consistencyLevel === 'low' && 'More creative variation, less predictable results'}
            {consistencyLevel === 'medium' && 'Balanced creativity and consistency'}
            {consistencyLevel === 'high' && 'More consistent results, less variation'}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex items-center justify-between w-full">
          <Badge variant="secondary" className="text-xs">
            Credits: {userCredits}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Cost: 2 credits
          </Badge>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim() || userCredits < 2}
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
              Generate (2 credits)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
