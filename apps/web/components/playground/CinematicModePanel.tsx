'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Film } from 'lucide-react'
import CinematicParameterSelector from '../../app/components/cinematic/CinematicParameterSelector'
import { CinematicParameters } from '../../../../packages/types/src/cinematic-parameters'

interface CinematicModePanelProps {
  enableCinematicMode: boolean
  cinematicParameters: Partial<CinematicParameters>
  showCinematicPreview: boolean
  includeTechnicalDetails: boolean
  includeStyleReferences: boolean
  enhancedPrompt: string
  onToggleCinematicMode: (enabled: boolean) => void
  onCinematicParametersChange: (params: Partial<CinematicParameters>) => void
  onTogglePreview: () => void
  onToggleChange: (technicalDetails: boolean, styleReferences: boolean) => void
  onRegenerate: () => void
}

export function CinematicModePanel({
  enableCinematicMode,
  cinematicParameters,
  showCinematicPreview,
  includeTechnicalDetails,
  includeStyleReferences,
  enhancedPrompt,
  onToggleCinematicMode,
  onCinematicParametersChange,
  onTogglePreview,
  onToggleChange,
  onRegenerate
}: CinematicModePanelProps) {
  return (
    <div className="space-y-4">
      {/* Cinematic Mode Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          <Label htmlFor="cinematic-mode" className="text-sm font-medium cursor-pointer">
            Cinematic Mode
          </Label>
        </div>
        <Switch
          id="cinematic-mode"
          checked={enableCinematicMode}
          onCheckedChange={onToggleCinematicMode}
        />
      </div>

      {/* Cinematic Parameters */}
      {enableCinematicMode && (
        <div className="space-y-4">
          <CinematicParameterSelector
            parameters={cinematicParameters}
            onParametersChange={onCinematicParametersChange}
            onToggleChange={onToggleChange}
            compact={false}
            showAdvanced={true}
          />

          {/* Preview & Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
            >
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onTogglePreview}
            >
              {showCinematicPreview ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {/* Preview Details */}
          {showCinematicPreview && (
            <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-2 text-xs">
              <div className="text-xs text-muted-foreground">
                <strong>Enhanced:</strong> {enhancedPrompt}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Active Parameters:</strong> {Object.values(cinematicParameters).filter(v => v !== undefined).length}
              </div>
              <div className="flex gap-2">
                <span className={includeTechnicalDetails ? 'text-primary' : 'text-muted-foreground'}>
                  {includeTechnicalDetails ? '✓' : '○'} Technical Details
                </span>
                <span className={includeStyleReferences ? 'text-primary' : 'text-muted-foreground'}>
                  {includeStyleReferences ? '✓' : '○'} Style References
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
