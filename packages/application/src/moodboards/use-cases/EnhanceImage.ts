import { Moodboard, MoodboardRepository, ImageStorageService, AIImageService } from '@preset/domain';

export interface EnhanceImageCommand {
  moodboardId: string;
  imageUrl: string;
  enhancementType: 'upscale' | 'style-transfer' | 'background-removal';
  style?: string;
  userId: string;
}

export interface EnhanceImageResult {
  originalUrl: string;
  enhancedUrl: string;
  taskId: string;
  cost: number;
}

export class EnhanceImageUseCase {
  constructor(
    private moodboardRepository: MoodboardRepository,
    private imageStorage: ImageStorageService,
    private aiService?: AIImageService
  ) {}

  async execute(command: EnhanceImageCommand): Promise<EnhanceImageResult> {
    // Verify user has permission to modify this moodboard
    const canModify = await this.moodboardRepository.canUserModify(
      command.moodboardId,
      command.userId
    );
    
    if (!canModify) {
      throw new Error('User does not have permission to modify this moodboard');
    }
    
    // Get the moodboard
    const moodboard = await this.moodboardRepository.findById(command.moodboardId);
    if (!moodboard) {
      throw new Error('Moodboard not found');
    }
    
    if (!this.aiService) {
      throw new Error('AI service not configured');
    }
    
    // Perform the enhancement
    const result = await this.aiService.enhanceImage({
      imageUrl: command.imageUrl,
      enhancementType: command.enhancementType,
      style: command.style
    });
    
    // Download the enhanced image
    const enhancedBuffer = await this.imageStorage.download(result.enhancedUrl);
    
    // Store in our storage
    const fileName = `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const storedUrl = await this.imageStorage.upload(
      enhancedBuffer,
      fileName,
      'image/jpeg'
    );
    
    // Update moodboard with enhancement log
    moodboard.addEnhancement({
      originalUrl: command.imageUrl,
      enhancedUrl: storedUrl,
      enhancementType: command.enhancementType,
      cost: result.cost,
      taskId: result.taskId,
      timestamp: new Date()
    });
    
    // Save updated moodboard
    await this.moodboardRepository.save(moodboard);
    
    return {
      originalUrl: command.imageUrl,
      enhancedUrl: storedUrl,
      taskId: result.taskId,
      cost: result.cost
    };
  }
}