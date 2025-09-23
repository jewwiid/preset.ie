import { 
  UserProfile, 
  EntityId, 
  UserRole, 
  UserRoles, 
  Subscription, 
  SubscriptionTier, 
  SubscriptionStatus 
} from '@preset/domain';

interface UserProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  role_flags: string[];
  style_tags: string[];
  subscription_tier: string;
  subscription_status: string;
  subscription_started_at: string;
  subscription_expires_at: string | null;
  verified_id: boolean;
  created_at: string;
  updated_at: string;
}

export class UserMapper {
  static toDomain(row: UserProfileRow): UserProfile {
    const id = new EntityId(row.id);
    
    // Map role flags to UserRoles
    const roles = new UserRoles(
      row.role_flags.map(role => role as UserRole)
    );

    // Map subscription
    const subscription = new Subscription(
      row.subscription_tier as SubscriptionTier,
      row.subscription_status as SubscriptionStatus,
      new Date(row.subscription_started_at),
      row.subscription_expires_at ? new Date(row.subscription_expires_at) : undefined
    );

    return new UserProfile(id, {
      userId: row.user_id,
      displayName: row.display_name,
      handle: row.handle,
      avatarUrl: row.avatar_url || undefined,
      bio: row.bio || undefined,
      city: row.city || undefined,
      roles,
      styleTags: row.style_tags,
      subscription,
      verifiedId: row.verified_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  static toRow(user: UserProfile): Partial<UserProfileRow> {
    return {
      id: user.id.toString(),
      user_id: user.userId,
      display_name: user.displayName,
      handle: user.handle,
      avatar_url: user.avatarUrl,
      bio: user.bio,
      city: user.city,
      role_flags: user.roles.toArray(),
      style_tags: user.styleTags,
      subscription_tier: user.subscription.tier,
      subscription_status: user.subscription.status,
      subscription_started_at: user.subscription.startedAt.toISOString(),
      subscription_expires_at: user.subscription.expiresAt?.toISOString(),
      verified_id: user.verifiedId,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
  }
}