import { BaseDomainEvent, DomainEvent } from '../../shared/DomainEvent';

/**
 * Event emitted when a new gig is created
 */
export class GigCreated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      ownerId: string;
      title: string;
      location: string;
      startTime: string;
      compensationType: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'GigCreated', payload, metadata);
  }
}

/**
 * Event emitted when a gig is published
 */
export class GigPublished extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      publishedAt: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'GigPublished', payload, metadata);
  }
}

/**
 * Event emitted when a gig is closed
 */
export class GigClosed extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      closedAt: string;
      totalApplications: number;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'GigClosed', payload, metadata);
  }
}

/**
 * Event emitted when talent is booked for a gig
 */
export class GigBooked extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      talentIds: string[];
      bookedAt: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'GigBooked', payload, metadata);
  }
}

/**
 * Event emitted when a gig is completed
 */
export class GigCompleted extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      completedAt: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'GigCompleted', payload, metadata);
  }
}

/**
 * Event emitted when a gig is cancelled
 */
export class GigCancelled extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      reason: string;
      cancelledAt: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'GigCancelled', payload, metadata);
  }
}

/**
 * Event emitted when a gig is boosted
 */
export class GigBoosted extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      boostLevel: number;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'GigBoosted', payload, metadata);
  }
}

/**
 * Event emitted when a moodboard is attached to a gig
 */
export class MoodboardAttached extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      moodboardId: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'MoodboardAttached', payload, metadata);
  }
}