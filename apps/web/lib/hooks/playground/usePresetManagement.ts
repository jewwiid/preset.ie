'use client'

import { useState, useEffect, useCallback } from 'react'
import { Preset } from '../../types/playground'
import { replaceSubjectInTemplate } from '../../utils/playground'

interface UsePresetManagementProps {
  userSubject: string
  generationMode: 'text-to-image' | 'image-to-image'
  selectedPreset?: Preset | null
  onPresetApplied?: () => void
  onStyleChange?: (style: string) => void
  onConsistencyChange?: (consistency: string) => void
  onGenerationModeChange?: (mode: 'text-to-image' | 'image-to-image') => void
  onSettingsChange?: (settings: any) => void
}

export const usePresetManagement = ({
  userSubject,
  generationMode,
  selectedPreset,
  onPresetApplied,
  onStyleChange,
  onConsistencyChange,
  onGenerationModeChange,
  onSettingsChange
}: UsePresetManagementProps) => {
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Force prompt to be empty on mount to override any state persistence
  useEffect(() => {
    setHasInitialized(true)
  }, [])

  // Check for preset from localStorage or URL parameters on mount
  useEffect(() => {
    const storedPreset = localStorage.getItem('selectedPreset')
    const urlParams = new URLSearchParams(window.location.search)
    const presetId = urlParams.get('preset')
    const presetName = urlParams.get('name')

    if (storedPreset) {
      try {
        const presetData = JSON.parse(storedPreset)
        console.log('🎯 Found stored preset:', presetData.name)

        // Create a Preset object from the stored data
        const presetObject: Preset = {
          id: presetData.id || 'local-preset',
          name: presetData.name || 'Unknown Preset',
          description: presetData.description || '',
          category: presetData.category || 'style',
          prompt_template: presetData.prompt_template || '',
          negative_prompt: presetData.negative_prompt || '',
          style_settings: presetData.style_settings || { style: '', intensity: 1.0, consistency_level: 'medium' },
          technical_settings: presetData.technical_settings || { resolution: '1024x1024', aspect_ratio: '1:1', num_images: 1 },
          ai_metadata: presetData.ai_metadata || {},
          seedream_config: presetData.seedream_config || { model: 'sd3', steps: 25, guidance_scale: 7.5, scheduler: 'ddim' },
          usage_count: presetData.usage_count || 0,
          likes_count: presetData.likes_count || 0,
          is_public: presetData.is_public || true,
          is_featured: presetData.is_featured || false,
          created_at: presetData.created_at || new Date().toISOString(),
          creator: presetData.creator || { id: 'system', display_name: 'System', handle: 'system' }
        }

        setCurrentPreset(presetObject)

        // Clear the stored preset so it doesn't apply again
        localStorage.removeItem('selectedPreset')

        console.log('🎯 Applied preset from localStorage:', presetData.name)
      } catch (error) {
        console.error('Error parsing stored preset:', error)
        localStorage.removeItem('selectedPreset')
      }
    } else if (presetId && presetName) {
      // Fetch preset data from API when URL parameters are present
      console.log('🎯 Found preset in URL, fetching from API:', { presetId, presetName })

      fetch('/api/presets')
        .then(response => response.json())
        .then(data => {
          if (data.presets) {
            const presetData = data.presets.find((p: any) => p.id === presetId)
            if (presetData) {
              console.log('🎯 Fetched preset from API:', presetData.name)

              const presetObject: Preset = {
                id: presetData.id,
                name: presetData.name,
                description: presetData.description || '',
                category: presetData.category || 'style',
                prompt_template: presetData.prompt_template || '',
                negative_prompt: presetData.negative_prompt || '',
                style_settings: presetData.style_settings || { style: '', intensity: 1.0, consistency_level: 'medium' },
                technical_settings: presetData.technical_settings || { resolution: '1024x1024', aspect_ratio: '1:1', num_images: 1 },
                ai_metadata: presetData.ai_metadata || {},
                seedream_config: presetData.seedream_config || { model: 'sd3', steps: 25, guidance_scale: 7.5, scheduler: 'ddim' },
                usage_count: presetData.usage_count || 0,
                likes_count: presetData.likes_count || 0,
                is_public: presetData.is_public || true,
                is_featured: presetData.is_featured || false,
                created_at: presetData.created_at || new Date().toISOString(),
                creator: presetData.creator || { id: 'system', display_name: 'System', handle: 'system' }
              }

              setCurrentPreset(presetObject)

              console.log('🎯 Applied preset from API:', presetData.name)
            } else {
              console.error('Preset not found in API response:', presetId)
            }
          }
        })
        .catch(error => {
          console.error('Error fetching preset from API:', error)
        })
    }
  }, [])

  // Handle preset selection from parent component
  useEffect(() => {
    console.log('🎯 selectedPreset useEffect running:', selectedPreset)

    if (selectedPreset) {
      console.log('🎯 Applying preset:', selectedPreset.name || selectedPreset.id, 'prompt:', selectedPreset.prompt_template)
      setCurrentPreset(selectedPreset)

      // Clear the selected preset after applying it
      if (onPresetApplied) {
        onPresetApplied()
      }
    }
  }, [selectedPreset, onPresetApplied])

  // Apply preset to form
  const applyPreset = useCallback((preset: Preset | null): {
    prompt: string
    style: string
    intensity: number
    consistencyLevel: string
    aspectRatio: string
    resolution: string
    numImages: number
    cinematicSettings?: any
  } | null => {
    if (!preset) {
      setCurrentPreset(null)
      return null
    }

    setCurrentPreset(preset)

    // Replace subject in prompt template
    const finalPrompt = replaceSubjectInTemplate(
      preset.prompt_template,
      userSubject,
      generationMode
    )

    // Notify parent components of changes
    if (onStyleChange && preset.style_settings?.style) {
      onStyleChange(preset.style_settings.style)
    }

    if (onConsistencyChange && preset.style_settings?.consistency_level) {
      onConsistencyChange(preset.style_settings.consistency_level)
    }

    if (onGenerationModeChange && preset.style_settings?.generation_mode) {
      onGenerationModeChange(preset.style_settings.generation_mode)
    }

    if (onSettingsChange) {
      onSettingsChange({
        resolution: preset.technical_settings?.resolution || '1024',
        aspectRatio: preset.technical_settings?.aspect_ratio || '1:1'
      })
    }

    return {
      prompt: finalPrompt,
      style: preset.style_settings?.style || '',
      intensity: preset.style_settings?.intensity || 1.0,
      consistencyLevel: preset.style_settings?.consistency_level || 'high',
      aspectRatio: preset.technical_settings?.aspect_ratio || '1:1',
      resolution: preset.technical_settings?.resolution || '1024',
      numImages: preset.technical_settings?.num_images || 1,
      cinematicSettings: preset.cinematic_settings
    }
  }, [userSubject, generationMode, onStyleChange, onConsistencyChange, onGenerationModeChange, onSettingsChange])

  // Clear preset
  const clearPreset = useCallback(() => {
    setCurrentPreset(null)
  }, [])

  // Get processed prompt from current preset
  const getPresetPrompt = useCallback((): string | null => {
    if (!currentPreset) return null

    return replaceSubjectInTemplate(
      currentPreset.prompt_template,
      userSubject,
      generationMode
    )
  }, [currentPreset, userSubject, generationMode])

  return {
    currentPreset,
    hasInitialized,
    setCurrentPreset,
    applyPreset,
    clearPreset,
    getPresetPrompt
  }
}
