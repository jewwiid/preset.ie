import { UserBlock } from '@preset/domain/collaboration/entities/UserBlock';
import { UserBlockRepository } from '@preset/domain/collaboration/ports/UserBlockRepository';
import { ProfileRepository } from '@preset/domain/identity/ports/ProfileRepository';

export interface GetBlockedUsersQuery {
  requestingUserId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface BlockedUserInfo {
  blockId: string;
  blockedUserId: string;
  blockedUserDisplayName?: string;
  blockedUserHandle?: string;
  blockedUserAvatarUrl?: string;
  reasonDetails: {
    reason: string;
    details?: string;
    label: string;
  };
  blockedAt: Date;
  ageInDays: number;
  isRecent: boolean;
}

export interface GetBlockedUsersResult {
  blockedUsers: BlockedUserInfo[];
  totalCount: number;
  hasMore: boolean;
}

export class GetBlockedUsersUseCase {
  constructor(
    private userBlockRepo: UserBlockRepository,
    private profileRepo: ProfileRepository
  ) {}

  async execute(query: GetBlockedUsersQuery): Promise<GetBlockedUsersResult> {
    const { requestingUserId, limit = 20, offset = 0 } = query;

    // Get blocked users
    const userBlocks = await this.userBlockRepo.getBlockedUsers(requestingUserId, {
      limit: limit + 1, // Get one extra to check if there are more
      offset,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'desc'
    });

    const hasMore = userBlocks.length > limit;
    const blocksToReturn = hasMore ? userBlocks.slice(0, limit) : userBlocks;

    // Get total count
    const totalCount = await this.userBlockRepo.countBlocksCreatedByUser(requestingUserId);

    // Enrich with user profile information
    const blockedUsers: BlockedUserInfo[] = await Promise.all(
      blocksToReturn.map(async (block) => {
        const blockedUserProfile = await this.profileRepo.findById(block.getBlockedUserId());
        
        return {
          blockId: block.getId(),
          blockedUserId: block.getBlockedUserId(),
          blockedUserDisplayName: blockedUserProfile?.getDisplayName(),
          blockedUserHandle: blockedUserProfile?.getHandle()?.getValue(),
          blockedUserAvatarUrl: blockedUserProfile?.getAvatarUrl(),
          reasonDetails: {
            reason: block.getReasonDetails().getReason(),
            details: block.getReasonDetails().getDetails(),
            label: block.getReasonDetails().getLabel()
          },
          blockedAt: block.getCreatedAt(),
          ageInDays: block.getAgeInDays(),
          isRecent: block.isRecent()
        };
      })
    );

    return {
      blockedUsers,
      totalCount,
      hasMore
    };
  }
}