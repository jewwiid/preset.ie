/**
 * Image optimization utilities for Supabase Storage
 * Supabase uses imgproxy for automatic image transformation
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  resize?: 'fit' | 'fill' | 'cover';
}

/**
 * Optimizes a Supabase storage URL with transformation parameters
 * Uses Supabase's built-in image transformation (imgproxy)
 *
 * @param url - Original Supabase storage URL
 * @param options - Transformation options
 * @returns Optimized URL with transformation parameters
 */
export function optimizeSupabaseImage(
  url: string,
  options: ImageTransformOptions = {}
): string {
  if (!url || !url.includes('supabase.co/storage')) {
    return url;
  }

  const {
    width,
    height,
    quality = 85,
    format = 'webp',
    resize = 'cover'
  } = options;

  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams();

    // Add transformation parameters
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    params.set('format', format);
    params.set('resize', resize);

    // Construct optimized URL
    return `${urlObj.origin}${urlObj.pathname}?${params.toString()}`;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return url;
  }
}

/**
 * Preset sizes for common image use cases
 */
export const IMAGE_SIZES = {
  hero: { width: 1920, height: 1080, quality: 90 },
  roleCard: { width: 400, height: 500, quality: 85 },
  thumbnail: { width: 300, height: 300, quality: 80 },
  avatar: { width: 200, height: 200, quality: 85 },
  coverBanner: { width: 1200, height: 400, quality: 90 },
  sectionImage: { width: 800, height: 600, quality: 85 },
} as const;

/**
 * Generate responsive image srcset for Next.js Image component
 */
export function generateImageSrcSet(url: string, sizes: number[]): string {
  return sizes
    .map(size => {
      const optimizedUrl = optimizeSupabaseImage(url, { width: size, quality: 85 });
      return `${optimizedUrl} ${size}w`;
    })
    .join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(url: string, options: ImageTransformOptions = {}) {
  if (typeof window === 'undefined') return;

  const optimizedUrl = optimizeSupabaseImage(url, options);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = optimizedUrl;

  if (options.format === 'webp') {
    link.type = 'image/webp';
  }

  document.head.appendChild(link);
}
