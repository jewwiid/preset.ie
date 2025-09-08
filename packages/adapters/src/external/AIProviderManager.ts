import { AIImageService, AIEnhancementRequest, AIEnhancedImage } from '../../domain/moodboards/ports/AIImageService';
import { CreditManager } from '../../application/credits/CreditManager';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AIProvider {
  name: string;
  priority: number;
  costPerRequest: number;
  isHealthy: boolean;
  successRate: number;
  lastError?: string;
  enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage>;
  healthCheck(): Promise<boolean>;
  getSuccessRate(): Promise<number>;
  getLastError(): Promise<string | undefined>;
}

export interface ProviderStatus {
  name: string;
  priority: number;
  isHealthy: boolean;
  costPerRequest: number;
  successRate24h: number;
  lastError?: string;
}

export interface AIEnhancementResult extends AIEnhancedImage {
  provider: string;
  costUsd: number;
}

export interface DegradedResponse {
  type: 'css_filter_fallback' | 'suggestion_fallback' | 'retry_later';
  originalUrl: string;
  enhancedUrl: string;
  cssFilter?: string;
  suggestion?: string;
  retryAfter?: Date;
  message?: string;
  degradationReason: string;
}

export class AIProviderManager {
  private providers: AIProvider[] = [];
  private creditManager: CreditManager;

  constructor(
    private supabase: SupabaseClient,
    private alertService?: AlertService
  ) {
    this.creditManager = new CreditManager(supabase, alertService);
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize providers based on configuration
    this.providers = [
      new NanoBananaProvider({ priority: 1, costPerRequest: 0.025 }),
      new FalAIProvider({ priority: 2, costPerRequest: 0.039 }),
      new KieAIProvider({ priority: 3, costPerRequest: 0.023 }),
      new GoogleDirectProvider({ priority: 4, costPerRequest: 0.039 })
    ].sort((a, b) => a.priority - b.priority);
  }

  async enhanceImageWithFallback(
    request: AIEnhancementRequest,
    userId: string
  ): Promise<AIEnhancementResult | DegradedResponse> {
    const errors: Error[] = [];

    for (const provider of this.providers) {
      try {
        // Check if provider is healthy
        if (!await provider.healthCheck()) {
          console.warn(`Provider ${provider.name} is unhealthy, skipping`);
          continue;
        }

        // Check and consume credits
        const creditResult = await this.creditManager.checkAndConsumeCredits(
          userId,
          1, // 1 credit per enhancement
          request.enhancementType
        );

        // Attempt enhancement
        const result = await provider.enhanceImage(request);

        // Log successful transaction
        await this.creditManager.logCreditTransaction({
          userId,
          provider: provider.name,
          creditsUsed: 1,
          costUsd: creditResult.costUsd,
          enhancementType: request.enhancementType
        });

        return {
          ...result,
          provider: provider.name,
          costUsd: creditResult.costUsd
        };

      } catch (error) {
        errors.push(new Error(`${provider.name}: ${error.message}`));
        
        // Log failed attempt
        await this.creditManager.logCreditTransaction({
          userId,
          provider: provider.name,
          creditsUsed: 0,
          costUsd: 0,
          enhancementType: request.enhancementType
        });

        // Update provider health status
        await this.updateProviderHealth(provider.name, false, error.message);

        continue;
      }
    }

    // All providers failed - provide graceful degradation
    return await this.provideFallbackResponse(request, userId, errors);
  }

  private async provideFallbackResponse(
    request: AIEnhancementRequest,
    userId: string,
    errors: Error[]
  ): Promise<DegradedResponse> {
    // Option 1: Return original image with CSS filters
    if (request.enhancementType === 'lighting') {
      return {
        type: 'css_filter_fallback',
        originalUrl: request.inputImageUrl,
        enhancedUrl: request.inputImageUrl,
        cssFilter: 'brightness(1.2) contrast(1.1) saturate(1.1)',
        message: 'Applied basic lighting adjustment. Upgrade for AI enhancement.',
        degradationReason: errors.map(e => e.message).join(', ')
      };
    }

    // Option 2: Suggest alternative
    return {
      type: 'suggestion_fallback',
      originalUrl: request.inputImageUrl,
      enhancedUrl: request.inputImageUrl,
      suggestion: `Try using "${request.enhancementType}" enhancement during off-peak hours`,
      retryAfter: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      degradationReason: errors.map(e => e.message).join(', ')
    };
  }

  async getProviderStatus(): Promise<ProviderStatus[]> {
    return Promise.all(
      this.providers.map(async (provider) => ({
        name: provider.name,
        priority: provider.priority,
        isHealthy: await provider.healthCheck(),
        costPerRequest: provider.costPerRequest,
        successRate24h: await provider.getSuccessRate(),
        lastError: await provider.getLastError()
      }))
    );
  }

  private async updateProviderHealth(
    providerName: string, 
    isHealthy: boolean, 
    errorMessage?: string
  ): Promise<void> {
    await this.supabase
      .from('api_providers')
      .update({
        is_active: isHealthy,
        last_health_check: new Date().toISOString(),
        success_rate_24h: isHealthy ? 100 : 0
      })
      .eq('name', providerName);

    if (!isHealthy && errorMessage) {
      await this.alertService?.notify({
        type: 'provider_unhealthy',
        level: 'error',
        message: `Provider ${providerName} is unhealthy: ${errorMessage}`
      });
    }
  }
}

// Graceful degradation middleware
export class GracefulDegradationMiddleware {
  constructor(
    private aiProviderManager: AIProviderManager
  ) {}

  async handleRequest(
    request: AIEnhancementRequest,
    userId: string
  ): Promise<AIEnhancementResult | DegradedResponse> {
    try {
      // Try AI enhancement
      return await this.aiProviderManager.enhanceImageWithFallback(request, userId);
      
    } catch (error) {
      // Graceful fallback options
      return await this.provideFallbackResponse(request, userId, error);
    }
  }

  private async provideFallbackResponse(
    request: AIEnhancementRequest,
    userId: string,
    error: Error
  ): Promise<DegradedResponse> {
    // Option 1: Return original image with filters
    if (request.enhancementType === 'lighting') {
      return {
        type: 'css_filter_fallback',
        originalUrl: request.inputImageUrl,
        enhancedUrl: request.inputImageUrl,
        cssFilter: 'brightness(1.2) contrast(1.1) saturate(1.1)',
        message: 'Applied basic lighting adjustment. Upgrade for AI enhancement.',
        degradationReason: error.message
      };
    }

    // Option 2: Suggest alternative
    return {
      type: 'suggestion_fallback',
      originalUrl: request.inputImageUrl,
      enhancedUrl: request.inputImageUrl,
      suggestion: `Try using "${request.enhancementType}" enhancement during off-peak hours`,
      retryAfter: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      degradationReason: error.message
    };
  }
}

// Placeholder provider implementations
class NanoBananaProvider implements AIProvider {
  constructor(public config: { priority: number; costPerRequest: number }) {}
  
  get name() { return 'nanobanan'; }
  get priority() { return this.config.priority; }
  get costPerRequest() { return this.config.costPerRequest; }
  get isHealthy() { return true; } // Will be updated by health checks
  get successRate() { return 95; } // Will be updated by health checks

  async enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage> {
    // Implementation would use the actual NanoBanana service
    throw new Error('Not implemented - use actual NanoBananaService');
  }

  async healthCheck(): Promise<boolean> {
    // Check if NanoBanana API is responding
    return true;
  }

  async getSuccessRate(): Promise<number> {
    return 95;
  }

  async getLastError(): Promise<string | undefined> {
    return undefined;
  }
}

class FalAIProvider implements AIProvider {
  constructor(public config: { priority: number; costPerRequest: number }) {}
  
  get name() { return 'fal_ai'; }
  get priority() { return this.config.priority; }
  get costPerRequest() { return this.config.costPerRequest; }
  get isHealthy() { return true; }
  get successRate() { return 90; }

  async enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage> {
    throw new Error('FalAI provider not implemented');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async getSuccessRate(): Promise<number> {
    return 90;
  }

  async getLastError(): Promise<string | undefined> {
    return undefined;
  }
}

class KieAIProvider implements AIProvider {
  constructor(public config: { priority: number; costPerRequest: number }) {}
  
  get name() { return 'kie_ai'; }
  get priority() { return this.config.priority; }
  get costPerRequest() { return this.config.costPerRequest; }
  get isHealthy() { return true; }
  get successRate() { return 88; }

  async enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage> {
    throw new Error('KieAI provider not implemented');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async getSuccessRate(): Promise<number> {
    return 88;
  }

  async getLastError(): Promise<string | undefined> {
    return undefined;
  }
}

class GoogleDirectProvider implements AIProvider {
  constructor(public config: { priority: number; costPerRequest: number }) {}
  
  get name() { return 'google_direct'; }
  get priority() { return this.config.priority; }
  get costPerRequest() { return this.config.costPerRequest; }
  get isHealthy() { return true; }
  get successRate() { return 92; }

  async enhanceImage(request: AIEnhancementRequest): Promise<AIEnhancedImage> {
    throw new Error('Google Direct provider not implemented');
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async getSuccessRate(): Promise<number> {
    return 92;
  }

  async getLastError(): Promise<string | undefined> {
    return undefined;
  }
}

export interface AlertService {
  notify(alert: { type: string; level: string; message: string }): Promise<void>;
}
