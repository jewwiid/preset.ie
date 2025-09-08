import { AggregateRoot } from '../../shared/aggregate-root';
import { EntityId } from '../../shared/value-objects/entity-id';
import { UserRoles } from '../value-objects/user-role';
import { Subscription, SubscriptionTier, SubscriptionStatus } from '../value-objects/subscription-tier';

export interface UserProfileProps {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  roles: UserRoles;
  styleTags: string[];
  subscription: Subscription;
  verifiedId: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserProfile extends AggregateRoot<UserProfileProps> {
  private props: UserProfileProps;

  constructor(id: EntityId, props: UserProfileProps) {
    super(id);
    this.props = props;
  }

  static create(
    userId: string,
    displayName: string,
    handle: string,
    roles: UserRoles
  ): UserProfile {
    const id = EntityId.generate();
    const now = new Date();

    return new UserProfile(id, {
      userId,
      displayName,
      handle,
      roles,
      styleTags: [],
      subscription: new Subscription(
        SubscriptionTier.FREE,
        SubscriptionStatus.ACTIVE,
        now
      ),
      verifiedId: false,
      createdAt: now,
      updatedAt: now
    });
  }

  updateProfile(
    displayName?: string,
    bio?: string,
    city?: string,
    avatarUrl?: string
  ): void {
    if (displayName) this.props.displayName = displayName;
    if (bio !== undefined) this.props.bio = bio;
    if (city !== undefined) this.props.city = city;
    if (avatarUrl !== undefined) this.props.avatarUrl = avatarUrl;
    this.props.updatedAt = new Date();
  }

  updateStyleTags(tags: string[]): void {
    this.props.styleTags = tags;
    this.props.updatedAt = new Date();
  }

  verifyId(): void {
    this.props.verifiedId = true;
    this.props.updatedAt = new Date();
  }

  upgradeSubscription(tier: SubscriptionTier): void {
    const now = new Date();
    this.props.subscription = new Subscription(
      tier,
      SubscriptionStatus.ACTIVE,
      now
    );
    this.props.updatedAt = now;
  }

  cancelSubscription(): void {
    this.props.subscription = new Subscription(
      this.props.subscription.tier,
      SubscriptionStatus.CANCELLED,
      this.props.subscription.startedAt,
      this.props.subscription.expiresAt
    );
    this.props.updatedAt = new Date();
  }

  canApply(currentApplicationCount: number): boolean {
    return this.props.subscription.canApply(currentApplicationCount);
  }

  canCreateGig(currentGigCount: number): boolean {
    return this.props.subscription.canCreateGig(currentGigCount);
  }

  canCreateShowcase(currentShowcaseCount: number): boolean {
    const max = this.props.subscription.maxShowcases();
    return max === -1 || currentShowcaseCount < max;
  }

  get userId(): string { return this.props.userId; }
  get displayName(): string { return this.props.displayName; }
  get handle(): string { return this.props.handle; }
  get avatarUrl(): string | undefined { return this.props.avatarUrl; }
  get bio(): string | undefined { return this.props.bio; }
  get city(): string | undefined { return this.props.city; }
  get roles(): UserRoles { return this.props.roles; }
  get styleTags(): string[] { return this.props.styleTags; }
  get subscription(): Subscription { return this.props.subscription; }
  get verifiedId(): boolean { return this.props.verifiedId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}