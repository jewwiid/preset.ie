'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Wand2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { useAuth } from '../../../lib/auth-context'
import PresetSelector from './PresetSelector'
import PromptAnalysisModal from './PromptAnalysisModal'
import { ImageProviderSelector } from '../ImageProviderSelector'

// Import extracted hooks
import { useImageGenerationForm } from '../../../lib/hooks/playground/useImageGenerationForm'
import { usePexelsSearch } from '../../../lib/hooks/playground/usePexelsSearch'
import { useBaseImageUpload } from '../../../lib/hooks/playground/useBaseImageUpload'
import { usePromptGeneration } from '../../../lib/hooks/playground/usePromptGeneration'
import { useCinematicMode } from '../../../lib/hooks/playground/useCinematicMode'
import { usePresetManagement } from '../../../lib/hooks/playground/usePresetManagement'

// Import extracted components
import { SavePresetDialog } from '../../../components/playground/SavePresetDialog'
import { GenerationSettings } from '../../../components/playground/GenerationSettings'
import { PromptBuilder } from '../../../components/playground/PromptBuilder'
import { CinematicModePanel } from '../../../components/playground/CinematicModePanel'
import { BaseImageUploader } from '../../../components/playground/BaseImageUploader'

// Import types
import type { Preset, UnifiedImageGenerationPanelProps } from '../../../lib/types/playground'
import { calculateResolution, calculateAspectRatio } from '../../../lib/utils/playground'

export default function UnifiedImageGenerationPanel({
  onGenerate,
  onSettingsChange,
  loading,
  userCredits,
  userSubscriptionTier,
  savedImages = [],
  onSelectSavedImage,
  selectedPreset,
  onPresetApplied,
  currentStyle,
  onStyleChange,
  generationMode: propGenerationMode,
  onGenerationModeChange,
  selectedProvider,
  onProviderChange,
  consistencyLevel,
  onConsistencyChange,
  aspectRatio: propAspectRatio,
  onPromptChange: propOnPromptChange,
  onEnhancedPromptChange: propOnEnhancedPromptChange
}: UnifiedImageGenerationPanelProps) {
  const { user, session, userRole } = useAuth()
  const { showFeedback } = useFeedback()

  // Local state for generation mode
  const [localGenerationMode, setLocalGenerationMode] = useState<'text-to-image' | 'image-to-image'>('text-to-image')
  const currentGenerationMode = propGenerationMode || localGenerationMode

  // State for dialogs and modals
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [userSubject, setUserSubject] = useState('')
  const [isUserTypingSubject, setIsUserTypingSubject] = useState(false)

  // Use all custom hooks
  const formState = useImageGenerationForm({
    initialResolution: '1024',
    initialAspectRatio: propAspectRatio || '1:1',
    initialStyle: currentStyle || '',
    initialGenerationMode: currentGenerationMode
  })

  const pexelsState = usePexelsSearch()

  const baseImageState = useBaseImageUpload(session)

  const presetState = usePresetManagement({
    userSubject,
    generationMode: formState.generationMode,
    selectedPreset,
    onPresetApplied,
    onStyleChange,
    onConsistencyChange,
    onGenerationModeChange: (mode) => {
      formState.updateGenerationMode(mode)
      if (onGenerationModeChange) {
        onGenerationModeChange(mode)
      }
    },
    onSettingsChange
  })

  const promptState = usePromptGeneration({
    style: formState.style,
    userSubject,
    currentPreset: presetState.currentPreset,
    generationMode: formState.generationMode,
    onPromptChange: propOnPromptChange
  })

  const cinematicState = useCinematicMode({
    prompt: promptState.prompt,
    userSubject,
    aspectRatio: formState.aspectRatio,
    onAspectRatioChange: formState.updateAspectRatio,
    onEnhancedPromptChange: propOnEnhancedPromptChange
  })

  // Use consistency level and provider from props with fallback
  const currentConsistencyLevel = consistencyLevel || 'high'
  const currentProvider: 'nanobanana' | 'seedream' = (selectedProvider as 'nanobanana' | 'seedream') || 'nanobanana'

  // Calculate credits based on provider
  const creditsPerImage = currentProvider === 'seedream' ? 2 : 1
  const totalCredits = formState.numImages * creditsPerImage

  // Notify parent of settings changes
  useEffect(() => {
    if (onSettingsChange) {
      const baseImageAspectRatio = baseImageState.baseImageDimensions
        ? calculateAspectRatio(baseImageState.baseImageDimensions.width, baseImageState.baseImageDimensions.height)
        : formState.aspectRatio

      onSettingsChange({
        resolution: formState.resolution,
        aspectRatio: formState.aspectRatio,
        baseImageAspectRatio,
        baseImageUrl: baseImageState.baseImage || undefined,
        onRemoveBaseImage: baseImageState.baseImage ? baseImageState.removeBaseImage : undefined,
        generationMode: formState.generationMode,
        style: formState.style,
        selectedProvider: currentProvider,
        consistencyLevel: currentConsistencyLevel,
        prompt: promptState.prompt,
        enhancedPrompt: cinematicState.enableCinematicMode ? cinematicState.enhancedPrompt : undefined
      })
    }
  }, [
    formState.resolution,
    formState.aspectRatio,
    formState.generationMode,
    formState.style,
    baseImageState.baseImage,
    baseImageState.baseImageDimensions,
    currentProvider,
    currentConsistencyLevel,
    promptState.prompt,
    cinematicState.enableCinematicMode,
    cinematicState.enhancedPrompt,
    onSettingsChange
  ])

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: Preset | null) => {
    if (preset) {
      const applied = presetState.applyPreset(preset)
      if (applied) {
        promptState.setPrompt(applied.prompt)
        promptState.setOriginalPrompt(applied.prompt)
        formState.setStyle(applied.style)
        formState.updateIntensity(applied.intensity)
        formState.updateAspectRatio(applied.aspectRatio)
        formState.setResolution(applied.resolution)
        formState.updateNumImages(applied.numImages)

        // Apply cinematic settings if present
        if (applied.cinematicSettings?.enableCinematicMode) {
          cinematicState.setEnableCinematicMode(true)
          if (applied.cinematicSettings.cinematicParameters) {
            cinematicState.setCinematicParameters(applied.cinematicSettings.cinematicParameters)
          }
          if (applied.cinematicSettings.enhancedPrompt) {
            cinematicState.setEnhancedPrompt(applied.cinematicSettings.enhancedPrompt)
          }
        }
      }
    } else {
      presetState.clearPreset()
      promptState.clearPrompt()
      formState.setStyle('')
      formState.updateIntensity(1.0)
      formState.updateAspectRatio('1:1')
      formState.setResolution('1024')
      formState.updateNumImages(1)
      cinematicState.setEnableCinematicMode(false)
    }
  }, [presetState, promptState, formState, cinematicState])

  // Handle main generation
  const handleGenerate = useCallback(async () => {
    if (!promptState.prompt?.trim()) {
      showFeedback({
        type: 'error',
        title: 'Missing Prompt',
        message: 'Please enter a prompt or select a subject'
      })
      return
    }

    if (formState.generationMode === 'image-to-image' && !baseImageState.baseImage) {
      showFeedback({
        type: 'error',
        title: 'Missing Base Image',
        message: 'Please upload or select a base image for image-to-image generation'
      })
      return
    }

    const effectiveResolution = userSubscriptionTier === 'FREE' ? '1024' : formState.resolution
    const calculatedResolution = calculateResolution(formState.aspectRatio, effectiveResolution)

    console.log('🎨 UnifiedImageGenerationPanel - About to generate with preset:', {
      hasCurrentPreset: !!presetState.currentPreset,
      presetId: presetState.currentPreset?.id,
      presetName: presetState.currentPreset?.name,
      presetStyle: presetState.currentPreset?.style_settings?.style
    })

    await onGenerate({
      prompt: cinematicState.enableCinematicMode ? cinematicState.enhancedPrompt : promptState.prompt,
      style: presetState.currentPreset ? presetState.currentPreset.style_settings?.style || formState.style : formState.style,
      resolution: calculatedResolution,
      consistencyLevel: currentConsistencyLevel,
      numImages: formState.numImages,
      customStylePreset: presetState.currentPreset || undefined,
      baseImage: formState.generationMode === 'image-to-image' ? baseImageState.baseImage || undefined : undefined,
      generationMode: formState.generationMode,
      intensity: formState.intensity,
      cinematicParameters: cinematicState.enableCinematicMode ? cinematicState.cinematicParameters : undefined,
      enhancedPrompt: cinematicState.enableCinematicMode ? cinematicState.enhancedPrompt : undefined,
      includeTechnicalDetails: cinematicState.enableCinematicMode ? cinematicState.includeTechnicalDetails : undefined,
      includeStyleReferences: cinematicState.enableCinematicMode ? cinematicState.includeStyleReferences : undefined,
      selectedProvider: currentProvider as 'nanobanana' | 'seedream',
      replaceLatestImages: formState.replaceLatestImages,
      userSubject: formState.generationMode === 'image-to-image' ? 'image' : (userSubject.trim() || undefined)
    })
  }, [
    promptState.prompt,
    formState,
    baseImageState.baseImage,
    cinematicState,
    presetState.currentPreset,
    userSubject,
    currentConsistencyLevel,
    currentProvider,
    userSubscriptionTier,
    onGenerate,
    showFeedback
  ])

  // Handle AI enhancement
  const handleAIEnhance = useCallback(async () => {
    const enhanced = await promptState.handleAIEnhancePrompt(
      promptState.prompt,
      cinematicState.enhancedPrompt,
      cinematicState.cinematicParameters,
      cinematicState.enableCinematicMode,
      showFeedback
    )

    if (enhanced) {
      if (cinematicState.enableCinematicMode) {
        cinematicState.setEnhancedPrompt(enhanced)
        cinematicState.setIsManuallyEditingEnhancedPrompt(true)
      } else {
        promptState.setPrompt(enhanced)
        promptState.setOriginalPrompt(enhanced)
      }
    }
  }, [promptState, cinematicState, showFeedback])

  // Handle clear all
  const handleClearAll = useCallback(() => {
    promptState.clearPrompt()
    setUserSubject('')
    formState.setStyle('')
    presetState.clearPreset()
    cinematicState.setCinematicParameters({})
    promptState.setIsPromptModified(false)
    cinematicState.setIsManuallyEditingEnhancedPrompt(false)

    showFeedback({
      type: 'success',
      title: 'Success',
      message: 'All fields cleared'
    })
  }, [promptState, formState, presetState, cinematicState, showFeedback])

  // Handle generation mode change
  const handleGenerationModeChange = useCallback((mode: 'text-to-image' | 'image-to-image') => {
    formState.updateGenerationMode(mode)
    setLocalGenerationMode(mode)
    if (onGenerationModeChange) {
      onGenerationModeChange(mode)
    }
  }, [formState, onGenerationModeChange])

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Image Generation</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Image Provider Selector */}
          <ImageProviderSelector
            selectedProvider={currentProvider}
            userCredits={userCredits}
            onProviderChange={(provider) => {
              if (onProviderChange) {
                onProviderChange(provider)
              }
            }}
          />

          {/* Preset Selector */}
          <PresetSelector
            onPresetSelect={handlePresetSelect}
            selectedPreset={presetState.currentPreset}
          />

          {/* Generation Mode Toggle */}
          <div className="flex items-center gap-4">
            <Label className="text-sm">Generation Mode:</Label>
            <div className="flex gap-2">
              <Button
                variant={formState.generationMode === 'text-to-image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGenerationModeChange('text-to-image')}
              >
                Text-to-Image
              </Button>
              <Button
                variant={formState.generationMode === 'image-to-image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleGenerationModeChange('image-to-image')}
              >
                Image-to-Image
              </Button>
            </div>
          </div>

          {/* Base Image Uploader (for image-to-image mode) */}
          {formState.generationMode === 'image-to-image' && (
            <BaseImageUploader
              baseImage={baseImageState.baseImage}
              baseImageSource={baseImageState.baseImageSource}
              baseImageDimensions={baseImageState.baseImageDimensions}
              onBaseImageSelected={baseImageState.handleImportedImage}
              onRemoveBaseImage={baseImageState.removeBaseImage}
            />
          )}

          {/* Prompt Builder */}
          <PromptBuilder
            userSubject={userSubject}
            prompt={promptState.prompt}
            enhancedPrompt={cinematicState.enhancedPrompt}
            enableCinematicMode={cinematicState.enableCinematicMode}
            isEnhancing={promptState.isEnhancing}
            isPromptModified={promptState.isPromptModified}
            isUserTypingSubject={isUserTypingSubject}
            isSubjectUpdating={promptState.isSubjectUpdating}
            generationMode={formState.generationMode}
            currentPreset={presetState.currentPreset}
            userSubscriptionTier={userSubscriptionTier}
            onUserSubjectChange={setUserSubject}
            onPromptChange={(newPrompt) => {
              if (cinematicState.enableCinematicMode) {
                cinematicState.setEnhancedPrompt(newPrompt)
                cinematicState.setIsManuallyEditingEnhancedPrompt(true)
              } else {
                promptState.setPrompt(newPrompt)
              }
              promptState.setIsPromptModified(true)
            }}
            onAIEnhance={handleAIEnhance}
            onClearAll={handleClearAll}
            onSavePreset={() => setShowSavePresetDialog(true)}
            onStartTypingSubject={() => setIsUserTypingSubject(true)}
            onStopTypingSubject={() => setIsUserTypingSubject(false)}
          />

          {/* Cinematic Mode Panel */}
          <CinematicModePanel
            enableCinematicMode={cinematicState.enableCinematicMode}
            cinematicParameters={cinematicState.cinematicParameters}
            showCinematicPreview={cinematicState.showCinematicPreview}
            includeTechnicalDetails={cinematicState.includeTechnicalDetails}
            includeStyleReferences={cinematicState.includeStyleReferences}
            enhancedPrompt={cinematicState.enhancedPrompt}
            onToggleCinematicMode={cinematicState.toggleCinematicMode}
            onCinematicParametersChange={cinematicState.handleCinematicParametersChange}
            onTogglePreview={cinematicState.togglePreview}
            onToggleChange={cinematicState.handleToggleChange}
            onRegenerate={cinematicState.regenerateEnhancedPrompt}
          />

          {/* Generation Settings */}
          <GenerationSettings
            intensity={formState.intensity}
            numImages={formState.numImages}
            aspectRatio={formState.aspectRatio}
            resolution={formState.resolution}
            replaceLatestImages={formState.replaceLatestImages}
            loading={loading}
            prompt={promptState.prompt}
            userCredits={userCredits}
            totalCredits={totalCredits}
            userSubscriptionTier={userSubscriptionTier}
            enableCinematicMode={cinematicState.enableCinematicMode}
            cinematicAspectRatio={cinematicState.cinematicParameters.aspectRatio as string | undefined}
            onIntensityChange={formState.updateIntensity}
            onNumImagesChange={formState.updateNumImages}
            onAspectRatioChange={formState.updateAspectRatio}
            onReplaceLatestImagesChange={formState.updateReplaceLatestImages}
            onGenerate={handleGenerate}
            onShowAnalysis={userSubscriptionTier !== 'FREE' ? () => setShowAnalysisModal(true) : undefined}
          />
        </CardContent>
      </Card>

      {/* Save Preset Dialog */}
      <SavePresetDialog
        isOpen={showSavePresetDialog}
        onClose={() => setShowSavePresetDialog(false)}
        prompt={promptState.prompt}
        enhancedPrompt={cinematicState.enhancedPrompt}
        userSubject={userSubject}
        style={formState.style}
        resolution={formState.resolution}
        aspectRatio={formState.aspectRatio}
        consistencyLevel={currentConsistencyLevel}
        intensity={formState.intensity}
        numImages={formState.numImages}
        enableCinematicMode={cinematicState.enableCinematicMode}
        cinematicParameters={cinematicState.cinematicParameters}
      />

      {/* Prompt Analysis Modal */}
      <PromptAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        imageUrl={baseImageState.baseImage || undefined}
        originalPrompt={promptState.prompt}
        enhancedPrompt={cinematicState.enhancedPrompt}
        style={presetState.currentPreset ? presetState.currentPreset.style_settings?.style || formState.style : formState.style}
        resolution={formState.resolution}
        aspectRatio={formState.aspectRatio}
        generationMode={formState.generationMode}
        cinematicParameters={cinematicState.enableCinematicMode ? cinematicState.cinematicParameters : undefined}
        onApplyPrompt={(improvedPrompt) => {
          promptState.setPrompt(improvedPrompt)
          setShowAnalysisModal(false)
        }}
        onSaveAsPreset={() => {
          setShowAnalysisModal(false)
          setShowSavePresetDialog(true)
        }}
        subscriptionTier="free"
      />
    </>
  )
}
