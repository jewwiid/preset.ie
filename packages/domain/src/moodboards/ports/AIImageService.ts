export interface AIEnhancementRequest {
  imageUrl: string;
  enhancementType: 'upscale' | 'style-transfer' | 'background-removal';
  style?: string;
}

export interface AIEnhancedImage {
  taskId: string;
  originalUrl: string;
  enhancedUrl: string;
  enhancementType: string;
  cost: number;
}

export interface AIImageService {
  enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage>;
  generateImage(prompt: string): Promise<AIEnhancedImage>;
  extractPalette(imageUrls: string[]): Promise<string[]>;
}

