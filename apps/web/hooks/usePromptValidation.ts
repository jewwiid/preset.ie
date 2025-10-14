'use client';

import { useMemo } from 'react';

interface ValidationParams {
  prompt: string;
  style: string;
  resolution: string;
  aspectRatio: string;
  generationMode: 'text-to-image' | 'image-to-image';
  imageUrl?: string;
}

interface ValidationState {
  prompt: boolean;
  style: boolean;
  resolution: boolean;
  aspectRatio: boolean;
  generationMode: boolean;
  imageUrl: boolean;
}

export function usePromptValidation(params: ValidationParams) {
  const validationState: ValidationState = useMemo(() => {
    return {
      prompt: params.prompt.trim().length > 0,
      style: params.style.trim().length > 0,
      resolution: params.resolution.trim().length > 0,
      aspectRatio: params.aspectRatio.trim().length > 0,
      generationMode: ['text-to-image', 'image-to-image'].includes(params.generationMode),
      imageUrl:
        params.generationMode === 'text-to-image'
          ? true
          : Boolean(params.imageUrl && params.imageUrl.trim().length > 0),
    };
  }, [
    params.prompt,
    params.style,
    params.resolution,
    params.aspectRatio,
    params.generationMode,
    params.imageUrl,
  ]);

  const validateInputs = useMemo(() => {
    const errors: string[] = [];

    if (!validationState.prompt) {
      errors.push('Prompt is required');
    }
    if (!validationState.style) {
      errors.push('Style is required');
    }
    if (!validationState.resolution) {
      errors.push('Resolution is required');
    }
    if (!validationState.aspectRatio) {
      errors.push('Aspect ratio is required');
    }
    if (!validationState.generationMode) {
      errors.push('Generation mode is required');
    }
    if (!validationState.imageUrl && params.generationMode === 'image-to-image') {
      errors.push('Base image is required for image-to-image mode');
    }

    return errors;
  }, [validationState, params.generationMode]);

  const isInputValid = useMemo(() => {
    return Object.values(validationState).every((isValid) => isValid);
  }, [validationState]);

  return {
    validationState,
    validateInputs,
    isInputValid,
  };
}
