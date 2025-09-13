import { Showcase, EntityId, IdGenerator } from '@preset/domain';
import { ShowcaseRepository } from '../../ports/repositories/showcase-repository';
import { GigRepository } from '../../ports/repositories/gig-repository';
import { UserRepository } from '../../ports/repositories/user-repository';
import { MediaStorage } from '../../ports/services/media-storage';

export interface CreateShowcaseCommand {
  gigId: string;
  creatorUserId: string;
  talentUserId: string;
  mediaIds: string[];
  caption?: string;
  tags?: string[];
}

export class CreateShowcaseUseCase {
  constructor(
    private showcaseRepository: ShowcaseRepository,
    private gigRepository: GigRepository,
    private userRepository: UserRepository,
    private mediaStorage: MediaStorage
  ) {}

  async execute(command: CreateShowcaseCommand): Promise<{ showcaseId: string }> {
    // Validate gig exists and is completed
    const gig = await this.gigRepository.findById(EntityId.from(command.gigId));
    if (!gig) {
      throw new Error('Gig not found');
    }

    if (gig.status !== 'COMPLETED') {
      throw new Error('Can only create showcases for completed gigs');
    }

    // Validate creator
    const creator = await this.userRepository.findByUserId(command.creatorUserId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Validate talent
    const talent = await this.userRepository.findByUserId(command.talentUserId);
    if (!talent) {
      throw new Error('Talent not found');
    }

    // Check showcase limits
    const creatorShowcaseCount = await this.showcaseRepository.countByUser(
      EntityId.from(creator.id.toString()),
      'PUBLIC'
    );

    if (!creator.canCreateShowcase(creatorShowcaseCount)) {
      throw new Error('Showcase limit reached for creator\'s subscription tier');
    }

    const talentShowcaseCount = await this.showcaseRepository.countByUser(
      EntityId.from(talent.id.toString()),
      'PUBLIC'
    );

    if (!talent.canCreateShowcase(talentShowcaseCount)) {
      throw new Error('Showcase limit reached for talent\'s subscription tier');
    }

    // Validate media count (3-6 items)
    if (command.mediaIds.length < 3 || command.mediaIds.length > 6) {
      throw new Error('Showcase must contain between 3 and 6 media items');
    }

    // Extract palette from first image
    // In a real implementation, we'd fetch media metadata here
    const palette: string[] = [];

    // Create showcase
    const showcase = Showcase.create({
      id: IdGenerator.generate(),
      gigId: command.gigId,
      creatorId: creator.id.toString(),
      talentId: talent.id.toString(),
      mediaIds: command.mediaIds,
      caption: command.caption || '',
      tags: command.tags || [],
      palette: palette
    });

    // Save showcase
    await this.showcaseRepository.save(showcase);

    return { showcaseId: showcase.id.toString() };
  }
}