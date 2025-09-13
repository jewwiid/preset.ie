import { UserBlock, UserBlockRepository, ProfileRepository, EventBus, IdGenerator, BlockReason, BlockReasonDetails } from '@preset/domain';

export interface BlockUserCommand {
  blockerUserId: string;
  blockedUserId: string;
  reason: BlockReason;
  details?: string;
}

export interface BlockUserResult {
  blockId: string;
  createdAt: Date;
  canCommunicate: boolean;
}

export class BlockUserUseCase {
  constructor(
    private userBlockRepo: UserBlockRepository,
    private profileRepo: ProfileRepository,
    private eventBus: EventBus,
    private idGenerator: IdGenerator
  ) {}

  async execute(command: BlockUserCommand): Promise<BlockUserResult> {
    // Validate that blocker and blocked users are different
    if (command.blockerUserId === command.blockedUserId) {
      throw new Error('Cannot block yourself');
    }

    // Verify both users exist
    const [blockerProfile, blockedProfile] = await Promise.all([
      this.profileRepo.findById(command.blockerUserId),
      this.profileRepo.findById(command.blockedUserId)
    ]);

    if (!blockerProfile) {
      throw new Error('Blocker user not found');
    }

    if (!blockedProfile) {
      throw new Error('User to block not found');
    }

    // Check if block already exists
    const existingBlock = await this.userBlockRepo.findBlockBetweenUsers(
      command.blockerUserId,
      command.blockedUserId
    );

    if (existingBlock) {
      throw new Error('User is already blocked');
    }

    // Check blocking limits (anti-abuse)
    const hasExceededLimits = await this.userBlockRepo.hasExceededBlockingLimits(
      command.blockerUserId,
      {
        maxBlocksPerDay: 10,
        maxBlocksPerMonth: 50,
        maxTotalBlocks: 100
      }
    );

    if (hasExceededLimits) {
      throw new Error('Blocking limit exceeded. Please contact support if this is legitimate.');
    }

    // Create block reason details
    const reasonDetails = new BlockReasonDetails(command.reason, command.details);

    // Create the user block
    const userBlock = UserBlock.create({
      id: IdGenerator.generate(),
      blockerUserId: command.blockerUserId,
      blockedUserId: command.blockedUserId,
      reasonDetails
    });

    // Save the block
    await this.userBlockRepo.save(userBlock);

    // Check if this creates a mutual block situation
    const reverseBlock = await this.userBlockRepo.findBlockBetweenUsers(
      command.blockedUserId,
      command.blockerUserId
    );

    if (reverseBlock) {
      // Publish mutual block detected event
      await this.eventBus.publish({
        aggregateId: userBlock.getId(),
        eventType: 'MutualBlockDetected',
        occurredAt: new Date(),
        payload: {
          userId1: command.blockerUserId,
          userId2: command.blockedUserId,
          firstBlockId: reverseBlock.getId(),
          secondBlockId: userBlock.getId(),
          detectedAt: new Date()
        }
      });
    }

    // Publish domain events
    const events = userBlock.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    userBlock.markEventsAsCommitted();

    // Check final communication status
    const canCommunicate = await this.userBlockRepo.canUsersCommunicate(
      command.blockerUserId,
      command.blockedUserId
    );

    return {
      blockId: userBlock.getId(),
      createdAt: userBlock.getCreatedAt(),
      canCommunicate
    };
  }
}