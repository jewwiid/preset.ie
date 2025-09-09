import { BaseAggregateRoot } from '../../shared/BaseAggregateRoot';
import { Visibility } from '../value-objects/Visibility';
import { Approval } from '../value-objects/Approval';

export interface ShowcaseProps {
  id: string;
  gigId: string;
  creatorId: string;  // Contributor who created the gig
  talentId: string;   // Talent who participated
  mediaIds: string[]; // 3-6 media items
  caption: string;
  tags: string[];
  palette: string[];  // Extracted color palette
  approvals: Approval[];
  visibility: Visibility;
  createdAt: Date;
  publishedAt?: Date;
  viewCount: number;
  likeCount: number;
}

/**
 * Showcase aggregate root - portfolio item from completed gig
 */
export class Showcase extends BaseAggregateRoot {
  private static readonly MIN_MEDIA = 3;
  private static readonly MAX_MEDIA = 6;
  private static readonly MAX_CAPTION_LENGTH = 500;
  private static readonly MAX_TAGS = 10;

  private props: ShowcaseProps;

  constructor(props: ShowcaseProps) {
    super();
    this.props = { ...props };
    this.validateMediaCount();
  }

  private validateMediaCount(): void {
    if (this.props.mediaIds.length < Showcase.MIN_MEDIA) {
      throw new Error(`Showcase must have at least ${Showcase.MIN_MEDIA} media items`);
    }

    if (this.props.mediaIds.length > Showcase.MAX_MEDIA) {
      throw new Error(`Showcase cannot have more than ${Showcase.MAX_MEDIA} media items`);
    }
  }

  static create(params: {
    id: string;
    gigId: string;
    creatorId: string;
    talentId: string;
    mediaIds: string[];
    caption: string;
    tags: string[];
    palette: string[];
  }): Showcase {
    const showcase = new Showcase({
      id: params.id,
      gigId: params.gigId,
      creatorId: params.creatorId,
      talentId: params.talentId,
      mediaIds: params.mediaIds,
      caption: params.caption,
      tags: params.tags,
      palette: params.palette,
      approvals: [],
      visibility: Visibility.PRIVATE, // Start as private until approved
      createdAt: new Date(),
      viewCount: 0,
      likeCount: 0
    });

    showcase.addDomainEvent({
      aggregateId: params.id,
      eventType: 'ShowcaseCreated',
      occurredAt: new Date(),
      payload: {
        showcaseId: params.id,
        gigId: params.gigId,
        creatorId: params.creatorId,
        talentId: params.talentId,
        mediaCount: params.mediaIds.length
      }
    });

    return showcase;
  }

  /**
   * Approve showcase for publication
   */
  approve(userId: string, note?: string): void {
    // Check if user is authorized to approve
    if (userId !== this.props.creatorId && userId !== this.props.talentId) {
      throw new Error('Only creator or talent can approve showcase');
    }

    // Check if already approved by this user
    const existingApproval = this.props.approvals.find(a => a.getUserId() === userId);
    if (existingApproval) {
      throw new Error('User has already approved this showcase');
    }

    const approval = new Approval(userId, new Date(), note);
    this.props.approvals.push(approval);

    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'ShowcaseApproved',
      occurredAt: new Date(),
      payload: {
        showcaseId: this.props.id,
        approvedBy: userId,
        gigId: this.props.gigId
      }
    });

    // If both parties have approved, publish
    if (this.hasBothApprovals()) {
      this.publish();
    }
  }

  /**
   * Publish showcase (make it public)
   */
  private publish(): void {
    if (!this.hasBothApprovals()) {
      throw new Error('Showcase needs approval from both creator and talent');
    }

    this.props.visibility = Visibility.PUBLIC;
    this.props.publishedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'ShowcasePublished',
      occurredAt: new Date(),
      payload: {
        showcaseId: this.props.id,
        gigId: this.props.gigId,
        creatorId: this.props.creatorId,
        talentId: this.props.talentId
      }
    });
  }

  /**
   * Add media to showcase
   */
  addMedia(mediaId: string): void {
    if (this.props.mediaIds.length >= Showcase.MAX_MEDIA) {
      throw new Error(`Cannot add more than ${Showcase.MAX_MEDIA} media items`);
    }

    if (this.props.mediaIds.includes(mediaId)) {
      throw new Error('Media already exists in showcase');
    }

    if (this.props.visibility === Visibility.PUBLIC) {
      throw new Error('Cannot modify published showcase');
    }

    this.props.mediaIds.push(mediaId);
  }

  /**
   * Update showcase caption
   */
  updateCaption(caption: string): void {
    if (caption.length > Showcase.MAX_CAPTION_LENGTH) {
      throw new Error(`Caption cannot exceed ${Showcase.MAX_CAPTION_LENGTH} characters`);
    }

    if (this.props.visibility === Visibility.PUBLIC) {
      throw new Error('Cannot modify published showcase');
    }

    this.props.caption = caption;
  }

  isPublished(): boolean {
    return this.props.visibility === Visibility.PUBLIC;
  }

  hasApprovalFrom(userId: string): boolean {
    return this.props.approvals.some(a => a.getUserId() === userId);
  }

  hasBothApprovals(): boolean {
    const hasCreatorApproval = this.hasApprovalFrom(this.props.creatorId);
    const hasTalentApproval = this.hasApprovalFrom(this.props.talentId);
    return hasCreatorApproval && hasTalentApproval;
  }

  // Getters
  getId(): string { return this.props.id; }
  getGigId(): string { return this.props.gigId; }
  getCreatorId(): string { return this.props.creatorId; }
  getTalentId(): string { return this.props.talentId; }
  getMediaIds(): string[] { return [...this.props.mediaIds]; }
  getCaption(): string { return this.props.caption; }
  getTags(): string[] { return [...this.props.tags]; }
  getPalette(): string[] { return [...this.props.palette]; }
  getApprovals(): Approval[] { return [...this.props.approvals]; }
  getVisibility(): Visibility { return this.props.visibility; }
  getCreatedAt(): Date { return new Date(this.props.createdAt); }
  getPublishedAt(): Date | undefined { 
    return this.props.publishedAt ? new Date(this.props.publishedAt) : undefined; 
  }
  getViewCount(): number { return this.props.viewCount; }
  getLikeCount(): number { return this.props.likeCount; }

  toJSON() {
    return {
      id: this.props.id,
      gigId: this.props.gigId,
      creatorId: this.props.creatorId,
      talentId: this.props.talentId,
      mediaIds: this.props.mediaIds,
      caption: this.props.caption,
      tags: this.props.tags,
      palette: this.props.palette,
      approvals: this.props.approvals.map(a => a.toJSON()),
      visibility: this.props.visibility,
      createdAt: this.props.createdAt.toISOString(),
      publishedAt: this.props.publishedAt?.toISOString(),
      viewCount: this.props.viewCount,
      likeCount: this.props.likeCount
    };
  }
}