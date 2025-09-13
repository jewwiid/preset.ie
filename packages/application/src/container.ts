import { SupabaseClient } from '@supabase/supabase-js';
import { MoodboardRepository, ImageStorageService, AIImageService, EventBus } from '@preset/domain';
// import { SupabaseMoodboardRepository } from '@preset/adapters/persistence/SupabaseMoodboardRepository';
// import { SupabaseImageStorage } from '@preset/adapters/storage/SupabaseImageStorage';
// import { NanoBananaService } from '@preset/adapters/external/NanoBananaService';
// import { SupabaseEventBus } from '@preset/adapters/events/SupabaseEventBus';
// import { InMemoryEventBus } from '@preset/adapters/events/InMemoryEventBus';
import { CreateMoodboardUseCase } from './moodboards/use-cases/CreateMoodboard';
import { EnhanceImageUseCase } from './moodboards/use-cases/EnhanceImage';
import { GetMoodboardUseCase } from './moodboards/use-cases/GetMoodboard';

/**
 * Dependency Injection Container
 * This is where we wire up all our ports with their concrete implementations
 */
export class DIContainer {
  private static instance: DIContainer;
  
  // Core Infrastructure
  private eventBus!: EventBus;
  
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
      useInMemoryEventBus?: boolean;
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
      useInMemoryEventBus?: boolean;
    }
  ): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer(supabase, config);
    }
    return DIContainer.instance;
  }

  private initializeAdapters(): void {
    // Initialize event bus
    if (this.config?.useInMemoryEventBus) {
      // this.eventBus = new InMemoryEventBus();
      throw new Error('EventBus implementation not available - adapters package needs to be built');
    } else {
      // this.eventBus = new SupabaseEventBus(this.supabase);
      throw new Error('EventBus implementation not available - adapters package needs to be built');
    }
    
    // Initialize concrete implementations
    // this.moodboardRepository = new SupabaseMoodboardRepository(this.supabase);
    // this.imageStorage = new SupabaseImageStorage(this.supabase);
    
    // Initialize AI service if configured
    // if (this.config?.nanoBananaApiKey && this.config?.nanoBananaCallbackUrl) {
    //   this.aiService = new NanoBananaService(
    //     this.config.nanoBananaApiKey,
    //     this.config.nanoBananaCallbackUrl
    //   );
    // }
    throw new Error('Repository implementations not available - adapters package needs to be built');
  }

  private initializeUseCases(): void {
    // Initialize use cases with dependencies
    this.createMoodboardUseCase = new CreateMoodboardUseCase(
      this.moodboardRepository,
      this.imageStorage,
      this.aiService,
      this.eventBus
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

  getEventBus(): EventBus {
    return this.eventBus;
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