export interface DomainEvent {
  aggregateId: string;
  eventType: string;
  occurredAt: Date;
  payload: Record<string, any>;
}