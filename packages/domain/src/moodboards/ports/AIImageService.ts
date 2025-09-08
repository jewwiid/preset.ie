export interface AIEnhancementRequest {
  inputImageUrl: string;
  enhancementType: 'lighting' | 'style' | 'background' | 'mood' | 'custom';
  prompt: string;
  strength?: number;
}

export interface AIEnhancedImage {
  id: string;
  originalUrl: string;
  enhancedUrl: string;
  enhancementType: string;
  prompt: string;
  cost: number;
}

export interface AIImageService {
  enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage>;
  generateImage(prompt: string): Promise<AIEnhancedImage>;
}

