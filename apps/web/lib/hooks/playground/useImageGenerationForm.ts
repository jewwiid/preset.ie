'use client'

import { useState, useCallback, useEffect } from 'react'

export interface ImageGenerationFormState {
  resolution: string
  aspectRatio: string
  numImages: number
  intensity: number
  style: string
  generationMode: 'text-to-image' | 'image-to-image'
  replaceLatestImages: boolean
}

interface UseImageGenerationFormProps {
  initialResolution?: string
  initialAspectRatio?: string
  initialStyle?: string
  initialGenerationMode?: 'text-to-image' | 'image-to-image'
}

export const useImageGenerationForm = ({
  initialResolution = '1024',
  initialAspectRatio = '1:1',
  initialStyle = '',
  initialGenerationMode = 'text-to-image'
}: UseImageGenerationFormProps = {}) => {
  const [resolution, setResolution] = useState(initialResolution)
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio)
  const [numImages, setNumImages] = useState(1)
  const [intensity, setIntensity] = useState(1.0)
  const [style, setStyle] = useState(initialStyle)
  const [generationMode, setGenerationMode] = useState<'text-to-image' | 'image-to-image'>(initialGenerationMode)
  const [replaceLatestImages, setReplaceLatestImages] = useState(true)

  // Debug: Log when aspect ratio changes
  useEffect(() => {
    console.log('🎯 Aspect ratio state changed to:', aspectRatio)
  }, [aspectRatio])

  // Removed: onAspectRatioChange effect to prevent infinite loops
  // Parent component should use useEffect to watch aspectRatio changes

  const updateResolution = useCallback((newResolution: string) => {
    setResolution(newResolution)
  }, [])

  const updateAspectRatio = useCallback((newAspectRatio: string) => {
    console.log('🎯 Updating aspect ratio to:', newAspectRatio)
    setAspectRatio(newAspectRatio)
  }, [])

  const updateNumImages = useCallback((newNumImages: number) => {
    setNumImages(newNumImages)
  }, [])

  const updateIntensity = useCallback((newIntensity: number) => {
    setIntensity(newIntensity)
  }, [])

  const updateStyle = useCallback((newStyle: string) => {
    setStyle(newStyle)
  }, [])

  const updateGenerationMode = useCallback((mode: 'text-to-image' | 'image-to-image') => {
    setGenerationMode(mode)
  }, [])

  const updateReplaceLatestImages = useCallback((replace: boolean) => {
    setReplaceLatestImages(replace)
  }, [])

  const resetForm = useCallback(() => {
    setResolution(initialResolution)
    setAspectRatio(initialAspectRatio)
    setNumImages(1)
    setIntensity(1.0)
    setStyle(initialStyle)
    setGenerationMode(initialGenerationMode)
    setReplaceLatestImages(true)
  }, [initialResolution, initialAspectRatio, initialStyle, initialGenerationMode])

  const formState: ImageGenerationFormState = {
    resolution,
    aspectRatio,
    numImages,
    intensity,
    style,
    generationMode,
    replaceLatestImages
  }

  return {
    formState,
    resolution,
    aspectRatio,
    numImages,
    intensity,
    style,
    generationMode,
    replaceLatestImages,
    updateResolution,
    updateAspectRatio,
    updateNumImages,
    updateIntensity,
    updateStyle,
    updateGenerationMode,
    updateReplaceLatestImages,
    setResolution,
    setAspectRatio,
    setStyle,
    resetForm
  }
}
