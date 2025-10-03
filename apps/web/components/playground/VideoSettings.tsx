'use client'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wand2, Settings } from 'lucide-react'

interface VideoSettingsProps {
  duration: number
  resolution: string
  aspectRatio: string
  motionType: string
  loading: boolean
  userCredits: number
  totalCredits: number
  onDurationChange: (duration: number) => void
  onResolutionChange: (resolution: string) => void
  onAspectRatioChange: (aspectRatio: string) => void
  onMotionTypeChange: (motionType: string) => void
  onGenerate: () => void
  hasImage: boolean
  selectedProvider?: 'seedream' | 'wan'
}

export function VideoSettings({
  duration,
  resolution,
  aspectRatio,
  motionType,
  loading,
  userCredits,
  totalCredits,
  onDurationChange,
  onResolutionChange,
  onAspectRatioChange,
  onMotionTypeChange,
  onGenerate,
  hasImage,
  selectedProvider = 'seedream'
}: VideoSettingsProps) {
  const calculateDimensions = (aspectRatio: string, resolution: string) => {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
    const aspectRatioValue = widthRatio / heightRatio

    let width: number, height: number

    if (resolution === '720p') {
      if (aspectRatioValue >= 1) {
        width = 1280
        height = Math.round(1280 / aspectRatioValue)
      } else {
        height = 720
        width = Math.round(720 * aspectRatioValue)
      }
    } else {
      if (aspectRatioValue >= 1) {
        width = 854
        height = Math.round(854 / aspectRatioValue)
      } else {
        height = 480
        width = Math.round(480 * aspectRatioValue)
      }
    }

    return { width, height }
  }

  return (
    <div className="space-y-4">
      {/* Duration & Motion Type */}
      <div className="grid grid-cols-2 gap-4">
        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm">
            Duration: {duration}s
          </Label>
          {selectedProvider === 'wan' ? (
            <Select value={duration.toString()} onValueChange={(value) => onDurationChange(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <>
              <Slider
                value={[duration]}
                onValueChange={(value) => onDurationChange(Array.isArray(value) ? value[0] : value)}
                min={5}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5s</span>
                <span>10s</span>
              </div>
            </>
          )}
          {selectedProvider === 'wan' && (
            <p className="text-xs text-muted-foreground">
              Wan supports 5s or 10s only
            </p>
          )}
        </div>

        {/* Motion Type */}
        <div className="space-y-2">
          <Label htmlFor="motionType" className="text-sm">
            Motion Type
          </Label>
          <Select value={motionType} onValueChange={onMotionTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subtle">Subtle Motion</SelectItem>
              <SelectItem value="moderate">Moderate Motion</SelectItem>
              <SelectItem value="dynamic">Dynamic Motion</SelectItem>
              <SelectItem value="camera_pan">Camera Pan</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Aspect Ratio & Resolution */}
      <div className="grid grid-cols-2 gap-4">
        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label htmlFor="aspectRatio" className="text-sm">
            <Settings className="h-4 w-4 inline mr-1" />
            Aspect Ratio
          </Label>
          <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
              <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
              <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
              <SelectItem value="4:3">4:3 (Traditional)</SelectItem>
              <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
              <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Target: {calculateDimensions(aspectRatio, resolution).width} × {calculateDimensions(aspectRatio, resolution).height}
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-2">
          <Label htmlFor="resolution" className="text-sm">
            Resolution
          </Label>
          <Select value={resolution} onValueChange={onResolutionChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="480p">480p (Standard)</SelectItem>
              <SelectItem value="720p">720p (HD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cost Info + Generate Button */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Cost: {totalCredits} credits</span>
          <span>Available: {userCredits} credits</span>
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={loading || !hasImage || userCredits < totalCredits}
          className="w-full"
          size="sm"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-border mr-2"></div>
              Generating Video...
            </>
          ) : (
            <>
              <Wand2 className="h-3 w-3 mr-2" />
              Generate Video ({totalCredits} credits)
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
