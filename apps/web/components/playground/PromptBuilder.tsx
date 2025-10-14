'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { X, Sparkles, Loader2 } from 'lucide-react'
import VoiceToTextButton from '@/components/ui/VoiceToTextButton'
import { MentionInput } from '@/app/components/ui/mention-input'
import { useMentionRegistry } from '@/lib/stores/mention-registry'
import { buildAllMentionEntities } from '@/lib/utils/cinematic-mention-builder'
import { getAllDefaultEntities } from '@/lib/utils/mention-types'
import { useMemo } from 'react'
import type { MentionDetectionContext } from '@/lib/ai/mention-detection'
import MentionHelpTooltip from '@/app/components/ui/mention-help-tooltip'
import MentionExamplesPanel from '@/app/components/ui/mention-examples-panel'
import MentionTutorialModal from '@/app/components/ui/mention-tutorial-modal'
import { HelpCircle, BookOpen } from 'lucide-react'

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
  // Enhanced mention props
  cinematicParams?: any
  selectedImages?: string[]
  userImages?: Array<{ id: string; url: string; name?: string; description?: string }>
  userPresets?: Array<{ id: string; name: string; description?: string; cinematicParams?: any }>
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
  // Enhanced mention props
  cinematicParams,
  selectedImages,
  userImages,
  userPresets,
  onUserSubjectChange,
  onPromptChange,
  onAIEnhance,
  onClearAll,
  onSavePreset,
  onStartTypingSubject,
  onStopTypingSubject
}: PromptBuilderProps) {
  const currentPrompt = enableCinematicMode ? enhancedPrompt : prompt
  
  // Build mentionable entities for the current context
  const availableEntities = useMemo(() => {
    const context = {
      mode: generationMode,
      selectedImages,
      currentPreset,
      cinematicParams,
      userImages,
      userPresets
    };
    
    return buildAllMentionEntities(context);
  }, [generationMode, selectedImages, currentPreset, cinematicParams, userImages, userPresets]);
  
  // Build mention detection context
  const mentionContext: MentionDetectionContext = useMemo(() => ({
    mode: generationMode,
    availableImages: userImages?.map(img => img.id) || [],
    currentPreset,
    cinematicParams,
    selectedImages
  }), [generationMode, userImages, currentPreset, cinematicParams, selectedImages]);
  
      // Get mention registry for cross-tab sharing
      const { addToRecent } = useMentionRegistry();

      const handleExampleSelect = (example: any) => {
        onPromptChange(example.prompt);
      };

      return (
        <div className="space-y-4">
      {/* Subject Input with Universal Mentions */}
      {generationMode === 'text-to-image' && (
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-sm">
            What do you want to create?
          </Label>
          <MentionInput
            value={userSubject}
            onChange={(value) => {
              onUserSubjectChange(value)
              onStartTypingSubject()
              setTimeout(onStopTypingSubject, 1000)
            }}
            placeholder="e.g., portrait of a person, mountain landscape, product shot, character design..."
            mentionableItems={[]} // No legacy items for subject
            availableEntities={availableEntities}
            mentionContext={mentionContext}
            enableAIMentions={userSubscriptionTier !== 'FREE'}
            colorCodedMentions={true}
            allowTextSelection={true}
            userSubscriptionTier={userSubscriptionTier}
            enableVoiceToText={true}
            rows={1}
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

          {/* Enhanced Prompt with Universal Mentions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Enhanced Prompt (Editable)
                <span className="text-xs text-muted-foreground ml-2">
                  Edit this prompt to customize your generation
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <MentionHelpTooltip context="generate">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <HelpCircle className="h-3 w-3" />
                  </Button>
                </MentionHelpTooltip>
                <MentionTutorialModal context="generate">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <BookOpen className="h-3 w-3" />
                  </Button>
                </MentionTutorialModal>
              </div>
            </div>
        <MentionInput
          value={currentPrompt}
          onChange={onPromptChange}
          placeholder="Edit the generated prompt or write your own custom prompt..."
          mentionableItems={[]} // No legacy items for prompt
          availableEntities={availableEntities}
          mentionContext={mentionContext}
          enableAIMentions={userSubscriptionTier !== 'FREE'}
          colorCodedMentions={true}
          allowTextSelection={true}
          userSubscriptionTier={userSubscriptionTier}
          enableVoiceToText={true}
          rows={3}
          className="text-sm"
        />
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

          {/* Examples Panel */}
          <MentionExamplesPanel 
            context="generate" 
            onExampleSelect={handleExampleSelect}
            className="mt-4"
          />
    </div>
  )
}
