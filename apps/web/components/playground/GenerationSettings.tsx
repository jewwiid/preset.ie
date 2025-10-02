'use client'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Wand2, Sparkles } from 'lucide-react'
import AspectRatioSelector from '../../app/components/ui/AspectRatioSelector'

interface GenerationSettingsProps {
  intensity: number
  numImages: number
  aspectRatio: string
  resolution: string
  replaceLatestImages: boolean
  loading: boolean
  prompt: string
  userCredits: number
  totalCredits: number
  userSubscriptionTier: string
  enableCinematicMode: boolean
  cinematicAspectRatio?: string
  onIntensityChange: (intensity: number) => void
  onNumImagesChange: (numImages: number) => void
  onAspectRatioChange: (aspectRatio: string) => void
  onReplaceLatestImagesChange: (replace: boolean) => void
  onGenerate: () => void
  onShowAnalysis?: () => void
  onCustomDimensionsChange?: (width: number, height: number) => void
}

export function GenerationSettings({
  intensity,
  numImages,
  aspectRatio,
  resolution,
  replaceLatestImages,
  loading,
  prompt,
  userCredits,
  totalCredits,
  userSubscriptionTier,
  enableCinematicMode,
  cinematicAspectRatio,
  onIntensityChange,
  onNumImagesChange,
  onAspectRatioChange,
  onReplaceLatestImagesChange,
  onGenerate,
  onShowAnalysis,
  onCustomDimensionsChange
}: GenerationSettingsProps) {
  const effectiveResolution = userSubscriptionTier === 'FREE' ? '1024' : resolution

  return (
    <div className="space-y-4">
      {/* Intensity + Number of Images */}
      <div className="grid grid-cols-2 gap-4">
        {/* Style Intensity */}
        <div className="space-y-2">
          <Label htmlFor="intensity" className="text-sm">
            Intensity: {intensity}
          </Label>
          <Slider
            value={[intensity]}
            onValueChange={(value) => onIntensityChange(Array.isArray(value) ? value[0] : value)}
            min={0.1}
            max={2.0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.1</span>
            <span>1.0</span>
            <span>2.0</span>
          </div>
        </div>

        {/* Number of Images */}
        <div className="space-y-2">
          <Label className="text-sm">Images: {numImages}</Label>
          <Slider
            value={[numImages]}
            onValueChange={(value) => onNumImagesChange(Array.isArray(value) ? value[0] : value)}
            min={1}
            max={8}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>8</span>
          </div>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <Label className="text-sm">Aspect Ratio</Label>
        <AspectRatioSelector
          value={aspectRatio}
          onChange={onAspectRatioChange}
          resolution={effectiveResolution}
          onCustomDimensionsChange={onCustomDimensionsChange}
        />
      </div>

      {/* Cost Info + Settings */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Cost: {totalCredits} credits ({numImages} × {totalCredits / numImages})</span>
          <div className="flex items-center gap-2">
            <span>Aspect: {aspectRatio}</span>
            {enableCinematicMode && cinematicAspectRatio && cinematicAspectRatio !== aspectRatio && (
              <span className="text-primary-500" title="Aspect ratio mismatch">
                ⚠️ Sync
              </span>
            )}
          </div>
        </div>

        {/* Image Replacement Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="replace-images" className="text-xs text-muted-foreground">
            Replace latest images
          </Label>
          <Switch
            id="replace-images"
            checked={replaceLatestImages}
            onCheckedChange={onReplaceLatestImagesChange}
            className="scale-75"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Analysis Button */}
          {userSubscriptionTier !== 'FREE' && onShowAnalysis && (
            <Button
              onClick={onShowAnalysis}
              disabled={loading || !prompt || !prompt.trim()}
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-9"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Optimize
            </Button>
          )}

          {/* Generate Button */}
          <Button
            onClick={onGenerate}
            disabled={loading || !prompt?.trim() || userCredits < totalCredits}
            className={userSubscriptionTier !== 'FREE' && onShowAnalysis ? "flex-1" : "w-full"}
            size="sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-border mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3 mr-2" />
                Generate {numImages} Image{numImages > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
