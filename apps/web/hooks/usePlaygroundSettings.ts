'use client';

import { useState, useCallback } from 'react';

interface PlaygroundSettings {
  aspectRatio: string;
  resolution: string;
  baseImageAspectRatio?: string;
  baseImageUrl?: string;
  style: string;
  generationMode: 'text-to-image' | 'image-to-image';
  selectedProvider: string;
  consistencyLevel: string;
  prompt: string;
  enhancedPrompt: string;
}

export function usePlaygroundSettings() {
  const [currentSettings, setCurrentSettings] = useState<PlaygroundSettings>({
    aspectRatio: '1:1',
    resolution: '1024',
    baseImageAspectRatio: undefined,
    baseImageUrl: undefined,
    style: '',
    generationMode: 'text-to-image',
    selectedProvider: 'nanobanana',
    consistencyLevel: 'high',
    prompt: '',
    enhancedPrompt: '',
  });

  const updateSettings = useCallback((updates: Partial<PlaygroundSettings>) => {
    setCurrentSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleStyleChange = useCallback((style: string) => {
    updateSettings({ style });
  }, [updateSettings]);

  const handleGenerationModeChange = useCallback((mode: 'text-to-image' | 'image-to-image') => {
    updateSettings({ generationMode: mode });
  }, [updateSettings]);

  const handleResolutionChange = useCallback((resolution: string) => {
    updateSettings({ resolution });
  }, [updateSettings]);

  const handleProviderChange = useCallback((provider: string) => {
    updateSettings({ selectedProvider: provider });
  }, [updateSettings]);

  const handleConsistencyChange = useCallback((consistency: string) => {
    updateSettings({ consistencyLevel: consistency });
  }, [updateSettings]);

  const handlePromptChange = useCallback((prompt: string) => {
    updateSettings({ prompt });
  }, [updateSettings]);

  const handleEnhancedPromptChange = useCallback((enhancedPrompt: string) => {
    updateSettings({ enhancedPrompt });
  }, [updateSettings]);

  return {
    currentSettings,
    updateSettings,
    handleStyleChange,
    handleGenerationModeChange,
    handleResolutionChange,
    handleProviderChange,
    handleConsistencyChange,
    handlePromptChange,
    handleEnhancedPromptChange,
  };
}
