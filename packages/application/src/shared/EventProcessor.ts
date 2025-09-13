import { EventBus, DomainEvent, EventHandler } from '@preset/domain';
import { EventHandlerRegistry } from './EventHandler';

/**
 * Event processor that connects domain events to handlers
 */
export class EventProcessor implements EventBus {
  constructor(
    private registry: EventHandlerRegistry,
    private persistEvent?: (event: DomainEvent) => Promise<void>
  ) {}

  /**
   * Publish a domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      // Persist event for audit trail
      if (this.persistEvent) {
        await this.persistEvent(event);
      }

      // Process through handlers
      await this.registry.processEvent(event);
      
      console.log(`Event processed: ${event.eventType} for aggregate ${event.aggregateId}`);
    } catch (error) {
      console.error(`Failed to process event ${event.eventType}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe a handler to specific event types
   */
  subscribe(handler: EventHandler): void {
    // Convert domain EventHandler to application EventHandler
    const subscribedTypes = handler.subscribedTo();
    if (subscribedTypes.length === 0) {
      throw new Error('EventHandler must subscribe to at least one event type');
    }
    const eventType = subscribedTypes[0];
    if (!eventType) {
      throw new Error('EventHandler subscribedTo() returned empty array');
    }
    const appHandler = {
      eventType: eventType,
      handle: handler.handle.bind(handler)
    };
    this.registry.register(appHandler);
  }

  /**
   * Unsubscribe a handler
   */
  unsubscribe(handler: EventHandler): void {
    // Note: This is a simplified implementation
    // In a real system, you'd need to track the mapping between domain and app handlers
    console.warn('Unsubscribe not fully implemented for domain EventHandlers');
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
   * Process a batch of events
   */
  async processBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}