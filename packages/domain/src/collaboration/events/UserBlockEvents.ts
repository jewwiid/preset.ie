import { DomainEvent } from '../../shared/DomainEvent';
import { BlockReason } from '../value-objects/BlockReason';

/**
 * Event fired when a user blocks another user
 */
export interface UserBlockCreatedEvent extends DomainEvent {
  eventType: 'UserBlockCreated';
  payload: {
    blockId: string;
    blockerUserId: string;
    blockedUserId: string;
    reason: BlockReason;
    details?: string;
  };
}

/**
 * Event fired when a user block reason is updated
 */
export interface UserBlockReasonUpdatedEvent extends DomainEvent {
  eventType: 'UserBlockReasonUpdated';
  payload: {
    blockId: string;
    blockerUserId: string;
    blockedUserId: string;
    oldReason: BlockReason;
    oldDetails?: string;
    newReason: BlockReason;
    newDetails?: string;
  };
}

/**
 * Event fired when a user block is removed
 */
export interface UserBlockRemovedEvent extends DomainEvent {
  eventType: 'UserBlockRemoved';
  payload: {
    blockId: string;
    blockerUserId: string;
    blockedUserId: string;
    removedBy: string; // Could be blocker, blocked user, or admin
    reason?: string; // Reason for removal (e.g., 'user_requested', 'admin_action')
  };
}

/**
 * Event fired when a blocked user attempts to communicate
 */
export interface BlockedCommunicationAttemptedEvent extends DomainEvent {
  eventType: 'BlockedCommunicationAttempted';
  payload: {
    attemptedBy: string; // The blocked user trying to communicate
    targetUserId: string; // The user they're trying to reach
    communicationType: 'message' | 'application' | 'gig_response' | 'review';
    blockId?: string; // The block that prevented the communication
    gigId?: string; // If related to a specific gig
    conversationId?: string; // If related to messaging
  };
}

/**
 * Event fired when someone tries to block a user they've already blocked
 */
export interface DuplicateBlockAttemptedEvent extends DomainEvent {
  eventType: 'DuplicateBlockAttempted';
  payload: {
    attemptedBy: string;
    targetUserId: string;
    existingBlockId: string;
  };
}

/**
 * Event fired when a mutual block situation is detected
 */
export interface MutualBlockDetectedEvent extends DomainEvent {
  eventType: 'MutualBlockDetected';
  payload: {
    userId1: string;
    userId2: string;
    firstBlockId: string;
    secondBlockId: string;
    detectedAt: Date;
  };
}

export type UserBlockEvent = 
  | UserBlockCreatedEvent
  | UserBlockReasonUpdatedEvent
  | UserBlockRemovedEvent
  | BlockedCommunicationAttemptedEvent
  | DuplicateBlockAttemptedEvent
  | MutualBlockDetectedEvent;