/**
 * Watermark utility functions for adding watermarks to images
 */

export interface WatermarkOptions {
  opacity?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  size?: number;
  margin?: number;
}

const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
  opacity: 0.7,
  position: 'bottom-right',
  size: 60,
  margin: 20
};

/**
 * Creates a simple text watermark as fallback
 */
function createTextWatermark(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, config: WatermarkOptions): void {
  const text = 'PRESET';
  const fontSize = Math.min(canvas.width, canvas.height) * 0.05; // 5% of smaller dimension
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.lineWidth = 2;
  
  const { x, y } = calculateWatermarkPosition(
    canvas.width,
    canvas.height,
    ctx.measureText(text).width,
    fontSize,
    config
  );
  
  ctx.globalAlpha = config.opacity!;
  ctx.strokeText(text, x, y + fontSize);
  ctx.fillText(text, x, y + fontSize);
  ctx.globalAlpha = 1.0;
}

/**
 * Adds a watermark to an image using canvas
 * @param imageUrl - The URL of the image to watermark
 * @param watermarkSvg - The SVG content for the watermark
 * @param options - Watermark configuration options
 * @returns Promise<string> - The watermarked image as a data URL
 */
export async function addWatermarkToImage(
  imageUrl: string,
  watermarkSvg: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const config = { ...DEFAULT_WATERMARK_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Create watermark image from SVG
        const watermarkImg = new Image();
        
        // Convert SVG to image
        const svgBlob = new Blob([watermarkSvg], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        // Add timeout for watermark loading
        const timeout = setTimeout(() => {
          URL.revokeObjectURL(svgUrl);
          
          // Fallback to text watermark on timeout
          try {
            createTextWatermark(canvas, ctx, config);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUrl);
          } catch (fallbackError) {
            reject(new Error('Watermark loading timeout and fallback failed'));
          }
        }, 5000); // 5 second timeout
        
        watermarkImg.onload = () => {
          try {
            clearTimeout(timeout);
            URL.revokeObjectURL(svgUrl);
            
            // Calculate watermark position
            const { x, y } = calculateWatermarkPosition(
              canvas.width,
              canvas.height,
              watermarkImg.width,
              watermarkImg.height,
              config
            );
            
            // Set opacity
            ctx.globalAlpha = config.opacity!;
            
            // Draw watermark
            ctx.drawImage(
              watermarkImg,
              x,
              y,
              config.size!,
              config.size!
            );
            
            // Reset opacity
            ctx.globalAlpha = 1.0;
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUrl);
          } catch (error) {
            reject(error);
          }
        };
        
        watermarkImg.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(svgUrl);
          
          // Fallback to text watermark
          try {
            createTextWatermark(canvas, ctx, config);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(dataUrl);
          } catch (fallbackError) {
            reject(new Error('Failed to load watermark image and fallback failed'));
          }
        };
        
        watermarkImg.src = svgUrl;
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Calculates the position for the watermark based on the configuration
 */
function calculateWatermarkPosition(
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  config: WatermarkOptions
): { x: number; y: number } {
  const margin = config.margin || 20;
  const size = config.size || 60;
  
  switch (config.position) {
    case 'top-left':
      return { x: margin, y: margin };
    case 'top-right':
      return { x: canvasWidth - size - margin, y: margin };
    case 'bottom-left':
      return { x: margin, y: canvasHeight - size - margin };
    case 'bottom-right':
      return { x: canvasWidth - size - margin, y: canvasHeight - size - margin };
    case 'center':
      return { 
        x: (canvasWidth - size) / 2, 
        y: (canvasHeight - size) / 2 
      };
    default:
      return { x: canvasWidth - size - margin, y: canvasHeight - size - margin };
  }
}

/**
 * Downloads an image with optional watermark for free users
 * @param imageUrl - The URL of the image to download
 * @param filename - The filename for the download
 * @param isPaidUser - Whether the user is a paid subscriber
 * @param watermarkSvg - The SVG watermark to add for free users
 */
export async function downloadImageWithWatermark(
  imageUrl: string,
  filename: string,
  isPaidUser: boolean,
  watermarkSvg?: string
): Promise<void> {
  try {
    let finalImageUrl = imageUrl;
    
    // Add watermark for free users
    if (!isPaidUser && watermarkSvg) {
      try {
        finalImageUrl = await addWatermarkToImage(imageUrl, watermarkSvg);
      } catch (watermarkError) {
        console.warn('Failed to add watermark, downloading original image:', watermarkError);
        // Fallback to original image if watermarking fails
        finalImageUrl = imageUrl;
      }
    }
    
    // Create download link
    const response = await fetch(finalImageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}
