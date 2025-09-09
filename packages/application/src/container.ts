import { SupabaseClient } from '@supabase/supabase-js';
import { MoodboardRepository } from '@preset/domain/moodboards/ports/MoodboardRepository';
import { ImageStorageService } from '@preset/domain/moodboards/ports/ImageStorageService';
import { AIImageService } from '@preset/domain/moodboards/ports/AIImageService';
import { SupabaseMoodboardRepository } from '@preset/adapters/persistence/SupabaseMoodboardRepository';
import { SupabaseImageStorage } from '@preset/adapters/storage/SupabaseImageStorage';
import { NanoBananaService } from '@preset/adapters/external/NanoBananaService';
import { CreateMoodboardUseCase } from './moodboards/use-cases/CreateMoodboard';
import { EnhanceImageUseCase } from './moodboards/use-cases/EnhanceImage';
import { GetMoodboardUseCase } from './moodboards/use-cases/GetMoodboard';

/**
 * Dependency Injection Container
 * This is where we wire up all our ports with their concrete implementations
 */
export class DIContainer {
  private static instance: DIContainer;
  
  // Repositories
  private moodboardRepository!: MoodboardRepository;
  private imageStorage!: ImageStorageService;
  private aiService?: AIImageService;
  
  // Use Cases
  private createMoodboardUseCase!: CreateMoodboardUseCase;
  private enhanceImageUseCase!: EnhanceImageUseCase;
  private getMoodboardUseCase!: GetMoodboardUseCase;

  private constructor(
    private supabase: SupabaseClient,
    private config?: {
      nanoBananaApiKey?: string;
      nanoBananaCallbackUrl?: string;
    }
  ) {
    this.initializeAdapters();
    this.initializeUseCases();
  }

  static getInstance(
    supabase: SupabaseClient,
    config?: {
      nanoBananaApiKey?: string;
      nanoBananaCallbackUrl?: string;
    }
  ): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer(supabase, config);
    }
    return DIContainer.instance;
  }

  private initializeAdapters(): void {
    // Initialize concrete implementations
    this.moodboardRepository = new SupabaseMoodboardRepository(this.supabase);
    this.imageStorage = new SupabaseImageStorage(this.supabase);
    
    // Initialize AI service if configured
    if (this.config?.nanoBananaApiKey && this.config?.nanoBananaCallbackUrl) {
      this.aiService = new NanoBananaService(
        this.config.nanoBananaApiKey,
        this.config.nanoBananaCallbackUrl
      );
    }
  }

  private initializeUseCases(): void {
    // Initialize use cases with dependencies
    this.createMoodboardUseCase = new CreateMoodboardUseCase(
      this.moodboardRepository,
      this.imageStorage,
      this.aiService
    );
    
    this.getMoodboardUseCase = new GetMoodboardUseCase(
      this.moodboardRepository
    );
    
    this.enhanceImageUseCase = new EnhanceImageUseCase(
      this.moodboardRepository,
      this.imageStorage,
      this.aiService
    );
  }

  // Getters for use cases
  getCreateMoodboardUseCase(): CreateMoodboardUseCase {
    return this.createMoodboardUseCase;
  }

  getEnhanceImageUseCase(): EnhanceImageUseCase {
    return this.enhanceImageUseCase;
  }

  getGetMoodboardUseCase(): GetMoodboardUseCase {
    return this.getMoodboardUseCase;
  }

  // Getters for repositories (for direct access if needed)
  getMoodboardRepository(): MoodboardRepository {
    return this.moodboardRepository;
  }

  getImageStorage(): ImageStorageService {
    return this.imageStorage;
  }

  getAIService(): AIImageService | undefined {
    return this.aiService;
  }
}

/**
 * Factory function to create container with Supabase client
 */
export function createContainer(
  supabase: SupabaseClient,
  config?: {
    nanoBananaApiKey?: string;
    nanoBananaCallbackUrl?: string;
  }
): DIContainer {
  return DIContainer.getInstance(supabase, config);
}