import { Moodboard } from '@preset/domain/moodboards/entities/Moodboard';
import { MoodboardRepository } from '@preset/domain/moodboards/ports/MoodboardRepository';
import { ImageStorageService } from '@preset/domain/moodboards/ports/ImageStorageService';
import { AIImageService } from '@preset/domain/moodboards/ports/AIImageService';
import { EventBus } from '@preset/domain/shared/ports/EventBus';

export interface CreateMoodboardCommand {
  gigId: string;
  ownerId: string;
  title: string;
  summary?: string;
  items: Array<{
    type: 'image' | 'video';
    url: string;
    caption?: string;
    source: 'pexels' | 'user-upload' | 'url';
  }>;
}

export class CreateMoodboardUseCase {
  constructor(
    private moodboardRepository: MoodboardRepository,
    private imageStorage: ImageStorageService,
    private aiService?: AIImageService,
    private eventBus?: EventBus
  ) {}

  async execute(command: CreateMoodboardCommand): Promise<{ moodboardId: string }> {
    // Validate the gig exists and user has permission
    // This would normally check with a GigRepository
    
    // Process and store images
    const processedItems = await Promise.all(
      command.items.map(async (item) => {
        // If it's a user upload or URL, we might want to store it
        let finalUrl = item.url;
        
        if (item.source === 'url') {
          // Download and re-upload to our storage
          const imageBuffer = await this.imageStorage.download(item.url);
          const fileName = `moodboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          finalUrl = await this.imageStorage.upload(imageBuffer, fileName, 'image/jpeg');
        }
        
        return {
          id: crypto.randomUUID(),
          type: item.type,
          url: finalUrl,
          caption: item.caption || '',
          source: item.source,
          order: 0
        };
      })
    );
    
    // Extract palette from images if AI service is available
    let palette: string[] = [];
    if (this.aiService) {
      palette = await this.aiService.extractPalette(processedItems.map(i => i.url));
    }
    
    // Create the moodboard
    const moodboard = Moodboard.create({
      gigId: command.gigId,
      ownerId: command.ownerId,
      title: command.title,
      summary: command.summary || '',
      items: processedItems,
      palette,
      sourceBreakdown: {
        pexels: processedItems.filter(i => i.source === 'pexels').length,
        userUploads: processedItems.filter(i => i.source === 'user-upload').length,
        aiEnhanced: 0,
        aiGenerated: 0
      },
      enhancementLog: [],
      totalCost: 0,
      generatedPrompts: []
    });
    
    // Save to repository
    await this.moodboardRepository.save(moodboard);
    
    // Publish domain events
    if (this.eventBus) {
      const events = moodboard.getUncommittedEvents();
      await this.eventBus.publishAll(events);
      moodboard.markEventsAsCommitted();
    }
    
    return { moodboardId: moodboard.id };
  }
}