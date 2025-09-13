import { UserBlockRepository } from '@preset/domain';

export interface CheckUserBlockedQuery {
  userId1: string;
  userId2: string;
}

export interface UserBlockStatus {
  isBlocked: boolean;
  blockerUserId?: string;
  blockedUserId?: string;
  blockId?: string;
  blockedAt?: Date;
  canCommunicate: boolean;
  blockReason?: {
    reason: string;
    details?: string;
    label: string;
  };
}

export interface CheckUserBlockedResult {
  user1BlockedByUser2: UserBlockStatus;
  user2BlockedByUser1: UserBlockStatus;
  mutualBlock: boolean;
  canCommunicate: boolean;
}

export class CheckUserBlockedUseCase {
  constructor(
    private userBlockRepo: UserBlockRepository
  ) {}

  async execute(query: CheckUserBlockedQuery): Promise<CheckUserBlockedResult> {
    const { userId1, userId2 } = query;

    // Check if user1 has blocked user2
    const user1BlocksUser2 = await this.userBlockRepo.findBlockBetweenUsers(userId1, userId2);
    
    // Check if user2 has blocked user1
    const user2BlocksUser1 = await this.userBlockRepo.findBlockBetweenUsers(userId2, userId1);

    // Check overall communication status
    const canCommunicate = await this.userBlockRepo.canUsersCommunicate(userId1, userId2);

    const user1BlockedByUser2: UserBlockStatus = {
      isBlocked: !!user2BlocksUser1,
      blockerUserId: user2BlocksUser1?.getBlockerUserId(),
      blockedUserId: user2BlocksUser1?.getBlockedUserId(),
      blockId: user2BlocksUser1?.getId(),
      blockedAt: user2BlocksUser1?.getCreatedAt(),
      canCommunicate: !user2BlocksUser1,
      blockReason: user2BlocksUser1 ? {
        reason: user2BlocksUser1.getReasonDetails().getReason(),
        details: user2BlocksUser1.getReasonDetails().getDetails(),
        label: user2BlocksUser1.getReasonDetails().getLabel()
      } : undefined
    };

    const user2BlockedByUser1: UserBlockStatus = {
      isBlocked: !!user1BlocksUser2,
      blockerUserId: user1BlocksUser2?.getBlockerUserId(),
      blockedUserId: user1BlocksUser2?.getBlockedUserId(),
      blockId: user1BlocksUser2?.getId(),
      blockedAt: user1BlocksUser2?.getCreatedAt(),
      canCommunicate: !user1BlocksUser2,
      blockReason: user1BlocksUser2 ? {
        reason: user1BlocksUser2.getReasonDetails().getReason(),
        details: user1BlocksUser2.getReasonDetails().getDetails(),
        label: user1BlocksUser2.getReasonDetails().getLabel()
      } : undefined
    };

    return {
      user1BlockedByUser2,
      user2BlockedByUser1,
      mutualBlock: !!user1BlocksUser2 && !!user2BlocksUser1,
      canCommunicate
    };
  }
}