import { DomainEvent } from '../DomainEvent';

/**
 * Handler for processing domain events
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * Handle a domain event
   */
  handle(event: T): Promise<void>;
  
  /**
   * The event types this handler is interested in
   */
  subscribedTo(): string[];
}

/**
 * Port interface for publishing and subscribing to domain events
 * This allows the domain to emit events without knowing how they're transmitted
 */
export interface EventBus {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): Promise<void>;
  
  /**
   * Publish multiple domain events
   */
  publishAll(events: DomainEvent[]): Promise<void>;
  
  /**
   * Subscribe a handler to specific event types
   */
  subscribe(handler: EventHandler): void;
  
  /**
   * Unsubscribe a handler
   */
  unsubscribe(handler: EventHandler): void;
}