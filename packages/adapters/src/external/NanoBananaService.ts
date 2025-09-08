import { AIImageService, AIEnhancementRequest, AIEnhancedImage } from '../../domain/moodboards/ports/AIImageService';

export interface NanoBananaTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    output_image: string;
    cost: number;
  };
  error?: string;
}

export class NanoBananaService implements AIImageService {
  private readonly baseUrl = 'https://api.nanobanana.ai';

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('NanoBanana API key is required');
    }
  }

  async enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage> {
    const enhancementPrompt = this.buildEnhancementPrompt(request);

    try {
      // Step 1: Submit enhancement task
      const taskResponse = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_image: request.inputImageUrl,
          prompt: enhancementPrompt,
          strength: request.strength || 0.8,
          aspect_ratio: '4:3',
          num_inference_steps: 20
        })
      });

      if (!taskResponse.ok) {
        const errorData = await taskResponse.json();
        throw new Error(`NanoBanana API error: ${taskResponse.status} - ${errorData.message || 'Unknown error'}`);
      }

      const taskData = await taskResponse.json();
      const taskId = taskData.id;

      // Step 2: Poll for completion
      const result = await this.pollForCompletion(taskId);
      
      return {
        id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: request.inputImageUrl,
        enhancedUrl: result.output_image,
        enhancementType: request.enhancementType,
        prompt: enhancementPrompt,
        cost: result.cost || 0.025
      };
    } catch (error) {
      console.error('NanoBanana enhancement error:', error);
      throw error;
    }
  }

  private async pollForCompletion(taskId: string, maxAttempts: number = 30): Promise<{ output_image: string; cost: number }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to check task status: ${response.status}`);
        }

        const taskData: NanoBananaTask = await response.json();

        if (taskData.status === 'completed' && taskData.result) {
          return taskData.result;
        }

        if (taskData.status === 'failed') {
          throw new Error(`Task failed: ${taskData.error || 'Unknown error'}`);
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Task did not complete within expected time');
  }

  async generateImage(prompt: string): Promise<AIEnhancedImage> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Professional photography style, ${prompt}, high quality, creative composition`,
          aspect_ratio: '4:3',
          num_inference_steps: 25,
          guidance_scale: 7.5
        })
      });

      if (!response.ok) {
        throw new Error(`NanoBanana API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: '',
        enhancedUrl: data.output_image,
        enhancementType: 'generation',
        prompt,
        cost: 0.025
      };
    } catch (error) {
      console.error('NanoBanana generation error:', error);
      throw error;
    }
  }

  private buildEnhancementPrompt(request: AIEnhancementRequest): string {
    const templates = {
      'lighting': `Adjust the lighting in this image to create ${request.prompt} atmosphere, enhance shadows and highlights professionally`,
      'style': `Apply ${request.prompt} artistic style to this image while maintaining the subject and composition`,
      'background': `Replace or enhance the background with ${request.prompt}, keep the main subject unchanged`,
      'mood': `Enhance the overall mood and atmosphere to be ${request.prompt}, adjust colors and contrast accordingly`,
      'custom': request.prompt
    };

    return templates[request.enhancementType] || request.prompt;
  }
}
