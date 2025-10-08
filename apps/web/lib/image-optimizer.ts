/**
 * Image optimization utilities for faster API processing
 */

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

/**
 * Optimize image for AI processing
 * Reduces file size while maintaining quality for AI enhancement
 */
export async function optimizeImageForAPI(
  imageUrl: string,
  options: OptimizationOptions = {}
): Promise<{ optimizedUrl: string; originalSize: number; optimizedSize: number }> {
  const {
    maxWidth = 1024,  // NanoBanana works well with 1024px
    maxHeight = 1024,
    quality = 0.85,   // Good balance of quality vs size
    format = 'jpeg'
  } = options;

  try {
    // If using Cloudinary or similar CDN, use their optimization params
    if (imageUrl.includes('cloudinary.com')) {
      const optimizedUrl = imageUrl.replace('/upload/', `/upload/w_${maxWidth},h_${maxHeight},c_limit,q_${quality * 100},f_${format}/`);
      return {
        optimizedUrl,
        originalSize: 0, // Can't determine without fetching
        optimizedSize: 0
      };
    }

    // If using Unsplash, use their optimization params
    if (imageUrl.includes('unsplash.com')) {
      const url = new URL(imageUrl);
      url.searchParams.set('w', maxWidth.toString());
      url.searchParams.set('q', (quality * 100).toString());
      url.searchParams.set('fm', format);
      url.searchParams.set('fit', 'max');
      return {
        optimizedUrl: url.toString(),
        originalSize: 0,
        optimizedSize: 0
      };
    }

    // If using Pexels, use their size variants
    if (imageUrl.includes('pexels.com')) {
      // Pexels provides different size URLs
      const optimizedUrl = imageUrl.replace(/\?.*$/, `?auto=compress&cs=tinysrgb&w=${maxWidth}`);
      return {
        optimizedUrl,
        originalSize: 0,
        optimizedSize: 0
      };
    }

    // For Supabase storage, add transformation params
    if (imageUrl.includes('supabase.co/storage')) {
      // Supabase doesn't have built-in image transformation yet
      // Return original URL but we'll handle client-side compression
      return {
        optimizedUrl: imageUrl,
        originalSize: 0,
        optimizedSize: 0
      };
    }

    // Default: return original URL
    // In production, you might want to proxy through your own optimization service
    return {
      optimizedUrl: imageUrl,
      originalSize: 0,
      optimizedSize: 0
    };
  } catch (error) {
    console.error('Image optimization error:', error);
    return {
      optimizedUrl: imageUrl,
      originalSize: 0,
      optimizedSize: 0
    };
  }
}

/**
 * Client-side image compression using Canvas API
 * This runs in the browser before uploading
 */
export async function compressImageClientSide(
  file: File,
  options: OptimizationOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.85,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          `image/${format}`,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Preload images to browser cache for faster processing
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload ${url}`));
        img.src = url;
      });
    })
  );
}

/**
 * Get image dimensions without loading the full image
 */
export async function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Convert image URL to base64 (useful for small images)
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Estimate processing time based on image size
 */
export function estimateProcessingTime(
  width: number,
  height: number,
  enhancementType: string
): { min: number; max: number } {
  const pixels = width * height;
  const megapixels = pixels / 1000000;
  
  // Base time in seconds
  const baseTime = 20;
  
  // Adjust based on enhancement type
  const typeMultipliers: Record<string, number> = {
    'lighting': 1.0,
    'style': 1.5,
    'background': 2.0,
    'mood': 1.2,
    'custom': 1.8
  };
  
  const multiplier = typeMultipliers[enhancementType] || 1.5;
  
  // Add time based on image size (larger images take longer)
  const sizeMultiplier = 1 + (megapixels / 5); // Add 20% per megapixel over 5MP
  
  const estimatedTime = baseTime * multiplier * Math.min(sizeMultiplier, 2);
  
  return {
    min: Math.floor(estimatedTime * 0.8),
    max: Math.ceil(estimatedTime * 1.2)
  };
}