import { BaseAggregateRoot } from '../../shared/BaseAggregateRoot';
import { Rating, ReviewTag } from '../value-objects/ReviewTag';

export interface ReviewProps {
  id: string;
  gigId: string;
  reviewerId: string;
  revieweeId: string;
  rating: Rating;
  tags: ReviewTag[];
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
  helpfulCount: number;
}

/**
 * Review aggregate root - mutual reviews after gig completion
 */
export class Review extends BaseAggregateRoot {
  private static readonly MIN_COMMENT_LENGTH = 10;
  private static readonly MAX_COMMENT_LENGTH = 1000;
  private static readonly MAX_TAGS = 5;

  private props: ReviewProps;

  constructor(props: ReviewProps) {
    super();
    this.props = { ...props };
    this.validate();
  }

  private validate(): void {
    if (this.props.comment.length < Review.MIN_COMMENT_LENGTH) {
      throw new Error(`Review comment must be at least ${Review.MIN_COMMENT_LENGTH} characters`);
    }

    if (this.props.comment.length > Review.MAX_COMMENT_LENGTH) {
      throw new Error(`Review comment cannot exceed ${Review.MAX_COMMENT_LENGTH} characters`);
    }

    if (this.props.tags.length > Review.MAX_TAGS) {
      throw new Error(`Cannot have more than ${Review.MAX_TAGS} review tags`);
    }

    if (this.props.reviewerId === this.props.revieweeId) {
      throw new Error('Cannot review yourself');
    }
  }

  static create(params: {
    id: string;
    gigId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    tags: ReviewTag[];
    comment: string;
  }): Review {
    const review = new Review({
      id: params.id,
      gigId: params.gigId,
      reviewerId: params.reviewerId,
      revieweeId: params.revieweeId,
      rating: new Rating(params.rating),
      tags: params.tags,
      comment: params.comment,
      createdAt: new Date(),
      helpfulCount: 0
    });

    review.addDomainEvent({
      aggregateId: params.id,
      eventType: 'ReviewSubmitted',
      occurredAt: new Date(),
      payload: {
        reviewId: params.id,
        gigId: params.gigId,
        reviewerId: params.reviewerId,
        revieweeId: params.revieweeId,
        rating: params.rating
      }
    });

    return review;
  }

  /**
   * Update review comment and tags
   */
  update(comment: string, tags: ReviewTag[]): void {
    if (comment.length < Review.MIN_COMMENT_LENGTH) {
      throw new Error(`Review comment must be at least ${Review.MIN_COMMENT_LENGTH} characters`);
    }

    if (comment.length > Review.MAX_COMMENT_LENGTH) {
      throw new Error(`Review comment cannot exceed ${Review.MAX_COMMENT_LENGTH} characters`);
    }

    if (tags.length > Review.MAX_TAGS) {
      throw new Error(`Cannot have more than ${Review.MAX_TAGS} review tags`);
    }

    // Only allow updates within 24 hours of creation
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    if (this.props.createdAt < oneDayAgo) {
      throw new Error('Reviews can only be edited within 24 hours of creation');
    }

    this.props.comment = comment;
    this.props.tags = tags;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'ReviewUpdated',
      occurredAt: new Date(),
      payload: {
        reviewId: this.props.id,
        gigId: this.props.gigId,
        updatedBy: this.props.reviewerId
      }
    });
  }

  /**
   * Mark review as helpful
   */
  markAsHelpful(): void {
    this.props.helpfulCount++;

    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'ReviewMarkedHelpful',
      occurredAt: new Date(),
      payload: {
        reviewId: this.props.id,
        helpfulCount: this.props.helpfulCount
      }
    });
  }

  /**
   * Add a tag to the review
   */
  addTag(tag: ReviewTag): void {
    if (this.props.tags.length >= Review.MAX_TAGS) {
      throw new Error(`Cannot have more than ${Review.MAX_TAGS} tags`);
    }

    if (this.props.tags.includes(tag)) {
      throw new Error('Tag already exists');
    }

    this.props.tags.push(tag);
    this.props.updatedAt = new Date();
  }

  /**
   * Remove a tag from the review
   */
  removeTag(tag: ReviewTag): void {
    const index = this.props.tags.indexOf(tag);
    if (index !== -1) {
      this.props.tags.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  // Getters
  getId(): string {
    return this.props.id;
  }

  getGigId(): string {
    return this.props.gigId;
  }

  getReviewerId(): string {
    return this.props.reviewerId;
  }

  getRevieweeId(): string {
    return this.props.revieweeId;
  }

  getRating(): Rating {
    return this.props.rating;
  }

  getTags(): ReviewTag[] {
    return [...this.props.tags];
  }

  getComment(): string {
    return this.props.comment;
  }

  getCreatedAt(): Date {
    return new Date(this.props.createdAt);
  }

  getUpdatedAt(): Date | undefined {
    return this.props.updatedAt ? new Date(this.props.updatedAt) : undefined;
  }

  getHelpfulCount(): number {
    return this.props.helpfulCount;
  }

  isPositive(): boolean {
    return this.props.rating.isPositive();
  }

  isNeutral(): boolean {
    return this.props.rating.isNeutral();
  }

  isNegative(): boolean {
    return this.props.rating.isNegative();
  }

  /**
   * Check if review is editable (within 24 hours)
   */
  isEditable(): boolean {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    return this.props.createdAt >= oneDayAgo;
  }

  /**
   * Get a summary for display
   */
  getSummary(maxLength: number = 100): string {
    if (this.props.comment.length <= maxLength) {
      return this.props.comment;
    }
    return this.props.comment.substring(0, maxLength).trim() + '...';
  }

  toJSON() {
    return {
      id: this.props.id,
      gigId: this.props.gigId,
      reviewerId: this.props.reviewerId,
      revieweeId: this.props.revieweeId,
      rating: this.props.rating.getValue(),
      tags: this.props.tags,
      comment: this.props.comment,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt?.toISOString(),
      helpfulCount: this.props.helpfulCount
    };
  }
}