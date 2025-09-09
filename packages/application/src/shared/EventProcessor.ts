import { EventBus } from '@preset/domain/shared/EventBus';
import { DomainEvent } from '@preset/domain/shared/DomainEvent';
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
   * Subscribe to an event type
   */
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    this.registry.register({
      eventType,
      handle: handler
    });
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