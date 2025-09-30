'use client'

import { useState } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { PresetVisualAid, PresetVisualAidGrid, PresetVisualAidModal } from './PresetVisualAid'
import { Settings, Wand2, Eye, EyeOff } from 'lucide-react'

interface CinematicParametersProps {
  enableCinematicMode?: boolean
  cinematicParameters?: any
  includeTechnicalDetails?: boolean
  includeStyleReferences?: boolean
  onParameterChange?: (parameters: any) => void
  onToggleCinematicMode?: (enabled: boolean) => void
  onToggleTechnicalDetails?: (enabled: boolean) => void
  onToggleStyleReferences?: (enabled: boolean) => void
}

// Define the cinematic parameter options based on your image
const CINEMATIC_PARAMETERS = [
  { key: 'portrait', name: 'Portrait', description: 'Professional portrait photography style' },
  { key: 'landscape', name: 'Landscape', description: 'Stunning landscape photography style' },
  { key: 'cinematic', name: 'Cinematic', description: 'Movie-like cinematic style' },
  { key: 'fashion', name: 'Fashion', description: 'High-end fashion photography style' },
  { key: 'street', name: 'Street', description: 'Urban street photography style' },
  { key: 'commercial', name: 'Commercial', description: 'Professional commercial photography' },
  { key: 'artistic', name: 'Artistic', description: 'Creative artistic photography style' },
  { key: 'documentary', name: 'Documentary', description: 'Documentary photography style' },
  { key: 'nature', name: 'Nature', description: 'Nature and wildlife photography' },
  { key: 'urban', name: 'Urban', description: 'Urban environment photography' }
]

export default function CinematicParametersWithVisualAids({
  enableCinematicMode = false,
  cinematicParameters = {},
  includeTechnicalDetails = true,
  includeStyleReferences = true,
  onParameterChange,
  onToggleCinematicMode,
  onToggleTechnicalDetails,
  onToggleStyleReferences
}: CinematicParametersProps) {
  const [showVisualAids, setShowVisualAids] = useState(true)
  const [selectedPresetModal, setSelectedPresetModal] = useState<string | null>(null)

  const handleParameterSelect = (presetKey: string) => {
    const newParameters = {
      ...cinematicParameters,
      [presetKey]: !cinematicParameters[presetKey] // Toggle the parameter
    }
    onParameterChange?.(newParameters)
  }

  const handleClearAll = () => {
    onParameterChange?.({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <span className="font-medium text-lg">Cinematic Parameters</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVisualAids(!showVisualAids)}
            className="flex items-center space-x-1"
          >
            {showVisualAids ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="text-sm">
              {showVisualAids ? 'Hide' : 'Show'} Examples
            </span>
          </Button>
        </div>
      </div>

      {/* Toggle Switches */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Technical Details</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={includeTechnicalDetails}
              onChange={(e) => onToggleTechnicalDetails?.(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Wand2 className="h-4 w-4" />
            <span className="text-sm font-medium">Style References</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={includeStyleReferences}
              onChange={(e) => onToggleStyleReferences?.(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      {/* Visual Aids Grid */}
      {showVisualAids && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Style Examples
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PresetVisualAidGrid
              visualAids={[]}
              parameterType="cinematic"
            />
          </CardContent>
        </Card>
      )}

      {/* Parameter Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {CINEMATIC_PARAMETERS.map((param) => (
          <div key={param.key} className="relative">
            <Button
              variant={cinematicParameters[param.key] ? "default" : "outline"}
              size="sm"
              className={`w-full h-auto p-3 flex flex-col items-center space-y-2 ${
                cinematicParameters[param.key] 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => handleParameterSelect(param.key)}
            >
              {/* Visual Aid Preview */}
              {showVisualAids && (
                <PresetVisualAid
                  imageUrl="/placeholder-image.jpg"
                  altText={param.name}
                  description={param.description}
                  parameterType="cinematic"
                  parameterValue={param.key}
                />
              )}
              
              <span className="text-xs font-medium">{param.name}</span>
            </Button>
            
            {/* Click to view larger example */}
            {showVisualAids && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPresetModal(param.key)
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Clear All Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear All Parameters
        </Button>
      </div>

      {/* Visual Aid Modals */}
      {selectedPresetModal && (
        <PresetVisualAidModal
          imageUrl="/placeholder-image.jpg"
          altText={CINEMATIC_PARAMETERS.find(p => p.key === selectedPresetModal)?.name || ''}
          description={CINEMATIC_PARAMETERS.find(p => p.key === selectedPresetModal)?.description || ''}
          parameterType="cinematic"
          parameterValue={selectedPresetModal}
          onClose={() => setSelectedPresetModal(null)}
        />
      )}
    </div>
  )
}
