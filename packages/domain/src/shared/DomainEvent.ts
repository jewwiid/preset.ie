/**
 * Base interface for all domain events in the system
 * Domain events represent something that has happened in the domain
 */
export interface DomainEvent {
  /**
   * The ID of the aggregate that emitted this event
   */
  aggregateId: string;
  
  /**
   * The type of event (e.g., "UserRegistered", "GigCreated")
   */
  eventType: string;
  
  /**
   * When the event occurred
   */
  occurredAt: Date;
  
  /**
   * The event data/payload
   */
  payload: Record<string, any>;
  
  /**
   * Optional metadata about the event
   */
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
    version?: number;
  };
}

/**
 * Base class for domain events with common functionality
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly metadata?: DomainEvent['metadata'];
  
  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly payload: Record<string, any>,
    metadata?: DomainEvent['metadata']
  ) {
    this.occurredAt = new Date();
    this.metadata = metadata;
  }
}
