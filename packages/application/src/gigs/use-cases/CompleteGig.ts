import { GigRepository } from '../../ports/repositories/gig-repository';
import { EntityId } from '@preset/domain';

export interface CompleteGigCommand {
  gigId: string;
  userId: string;
}

export class CompleteGigUseCase {
  constructor(
    private gigRepository: GigRepository
  ) {}

  async execute(command: CompleteGigCommand): Promise<void> {
    const { gigId, userId } = command;

    // Find the gig
    const gig = await this.gigRepository.findById(EntityId.from(gigId));
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Verify the user owns this gig
    if (gig.ownerUserId.toString() !== userId) {
      throw new Error('Only the gig owner can mark it as completed');
    }

    // Complete the gig (this will validate it's in BOOKED status)
    gig.complete();

    // Save the updated gig
    await this.gigRepository.save(gig);
  }
}