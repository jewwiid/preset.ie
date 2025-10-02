'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CinematicParameters } from '../../../../../packages/types/src/cinematic-parameters'
import CinematicPromptBuilder from '../../../../../packages/services/src/cinematic-prompt-builder'

interface UseCinematicModeProps {
  prompt: string
  userSubject: string
  aspectRatio: string
  onAspectRatioChange?: (aspectRatio: string) => void
  onEnhancedPromptChange?: (enhancedPrompt: string) => void
}

export const useCinematicMode = ({
  prompt,
  userSubject,
  aspectRatio,
  onAspectRatioChange,
  onEnhancedPromptChange
}: UseCinematicModeProps) => {
  const [enableCinematicMode, setEnableCinematicMode] = useState(false)
  const [cinematicParameters, setCinematicParameters] = useState<Partial<CinematicParameters>>({})
  const [enhancedPrompt, setEnhancedPromptState] = useState('')
  const [showCinematicPreview, setShowCinematicPreview] = useState(false)
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true)
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true)
  const [isManuallyEditingEnhancedPrompt, setIsManuallyEditingEnhancedPrompt] = useState(false)
  const promptBuilder = useRef(new CinematicPromptBuilder())

  // Use refs to prevent infinite loops in aspect ratio sync
  const isUpdatingFromCinematic = useRef(false)
  const isUpdatingFromMain = useRef(false)

  // Wrapper for setEnhancedPrompt that notifies parent
  const setEnhancedPrompt = useCallback((newPrompt: string) => {
    setEnhancedPromptState(newPrompt)
    if (onEnhancedPromptChange) {
      onEnhancedPromptChange(newPrompt)
    }
  }, [onEnhancedPromptChange])

  // Debug: Log when cinematic parameters change
  useEffect(() => {
    console.log('🎯 Cinematic parameters changed:', cinematicParameters)
  }, [cinematicParameters])

  // Sync cinematic aspect ratio with main aspect ratio selector
  useEffect(() => {
    if (enableCinematicMode && cinematicParameters.aspectRatio && cinematicParameters.aspectRatio !== aspectRatio && !isUpdatingFromMain.current) {
      console.log('🎯 Syncing main aspect ratio from cinematic parameters:', cinematicParameters.aspectRatio)
      isUpdatingFromCinematic.current = true
      if (onAspectRatioChange) {
        onAspectRatioChange(cinematicParameters.aspectRatio as string)
      }
      setTimeout(() => {
        isUpdatingFromCinematic.current = false
      }, 0)
    }
  }, [cinematicParameters.aspectRatio, enableCinematicMode, aspectRatio, onAspectRatioChange])

  // Sync main aspect ratio with cinematic parameters when cinematic mode is enabled
  useEffect(() => {
    if (enableCinematicMode && aspectRatio && cinematicParameters.aspectRatio !== aspectRatio && !isUpdatingFromCinematic.current) {
      console.log('🎯 Syncing cinematic aspect ratio from main selector:', aspectRatio)
      isUpdatingFromMain.current = true
      setCinematicParameters(prev => ({
        ...prev,
        aspectRatio: aspectRatio as any
      }))
      setTimeout(() => {
        isUpdatingFromMain.current = false
      }, 0)
    }
  }, [aspectRatio, enableCinematicMode, cinematicParameters.aspectRatio])

  // Wrapper function to handle cinematic parameter changes
  const handleCinematicParametersChange = useCallback((newParameters: Partial<CinematicParameters>) => {
    console.log('🎯 Cinematic parameters changed:', newParameters)
    setCinematicParameters(newParameters)

    // If aspect ratio changed in cinematic parameters, also update main aspect ratio
    if (newParameters.aspectRatio && newParameters.aspectRatio !== aspectRatio && !isUpdatingFromMain.current) {
      console.log('🎯 Also updating main aspect ratio from cinematic parameters:', newParameters.aspectRatio)
      isUpdatingFromCinematic.current = true
      if (onAspectRatioChange) {
        onAspectRatioChange(newParameters.aspectRatio as string)
      }
      setTimeout(() => {
        isUpdatingFromCinematic.current = false
      }, 0)
    }
  }, [aspectRatio, onAspectRatioChange])

  // Auto-generate enhanced prompt when parameters change (but not when manually editing)
  useEffect(() => {
    if (enableCinematicMode && !isManuallyEditingEnhancedPrompt) {
      const basePrompt = prompt || `Create a cinematic image${userSubject ? ` of ${userSubject}` : ''}`

      const enhanced = promptBuilder.current.constructPrompt({
        basePrompt,
        cinematicParameters,
        enhancementType: 'cinematic',
        includeTechnicalDetails,
        includeStyleReferences,
        subject: userSubject
      }).fullPrompt

      setEnhancedPrompt(enhanced)
    }
  }, [prompt, userSubject, cinematicParameters, enableCinematicMode, includeTechnicalDetails, includeStyleReferences, isManuallyEditingEnhancedPrompt, setEnhancedPrompt])

  // Handle toggle changes from CinematicParameterSelector
  const handleToggleChange = useCallback((technicalDetails: boolean, styleReferences: boolean) => {
    setIncludeTechnicalDetails(technicalDetails)
    setIncludeStyleReferences(styleReferences)
  }, [])

  const toggleCinematicMode = useCallback((enabled: boolean) => {
    setEnableCinematicMode(enabled)
    if (!enabled) {
      // Reset cinematic state when disabled
      setCinematicParameters({})
      setEnhancedPrompt('')
      setIsManuallyEditingEnhancedPrompt(false)
      setShowCinematicPreview(false)
    }
  }, [setEnhancedPrompt])

  const togglePreview = useCallback(() => {
    setShowCinematicPreview(prev => !prev)
  }, [])

  const regenerateEnhancedPrompt = useCallback(() => {
    setIsManuallyEditingEnhancedPrompt(false)
    // Trigger re-generation by updating parameters
    setCinematicParameters({ ...cinematicParameters })
  }, [cinematicParameters])

  return {
    enableCinematicMode,
    cinematicParameters,
    enhancedPrompt,
    showCinematicPreview,
    includeTechnicalDetails,
    includeStyleReferences,
    isManuallyEditingEnhancedPrompt,
    setEnableCinematicMode: toggleCinematicMode,
    setCinematicParameters,
    setEnhancedPrompt,
    setShowCinematicPreview,
    setIncludeTechnicalDetails,
    setIncludeStyleReferences,
    setIsManuallyEditingEnhancedPrompt,
    handleCinematicParametersChange,
    handleToggleChange,
    toggleCinematicMode,
    togglePreview,
    regenerateEnhancedPrompt
  }
}
