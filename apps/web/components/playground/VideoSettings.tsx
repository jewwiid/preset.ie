'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wand2, Settings } from 'lucide-react'

interface CameraMovement {
  id: string
  value: string
  label: string
  description: string
  category: string
  is_active: boolean
}

interface AspectRatio {
  id: string
  value: string
  label: string
  description: string
  category: string
  is_active: boolean
}

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
  const [cameraMovements, setCameraMovements] = useState<CameraMovement[]>([])
  const [loadingMovements, setLoadingMovements] = useState(true)
  const [aspectRatios, setAspectRatios] = useState<AspectRatio[]>([])
  const [loadingAspectRatios, setLoadingAspectRatios] = useState(true)

  useEffect(() => {
    const fetchCameraMovements = async () => {
      try {
        const response = await fetch('/api/cinematic-parameters?category=camera_movements')
        const data = await response.json()
        if (data.success && data.parameters) {
          setCameraMovements(data.parameters)
        }
      } catch (error) {
        console.error('Error fetching camera movements:', error)
      } finally {
        setLoadingMovements(false)
      }
    }

    fetchCameraMovements()
  }, [])

  useEffect(() => {
    const fetchAspectRatios = async () => {
      try {
        const response = await fetch('/api/cinematic-parameters?category=aspect_ratios')
        const data = await response.json()
        if (data.success && data.parameters) {
          setAspectRatios(data.parameters)
        }
      } catch (error) {
        console.error('Error fetching aspect ratios:', error)
      } finally {
        setLoadingAspectRatios(false)
      }
    }

    fetchAspectRatios()
  }, [])
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

        {/* Camera Movement */}
        <div className="space-y-2">
          <Label htmlFor="motionType" className="text-sm">
            Camera Movement
          </Label>
          <Select value={motionType} onValueChange={onMotionTypeChange} disabled={loadingMovements}>
            <SelectTrigger>
              <SelectValue placeholder={loadingMovements ? "Loading..." : "Select movement"} />
            </SelectTrigger>
            <SelectContent>
              {cameraMovements.map((movement) => (
                <SelectItem key={movement.id} value={movement.value} title={movement.description}>
                  {movement.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {motionType && cameraMovements.find(m => m.value === motionType)?.description && (
            <p className="text-xs text-muted-foreground">
              {cameraMovements.find(m => m.value === motionType)?.description}
            </p>
          )}
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
          <Select value={aspectRatio} onValueChange={onAspectRatioChange} disabled={loadingAspectRatios}>
            <SelectTrigger>
              <SelectValue placeholder={loadingAspectRatios ? "Loading..." : "Select aspect ratio"} />
            </SelectTrigger>
            <SelectContent>
              {aspectRatios.map((ratio) => (
                <SelectItem key={ratio.id} value={ratio.value} title={ratio.description}>
                  {ratio.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            {aspectRatio && aspectRatio.includes(':') ? (
              <>Target: {calculateDimensions(aspectRatio, resolution).width} × {calculateDimensions(aspectRatio, resolution).height}</>
            ) : (
              aspectRatios.find(r => r.value === aspectRatio)?.description || ''
            )}
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
