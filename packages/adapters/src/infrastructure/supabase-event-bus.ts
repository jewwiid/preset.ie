import { EventBus } from '@preset/domain/shared/EventBus';
import { DomainEvent } from '@preset/domain/shared/DomainEvent';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

type EventRow = {
  id: string;
  aggregate_id: string;
  event_type: string;
  event_version: number;
  payload: any;
  metadata?: any;
  occurred_at: string;
  created_at: string;
};

/**
 * Supabase implementation of EventBus
 * Persists events and broadcasts them via Realtime
 */
export class SupabaseEventBus implements EventBus {
  private handlers: Map<string, ((event: DomainEvent) => Promise<void>)[]> = new Map();
  private channel: any;

  constructor(
    private supabase: SupabaseClient<Database>,
    private enableRealtime: boolean = true
  ) {
    if (this.enableRealtime) {
      this.setupRealtimeSubscription();
    }
  }

  /**
   * Publish a domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      // Persist event to database
      const eventRow: EventRow = {
        id: crypto.randomUUID(),
        aggregate_id: event.aggregateId,
        event_type: event.eventType,
        event_version: 1,
        payload: event.payload,
        metadata: event.metadata || {},
        occurred_at: event.occurredAt.toISOString(),
        created_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('domain_events')
        .insert(eventRow);

      if (error) {
        console.error('Failed to persist event:', error);
        throw new Error(`Failed to persist event: ${error.message}`);
      }

      // Broadcast via Realtime if enabled
      if (this.enableRealtime && this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'domain_event',
          payload: event
        });
      }

      // Process local handlers
      await this.processLocalHandlers(event);

      console.log(`Event published: ${event.eventType} for aggregate ${event.aggregateId}`);
    } catch (error) {
      console.error(`Failed to publish event ${event.eventType}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to an event type
   */
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Process local handlers for an event
   */
  private async processLocalHandlers(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    
    // Process handlers in parallel
    const promises = handlers.map(handler =>
      handler(event).catch(error => {
        console.error(`Handler failed for ${event.eventType}:`, error);
        // Don't throw - allow other handlers to continue
      })
    );

    await Promise.all(promises);
  }

  /**
   * Setup Realtime subscription for distributed event processing
   */
  private setupRealtimeSubscription(): void {
    this.channel = this.supabase
      .channel('domain_events')
      .on('broadcast', { event: 'domain_event' }, (payload: any) => {
        // Process events from other instances
        const event = payload.payload as DomainEvent;
        this.processLocalHandlers(event).catch(error => {
          console.error('Failed to process realtime event:', error);
        });
      })
      .subscribe((status: string) => {
        console.log('Realtime subscription status:', status);
      });
  }

  /**
   * Replay events from a specific point in time
   */
  async replayEvents(
    fromDate: Date,
    toDate?: Date,
    aggregateId?: string
  ): Promise<DomainEvent[]> {
    let query = this.supabase
      .from('domain_events')
      .select('*')
      .gte('occurred_at', fromDate.toISOString());

    if (toDate) {
      query = query.lte('occurred_at', toDate.toISOString());
    }

    if (aggregateId) {
      query = query.eq('aggregate_id', aggregateId);
    }

    const { data, error } = await query.order('occurred_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to replay events: ${error.message}`);
    }

    return (data || []).map(row => this.toDomainEvent(row));
  }

  /**
   * Get events for a specific aggregate
   */
  async getAggregateEvents(aggregateId: string): Promise<DomainEvent[]> {
    const { data, error } = await this.supabase
      .from('domain_events')
      .select('*')
      .eq('aggregate_id', aggregateId)
      .order('occurred_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get aggregate events: ${error.message}`);
    }

    return (data || []).map(row => this.toDomainEvent(row));
  }

  /**
   * Convert database row to domain event
   */
  private toDomainEvent(row: any): DomainEvent {
    return {
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      occurredAt: new Date(row.occurred_at),
      payload: row.payload,
      metadata: row.metadata
    };
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
    }
  }
}