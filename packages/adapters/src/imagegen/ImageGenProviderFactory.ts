import type { ImageGenService } from '@preset/application/ports/ImageGenService';
import { NanoBananaAdapter } from './NanoBananaAdapter';
import { SeedreamWaveSpeedAdapter } from './SeedreamWaveSpeedAdapter';

export type ImageProvider = 'nanobanana' | 'seedream';

export interface ProviderConfig {
  provider: ImageProvider;
  nanobanana?: {
    apiKey: string;
    baseUrl: string;
    callbackUrl: string;
  };
  seedream?: {
    apiKey: string;
    baseUrl: string;
    webhookSecret: string;
  };
}

export class ImageGenProviderFactory {
  static createProvider(config: ProviderConfig): ImageGenService {
    switch (config.provider) {
      case 'nanobanana':
        if (!config.nanobanana) {
          throw new Error('NanoBanana configuration is required');
        }
        return new NanoBananaAdapter(config.nanobanana);
      
      case 'seedream':
        if (!config.seedream) {
          throw new Error('Seedream configuration is required');
        }
        return new SeedreamWaveSpeedAdapter(config.seedream);
      
      default:
        throw new Error(`Unsupported image provider: ${config.provider}`);
    }
  }
}
