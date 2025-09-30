'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PlatformImage {
  id: string;
  image_key: string;
  image_type: string;
  category?: string;
  image_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  title?: string;
  description?: string;
  width: number;
  height: number;
  file_size: number;
  format: string;
  usage_context?: any;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface UseHomepageImagesOptions {
  preload?: boolean;
  cacheStrategy?: 'aggressive' | 'moderate' | 'conservative';
}

export interface UseHomepageImagesReturn {
  images: PlatformImage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHomepageImages(options: UseHomepageImagesOptions = {}): UseHomepageImagesReturn {
  const [images, setImages] = useState<PlatformImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/platform-images?type=homepage&active=true');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const data = await response.json();
      setImages(data.images || []);

      // Preload images if requested
      if (options.preload) {
        data.images?.forEach((image: PlatformImage) => {
          if (image.image_url) {
            const img = new Image();
            img.src = image.image_url;
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
      console.error('Error fetching homepage images:', err);
    } finally {
      setLoading(false);
    }
  }, [options.preload]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return {
    images,
    loading,
    error,
    refetch: fetchImages
  };
}

export interface UsePreloadCriticalImagesOptions {
  cacheStrategy?: 'aggressive' | 'moderate' | 'conservative';
}

export function usePreloadCriticalImages(options: UsePreloadCriticalImagesOptions = {}): void {
  useEffect(() => {
    const preloadCriticalImages = async () => {
      try {
        // Preload homepage hero image
        const heroImg = new Image();
        heroImg.src = '/hero-bg.jpeg';
        
        // Preload other critical images
        const criticalImages = [
          '/images/homepage/feature-gigs.jpg',
          '/images/homepage/feature-showcases.jpg',
          '/images/homepage/feature-safety.jpg'
        ];

        criticalImages.forEach(src => {
          const img = new Image();
          img.src = src;
        });
      } catch (error) {
        console.warn('Failed to preload critical images:', error);
      }
    };

    preloadCriticalImages();
  }, [options.cacheStrategy]);
}

export interface UsePresetVisualAidsOptions {
  presetKey?: string;
  active?: boolean;
}

export interface UsePresetVisualAidsReturn {
  visualAids: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePresetVisualAids(options: UsePresetVisualAidsOptions = {}): UsePresetVisualAidsReturn {
  const [visualAids, setVisualAids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisualAids = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.presetKey) params.append('preset_key', options.presetKey);
      if (options.active !== undefined) params.append('active', options.active.toString());

      const response = await fetch(`/api/preset-visual-aids?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch visual aids: ${response.statusText}`);
      }

      const data = await response.json();
      setVisualAids(data.visualAids || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch visual aids');
      console.error('Error fetching preset visual aids:', err);
    } finally {
      setLoading(false);
    }
  }, [options.presetKey, options.active]);

  useEffect(() => {
    fetchVisualAids();
  }, [fetchVisualAids]);

  return {
    visualAids,
    loading,
    error,
    refetch: fetchVisualAids
  };
}