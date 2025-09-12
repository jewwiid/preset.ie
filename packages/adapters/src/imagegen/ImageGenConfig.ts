import type { ProviderConfig } from './ImageGenProviderFactory';

export class ImageGenConfig {
  static fromEnvironment(): ProviderConfig {
    const provider = (process.env.IMAGE_PROVIDER || 'nanobanana') as 'nanobanana' | 'seedream';

    const config: ProviderConfig = { provider };

    if (provider === 'nanobanana') {
      config.nanobanana = {
        apiKey: process.env.NANOBANAN_API_KEY!,
        baseUrl: process.env.NANOBANANA_BASE_URL || 'https://api.nanobanana.ai',
        callbackUrl: process.env.NANOBANANA_CALLBACK_URL!,
      };
    } else if (provider === 'seedream') {
      config.seedream = {
        apiKey: process.env.WAVESPEED_API_KEY!,
        baseUrl: process.env.WAVESPEED_BASE_URL || 'https://api.wavespeed.ai',
        webhookSecret: process.env.WAVESPEED_WEBHOOK_SECRET!,
      };
    }

    return config;
  }

  static validateConfig(config: ProviderConfig): void {
    if (config.provider === 'nanobanana' && !config.nanobanana?.apiKey) {
      throw new Error('NANOBANAN_API_KEY is required when using nanobanana provider');
    }

    if (config.provider === 'seedream' && !config.seedream?.apiKey) {
      throw new Error('WAVESPEED_API_KEY is required when using seedream provider');
    }
  }
}
