import { EventBus, EventHandler } from '@preset/domain/shared/ports/EventBus';
import { DomainEvent } from '@preset/domain/shared/DomainEvent';

/**
 * In-memory implementation of EventBus for testing
 */
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private publishedEvents: DomainEvent[] = [];
  
  /**
   * Publish a domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
    
    const handlers = this.handlers.get(event.eventType);
    if (handlers) {
      for (const handler of handlers) {
        await handler.handle(event);
      }
    }
  }
  
  /**
   * Publish multiple domain events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
  
  /**
   * Subscribe a handler to specific event types
   */
  subscribe(handler: EventHandler): void {
    const eventTypes = handler.subscribedTo();
    
    for (const eventType of eventTypes) {
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, new Set());
      }
      this.handlers.get(eventType)!.add(handler);
    }
  }
  
  /**
   * Unsubscribe a handler
   */
  unsubscribe(handler: EventHandler): void {
    const eventTypes = handler.subscribedTo();
    
    for (const eventType of eventTypes) {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    }
  }
  
  /**
   * Get all published events (for testing)
   */
  getPublishedEvents(): DomainEvent[] {
    return [...this.publishedEvents];
  }
  
  /**
   * Clear all published events (for testing)
   */
  clearPublishedEvents(): void {
    this.publishedEvents = [];
  }
  
  /**
   * Get event count by type (for testing)
   */
  getEventCount(eventType: string): number {
    return this.publishedEvents.filter(e => e.eventType === eventType).length;
  }
}