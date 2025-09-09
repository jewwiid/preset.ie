import { DomainEvent } from '@preset/domain/shared/DomainEvent';

/**
 * Base interface for all event handlers
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * The event type this handler processes
   */
  eventType: string;

  /**
   * Handle the event
   */
  handle(event: T): Promise<void>;
}

/**
 * Event handler registry for managing handlers
 */
export class EventHandlerRegistry {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler
   */
  register(handler: EventHandler): void {
    const handlers = this.handlers.get(handler.eventType) || [];
    handlers.push(handler);
    this.handlers.set(handler.eventType, handlers);
  }

  /**
   * Get handlers for an event type
   */
  getHandlers(eventType: string): EventHandler[] {
    return this.handlers.get(eventType) || [];
  }

  /**
   * Process an event through all registered handlers
   */
  async processEvent(event: DomainEvent): Promise<void> {
    const handlers = this.getHandlers(event.eventType);
    
    // Process handlers in parallel for performance
    const promises = handlers.map(handler => 
      handler.handle(event).catch(error => {
        console.error(`Handler failed for ${event.eventType}:`, error);
        // Don't throw - allow other handlers to continue
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}