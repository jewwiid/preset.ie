import { Moodboard } from '@preset/domain/moodboards/entities/Moodboard';
import { MoodboardRepository } from '@preset/domain/moodboards/ports/MoodboardRepository';

export interface GetMoodboardQuery {
  moodboardId?: string;
  gigId?: string;
  ownerId?: string;
}

export class GetMoodboardUseCase {
  constructor(
    private moodboardRepository: MoodboardRepository
  ) {}

  async execute(query: GetMoodboardQuery): Promise<Moodboard | Moodboard[] | null> {
    if (query.moodboardId) {
      return await this.moodboardRepository.findById(query.moodboardId);
    }
    
    if (query.gigId) {
      return await this.moodboardRepository.findByGigId(query.gigId);
    }
    
    if (query.ownerId) {
      return await this.moodboardRepository.findByOwnerId(query.ownerId);
    }
    
    throw new Error('Must provide either moodboardId, gigId, or ownerId');
  }
}