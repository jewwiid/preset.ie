'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CinematicParameters } from '../../../../packages/types/src/cinematic-parameters'

interface SavePresetDialogProps {
  isOpen: boolean
  onClose: () => void
  prompt: string
  enhancedPrompt: string
  userSubject: string
  style: string
  resolution: string
  aspectRatio: string
  consistencyLevel: string
  intensity: number
  numImages: number
  enableCinematicMode: boolean
  cinematicParameters: Partial<CinematicParameters>
  // Optional video-specific fields
  isVideoMode?: boolean
  videoPrompt?: string
  generationMode?: 'image' | 'video' | 'both'
}

export function SavePresetDialog({
  isOpen,
  onClose,
  prompt,
  enhancedPrompt,
  userSubject,
  style,
  resolution,
  aspectRatio,
  consistencyLevel,
  intensity,
  numImages,
  enableCinematicMode,
  cinematicParameters,
  isVideoMode = false,
  videoPrompt,
  generationMode = 'both'
}: SavePresetDialogProps) {
  const handleSave = () => {
    const finalPrompt = enableCinematicMode ? enhancedPrompt : prompt

    const queryParams = new URLSearchParams({
      name: userSubject ? `${style} ${userSubject}` : `${style} preset`,
      description: `Preset with ${style} style${userSubject ? ` for ${userSubject}` : ''}`,
      prompt_template: finalPrompt,
      generation_mode: generationMode,
      style: style,
      resolution: resolution,
      aspect_ratio: aspectRatio,
      consistency_level: consistencyLevel,
      intensity: intensity.toString(),
      num_images: numImages.toString(),
      is_public: 'false',
      ...(userSubject && { subject: userSubject }),
      ...(videoPrompt && { prompt_template_video: videoPrompt }),
      ...(enableCinematicMode && Object.keys(cinematicParameters).length > 0 ? {
        cinematic_parameters: JSON.stringify(cinematicParameters),
        enable_cinematic_mode: 'true'
      } : {})
    }).toString()

    window.location.href = `/presets/create?${queryParams}`
    onClose()
  }

  const displayPrompt = enableCinematicMode ? enhancedPrompt : prompt

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Preset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Save your current prompt, style, and parameters as a reusable preset.
          </p>
          <div className="space-y-2">
            <Label>Current Configuration</Label>
            <div className="text-sm space-y-1">
              <div>
                <strong>Prompt:</strong> {displayPrompt.substring(0, 100)}...
              </div>
              {userSubject && (
                <div>
                  <strong>Subject:</strong> {userSubject}
                </div>
              )}
              {style && (
                <div>
                  <strong>Style:</strong> {style}
                </div>
              )}
              {enableCinematicMode && Object.keys(cinematicParameters).length > 0 && (
                <div>
                  <strong>Cinematic Parameters:</strong> {Object.keys(cinematicParameters).length} active
                </div>
              )}
            </div>
          </div>
          <Button className="w-full" onClick={handleSave}>
            Continue to Save Preset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
