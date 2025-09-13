import { DomainEvent } from './DomainEvent';

/**
 * Interface for entities that can emit domain events
 */
interface AggregateRoot {
  getUncommittedEvents(): DomainEvent[];
  markEventsAsCommitted(): void;
  addDomainEvent(event: DomainEvent): void;
}

/**
 * Base class for aggregate roots that can emit domain events
 */
export abstract class BaseAggregateRoot implements AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];
  
  /**
   * Get all uncommitted events
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }
  
  /**
   * Mark all events as committed
   */
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }
  
  /**
   * Add a domain event to be published
   */
  addDomainEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
  }
  
  /**
   * Helper method to create and add an event
   */
  protected raise(event: DomainEvent): void {
    this.addDomainEvent(event);
  }

  /**
   * Get all events (alias for getUncommittedEvents for backward compatibility)
   */
  getEvents(): DomainEvent[] {
    return this.getUncommittedEvents();
  }

  /**
   * Clear all events (alias for markEventsAsCommitted for backward compatibility)
   */
  clearEvents(): void {
    this.markEventsAsCommitted();
  }
}