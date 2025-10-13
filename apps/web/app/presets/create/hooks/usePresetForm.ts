/**
 * Preset Create Module - usePresetForm Hook
 *
 * Manages preset creation form state and actions.
 */

import { useState, useCallback } from 'react';
import type { PresetData, ValidationErrors } from '../types';
import { DEFAULT_PRESET_DATA } from '../constants/presetConfig';
import { validatePresetData } from '../lib/validation';
import {
  generateEnhancedPrompt,
  generateEnhancedVideoPrompt,
} from '../lib/promptHelpers';

interface UsePresetFormReturn {
  // State
  presetData: PresetData;
  errors: ValidationErrors;
  activeTab: string;
  generatedPreview: string | null;

  // Actions
  updateField: <K extends keyof PresetData>(field: K, value: PresetData[K]) => void;
  updateNestedField: (
    parent: keyof PresetData,
    field: string,
    value: any
  ) => void;
  setActiveTab: (tab: string) => void;
  generatePrompts: () => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  addMarketplaceTag: (tag: string) => void;
  removeMarketplaceTag: (tag: string) => void;
  validate: () => boolean;
  reset: () => void;
  loadPreset: (data: PresetData) => void;
}

export function usePresetForm(): UsePresetFormReturn {
  const [presetData, setPresetData] = useState<PresetData>(DEFAULT_PRESET_DATA);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  // Update a top-level field
  const updateField = useCallback(
    <K extends keyof PresetData>(field: K, value: PresetData[K]) => {
      setPresetData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field
      if (errors[field as keyof ValidationErrors]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as keyof ValidationErrors];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Update a nested field
  const updateNestedField = useCallback(
    (parent: keyof PresetData, field: string, value: any) => {
      setPresetData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent] as any),
          [field]: value,
        },
      }));
    },
    []
  );

  // Generate enhanced prompts
  const generatePrompts = useCallback(() => {
    const enhanced = generateEnhancedPrompt(presetData);
    const enhancedVideo = generateEnhancedVideoPrompt(presetData);

    setPresetData((prev) => ({
      ...prev,
      enhanced_prompt: enhanced,
      enhanced_prompt_video: enhancedVideo,
    }));
  }, [presetData]);

  // Add AI metadata tag
  const addTag = useCallback((tag: string) => {
    if (!tag.trim()) return;

    setPresetData((prev) => ({
      ...prev,
      ai_metadata: {
        ...prev.ai_metadata,
        tags: [...prev.ai_metadata.tags, tag.trim()],
      },
    }));
  }, []);

  // Remove AI metadata tag
  const removeTag = useCallback((tag: string) => {
    setPresetData((prev) => ({
      ...prev,
      ai_metadata: {
        ...prev.ai_metadata,
        tags: prev.ai_metadata.tags.filter((t) => t !== tag),
      },
    }));
  }, []);

  // Add marketplace tag
  const addMarketplaceTag = useCallback((tag: string) => {
    if (!tag.trim()) return;

    setPresetData((prev) => ({
      ...prev,
      marketplace_tags: [...prev.marketplace_tags, tag.trim()],
    }));
  }, []);

  // Remove marketplace tag
  const removeMarketplaceTag = useCallback((tag: string) => {
    setPresetData((prev) => ({
      ...prev,
      marketplace_tags: prev.marketplace_tags.filter((t) => t !== tag),
    }));
  }, []);

  // Validate form
  const validate = useCallback((): boolean => {
    const validationErrors = validatePresetData(presetData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [presetData]);

  // Reset form
  const reset = useCallback(() => {
    setPresetData(DEFAULT_PRESET_DATA);
    setErrors({});
    setActiveTab('basic');
    setGeneratedPreview(null);
  }, []);

  // Load existing preset data
  const loadPreset = useCallback((data: PresetData) => {
    setPresetData(data);
    setErrors({});
  }, []);

  return {
    presetData,
    errors,
    activeTab,
    generatedPreview,
    updateField,
    updateNestedField,
    setActiveTab,
    generatePrompts,
    addTag,
    removeTag,
    addMarketplaceTag,
    removeMarketplaceTag,
    validate,
    reset,
    loadPreset,
  };
}
