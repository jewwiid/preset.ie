'use client';

import { useState, useEffect } from 'react';
import type { CinematicParameters } from '@preset/types';

interface UseVideoGenerationStateOptions {
  initialAspectRatio?: string;
  selectedProvider?: 'seedream' | 'wan';
  selectedPreset?: any;
  onAspectRatioChange?: (aspectRatio: string) => void;
  onResolutionChange?: (resolution: string) => void;
}

export function useVideoGenerationState({
  initialAspectRatio = '16:9',
  selectedProvider = 'seedream',
  selectedPreset,
  onAspectRatioChange,
  onResolutionChange,
}: UseVideoGenerationStateOptions) {
  // Form state
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoResolution, setVideoResolution] = useState('480p');
  const [motionType, setMotionType] = useState('smooth');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(initialAspectRatio);
  const [imageYPosition, setImageYPosition] = useState(0);
  const [videoStyle, setVideoStyle] = useState('');
  const [videoSubject, setVideoSubject] = useState('');
  const [styledImageUrl, setStyledImageUrl] = useState<string | null>(null);

  // Cinematic parameters state
  const [enableCinematicMode, setEnableCinematicMode] = useState(false);
  const [cinematicParameters, setCinematicParameters] = useState<Partial<CinematicParameters>>({});
  const [includeTechnicalDetails, setIncludeTechnicalDetails] = useState(true);
  const [includeStyleReferences, setIncludeStyleReferences] = useState(true);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');

  // Image source state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeImageSource, setActiveImageSource] = useState<'selected' | 'uploaded' | 'saved' | 'pexels'>('selected');
  const [imageAttribution, setImageAttribution] = useState<{
    source: 'pexels' | 'url' | 'upload' | 'saved';
    photographer?: string;
    photographer_url?: string;
    photographer_id?: number;
    original_url?: string;
  } | null>(null);

  // Loading states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [applyingStyle, setApplyingStyle] = useState(false);

  // Auto-correct duration when switching to Wan (only allows 5 or 10)
  useEffect(() => {
    if (selectedProvider === 'wan' && videoDuration !== 5 && videoDuration !== 10) {
      const validDuration = videoDuration < 7.5 ? 5 : 10;
      setVideoDuration(validDuration);
    }
  }, [selectedProvider, videoDuration]);

  // Load preset when selectedPreset changes
  useEffect(() => {
    if (selectedPreset) {
      // Set prompt from preset
      if (selectedPreset.prompt_template_video || selectedPreset.prompt_template) {
        const promptToUse = selectedPreset.prompt_template_video || selectedPreset.prompt_template;
        setVideoPrompt(promptToUse);
      }

      // Set aspect ratio from preset
      const presetAspectRatio =
        selectedPreset.cinematic_settings?.cinematicParameters?.aspectRatio ||
        selectedPreset.technical_settings?.aspect_ratio ||
        selectedPreset.technical_settings?.aspectRatio;

      if (presetAspectRatio) {
        setSelectedAspectRatio(presetAspectRatio);
        onAspectRatioChange?.(presetAspectRatio);
      }

      // Set resolution from preset
      let presetResolution =
        selectedPreset.cinematic_settings?.video?.resolution ||
        selectedPreset.technical_settings?.resolution;

      if (presetResolution) {
        if (!presetResolution.includes('p')) {
          const resNum = parseInt(presetResolution);
          presetResolution = resNum >= 720 ? '720p' : '480p';
        }
        setVideoResolution(presetResolution);
        onResolutionChange?.(presetResolution);
      }

      // Set cinematic parameters if available
      if (selectedPreset.cinematic_settings) {
        setEnableCinematicMode(true);
        setCinematicParameters(selectedPreset.cinematic_settings.cinematicParameters || {});

        // Load video-specific settings
        if (selectedPreset.cinematic_settings.video) {
          const {
            cameraMovement: presetCamera,
            videoStyle: presetStyle,
            duration: presetDuration,
          } = selectedPreset.cinematic_settings.video;

          if (presetCamera) setMotionType(presetCamera);
          if (presetStyle) setVideoStyle(presetStyle);
          if (presetDuration) setVideoDuration(presetDuration);
        }

        // Load detail settings
        if (typeof selectedPreset.cinematic_settings.includeTechnicalDetails === 'boolean') {
          setIncludeTechnicalDetails(selectedPreset.cinematic_settings.includeTechnicalDetails);
        }
        if (typeof selectedPreset.cinematic_settings.includeStyleReferences === 'boolean') {
          setIncludeStyleReferences(selectedPreset.cinematic_settings.includeStyleReferences);
        }
      }
    }
  }, [selectedPreset]);

  return {
    // Form state
    videoDuration,
    setVideoDuration,
    videoResolution,
    setVideoResolution,
    motionType,
    setMotionType,
    videoPrompt,
    setVideoPrompt,
    selectedAspectRatio,
    setSelectedAspectRatio,
    imageYPosition,
    setImageYPosition,
    videoStyle,
    setVideoStyle,
    videoSubject,
    setVideoSubject,
    styledImageUrl,
    setStyledImageUrl,

    // Cinematic parameters
    enableCinematicMode,
    setEnableCinematicMode,
    cinematicParameters,
    setCinematicParameters,
    includeTechnicalDetails,
    setIncludeTechnicalDetails,
    includeStyleReferences,
    setIncludeStyleReferences,
    enhancedPrompt,
    setEnhancedPrompt,

    // Image source
    uploadedImage,
    setUploadedImage,
    activeImageSource,
    setActiveImageSource,
    imageAttribution,
    setImageAttribution,

    // Loading states
    isEnhancing,
    setIsEnhancing,
    applyingStyle,
    setApplyingStyle,
  };
}
