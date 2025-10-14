'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { X, Sparkles, Loader2 } from 'lucide-react'
import VoiceToTextButton from '@/components/ui/VoiceToTextButton'

interface PromptBuilderProps {
  userSubject: string
  prompt: string
  enhancedPrompt: string
  enableCinematicMode: boolean
  isEnhancing: boolean
  isPromptModified: boolean
  isUserTypingSubject: boolean
  isSubjectUpdating: boolean
  generationMode: 'text-to-image' | 'image-to-image'
  currentPreset: any
  userSubscriptionTier?: string
  onUserSubjectChange: (subject: string) => void
  onPromptChange: (prompt: string) => void
  onAIEnhance: () => void
  onClearAll: () => void
  onSavePreset: () => void
  onStartTypingSubject: () => void
  onStopTypingSubject: () => void
}

export function PromptBuilder({
  userSubject,
  prompt,
  enhancedPrompt,
  enableCinematicMode,
  isEnhancing,
  isPromptModified,
  isUserTypingSubject,
  isSubjectUpdating,
  generationMode,
  currentPreset,
  userSubscriptionTier = 'FREE',
  onUserSubjectChange,
  onPromptChange,
  onAIEnhance,
  onClearAll,
  onSavePreset,
  onStartTypingSubject,
  onStopTypingSubject
}: PromptBuilderProps) {
  const currentPrompt = enableCinematicMode ? enhancedPrompt : prompt

  return (
    <div className="space-y-4">
      {/* Subject Input */}
      {generationMode === 'text-to-image' && (
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm">
            What do you want to create?
          </Label>
          <Input
            id="subject"
            value={userSubject}
            onChange={(e) => {
              onUserSubjectChange(e.target.value)
              onStartTypingSubject()
              setTimeout(onStopTypingSubject, 1000)
            }}
            placeholder="e.g., portrait of a person, mountain landscape, product shot, character design..."
            className="text-sm"
          />
          {isUserTypingSubject && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              Typing... (will update when you pause)
            </div>
          )}
          {isSubjectUpdating && !isUserTypingSubject && (
            <div className="text-xs text-primary flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              Updating prompt...
            </div>
          )}
          {currentPreset && !currentPreset.prompt_template.includes('{subject}') && (
            <div className="text-xs text-primary-600 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
              Preset active - subject won't modify prompt
            </div>
          )}
        </div>
      )}

      {/* Prompt Preview (Read-only with syntax highlighting) */}
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-sm">
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
                {generationMode === 'text-to-image'
                  ? "Prompt will be generated based on your selections..."
                  : "Prompt will be generated based on your selections..."}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editable Prompt Textarea */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Enhanced Prompt (Editable)
          <span className="text-xs text-muted-foreground ml-2">
            Edit this prompt to customize your generation
          </span>
        </Label>
        <div className="relative">
          <Textarea
            value={currentPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Edit the generated prompt or write your own custom prompt..."
            rows={3}
            className="text-sm pr-14"
          />
          <div className="absolute right-2 bottom-2">
            <VoiceToTextButton
              onAppendText={async (text) => {
                // Typewriter effect
                const base = currentPrompt.endsWith(' ') || !currentPrompt ? currentPrompt : currentPrompt + ' ';
                let out = base;
                onPromptChange(out);
                for (let i = 0; i < text.length; i++) {
                  out += text[i];
                  onPromptChange(out);
                  await new Promise(r => setTimeout(r, 8));
                }
              }}
              disabled={userSubscriptionTier === 'FREE'}
            />
          </div>
        </div>
        {isPromptModified && (
          <p className="text-xs text-primary">
            💡 Modified prompt - save as preset above
          </p>
        )}
        {isPromptModified && userSubject.trim() && (
          <p className="text-xs text-muted-foreground">
            ⚠️ Manual editing detected - subject field updates disabled
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onAIEnhance}
          disabled={isEnhancing || (!prompt && !userSubject)}
          className="flex items-center gap-1"
        >
          {isEnhancing ? (
            <>
              <LoadingSpinner size="sm" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              AI Enhance
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          disabled={!prompt && !userSubject}
          className="flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear All
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSavePreset}
          disabled={!prompt}
          className="flex items-center gap-1"
        >
          Save Preset
        </Button>
      </div>
    </div>
  )
}
