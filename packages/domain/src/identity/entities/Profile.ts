import { Handle } from '../value-objects/Handle';
import { ProfileUpdated, StyleTagAdded, StyleTagRemoved } from '../events/ProfileEvents';
import { BaseAggregateRoot } from '../../shared/BaseAggregateRoot';

export interface ProfileProps {
  id: string;
  userId: string;
  handle: Handle;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  website?: string;
  instagram?: string;
  styleTags: string[];
  showcaseIds: string[];
  isPublic: boolean;
  profileViews: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile entity - manages user's public profile information
 */
export class Profile extends BaseAggregateRoot {
  private static readonly MAX_STYLE_TAGS = 10;
  private static readonly MAX_BIO_LENGTH = 500;
  private static readonly MAX_SHOWCASES_FREE = 3;
  
  private constructor(private props: ProfileProps) {
    super();
  }

  /**
   * Create a new profile
   */
  static create(params: {
    userId: string;
    handle: string;
    displayName: string;
  }): Profile {
    const handle = new Handle(params.handle);
    
    const profile = new Profile({
      id: crypto.randomUUID(),
      userId: params.userId,
      handle,
      displayName: params.displayName,
      styleTags: [],
      showcaseIds: [],
      isPublic: true,
      profileViews: 0,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return profile;
  }

  /**
   * Reconstitute profile from persistence
   */
  static fromPersistence(props: ProfileProps): Profile {
    return new Profile(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get handle(): Handle { return this.props.handle; }
  get displayName(): string { return this.props.displayName; }
  get avatarUrl(): string | undefined { return this.props.avatarUrl; }
  get bio(): string | undefined { return this.props.bio; }
  get city(): string | undefined { return this.props.city; }
  get styleTags(): string[] { return [...this.props.styleTags]; }
  get showcaseIds(): string[] { return [...this.props.showcaseIds]; }
  get isPublic(): boolean { return this.props.isPublic; }

  // Role and permission methods for application layer compatibility
  get roles(): { isTalent(): boolean; isContributor(): boolean } {
    return {
      isTalent: () => true, // Default to talent for now
      isContributor: () => true // Default to contributor for now
    };
  }

  canApply(applicationCount: number): boolean {
    // Basic application limits - can be enhanced with subscription tiers
    return applicationCount < 10; // Allow up to 10 applications per month
  }

  canCreateGig(gigCount: number): boolean {
    // Basic gig creation limits - can be enhanced with subscription tiers
    return gigCount < 5; // Allow up to 5 gigs per month
  }

  canCreateShowcase(showcaseCount: number): boolean {
    // Basic showcase limits - can be enhanced with subscription tiers
    return showcaseCount < 3; // Allow up to 3 showcases total for free tier
  }

  /**
   * Update profile information
   */
  updateProfile(updates: {
    displayName?: string;
    bio?: string;
    city?: string;
    country?: string;
    website?: string;
    instagram?: string;
  }): void {
    // Validate bio length
    if (updates.bio && updates.bio.length > Profile.MAX_BIO_LENGTH) {
      throw new Error(`Bio cannot exceed ${Profile.MAX_BIO_LENGTH} characters`);
    }

    // Validate website URL
    if (updates.website && !this.isValidUrl(updates.website)) {
      throw new Error('Invalid website URL');
    }

    // Apply updates
    if (updates.displayName !== undefined) this.props.displayName = updates.displayName;
    if (updates.bio !== undefined) this.props.bio = updates.bio;
    if (updates.city !== undefined) this.props.city = updates.city;
    if (updates.country !== undefined) this.props.country = updates.country;
    if (updates.website !== undefined) this.props.website = updates.website;
    if (updates.instagram !== undefined) this.props.instagram = updates.instagram;
    
    this.props.updatedAt = new Date();

    // Emit event
    this.raise(new ProfileUpdated(
      this.id,
      {
        profileId: this.id,
        userId: this.props.userId,
        updates
      }
    ));
  }

  /**
   * Update avatar
   */
  updateAvatar(avatarUrl: string): void {
    if (!this.isValidUrl(avatarUrl)) {
      throw new Error('Invalid avatar URL');
    }

    this.props.avatarUrl = avatarUrl;
    this.props.updatedAt = new Date();

    this.raise(new ProfileUpdated(
      this.id,
      {
        profileId: this.id,
        userId: this.props.userId,
        updates: { avatarUrl }
      }
    ));
  }

  /**
   * Add a style tag
   */
  addStyleTag(tag: string): void {
    const normalizedTag = tag.toLowerCase().trim();
    
    if (this.props.styleTags.length >= Profile.MAX_STYLE_TAGS) {
      throw new Error(`Cannot add more than ${Profile.MAX_STYLE_TAGS} style tags`);
    }

    if (this.props.styleTags.includes(normalizedTag)) {
      return; // Already has this tag
    }

    this.props.styleTags.push(normalizedTag);
    this.props.updatedAt = new Date();

    this.raise(new StyleTagAdded(
      this.id,
      {
        profileId: this.id,
        userId: this.props.userId,
        tag: normalizedTag
      }
    ));
  }

  /**
   * Remove a style tag
   */
  removeStyleTag(tag: string): void {
    const normalizedTag = tag.toLowerCase().trim();
    const index = this.props.styleTags.indexOf(normalizedTag);
    
    if (index === -1) {
      return; // Tag not found
    }

    this.props.styleTags.splice(index, 1);
    this.props.updatedAt = new Date();

    this.raise(new StyleTagRemoved(
      this.id,
      {
        profileId: this.id,
        userId: this.props.userId,
        tag: normalizedTag
      }
    ));
  }

  /**
   * Add showcase to profile
   */
  addShowcase(showcaseId: string, subscriptionTier: 'free' | 'plus' | 'pro'): void {
    // Check limits based on subscription
    const limits = {
      free: 3,
      plus: 10,
      pro: Infinity
    };

    const limit = limits[subscriptionTier];
    
    if (this.props.showcaseIds.length >= limit) {
      throw new Error(`Showcase limit reached for ${subscriptionTier} tier`);
    }

    if (this.props.showcaseIds.includes(showcaseId)) {
      return; // Already added
    }

    this.props.showcaseIds.push(showcaseId);
    this.props.updatedAt = new Date();
  }

  /**
   * Remove showcase from profile
   */
  removeShowcase(showcaseId: string): void {
    const index = this.props.showcaseIds.indexOf(showcaseId);
    if (index !== -1) {
      this.props.showcaseIds.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Toggle profile visibility
   */
  toggleVisibility(): void {
    this.props.isPublic = !this.props.isPublic;
    this.props.updatedAt = new Date();
  }

  /**
   * Increment profile views
   */
  incrementViews(): void {
    this.props.profileViews++;
  }

  /**
   * Update last active timestamp
   */
  updateLastActive(): void {
    this.props.lastActiveAt = new Date();
  }

  /**
   * Check if profile is complete
   */
  isComplete(): boolean {
    return !!(
      this.props.displayName &&
      this.props.bio &&
      this.props.city &&
      this.props.avatarUrl &&
      this.props.styleTags.length > 0
    );
  }

  /**
   * Get profile completion percentage
   */
  getCompletionPercentage(): number {
    let completed = 0;
    const fields = [
      'displayName',
      'bio',
      'city',
      'avatarUrl',
      'styleTags',
      'website',
      'instagram'
    ];

    if (this.props.displayName) completed++;
    if (this.props.bio) completed++;
    if (this.props.city) completed++;
    if (this.props.avatarUrl) completed++;
    if (this.props.styleTags.length > 0) completed++;
    if (this.props.website) completed++;
    if (this.props.instagram) completed++;

    return Math.round((completed / fields.length) * 100);
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert to persistence model
   */
  toPersistence() {
    return {
      id: this.props.id,
      user_id: this.props.userId,
      handle: this.props.handle.toString(),
      display_name: this.props.displayName,
      avatar_url: this.props.avatarUrl,
      bio: this.props.bio,
      city: this.props.city,
      country: this.props.country,
      website: this.props.website,
      instagram: this.props.instagram,
      style_tags: this.props.styleTags,
      showcase_ids: this.props.showcaseIds,
      is_public: this.props.isPublic,
      profile_views: this.props.profileViews,
      last_active_at: this.props.lastActiveAt.toISOString(),
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }

  // Additional getter methods needed by application layer
  getId(): string { return this.props.id; }
  getUserId(): string { return this.props.userId; }
  getDisplayName(): string { return this.props.displayName; }
  getHandle(): Handle { return this.props.handle; }
  getAvatarUrl(): string | undefined { return this.props.avatarUrl; }
  getBio(): string | undefined { return this.props.bio; }
  getCity(): string | undefined { return this.props.city; }
  getStyleTags(): string[] { return [...this.props.styleTags]; }
  getShowcaseIds(): string[] { return [...this.props.showcaseIds]; }
  getWebsiteUrl(): string | undefined { return this.props.website; }
  getInstagramHandle(): string | undefined { return this.props.instagram; }
  getCreatedAt(): Date { return new Date(this.props.createdAt); }
  getUpdatedAt(): Date { return new Date(this.props.updatedAt); }
}