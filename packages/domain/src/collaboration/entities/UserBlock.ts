import { BaseAggregateRoot } from '../../shared/BaseAggregateRoot';
import { BlockReasonDetails } from '../value-objects/BlockReason';

export interface UserBlockProps {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  reasonDetails: BlockReasonDetails;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserBlock entity representing a user blocking another user globally
 * This prevents all communication and interaction between the users
 */
export class UserBlock extends BaseAggregateRoot {
  private props: UserBlockProps;

  constructor(props: UserBlockProps) {
    super();
    this.props = { ...props };
    this.validate();
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('UserBlock ID is required');
    }

    if (!this.props.blockerUserId) {
      throw new Error('Blocker user ID is required');
    }

    if (!this.props.blockedUserId) {
      throw new Error('Blocked user ID is required');
    }

    if (this.props.blockerUserId === this.props.blockedUserId) {
      throw new Error('User cannot block themselves');
    }

    if (!this.props.reasonDetails) {
      throw new Error('Block reason is required');
    }

    if (!this.props.createdAt) {
      throw new Error('Created date is required');
    }

    if (!this.props.updatedAt) {
      throw new Error('Updated date is required');
    }

    // Validate dates
    if (this.props.updatedAt < this.props.createdAt) {
      throw new Error('Updated date cannot be before created date');
    }
  }

  static create(params: {
    id: string;
    blockerUserId: string;
    blockedUserId: string;
    reasonDetails: BlockReasonDetails;
  }): UserBlock {
    const now = new Date();
    
    const userBlock = new UserBlock({
      id: params.id,
      blockerUserId: params.blockerUserId,
      blockedUserId: params.blockedUserId,
      reasonDetails: params.reasonDetails,
      createdAt: now,
      updatedAt: now
    });

    // Add domain event
    userBlock.addDomainEvent({
      aggregateId: params.id,
      eventType: 'UserBlockCreated',
      occurredAt: now,
      payload: {
        blockId: params.id,
        blockerUserId: params.blockerUserId,
        blockedUserId: params.blockedUserId,
        reason: params.reasonDetails.getReason(),
        details: params.reasonDetails.getDetails()
      }
    });

    return userBlock;
  }

  /**
   * Update the block reason
   */
  updateReason(newReasonDetails: BlockReasonDetails, updatedBy: string): void {
    // Only the blocker can update the reason
    if (updatedBy !== this.props.blockerUserId) {
      throw new Error('Only the blocker can update the block reason');
    }

    if (this.props.reasonDetails.equals(newReasonDetails)) {
      return; // No change needed
    }

    const oldReason = this.props.reasonDetails;
    this.props.reasonDetails = newReasonDetails;
    this.props.updatedAt = new Date();

    // Add domain event
    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'UserBlockReasonUpdated',
      occurredAt: this.props.updatedAt,
      payload: {
        blockId: this.props.id,
        blockerUserId: this.props.blockerUserId,
        blockedUserId: this.props.blockedUserId,
        oldReason: oldReason.getReason(),
        oldDetails: oldReason.getDetails(),
        newReason: newReasonDetails.getReason(),
        newDetails: newReasonDetails.getDetails()
      }
    });
  }

  /**
   * Check if a specific user is blocked by another user
   */
  static isBlocking(blockerUserId: string, targetUserId: string, blocks: UserBlock[]): boolean {
    return blocks.some(block => 
      block.getBlockerUserId() === blockerUserId && 
      block.getBlockedUserId() === targetUserId
    );
  }

  /**
   * Check if two users can communicate (neither has blocked the other)
   */
  static canCommunicate(userId1: string, userId2: string, blocks: UserBlock[]): boolean {
    return !UserBlock.isBlocking(userId1, userId2, blocks) && 
           !UserBlock.isBlocking(userId2, userId1, blocks);
  }

  /**
   * Get all users blocked by a specific user
   */
  static getBlockedUsers(blockerUserId: string, blocks: UserBlock[]): UserBlock[] {
    return blocks.filter(block => block.getBlockerUserId() === blockerUserId);
  }

  /**
   * Get all users who have blocked a specific user
   */
  static getUsersBlockingUser(blockedUserId: string, blocks: UserBlock[]): UserBlock[] {
    return blocks.filter(block => block.getBlockedUserId() === blockedUserId);
  }

  /**
   * Check if block involves a specific user (as blocker or blocked)
   */
  involvesUser(userId: string): boolean {
    return this.props.blockerUserId === userId || this.props.blockedUserId === userId;
  }

  /**
   * Check if user is the blocker
   */
  isBlocker(userId: string): boolean {
    return this.props.blockerUserId === userId;
  }

  /**
   * Check if user is the blocked party
   */
  isBlocked(userId: string): boolean {
    return this.props.blockedUserId === userId;
  }

  /**
   * Get the other user in this block relationship
   */
  getOtherUser(userId: string): string {
    if (this.props.blockerUserId === userId) {
      return this.props.blockedUserId;
    }
    if (this.props.blockedUserId === userId) {
      return this.props.blockerUserId;
    }
    throw new Error('User is not part of this block relationship');
  }

  /**
   * Get age of the block in days
   */
  getAgeInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.props.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if block is recent (within specified days)
   */
  isRecent(days: number = 7): boolean {
    return this.getAgeInDays() <= days;
  }

  // Getters
  getId(): string {
    return this.props.id;
  }

  getBlockerUserId(): string {
    return this.props.blockerUserId;
  }

  getBlockedUserId(): string {
    return this.props.blockedUserId;
  }

  getReasonDetails(): BlockReasonDetails {
    return this.props.reasonDetails;
  }

  getCreatedAt(): Date {
    return new Date(this.props.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  toJSON() {
    return {
      id: this.props.id,
      blockerUserId: this.props.blockerUserId,
      blockedUserId: this.props.blockedUserId,
      reasonDetails: this.props.reasonDetails.toJSON(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      ageInDays: this.getAgeInDays(),
      isRecent: this.isRecent()
    };
  }
}