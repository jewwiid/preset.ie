import { AIImageService, AIEnhancementRequest, AIEnhancedImage } from '@preset/domain';

export class NanoBananaService implements AIImageService {
  private readonly baseUrl = 'https://api.wavespeed.ai/api/v3';
  private readonly callbackUrl: string;

  constructor(private apiKey: string, callbackUrl: string) {
    if (!apiKey) {
      throw new Error('WaveSpeed API key is required');
    }
    this.callbackUrl = callbackUrl;
  }

  async enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage> {
    const prompt = request.style || this.getDefaultPrompt(request.enhancementType);

    try {
      // For image enhancement, we'll use WaveSpeed's image editing capabilities
      // Note: This might need to be adjusted based on available WaveSpeed endpoints
      const endpoint = this.getWaveSpeedEndpointForType(request.enhancementType);
      
      const taskResponse = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: request.imageUrl,
          prompt,
          output_format: 'png',
          enable_sync_mode: false,
          enable_base64_output: false
        })
      });

      if (!taskResponse.ok) {
        const errorData = await taskResponse.text();
        throw new Error(`WaveSpeed API error: ${taskResponse.status} - ${errorData}`);
      }

      const taskData = await taskResponse.json();
      
      // WaveSpeed uses async tasks, need to poll for results
      // Initial response has data wrapped in a 'data' property
      return {
        taskId: taskData.data?.id || taskData.id,
        originalUrl: request.imageUrl,
        enhancedUrl: '', // Will be filled by polling
        enhancementType: request.enhancementType,
        cost: 0.10
      };
    } catch (error) {
      console.error('WaveSpeed enhancement error:', error);
      throw error;
    }
  }

  async generateImage(prompt: string): Promise<AIEnhancedImage> {
    try {
      // Submit task to WaveSpeed's nano-banana endpoint
      const response = await fetch(`${this.baseUrl}/google/nano-banana/text-to-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Professional photography style, ${prompt}, high quality, creative composition`,
          output_format: 'png',
          enable_sync_mode: false,
          enable_base64_output: false
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`WaveSpeed API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('WaveSpeed initial response:', JSON.stringify(data, null, 2));
      
      // WaveSpeed returns task info immediately, need to poll for results
      // Initial response has data wrapped in a 'data' property
      return {
        taskId: data.data?.id || data.id,
        originalUrl: '',
        enhancedUrl: '', // Will be filled by polling
        enhancementType: 'generated',
        cost: 0.10 // Default cost, adjust as needed
      };
    } catch (error) {
      console.error('WaveSpeed generation error:', error);
      throw error;
    }
  }

  async getTaskResult(taskId: string): Promise<AIEnhancedImage | null> {
    try {
      const response = await fetch(`${this.baseUrl}/predictions/${taskId}/result`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Task not found or still processing
        }
        const errorData = await response.text();
        throw new Error(`WaveSpeed API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('WaveSpeed task result data:', JSON.stringify(data, null, 2));
      
      // WaveSpeed returns the data directly, not wrapped in a data property
      if (data.status === 'completed' && data.outputs?.length > 0) {
        return {
          taskId: data.id,
          originalUrl: '',
          enhancedUrl: data.outputs[0],
          enhancementType: 'generated',
          cost: 0.10
        };
      } else if (data.status === 'failed') {
        throw new Error(`Task failed: ${data.error || 'Unknown error'}`);
      }
      
      return null; // Still processing
    } catch (error) {
      console.error('WaveSpeed task result error:', error);
      throw error;
    }
  }

  async waitForTaskCompletion(taskId: string, maxWaitTime: number = 60000, pollInterval: number = 2000): Promise<AIEnhancedImage> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.getTaskResult(taskId);
      
      if (result && result.enhancedUrl) {
        return result;
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error(`Task ${taskId} did not complete within ${maxWaitTime}ms`);
  }

  async extractPalette(imageUrls: string[]): Promise<string[]> {
    // For now, return a placeholder palette
    // This could be implemented with a color extraction service
    return ['#FF5733', '#33FF57', '#3357FF', '#F3F3F3', '#1A1A1A'];
  }

  private getWaveSpeedEndpointForType(type: string): string {
    // Map enhancement types to WaveSpeed endpoints
    const endpoints: Record<string, string> = {
      'upscale': 'image-upscaler', // WaveSpeed has image upscaler
      'style-transfer': 'google/nano-banana/text-to-image', // Use nano-banana for style transfer
      'background-removal': 'image-background-remover', // WaveSpeed has background remover
    };
    return endpoints[type] || 'google/nano-banana/text-to-image';
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