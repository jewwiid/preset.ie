import { BaseDomainEvent, DomainEvent } from '../../shared/DomainEvent';

/**
 * Event emitted when a profile is created
 */
export class ProfileCreated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      profileId: string;
      userId: string;
      handle: string;
      displayName: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'ProfileCreated', payload, metadata);
  }
}

/**
 * Event emitted when a profile is updated
 */
export class ProfileUpdated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      profileId: string;
      userId: string;
      updates: Record<string, any>;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'ProfileUpdated', payload, metadata);
  }
}

/**
 * Event emitted when a style tag is added
 */
export class StyleTagAdded extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      profileId: string;
      userId: string;
      tag: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'StyleTagAdded', payload, metadata);
  }
}

/**
 * Event emitted when a style tag is removed
 */
export class StyleTagRemoved extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      profileId: string;
      userId: string;
      tag: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'StyleTagRemoved', payload, metadata);
  }
}

/**
 * Event emitted when a showcase is added to profile
 */
export class ShowcaseAddedToProfile extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      profileId: string;
      userId: string;
      showcaseId: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'ShowcaseAddedToProfile', payload, metadata);
  }
}

/**
 * Event emitted when profile visibility changes
 */
export class ProfileVisibilityChanged extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      profileId: string;
      userId: string;
      isPublic: boolean;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'ProfileVisibilityChanged', payload, metadata);
  }
}