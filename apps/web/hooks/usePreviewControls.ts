'use client';

import { useState, useEffect, useMemo } from 'react';

export interface PreviewImage {
  url: string;
  width: number;
  height: number;
  generated_at: string;
  type?: string;
}

export interface UsePreviewControlsOptions {
  images?: PreviewImage[];
  onError?: (error: string) => void;
}

/**
 * Manages preview control state:
 * - Grid overlay settings
 * - Base image vs generated image toggle
 * - Available styles fetching
 * - Image filtering logic
 */
export function usePreviewControls({ images, onError }: UsePreviewControlsOptions) {
  const [showBaseImage, setShowBaseImage] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [gridType, setGridType] = useState<'horizontal' | 'rule-of-thirds'>('horizontal');
  const [availableStyles, setAvailableStyles] = useState<Array<{ style_name: string; display_name: string }>>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  // Fetch available styles from database
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        setLoadingStyles(true);
        const response = await fetch('/api/style-prompts');
        if (response.ok) {
          const data = await response.json();
          setAvailableStyles(data.stylePrompts || []);
        } else {
          console.error('Failed to fetch styles');
          onError?.('Failed to fetch styles');
        }
      } catch (error) {
        console.error('Error fetching styles:', error);
        onError?.('Error fetching styles');
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchStyles();
  }, [onError]);

  // Separate base images from generated images - memoized to prevent infinite loops
  const baseImages = useMemo(() => (images || []).filter(img => img.type === 'base'), [images]);
  const generatedImages = useMemo(() => (images || []).filter(img => img.type !== 'base'), [images]);

  // Auto-show base image when it exists and no generated images are present
  useEffect(() => {
    const hasBaseImages = baseImages.length > 0;
    const hasGeneratedImages = generatedImages.length > 0;

    // If there are base images but no generated images, show base images by default
    if (hasBaseImages && !hasGeneratedImages) {
      setShowBaseImage(true);
    }
    // If there are generated images, show them by default
    else if (hasGeneratedImages) {
      setShowBaseImage(false);
    }
  }, [baseImages, generatedImages]);

  // Show generated images by default when they exist, otherwise show base images
  const imagesToDisplay = showBaseImage ? baseImages : generatedImages.length > 0 ? generatedImages : baseImages;

  return {
    // Grid overlay state
    showGridOverlay,
    setShowGridOverlay,
    gridType,
    setGridType,

    // Image toggle state
    showBaseImage,
    setShowBaseImage,

    // Styles state
    availableStyles,
    loadingStyles,

    // Filtered images
    baseImages,
    generatedImages,
    imagesToDisplay,
  };
}
