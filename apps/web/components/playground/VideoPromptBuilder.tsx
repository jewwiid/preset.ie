'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Wand2, Sparkles, Trash2 } from 'lucide-react'

interface VideoPromptBuilderProps {
  prompt: string
  enhancedPrompt?: string
  enableCinematicMode: boolean
  isEnhancing?: boolean
  onPromptChange: (prompt: string) => void
  onEnhancedPromptChange?: (prompt: string) => void
  onAIEnhance?: () => void
  onClearAll?: () => void
  maxLength?: number
  style?: string
}

export function VideoPromptBuilder({
  prompt,
  enhancedPrompt,
  enableCinematicMode,
  isEnhancing = false,
  onPromptChange,
  onEnhancedPromptChange,
  onAIEnhance,
  onClearAll,
  maxLength = 2000,
  style
}: VideoPromptBuilderProps) {
  return (
    <div className="space-y-3">
      {/* Style Display */}
      {style && (
        <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-md">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">Style: {style}</span>
        </div>
      )}

      {/* Video Prompt */}
      <div>
        <Label htmlFor="videoPrompt" className="text-sm">
          Video Prompt (Optional)
        </Label>
        <Textarea
          id="videoPrompt"
          value={enableCinematicMode && enhancedPrompt ? enhancedPrompt : prompt}
          onChange={(e) => {
            if (enableCinematicMode && onEnhancedPromptChange) {
              onEnhancedPromptChange(e.target.value)
            } else {
              onPromptChange(e.target.value)
            }
          }}
          placeholder="Describe the motion, camera movement, or action you want in the video. For example: 'Gentle zoom in on the subject, camera slowly rotates around the scene'"
          className="resize-none"
          rows={4}
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
          <span>
            {enableCinematicMode && enhancedPrompt ? enhancedPrompt.length : prompt.length}/{maxLength} characters
          </span>
          <span className="text-right">Leave empty for default motion</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onAIEnhance && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAIEnhance}
            disabled={isEnhancing || (!prompt.trim() && !enableCinematicMode)}
          >
            {isEnhancing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-2" />
                AI Enhance
              </>
            )}
          </Button>
        )}
        {onClearAll && (
          <Button variant="outline" size="sm" onClick={onClearAll}>
            <Trash2 className="h-3 w-3 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Tips */}
      <div className="p-2 bg-muted/30 border border-border rounded-md">
        <p className="text-xs text-muted-foreground">
          <strong>💡 Tips:</strong> Describe motion, camera movement, or actions. Examples: "Gentle zoom in", "Camera rotates around subject", "Slow pan left", "Dramatic zoom out"
        </p>
      </div>

      {/* Enhanced Prompt Label */}
      {enableCinematicMode && enhancedPrompt && (
        <div className="text-xs text-primary">
          <Wand2 className="h-3 w-3 inline mr-1" />
          Editing enhanced prompt (generated with cinematic parameters)
        </div>
      )}
    </div>
  )
}
