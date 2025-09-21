'use client'

import { useState } from 'react'
import { Monitor, Smartphone, Tablet, Camera, Film, Square, Maximize2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AspectRatioSelectorProps {
  value: string
  onChange: (aspectRatio: string) => void
  resolution: string
  onCustomDimensionsChange?: (width: number, height: number) => void
  className?: string
}

interface AspectRatioOption {
  id: string
  name: string
  ratio: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  category: 'common' | 'social' | 'video' | 'custom'
  dimensions?: { width: number; height: number }
}

const aspectRatioOptions: AspectRatioOption[] = [
  // Common ratios
  {
    id: '1:1',
    name: 'Square',
    ratio: '1:1',
    icon: Square,
    description: 'Perfect square',
    category: 'common',
    dimensions: { width: 1024, height: 1024 }
  },
  {
    id: '4:3',
    name: 'Standard',
    ratio: '4:3',
    icon: Monitor,
    description: 'Traditional photo',
    category: 'common',
    dimensions: { width: 1024, height: 768 }
  },
  {
    id: '3:4',
    name: 'Portrait',
    ratio: '3:4',
    icon: Monitor,
    description: 'Vertical standard',
    category: 'common',
    dimensions: { width: 768, height: 1024 }
  },
  {
    id: '16:9',
    name: 'Widescreen',
    ratio: '16:9',
    icon: Monitor,
    description: 'HD landscape',
    category: 'common',
    dimensions: { width: 1024, height: 576 }
  },
  
  // Social media ratios
  {
    id: '9:16',
    name: 'Vertical',
    ratio: '9:16',
    icon: Smartphone,
    description: 'Mobile portrait',
    category: 'social',
    dimensions: { width: 576, height: 1024 }
  },
  {
    id: '3:2',
    name: 'Instagram',
    ratio: '3:2',
    icon: Camera,
    description: 'Instagram feed',
    category: 'social',
    dimensions: { width: 1024, height: 683 }
  },
  {
    id: '9:16-story',
    name: 'Instagram Story',
    ratio: '9:16',
    icon: Smartphone,
    description: 'Instagram stories',
    category: 'social',
    dimensions: { width: 576, height: 1024 }
  },
  
  // Video ratios
  {
    id: '21:9',
    name: 'Ultrawide',
    ratio: '21:9',
    icon: Maximize2,
    description: 'Cinematic',
    category: 'video',
    dimensions: { width: 1024, height: 439 }
  },
  {
    id: '16:10',
    name: 'Widescreen',
    ratio: '16:10',
    icon: Monitor,
    description: 'Computer screen',
    category: 'video',
    dimensions: { width: 1024, height: 640 }
  },
  {
    id: '5:4',
    name: 'Large Format',
    ratio: '5:4',
    icon: Camera,
    description: 'Large format camera',
    category: 'video',
    dimensions: { width: 1024, height: 819 }
  }
]

export default function AspectRatioSelector({
  value,
  onChange,
  resolution,
  onCustomDimensionsChange,
  className = ''
}: AspectRatioSelectorProps) {
  const [customWidth, setCustomWidth] = useState(1024)
  const [customHeight, setCustomHeight] = useState(1024)
  const [activeCategory, setActiveCategory] = useState<'common' | 'social' | 'video' | 'custom'>('common')

  const selectedOption = aspectRatioOptions.find(option => option.ratio === value)
  const baseResolution = parseInt(resolution)

  const calculateDimensions = (ratio: string, baseRes: number) => {
    const [widthRatio, heightRatio] = ratio.split(':').map(Number)
    const aspectRatioValue = widthRatio / heightRatio
    
    let width: number, height: number
    
    if (aspectRatioValue >= 1) {
      // Landscape or square
      width = baseRes
      height = Math.round(baseRes / aspectRatioValue)
    } else {
      // Portrait
      height = baseRes
      width = Math.round(baseRes * aspectRatioValue)
    }
    
    return { width, height }
  }

  const handleAspectRatioChange = (ratio: string) => {
    onChange(ratio)
    
    // Calculate and notify custom dimensions
    const dimensions = calculateDimensions(ratio, baseResolution)
    onCustomDimensionsChange?.(dimensions.width, dimensions.height)
  }

  const handleCustomDimensionsChange = () => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(customWidth, customHeight)
    const ratioWidth = customWidth / divisor
    const ratioHeight = customHeight / divisor
    const customRatio = `${ratioWidth}:${ratioHeight}`
    
    onChange(customRatio)
    onCustomDimensionsChange?.(customWidth, customHeight)
  }

  const getCategoryOptions = (category: string) => {
    return aspectRatioOptions.filter(option => option.category === category)
  }

  const currentDimensions = selectedOption 
    ? calculateDimensions(selectedOption.ratio, baseResolution)
    : { width: customWidth, height: customHeight }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>Aspect Ratio</Label>
        
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="common" className="text-xs">Common</TabsTrigger>
            <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
            <TabsTrigger value="video" className="text-xs">Video</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="common" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {getCategoryOptions('common').map((option) => {
                const IconComponent = option.icon
                const isSelected = value === option.ratio
                const dimensions = calculateDimensions(option.ratio, baseResolution)
                
                return (
                  <Card 
                    key={option.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'
                    }`}
                    onClick={() => handleAspectRatioChange(option.ratio)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{option.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{option.description}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {option.ratio}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dimensions.width}×{dimensions.height}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {getCategoryOptions('social').map((option) => {
                const IconComponent = option.icon
                const isSelected = value === option.ratio
                const dimensions = calculateDimensions(option.ratio, baseResolution)
                
                return (
                  <Card 
                    key={option.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'
                    }`}
                    onClick={() => handleAspectRatioChange(option.ratio)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{option.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{option.description}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {option.ratio}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dimensions.width}×{dimensions.height}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="video" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {getCategoryOptions('video').map((option) => {
                const IconComponent = option.icon
                const isSelected = value === option.ratio
                const dimensions = calculateDimensions(option.ratio, baseResolution)
                
                return (
                  <Card 
                    key={option.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'
                    }`}
                    onClick={() => handleAspectRatioChange(option.ratio)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{option.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{option.description}</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {option.ratio}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {dimensions.width}×{dimensions.height}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="custom-width">Width</Label>
                  <Input
                    id="custom-width"
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1024)}
                    min="256"
                    max="4096"
                    step="64"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-height">Height</Label>
                  <Input
                    id="custom-height"
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1024)}
                    min="256"
                    max="4096"
                    step="64"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleCustomDimensionsChange}
                className="w-full"
                variant="outline"
              >
                Apply Custom Dimensions
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                Custom: {customWidth}×{customHeight} pixels
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  )
}
