import { BaseDomainEvent, DomainEvent } from '../../shared/DomainEvent';

/**
 * Event emitted when a new moodboard is created
 */
export class MoodboardCreated extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      gigId: string;
      ownerId: string;
      title: string;
      itemCount: number;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'MoodboardCreated', payload, metadata);
  }
}

/**
 * Event emitted when an image is enhanced
 */
export class ImageEnhanced extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      moodboardId: string;
      originalUrl: string;
      enhancedUrl: string;
      enhancementType: string;
      cost: number;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'ImageEnhanced', payload, metadata);
  }
}

/**
 * Event emitted when an item is added to a moodboard
 */
export class MoodboardItemAdded extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      moodboardId: string;
      itemId: string;
      itemType: string;
      source: string;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'MoodboardItemAdded', payload, metadata);
  }
}

/**
 * Event emitted when a moodboard is published
 */
export class MoodboardPublished extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    payload: {
      moodboardId: string;
      gigId: string;
      isPublic: boolean;
    },
    metadata?: DomainEvent['metadata']
  ) {
    super(aggregateId, 'MoodboardPublished', payload, metadata);
  }
}