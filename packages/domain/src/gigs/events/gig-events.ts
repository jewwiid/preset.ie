import { DomainEvent } from '../../shared/domain-event';

export class GigCreatedEvent implements DomainEvent {
  eventType = 'GigCreated';
  occurredAt = new Date();
  
  constructor(
    public aggregateId: string,
    public ownerUserId: string,
    public payload: Record<string, any> = {}
  ) {
    this.payload = { ownerUserId };
  }
}

export class GigPublishedEvent implements DomainEvent {
  eventType = 'GigPublished';
  occurredAt = new Date();
  payload: Record<string, any> = {};
  
  constructor(public aggregateId: string) {}
}

export class GigBookedEvent implements DomainEvent {
  eventType = 'GigBooked';
  occurredAt = new Date();
  
  constructor(
    public aggregateId: string,
    public talentUserIds: string[],
    public payload: Record<string, any> = {}
  ) {
    this.payload = { talentUserIds };
  }
}