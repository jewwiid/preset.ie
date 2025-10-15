/**
 * PaletteDisplay Component
 * Display extracted color palette with AI toggle
 */

'use client'

import { Palette, Sparkles, Loader2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useState } from 'react'

interface PaletteDisplayProps {
  palette: string[]
  loading: boolean
  useAI: boolean
  aiDescription?: string
  aiMood?: string
  onToggleAI: (useAI: boolean) => void
  onExtract: () => void
  disabled?: boolean
}

// Helper function to convert hex to different color formats
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

const hexToHsl = (hex: string) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  
  const { r, g, b } = rgb
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  let h = 0, s = 0, l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break
      case gNorm: h = (bNorm - rNorm) / d + 2; break
      case bNorm: h = (rNorm - gNorm) / d + 4; break
    }
    h /= 6
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export const PaletteDisplay = ({
  palette,
  loading,
  useAI,
  aiDescription,
  aiMood,
  onToggleAI,
  onExtract,
  disabled = false
}: PaletteDisplayProps) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = async (color: string, format: string) => {
    try {
      await navigator.clipboard.writeText(color)
      setCopiedColor(format)
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (err) {
      console.error('Failed to copy color:', err)
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Color Palette</h3>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={useAI}
              onCheckedChange={onToggleAI}
              disabled={loading || disabled}
            />
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Enhanced
            </label>
          </div>

          {/* Extract Button */}
          <Button
            type="button"
            size="sm"
            onClick={onExtract}
            disabled={loading || disabled}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Extracting...
              </>
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" />
                Extract
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Palette Colors */}
      {palette.length > 0 ? (
        <div className="space-y-3">
          {/* Color Swatches */}
          <div className="flex gap-2 flex-wrap">
            {palette.map((color, index) => {
              const rgb = hexToRgb(color)
              const hsl = hexToHsl(color)
              
              return (
                <HoverCard key={index}>
                  <HoverCardTrigger asChild>
                    <div className="flex-1 min-w-[60px] group cursor-pointer">
                      <div
                        className="h-20 rounded-lg shadow-md transition-transform hover:scale-105"
                        style={{ backgroundColor: color }}
                      />
                      <div className="mt-1 text-xs text-center text-muted-foreground font-mono">
                        {color}
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg shadow-md border-2 border-border"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <h4 className="font-semibold text-foreground">Color {index + 1}</h4>
                          <p className="text-sm text-muted-foreground">Click to copy any format</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">HEX</div>
                            <div 
                              className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => copyToClipboard(color, 'hex')}
                            >
                              <span className="font-mono">{color}</span>
                              {copiedColor === 'hex' ? (
                                <Check className="w-4 h-4 text-primary-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          
                          {rgb && (
                            <div className="space-y-1">
                              <div className="font-medium text-foreground">RGB</div>
                              <div 
                                className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors"
                                onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
                              >
                                <span className="font-mono text-xs">rgb({rgb.r}, {rgb.g}, {rgb.b})</span>
                                {copiedColor === 'rgb' ? (
                                  <Check className="w-4 h-4 text-primary-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {hsl && (
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">HSL</div>
                            <div 
                              className="flex items-center justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')}
                            >
                              <span className="font-mono text-xs">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span>
                              {copiedColor === 'hsl' ? (
                                <Check className="w-4 h-4 text-primary-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p>• Hue: {hsl?.h}°</p>
                        <p>• Saturation: {hsl?.s}%</p>
                        <p>• Lightness: {hsl?.l}%</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )
            })}
          </div>

          {/* AI Analysis */}
          {useAI && (aiDescription || aiMood) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
              {aiMood && (
                <div>
                  <p className="text-xs font-medium text-primary mb-1">Mood</p>
                  <p className="text-sm text-foreground">{aiMood}</p>
                </div>
              )}
              {aiDescription && (
                <div>
                  <p className="text-xs font-medium text-primary mb-1">Description</p>
                  <p className="text-sm text-foreground">{aiDescription}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Palette className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Add images and click Extract to generate a color palette
          </p>
        </div>
      )}

      {/* Info Text */}
      <div className="text-xs text-muted-foreground">
        {useAI ? (
          <p>AI-enhanced palette extraction uses advanced vision analysis to accurately identify the most dominant colors in your images.</p>
        ) : (
          <p>Standard palette extraction pulls dominant colors directly from your images.</p>
        )}
      </div>
    </div>
  )
}
