'use client'

import { Camera, Lightbulb, Palette, Film, Eye } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'

interface CinematicMetadata {
  ai_metadata?: {
    cameraAngle?: string
    lensType?: string
    shotSize?: string
    depthOfField?: string
    compositionTechnique?: string
    lightingStyle?: string
    colorPalette?: string
    directorStyle?: string
    eraEmulation?: string
    sceneMood?: string
    cameraMovement?: string
    aspectRatio?: string
    timeSetting?: string
    weatherCondition?: string
    locationType?: string
    additionalDetails?: string
    aiProvider?: string
    generationCost?: number
    generatedAt?: string
  }
  generation_metadata?: {
    cinematic_parameters?: {
      cameraAngle?: string
      lensType?: string
      shotSize?: string
      depthOfField?: string
      compositionTechnique?: string
      lightingStyle?: string
      colorPalette?: string
      directorStyle?: string
      eraEmulation?: string
      sceneMood?: string
      cameraMovement?: string
      aspectRatio?: string
      timeSetting?: string
      weatherCondition?: string
      locationType?: string
    }
    prompt?: string
    enhanced_prompt?: string
    style_prompt?: string
    provider?: string
    credits_used?: number
    generated_at?: string
    base_image?: string
    resolution?: string
    aspect_ratio?: string
  }
  cinematic_tags?: string[]
}

interface CinematicMetadataDisplayProps {
  metadata: CinematicMetadata | null
  compact?: boolean
  showAll?: boolean
}

export default function CinematicMetadataDisplay({ 
  metadata, 
  compact = false, 
  showAll = false 
}: CinematicMetadataDisplayProps) {
  // Check both possible data paths
  const aiMetadata = metadata?.ai_metadata || metadata?.generation_metadata?.cinematic_parameters
  
  if (!aiMetadata) {
    return null
  }
  const formatLabel = (value: string) => {
    return value.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getIconForParameter = (param: string) => {
    switch (param) {
      case 'cameraAngle':
      case 'lensType':
      case 'shotSize':
      case 'cameraMovement':
        return <Camera className="h-3 w-3" />
      case 'lightingStyle':
        return <Lightbulb className="h-3 w-3" />
      case 'colorPalette':
        return <Palette className="h-3 w-3" />
      case 'directorStyle':
      case 'eraEmulation':
        return <Film className="h-3 w-3" />
      default:
        return <Eye className="h-3 w-3" />
    }
  }

  const getColorForParameter = (param: string) => {
    switch (param) {
      case 'cameraAngle':
      case 'lensType':
      case 'shotSize':
      case 'cameraMovement':
        return 'bg-primary-100 text-primary-800 border-primary-200'
      case 'lightingStyle':
        return 'bg-primary-100 text-primary-800 border-primary-200'
      case 'colorPalette':
        return 'bg-primary-100 text-primary-800 border-primary-200'
      case 'directorStyle':
      case 'eraEmulation':
        return 'bg-primary-100 text-primary-800 border-primary/20'
      case 'sceneMood':
        return 'bg-primary-100 text-primary-800 border-primary/20'
      default:
        return 'bg-muted-100 text-muted-foreground-800 border-border-200'
    }
  }

  // Priority parameters to show in compact mode
  const priorityParams = [
    'directorStyle',
    'cameraAngle', 
    'lightingStyle',
    'colorPalette',
    'sceneMood'
  ]

  const allParams = [
    'cameraAngle',
    'lensType', 
    'shotSize',
    'depthOfField',
    'compositionTechnique',
    'lightingStyle',
    'colorPalette',
    'directorStyle',
    'eraEmulation',
    'sceneMood',
    'cameraMovement',
    'aspectRatio',
    'timeSetting',
    'weatherCondition',
    'locationType'
  ]

  const paramsToShow = compact ? priorityParams : (showAll ? allParams : priorityParams)

  const activeParams = paramsToShow.filter(param => aiMetadata[param as keyof typeof aiMetadata])

  if (activeParams.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {activeParams.slice(0, 3).map(param => {
          const value = aiMetadata[param as keyof typeof aiMetadata] as string
          return (
            <Badge 
              key={param}
              variant="outline" 
              className={`text-xs ${getColorForParameter(param)}`}
            >
              {getIconForParameter(param)}
              <span className="ml-1">{formatLabel(value)}</span>
            </Badge>
          )
        })}
        {activeParams.length > 3 && (
          <Badge variant="outline" className="text-xs bg-muted-100 text-muted-foreground-600">
            +{activeParams.length - 3} more
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className="mt-3">
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <Film className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-muted-foreground-700">Cinematic Parameters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeParams.map(param => {
              const value = aiMetadata[param as keyof typeof aiMetadata] as string
              return (
                <div key={param} className="flex items-center space-x-2">
                  <div className={`p-1 rounded ${getColorForParameter(param)}`}>
                    {getIconForParameter(param)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground-500 capitalize">
                      {param.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-xs font-medium ml-1">
                      {formatLabel(value)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Technical Details */}
          {(metadata.generation_metadata?.provider || metadata.generation_metadata?.credits_used || (aiMetadata as any).aiProvider || (aiMetadata as any).generationCost) && (
            <div className="pt-2 mt-2 border-t border-border-200">
              <div className="flex items-center justify-between text-xs text-muted-foreground-500">
                {(metadata.generation_metadata?.provider || (aiMetadata as any).aiProvider) && (
                  <span>AI: {metadata.generation_metadata?.provider || (aiMetadata as any).aiProvider}</span>
                )}
                {(metadata.generation_metadata?.credits_used || (aiMetadata as any).generationCost) && (
                  <span>Cost: {metadata.generation_metadata?.credits_used || (aiMetadata as any).generationCost} credits</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
