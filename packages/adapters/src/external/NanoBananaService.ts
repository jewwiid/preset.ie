import { AIImageService, AIEnhancementRequest, AIEnhancedImage } from '@preset/domain/moodboards/ports/AIImageService';

export class NanoBananaService implements AIImageService {
  private readonly baseUrl = 'https://api.nanobanana.com/v1';
  private readonly callbackUrl: string;

  constructor(private apiKey: string, callbackUrl: string) {
    if (!apiKey) {
      throw new Error('NanoBanana API key is required');
    }
    this.callbackUrl = callbackUrl;
  }

  async enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage> {
    const model = this.getModelForType(request.enhancementType);
    const prompt = request.style || this.getDefaultPrompt(request.enhancementType);

    try {
      // Submit task with callback URL - NanoBanana doesn't have polling
      const taskResponse = await fetch(`${this.baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'IMAGETOIMAGE',
          input: {
            image: request.imageUrl,
            model,
            prompt,
            negativePrompt: 'blur, distortion, artifacts',
            width: 1024,
            height: 1024,
            guidanceScale: 7.5,
            strength: 0.75,
            numInferenceSteps: 30,
            numOutputs: 1,
          },
          callbackUrl: this.callbackUrl,
        })
      });

      if (!taskResponse.ok) {
        const errorData = await taskResponse.text();
        throw new Error(`NanoBanana API error: ${taskResponse.status} - ${errorData}`);
      }

      const taskData = await taskResponse.json();
      
      // NanoBanana uses callbacks, not polling
      // Return task info, enhanced URL will come via callback
      return {
        taskId: taskData.id,
        originalUrl: request.imageUrl,
        enhancedUrl: '', // Will be filled by callback
        enhancementType: request.enhancementType,
        cost: taskData.cost || 0.10
      };
    } catch (error) {
      console.error('NanoBanana enhancement error:', error);
      throw error;
    }
  }

  async generateImage(prompt: string): Promise<AIEnhancedImage> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'TEXTTOIMAGE',
          input: {
            model: 'sdxl-lightning',
            prompt: `Professional photography style, ${prompt}, high quality, creative composition`,
            negativePrompt: 'blur, distortion, artifacts',
            width: 1024,
            height: 1024,
            guidanceScale: 7.5,
            numInferenceSteps: 30,
            numOutputs: 1,
          },
          callbackUrl: this.callbackUrl,
        })
      });

      if (!response.ok) {
        throw new Error(`NanoBanana API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        taskId: data.id,
        originalUrl: '',
        enhancedUrl: '', // Will be filled by callback
        enhancementType: 'generated',
        cost: data.cost || 0.10
      };
    } catch (error) {
      console.error('NanoBanana generation error:', error);
      throw error;
    }
  }

  async extractPalette(imageUrls: string[]): Promise<string[]> {
    // For now, return a placeholder palette
    // This could be implemented with a color extraction service
    return ['#FF5733', '#33FF57', '#3357FF', '#F3F3F3', '#1A1A1A'];
  }

  private getModelForType(type: string): string {
    const models: Record<string, string> = {
      'upscale': 'realesrgan',
      'style-transfer': 'sdxl-lightning',
      'background-removal': 'rembg',
    };
    return models[type] || 'sdxl-lightning';
  }

  private getDefaultPrompt(type: string): string {
    const prompts: Record<string, string> = {
      'upscale': 'high resolution, sharp details, professional quality',
      'style-transfer': 'artistic style, creative interpretation',
      'background-removal': 'transparent background, clean edges',
    };
    return prompts[type] || 'enhanced image';
  }
}