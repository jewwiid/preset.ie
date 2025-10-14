/**
 * PaletteDisplay Component
 * Display extracted color palette with AI toggle
 */

'use client'

import { Palette, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
            {palette.map((color, index) => (
              <div key={index} className="flex-1 min-w-[60px] group">
                <div
                  className="h-20 rounded-lg shadow-md cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: color }}
                  title={color}
                />
                <div className="mt-1 text-xs text-center text-muted-foreground font-mono">
                  {color}
                </div>
              </div>
            ))}
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
