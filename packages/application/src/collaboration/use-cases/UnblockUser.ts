import { UserBlockRepository } from '@preset/domain/collaboration/ports/UserBlockRepository';
import { EventBus } from '@preset/domain/shared/ports/EventBus';

export interface UnblockUserCommand {
  blockerUserId: string;
  blockedUserId: string;
  reason?: string; // Optional reason for unblocking (e.g., 'resolved', 'mistake')
}

export interface UnblockUserResult {
  success: boolean;
  canCommunicate: boolean;
  removedBlockId?: string;
}

export class UnblockUserUseCase {
  constructor(
    private userBlockRepo: UserBlockRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: UnblockUserCommand): Promise<UnblockUserResult> {
    // Validate that blocker and blocked users are different
    if (command.blockerUserId === command.blockedUserId) {
      throw new Error('Cannot unblock yourself');
    }

    // Find the existing block
    const existingBlock = await this.userBlockRepo.findBlockBetweenUsers(
      command.blockerUserId,
      command.blockedUserId
    );

    if (!existingBlock) {
      // No block exists, but this is not an error - return success
      const canCommunicate = await this.userBlockRepo.canUsersCommunicate(
        command.blockerUserId,
        command.blockedUserId
      );

      return {
        success: true,
        canCommunicate,
        removedBlockId: undefined
      };
    }

    // Verify the requester is the blocker
    if (existingBlock.getBlockerUserId() !== command.blockerUserId) {
      throw new Error('Only the user who created the block can remove it');
    }

    // Store block ID for response
    const removedBlockId = existingBlock.getId();

    // Remove the block
    await this.userBlockRepo.remove(existingBlock);

    // Publish domain event
    await this.eventBus.publish({
      aggregateId: removedBlockId,
      eventType: 'UserBlockRemoved',
      occurredAt: new Date(),
      payload: {
        blockId: removedBlockId,
        blockerUserId: command.blockerUserId,
        blockedUserId: command.blockedUserId,
        removedBy: command.blockerUserId,
        reason: command.reason || 'user_requested'
      }
    });

    // Check final communication status
    const canCommunicate = await this.userBlockRepo.canUsersCommunicate(
      command.blockerUserId,
      command.blockedUserId
    );

    return {
      success: true,
      canCommunicate,
      removedBlockId
    };
  }
}