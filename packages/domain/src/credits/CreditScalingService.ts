export interface ProviderCreditConfig {
  provider: string;
  ratio: number; // How many provider credits = 1 user credit
  minimumPurchase?: number;
  maximumPurchase?: number;
}

export class CreditScalingService {
  private configs: Map<string, ProviderCreditConfig> = new Map();

  constructor(configs: ProviderCreditConfig[] = []) {
    configs.forEach(config => {
      this.configs.set(config.provider, config);
    });
  }

  /**
   * Convert user credits to provider credits
   */
  toProviderCredits(provider: string, userCredits: number): number {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`No configuration found for provider: ${provider}`);
    }
    return Math.ceil(userCredits * config.ratio);
  }

  /**
   * Convert provider credits to user credits
   */
  toUserCredits(provider: string, providerCredits: number): number {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`No configuration found for provider: ${provider}`);
    }
    return Math.floor(providerCredits / config.ratio);
  }

  /**
   * Check if platform has enough credits for an operation
   */
  hasEnoughPlatformCredits(
    provider: string,
    userCredits: number,
    platformBalance: number
  ): boolean {
    const requiredProviderCredits = this.toProviderCredits(provider, userCredits);
    return platformBalance >= requiredProviderCredits;
  }

  /**
   * Calculate the cost in provider credits for a user operation
   */
  calculateProviderCost(provider: string, userCredits: number): {
    userCredits: number;
    providerCredits: number;
    ratio: number;
  } {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`No configuration found for provider: ${provider}`);
    }
    
    return {
      userCredits,
      providerCredits: this.toProviderCredits(provider, userCredits),
      ratio: config.ratio
    };
  }

  /**
   * Get available user credits based on platform balance
   */
  getAvailableUserCredits(provider: string, platformBalance: number): number {
    return this.toUserCredits(provider, platformBalance);
  }

  /**
   * Add or update a provider configuration
   */
  setProviderConfig(config: ProviderCreditConfig): void {
    this.configs.set(config.provider, config);
  }

  /**
   * Get all provider configurations
   */
  getAllConfigs(): ProviderCreditConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get configuration for a specific provider
   */
  getProviderConfig(provider: string): ProviderCreditConfig | undefined {
    return this.configs.get(provider);
  }
}

// Singleton instance with default configuration
export const creditScalingService = new CreditScalingService([
  {
    provider: 'nanobanana',
    ratio: 4, // 1 user credit = 4 NanoBanana credits
    minimumPurchase: 10,
    maximumPurchase: 1000
  },
  {
    provider: 'openai',
    ratio: 0.1, // 1 user credit = 0.1 OpenAI credits (example)
    minimumPurchase: 10,
    maximumPurchase: 500
  },
  {
    provider: 'pexels',
    ratio: 1, // 1 user credit = 1 Pexels API call
    minimumPurchase: 5,
    maximumPurchase: 100
  }
]);