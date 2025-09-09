import { SupabaseClient } from '@supabase/supabase-js';
import { EventBus, EventHandler } from '@preset/domain/shared/ports/EventBus';
import { DomainEvent } from '@preset/domain/shared/DomainEvent';

/**
 * Supabase implementation of the EventBus
 * Stores events in a database table and broadcasts via Realtime
 */
export class SupabaseEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private realtimeChannel: any;
  
  constructor(private supabase: SupabaseClient) {
    this.setupRealtimeSubscription();
  }
  
  /**
   * Publish a single domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      // Store event in database for audit trail
      const { error } = await this.supabase
        .from('domain_events')
        .insert({
          aggregate_id: event.aggregateId,
          event_type: event.eventType,
          payload: event.payload,
          metadata: event.metadata,
          occurred_at: event.occurredAt.toISOString()
        });
      
      if (error) {
        console.error('Failed to store domain event:', error);
        throw error;
      }
      
      // Broadcast event via Realtime for immediate processing
      await this.broadcastEvent(event);
      
      // Process local handlers
      await this.processLocalHandlers(event);
    } catch (error) {
      console.error('Failed to publish domain event:', error);
      throw error;
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
        if (handlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    }
  }
  
  /**
   * Set up Realtime subscription for distributed event processing
   */
  private setupRealtimeSubscription(): void {
    this.realtimeChannel = this.supabase
      .channel('domain-events')
      .on('broadcast', { event: 'domain-event' }, (payload: any) => {
        this.handleRealtimeEvent(payload.payload);
      })
      .subscribe();
  }
  
  /**
   * Broadcast event via Realtime
   */
  private async broadcastEvent(event: DomainEvent): Promise<void> {
    await this.realtimeChannel.send({
      type: 'broadcast',
      event: 'domain-event',
      payload: event
    });
  }
  
  /**
   * Handle events received via Realtime
   */
  private async handleRealtimeEvent(event: DomainEvent): Promise<void> {
    await this.processLocalHandlers(event);
  }
  
  /**
   * Process event with local handlers
   */
  private async processLocalHandlers(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType);
    
    if (handlers && handlers.size > 0) {
      // Process handlers in parallel
      const promises = Array.from(handlers).map(handler => 
        handler.handle(event).catch(error => {
          console.error(`Handler failed for event ${event.eventType}:`, error);
        })
      );
      
      await Promise.all(promises);
    }
  }
  
  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    if (this.realtimeChannel) {
      await this.supabase.removeChannel(this.realtimeChannel);
    }
  }
}