import { BaseDomainEvent, DomainEvent } from '../../shared/DomainEvent';
import { UserRole } from '../value-objects/UserRole';
import { SubscriptionTier } from '../../subscriptions/SubscriptionTier';

/**
 * Event emitted when a new user registers
 */
export class UserRegistered extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      userId: string;
      email: string;
      role: UserRole;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'UserRegistered', payload, metadata);
  }
}

/**
 * Event emitted when a user is verified
 */
export class UserVerified extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      userId: string;
      verificationType: 'email' | 'phone' | 'id';
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'UserVerified', payload, metadata);
  }
}

/**
 * Event emitted when a user's role changes
 */
export class UserRoleChanged extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      userId: string;
      oldRole: UserRole;
      newRole: UserRole;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'UserRoleChanged', payload, metadata);
  }
}

/**
 * Event emitted when a user's subscription changes
 */
export class SubscriptionChanged extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      userId: string;
      oldTier: SubscriptionTier;
      newTier: SubscriptionTier;
      expiresAt?: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'SubscriptionChanged', payload, metadata);
  }
}

/**
 * Event emitted when a user is suspended
 */
export class UserSuspended extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      userId: string;
      reason: string;
      suspendedUntil?: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'UserSuspended', payload, metadata);
  }
}

/**
 * Event emitted when a user is unsuspended
 */
export class UserUnsuspended extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      userId: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'UserUnsuspended', payload, metadata);
  }
}