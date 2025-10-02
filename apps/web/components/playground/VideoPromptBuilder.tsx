'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Wand2, Sparkles, Trash2, X, Loader2 } from 'lucide-react'

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
  const currentPrompt = enableCinematicMode ? enhancedPrompt : prompt

  return (
    <div className="space-y-4">
      {/* Style Display */}
      {style && (
        <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-md">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">Style: {style}</span>
        </div>
      )}

      {/* Prompt Preview (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="promptPreview" className="text-sm">
          Prompt {enableCinematicMode && (
            <span className="text-xs text-muted-foreground ml-1">
              (Generated - edit below to customize)
            </span>
          )}
        </Label>
        <div className="text-sm bg-muted/30 border border-border rounded-md p-3 min-h-[60px]">
          <div className="whitespace-pre-wrap break-words">
            {currentPrompt ? (
              <span className="text-foreground/70">{currentPrompt}</span>
            ) : (
              <span className="text-muted-foreground italic">
                Prompt will be generated based on your selections...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editable Enhanced Prompt */}
      <div className="space-y-2">
        <Label htmlFor="videoPrompt" className="text-sm font-medium">
          Enhanced Prompt (Editable)
          <span className="text-xs text-muted-foreground ml-2">
            Edit this prompt to customize motion and camera work
          </span>
        </Label>
        <Textarea
          id="videoPrompt"
          value={currentPrompt || ''}
          onChange={(e) => {
            if (enableCinematicMode && onEnhancedPromptChange) {
              onEnhancedPromptChange(e.target.value)
            } else {
              onPromptChange(e.target.value)
            }
          }}
          placeholder="Describe the motion, camera movement, or action you want in the video. For example: 'Gentle zoom in on the subject, camera slowly rotates around the scene'"
          className="resize-none text-sm"
          rows={3}
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
          <span>
            {currentPrompt?.length || 0}/{maxLength} characters
          </span>
          <span className="text-right">Leave empty for default motion</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {onAIEnhance && (
          <Button
            variant="default"
            size="sm"
            onClick={onAIEnhance}
            disabled={isEnhancing || !prompt.trim()}
            className="flex items-center gap-1"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                AI Enhance
              </>
            )}
          </Button>
        )}
        {onClearAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={!prompt}
            className="flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  )
}
