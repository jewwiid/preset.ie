import { EventBus, DomainEvent } from '@preset/application';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '../database/database.types';

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  eventType: string;
  handle: (event: T) => Promise<void>;
}

export class SupabaseRealtimeEventBus implements EventBus {
  private channels: Map<string, RealtimeChannel> = new Map();
  private handlers: Map<string, EventHandler[]> = new Map();
  private globalHandlers: Array<(event: DomainEvent) => Promise<void>> = [];

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async publish(event: DomainEvent): Promise<void> {
    try {
      // Store event in database for persistence and audit
      const { error: dbError } = await this.supabase
        .from('domain_events')
        .insert({
          aggregate_id: event.aggregateId,
          aggregate_type: event.aggregateType,
          event_type: event.eventType,
          event_version: event.eventVersion,
          event_data: event.eventData,
          metadata: event.metadata || {},
        });

      if (dbError) {
        console.error('Failed to persist domain event:', dbError);
        throw new Error(`Failed to persist event: ${dbError.message}`);
      }

      // Broadcast event via Realtime
      const channel = this.getOrCreateChannel(event.aggregateType);
      
      await channel.send({
        type: 'broadcast',
        event: event.eventType,
        payload: {
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          eventType: event.eventType,
          eventVersion: event.eventVersion,
          eventData: event.eventData,
          metadata: event.metadata,
          occurredAt: event.occurredAt,
        },
      });

      // Execute local handlers
      await this.executeHandlers(event);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    // Use a transaction-like approach for batch publishing
    const promises = events.map(event => this.publish(event));
    await Promise.all(promises);
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): () => void {
    const eventHandler: EventHandler<T> = {
      eventType,
      handle: handler,
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(eventHandler as EventHandler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(eventHandler as EventHandler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  subscribeToAll(handler: (event: DomainEvent) => Promise<void>): () => void {
    this.globalHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index > -1) {
        this.globalHandlers.splice(index, 1);
      }
    };
  }

  subscribeToAggregate(
    aggregateType: string,
    aggregateId: string,
    handler: (event: DomainEvent) => Promise<void>
  ): () => void {
    const channel = this.getOrCreateChannel(`${aggregateType}:${aggregateId}`);

    const subscription = channel.on(
      'broadcast',
      { event: '*' },
      async (payload) => {
        const event = payload.payload as DomainEvent;
        if (event.aggregateId === aggregateId) {
          await handler(event);
        }
      }
    );

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
    };
  }

  async replay(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<DomainEvent[]> {
    let query = this.supabase
      .from('domain_events')
      .select('*')
      .eq('aggregate_id', aggregateId)
      .order('event_version', { ascending: true });

    if (fromVersion !== undefined) {
      query = query.gte('event_version', fromVersion);
    }

    if (toVersion !== undefined) {
      query = query.lte('event_version', toVersion);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to replay events: ${error.message}`);
    }

    return (data || []).map(this.mapToDomainEvent);
  }

  async replayByType(
    eventType: string,
    since?: Date,
    until?: Date
  ): Promise<DomainEvent[]> {
    let query = this.supabase
      .from('domain_events')
      .select('*')
      .eq('event_type', eventType)
      .order('created_at', { ascending: true });

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    if (until) {
      query = query.lte('created_at', until.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to replay events by type: ${error.message}`);
    }

    return (data || []).map(this.mapToDomainEvent);
  }

  async getLastEvent(aggregateId: string): Promise<DomainEvent | null> {
    const { data, error } = await this.supabase
      .from('domain_events')
      .select('*')
      .eq('aggregate_id', aggregateId)
      .order('event_version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No events found
        return null;
      }
      throw new Error(`Failed to get last event: ${error.message}`);
    }

    return data ? this.mapToDomainEvent(data) : null;
  }

  async getEventStream(
    aggregateType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<() => void> {
    const channel = this.getOrCreateChannel(aggregateType);

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'domain_events',
        filter: `aggregate_type=eq.${aggregateType}`,
      },
      async (payload) => {
        const event = this.mapToDomainEvent(payload.new);
        await handler(event);
      }
    );

    await channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  private getOrCreateChannel(name: string): RealtimeChannel {
    if (!this.channels.has(name)) {
      const channel = this.supabase.channel(name);
      this.channels.set(name, channel);
    }
    return this.channels.get(name)!;
  }

  private async executeHandlers(event: DomainEvent): Promise<void> {
    // Execute specific handlers
    const handlers = this.handlers.get(event.eventType) || [];
    const handlerPromises = handlers.map(h => h.handle(event));

    // Execute global handlers
    const globalPromises = this.globalHandlers.map(h => h(event));

    // Execute all handlers in parallel
    await Promise.all([...handlerPromises, ...globalPromises]);
  }

  private mapToDomainEvent(data: any): DomainEvent {
    return {
      aggregateId: data.aggregate_id,
      aggregateType: data.aggregate_type,
      eventType: data.event_type,
      eventVersion: data.event_version,
      eventData: data.event_data,
      metadata: data.metadata,
      occurredAt: new Date(data.created_at),
    };
  }

  async cleanup(): Promise<void> {
    // Unsubscribe from all channels
    for (const channel of this.channels.values()) {
      await channel.unsubscribe();
    }
    this.channels.clear();
    this.handlers.clear();
    this.globalHandlers = [];
  }

  // Utility method to wait for event processing
  async waitForEvent(
    eventType: string,
    timeout: number = 5000
  ): Promise<DomainEvent> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const unsubscribe = this.subscribe(eventType, async (event) => {
        clearTimeout(timer);
        unsubscribe();
        resolve(event);
      });
    });
  }

  // Method to get event statistics
  async getEventStats(
    aggregateType?: string,
    since?: Date
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsPerHour: number;
  }> {
    let query = this.supabase
      .from('domain_events')
      .select('event_type, created_at');

    if (aggregateType) {
      query = query.eq('aggregate_type', aggregateType);
    }

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get event stats: ${error.message}`);
    }

    const events = data || [];
    const eventsByType: Record<string, number> = {};
    
    events.forEach(event => {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
    });

    const now = new Date();
    const oldestEvent = events.length > 0 
      ? new Date(events[0].created_at)
      : now;
    const hoursDiff = Math.max(1, (now.getTime() - oldestEvent.getTime()) / (1000 * 60 * 60));

    return {
      totalEvents: events.length,
      eventsByType,
      eventsPerHour: Math.round(events.length / hoursDiff),
    };
  }
}