'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { formatStyleName, detectSubjectCategory } from '../../utils/playground'
import { Preset } from '../../types/playground'

interface UsePromptGenerationProps {
  style: string
  userSubject: string
  currentPreset: Preset | null
  generationMode: 'text-to-image' | 'image-to-image'
  onPromptChange?: (prompt: string) => void
}

export const usePromptGeneration = ({
  style,
  userSubject,
  currentPreset,
  generationMode,
  onPromptChange
}: UsePromptGenerationProps) => {
  const [prompt, setPromptState] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [isPromptModified, setIsPromptModified] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isPromptUpdating, setIsPromptUpdating] = useState(false)
  const [isUserTypingSubject, setIsUserTypingSubject] = useState(false)
  const [isSubjectUpdating, setIsSubjectUpdating] = useState(false)
  const subjectUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Wrapper function for setPrompt that also calls onPromptChange
  const setPrompt = useCallback((newPrompt: string) => {
    setPromptState(newPrompt)
    if (onPromptChange) {
      onPromptChange(newPrompt)
    }
  }, [onPromptChange])

  // Initialize original prompt
  useEffect(() => {
    if (!originalPrompt && prompt) {
      setOriginalPrompt(prompt)
    }
  }, [prompt, originalPrompt])

  // Generate enhanced prompt from style + subject
  const generateEnhancedPrompt = useCallback(async (
    styleValue: string,
    userPrompt: string,
    mode: 'text-to-image' | 'image-to-image'
  ): Promise<string> => {
    try {
      console.log('🎯 Fetching style prompt for:', { style: styleValue, mode, userPrompt })

      // Get base style prompt from database
      const response = await fetch('/api/style-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          styleName: styleValue,
          generationMode: mode
        })
      })

      if (!response.ok) {
        // Fallback to basic prompt
        const formattedStyle = formatStyleName(styleValue)
        if (userPrompt.trim()) {
          return mode === 'text-to-image'
            ? `Create a ${formattedStyle} image with natural lighting and detailed textures of ${userPrompt.trim()}`
            : `Apply ${formattedStyle} rendering with natural lighting and detailed textures to ${userPrompt.trim()}`
        }
        return mode === 'text-to-image'
          ? `Create a ${formattedStyle} image with natural lighting and detailed textures`
          : `Apply ${formattedStyle} rendering with natural lighting and detailed textures`
      }

      const data = await response.json()
      const { prompt: baseStylePrompt } = data

      if (!baseStylePrompt) {
        const formattedStyle = formatStyleName(styleValue)
        if (userPrompt.trim()) {
          return mode === 'text-to-image'
            ? `Create a ${formattedStyle} image with natural lighting and detailed textures of ${userPrompt.trim()}`
            : `Apply ${formattedStyle} rendering with natural lighting and detailed textures to ${userPrompt.trim()}`
        }
        return mode === 'text-to-image'
          ? `Create a ${formattedStyle} image with natural lighting and detailed textures`
          : `Apply ${formattedStyle} rendering with natural lighting and detailed textures`
      }

      // Handle subject integration based on generation mode
      if (mode === 'image-to-image') {
        const simplePrompt = `${baseStylePrompt} this image`
        console.log('🎯 Image-to-image prompt generated:', { baseStylePrompt, simplePrompt })
        return simplePrompt
      } else if (userPrompt.trim()) {
        const simplePrompt = `${baseStylePrompt} of ${userPrompt.trim()}`
        console.log('🎯 Simple prompt generated:', { baseStylePrompt, userPrompt: userPrompt.trim(), simplePrompt })
        return simplePrompt
      }

      return baseStylePrompt
    } catch (error) {
      console.warn('Error generating enhanced prompt (using fallback):', error)
      const formattedStyle = formatStyleName(styleValue)
      if (userPrompt.trim()) {
        return mode === 'text-to-image'
          ? `Create a ${formattedStyle} image with natural lighting and detailed textures of ${userPrompt.trim()}`
          : `Apply ${formattedStyle} rendering with natural lighting and detailed textures to ${userPrompt.trim()}`
      }
      return mode === 'text-to-image'
        ? `Create a ${formattedStyle} image with natural lighting and detailed textures`
        : `Apply ${formattedStyle} rendering with natural lighting and detailed textures`
    }
  }, [])

  // Update prompt when userSubject changes
  useEffect(() => {
    // Don't update if user is still typing or if prompt has been manually modified
    if (isUserTypingSubject || isPromptModified) {
      return
    }

    // If a preset is active, don't auto-generate prompts
    // The preset handles its own prompt template
    if (currentPreset) {
      // Only update if subject changed and template has {subject} placeholder
      if (userSubject.trim() && currentPreset.prompt_template?.includes('{subject}')) {
        const finalPrompt = currentPreset.prompt_template.replace(/\{subject\}/g, userSubject.trim())
        setPrompt(finalPrompt)
        setOriginalPrompt(finalPrompt)
      }
      return
    }

    // If no preset but we have a style and subject, generate prompt
    if (!currentPreset && style && userSubject.trim()) {
      setIsSubjectUpdating(true)
      generateEnhancedPrompt(style, userSubject, generationMode).then((newPrompt: string) => {
        setPrompt(newPrompt)
        setOriginalPrompt(newPrompt)
        setIsSubjectUpdating(false)
      }).catch(() => {
        setIsSubjectUpdating(false)
      })
      return
    }

    // If no style but we have a subject, create a basic prompt
    if (!currentPreset && !style && userSubject.trim()) {
      const basicPrompt = generationMode === 'text-to-image'
        ? `Create an image of ${userSubject.trim()}`
        : `Transform this image with ${userSubject.trim()}`
      setPrompt(basicPrompt)
      setOriginalPrompt(basicPrompt)
      return
    }

    // If subject is cleared and we have a style, update prompt accordingly
    if (!userSubject.trim() && style) {
      setIsSubjectUpdating(true)
      generateEnhancedPrompt(style, '', generationMode).then((newPrompt: string) => {
        setPrompt(newPrompt)
        setOriginalPrompt(newPrompt)
        setIsSubjectUpdating(false)
      }).catch(() => {
        setIsSubjectUpdating(false)
      })
      return
    }

    // If both subject and style are cleared, clear the prompt
    if (!userSubject.trim() && !style && !currentPreset) {
      setPrompt('')
      setOriginalPrompt('')
    }
  }, [userSubject, style, currentPreset, generationMode, isPromptModified, isUserTypingSubject, generateEnhancedPrompt, setPrompt])

  // AI Enhancement handler
  const handleAIEnhancePrompt = useCallback(async (
    currentPrompt: string,
    enhancedPrompt: string,
    cinematicParameters: any,
    enableCinematicMode: boolean,
    showFeedback: (feedback: any) => void
  ) => {
    setIsEnhancing(true)
    try {
      const subjectCategory = userSubject ? detectSubjectCategory(userSubject) : undefined

      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enableCinematicMode ? enhancedPrompt : currentPrompt,
          subject: userSubject,
          style,
          subjectCategory,
          cinematicParameters: enableCinematicMode ? cinematicParameters : undefined,
          generationMode
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enhance prompt')
      }

      const data = await response.json()

      showFeedback({
        type: 'success',
        title: 'Success',
        message: 'Prompt enhanced successfully!'
      })

      return data.enhancedPrompt
    } catch (error) {
      console.error('Error enhancing prompt:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to enhance prompt'
      })
      return null
    } finally {
      setIsEnhancing(false)
    }
  }, [userSubject, style, generationMode])

  // Clear all prompts
  const clearPrompt = useCallback(() => {
    setPrompt('')
    setOriginalPrompt('')
    setIsPromptModified(false)
  }, [setPrompt])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (subjectUpdateTimeoutRef.current) {
        clearTimeout(subjectUpdateTimeoutRef.current)
      }
    }
  }, [])

  return {
    prompt,
    originalPrompt,
    isPromptModified,
    isEnhancing,
    isPromptUpdating,
    isSubjectUpdating,
    setPrompt,
    setOriginalPrompt,
    setIsPromptModified,
    setIsPromptUpdating,
    setIsUserTypingSubject,
    generateEnhancedPrompt,
    handleAIEnhancePrompt,
    clearPrompt
  }
}
