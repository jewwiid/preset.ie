export interface NanoBananaEnhancement {
  id: string
  url: string
  cost: number
  enhancement_type: string
  prompt: string
  original_url: string
}

export interface EnhancementOptions {
  type: 'lighting' | 'style' | 'background' | 'mood' | 'custom'
  prompt?: string
  intensity?: number // 0-100
}

export class NanoBananaService {
  private apiKey: string
  private baseUrl = 'https://api.nanobana.com/v1'
  
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('NanoBanana API key is required')
    }
    this.apiKey = apiKey
  }
  
  /**
   * Enhance an image using AI
   */
  async enhanceImage(
    imageUrl: string, 
    options: EnhancementOptions
  ): Promise<NanoBananaEnhancement> {
    try {
      // Build the enhancement prompt based on type
      const prompt = this.buildEnhancementPrompt(options)
      
      const response = await fetch(`${this.baseUrl}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: prompt,
          model: 'enhance-v1',
          intensity: options.intensity || 75,
          output_format: 'png',
          preserve_metadata: true
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Enhancement failed')
      }
      
      const data = await response.json()
      
      return {
        id: data.id,
        url: data.enhanced_url,
        cost: 0.025, // Fixed cost per enhancement
        enhancement_type: options.type,
        prompt: prompt,
        original_url: imageUrl
      }
    } catch (error) {
      console.error('NanoBanana enhancement error:', error)
      throw error
    }
  }
  
  /**
   * Generate an image from text prompt
   */
  async generateImage(prompt: string): Promise<{
    id: string
    url: string
    cost: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'generate-v1',
          width: 1024,
          height: 1024,
          output_format: 'png'
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Generation failed')
      }
      
      const data = await response.json()
      
      return {
        id: data.id,
        url: data.generated_url,
        cost: 0.05 // Fixed cost per generation
      }
    } catch (error) {
      console.error('NanoBanana generation error:', error)
      throw error
    }
  }
  
  /**
   * Build enhancement prompt based on type
   */
  private buildEnhancementPrompt(options: EnhancementOptions): string {
    const { type, prompt } = options
    
    if (prompt && type === 'custom') {
      return prompt
    }
    
    const prompts = {
      lighting: 'Enhance lighting, improve exposure, balance shadows and highlights, make colors more vibrant',
      style: 'Apply artistic style enhancement, improve composition, enhance visual appeal',
      background: 'Improve background, remove distractions, enhance depth and focus',
      mood: 'Enhance mood and atmosphere, adjust color grading, improve emotional impact',
      custom: prompt || 'General image enhancement'
    }
    
    return prompts[type] || prompts.custom
  }
  
  /**
   * Check API status
   */
  async checkStatus(): Promise<{
    status: 'operational' | 'degraded' | 'down'
    message: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      
      if (!response.ok) {
        return {
          status: 'down',
          message: 'API is currently unavailable'
        }
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return {
        status: 'down',
        message: 'Cannot connect to NanoBanana API'
      }
    }
  }
  
  /**
   * Get usage statistics
   */
  async getUsage(): Promise<{
    credits_used: number
    credits_remaining: number
    enhancements_today: number
    generations_today: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/usage`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch usage:', error)
      throw error
    }
  }
}