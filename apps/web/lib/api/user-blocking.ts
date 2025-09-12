/**
 * API client for user blocking functionality
 */

// Types for API responses
export enum BlockReason {
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  UNPROFESSIONAL_BEHAVIOR = 'unprofessional_behavior',
  NO_SHOW = 'no_show',
  PAYMENT_DISPUTE = 'payment_dispute',
  PRIVACY_VIOLATION = 'privacy_violation',
  OTHER = 'other'
}

export interface BlockedUserDTO {
  blockId: string;
  blockedUserId: string;
  blockedUserDisplayName?: string;
  blockedUserHandle?: string;
  blockedUserAvatarUrl?: string;
  reasonDetails: {
    reason: BlockReason;
    details?: string;
    label: string;
  };
  blockedAt: string;
  ageInDays: number;
  isRecent: boolean;
}

export interface BlockUserRequest {
  blockedUserId: string;
  reason: BlockReason;
  details?: string;
}

export interface BlockUserResponse {
  success: boolean;
  data: {
    blockId: string;
    createdAt: string;
    canCommunicate: boolean;
  };
}

export interface UnblockUserRequest {
  blockedUserId: string;
  reason?: string;
}

export interface UnblockUserResponse {
  success: boolean;
  data: {
    success: boolean;
    canCommunicate: boolean;
    removedBlockId?: string;
  };
}

export interface GetBlockedUsersResponse {
  success: boolean;
  data: {
    blockedUsers: BlockedUserDTO[];
    totalCount: number;
    hasMore: boolean;
    pagination: {
      limit: number;
      offset: number;
      totalCount: number;
    };
  };
}

export interface UserBlockStatus {
  isBlocked: boolean;
  blockerUserId?: string;
  blockedUserId?: string;
  blockId?: string;
  blockedAt?: string;
  canCommunicate: boolean;
  blockReason?: {
    reason: BlockReason;
    details?: string;
    label: string;
  };
}

export interface CheckBlockStatusResponse {
  success: boolean;
  data: {
    youBlockedThem: UserBlockStatus;
    theyBlockedYou: UserBlockStatus;
    mutualBlock: boolean;
    canCommunicate: boolean;
  };
}

// API client class
export class UserBlockingApi {
  private baseUrl: string;
  private getAuthToken: () => Promise<string>;

  constructor(baseUrl: string = '', getAuthToken: () => Promise<string>) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Block a user
   */
  async blockUser(data: BlockUserRequest): Promise<BlockUserResponse> {
    return this.makeRequest<BlockUserResponse>('/api/users/block', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Unblock a user
   */
  async unblockUser(data: UnblockUserRequest): Promise<UnblockUserResponse> {
    return this.makeRequest<UnblockUserResponse>('/api/users/unblock', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(params?: {
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  }): Promise<GetBlockedUsersResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    const endpoint = `/api/users/blocked${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<GetBlockedUsersResponse>(endpoint);
  }

  /**
   * Check blocking status between current user and another user
   */
  async checkBlockStatus(otherUserId: string): Promise<CheckBlockStatusResponse> {
    const searchParams = new URLSearchParams({
      otherUserId
    });
    
    return this.makeRequest<CheckBlockStatusResponse>(
      `/api/users/block-status?${searchParams.toString()}`
    );
  }

  /**
   * Helper method to get block reason labels
   */
  static getBlockReasonLabel(reason: BlockReason): string {
    switch (reason) {
      case BlockReason.HARASSMENT:
        return 'Harassment or bullying';
      case BlockReason.SPAM:
        return 'Spam messages';
      case BlockReason.INAPPROPRIATE_CONTENT:
        return 'Inappropriate content';
      case BlockReason.UNPROFESSIONAL_BEHAVIOR:
        return 'Unprofessional behavior';
      case BlockReason.NO_SHOW:
        return 'No-show to scheduled shoot';
      case BlockReason.PAYMENT_DISPUTE:
        return 'Payment or compensation dispute';
      case BlockReason.PRIVACY_VIOLATION:
        return 'Privacy violation or unauthorized use';
      case BlockReason.OTHER:
        return 'Other reason';
      default:
        return 'Unknown reason';
    }
  }

  /**
   * Helper method to get all available block reasons
   */
  static getBlockReasons(): Array<{ value: BlockReason; label: string }> {
    return Object.values(BlockReason).map(reason => ({
      value: reason,
      label: UserBlockingApi.getBlockReasonLabel(reason)
    }));
  }
}

/**
 * Hook for using the user blocking API with Supabase auth
 */
export function useUserBlockingApi() {
  const getAuthToken = async (): Promise<string> => {
    // Get the current session from Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    return session.access_token;
  };

  return new UserBlockingApi('', getAuthToken);
}

/**
 * Factory function to create user blocking API with custom auth
 */
export function createUserBlockingApi(
  baseUrl: string = '',
  getAuthToken: () => Promise<string>
): UserBlockingApi {
  return new UserBlockingApi(baseUrl, getAuthToken);
}