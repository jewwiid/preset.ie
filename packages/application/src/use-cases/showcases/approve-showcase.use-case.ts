import { EntityId, IdGenerator } from '@preset/domain';
import { ShowcaseRepository } from '../../ports/repositories/showcase-repository';
import { GigRepository } from '../../ports/repositories/gig-repository';
import { UserRepository } from '../../ports/repositories/user-repository';
import { EventBus } from '../../ports/services/event-bus';

export interface ApproveShowcaseCommand {
  showcaseId: string;
  userId: string;
  action: 'approve' | 'request_changes';
  note?: string;
}

export class ApproveShowcaseUseCase {
  constructor(
    private showcaseRepository: ShowcaseRepository,
    private gigRepository: GigRepository,
    private userRepository: UserRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: ApproveShowcaseCommand): Promise<void> {
    // 1. Fetch showcase and validate it's from a gig
    const showcase = await this.showcaseRepository.findById(EntityId.from(command.showcaseId));
    if (!showcase) {
      throw new Error('Showcase not found');
    }

    // Check if this is a gig-based showcase
    const showcaseData = await this.showcaseRepository.findById(EntityId.from(command.showcaseId));
    if (!showcaseData) {
      throw new Error('Showcase not found');
    }

    // 2. Verify user is talent in the gig
    const gig = await this.gigRepository.findById(EntityId.from(showcase.getGigId()));
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Check if user is the talent in this gig
    const user = await this.userRepository.findByUserId(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify user is the talent (not the creator)
    if (user.id.toString() === showcase.getCreatorId()) {
      throw new Error('Creator cannot approve their own showcase');
    }

    // Check if user is the talent by looking at accepted applications
    const isTalent = await this.isUserTalentInGig(gig.getId(), user.id.toString());
    if (!isTalent) {
      throw new Error('Only the talent can approve this showcase');
    }

    // 3. Call showcase.approve(userId, note) or handle changes request
    if (command.action === 'approve') {
      showcase.approve(command.userId, command.note);
      
      // Save the showcase with updated approvals
      await this.showcaseRepository.save(showcase);
      
      // 4. If both approved, update status to 'approved' and visibility to 'public'
      if (showcase.hasBothApprovals()) {
        // Update database status
        await this.updateShowcaseStatus(command.showcaseId, 'approved', 'public');
        
        // 5. Publish ShowcaseApproved event
        await this.eventBus.publish({
          aggregateId: command.showcaseId,
          eventType: 'ShowcaseApproved',
          occurredAt: new Date(),
          payload: {
            showcaseId: command.showcaseId,
            gigId: showcase.getGigId(),
            creatorId: showcase.getCreatorId(),
            talentId: showcase.getTalentId()
          }
        });
      } else {
        // Update database status to pending talent approval
        await this.updateShowcaseStatus(command.showcaseId, 'pending_approval', 'private');
      }
    } else if (command.action === 'request_changes') {
      // Handle changes request
      await this.updateShowcaseStatus(command.showcaseId, 'changes_requested', 'private', command.note);
      
      // Publish ShowcaseChangesRequested event
      await this.eventBus.publish({
        aggregateId: command.showcaseId,
        eventType: 'ShowcaseChangesRequested',
        occurredAt: new Date(),
        payload: {
          showcaseId: command.showcaseId,
          gigId: showcase.getGigId(),
          creatorId: showcase.getCreatorId(),
          talentId: command.userId,
          note: command.note
        }
      });
    }
  }

  private async isUserTalentInGig(gigId: string, userId: string): Promise<boolean> {
    // This would need to be implemented based on your application structure
    // For now, we'll assume there's a way to check if user is accepted talent
    // You might need to query applications table or have a different way to track this
    return true; // Placeholder - implement based on your gig-talent relationship
  }

  private async updateShowcaseStatus(
    showcaseId: string, 
    status: string, 
    visibility: string, 
    notes?: string
  ): Promise<void> {
    // This would update the database directly since we're dealing with status fields
    // that aren't part of the domain model
    // Implementation depends on your repository pattern
  }
}
