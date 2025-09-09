import { DomainEvent } from '../../shared/DomainEvent';

/**
 * Event emitted when an application is submitted
 */
export class ApplicationSubmitted implements DomainEvent {
  readonly eventType = 'ApplicationSubmitted';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      applicationId: string;
      gigId: string;
      applicantId: string;
      appliedAt: Date;
    }
  ) {}

  get aggregateId(): string {
    return this.payload.applicationId;
  }
}

/**
 * Event emitted when an applicant is shortlisted
 */
export class ApplicantShortlisted implements DomainEvent {
  readonly eventType = 'ApplicantShortlisted';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      applicationId: string;
      gigId: string;
      applicantId: string;
      shortlistedAt: Date;
    }
  ) {}

  get aggregateId(): string {
    return this.payload.applicationId;
  }
}

/**
 * Event emitted when talent is booked (application accepted)
 */
export class TalentBooked implements DomainEvent {
  readonly eventType = 'TalentBooked';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      applicationId: string;
      gigId: string;
      talentId: string;
      bookedAt: Date;
    }
  ) {}

  get aggregateId(): string {
    return this.payload.applicationId;
  }
}

/**
 * Event emitted when an application is declined
 */
export class ApplicationDeclined implements DomainEvent {
  readonly eventType = 'ApplicationDeclined';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      applicationId: string;
      gigId: string;
      applicantId: string;
      declinedAt: Date;
    }
  ) {}

  get aggregateId(): string {
    return this.payload.applicationId;
  }
}

/**
 * Event emitted when an application is withdrawn
 */
export class ApplicationWithdrawn implements DomainEvent {
  readonly eventType = 'ApplicationWithdrawn';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      applicationId: string;
      gigId: string;
      applicantId: string;
      withdrawnAt: Date;
    }
  ) {}

  get aggregateId(): string {
    return this.payload.applicationId;
  }
}

/**
 * Event emitted when application note is updated
 */
export class ApplicationNoteUpdated implements DomainEvent {
  readonly eventType = 'ApplicationNoteUpdated';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      applicationId: string;
      gigId: string;
      applicantId: string;
      newNote: string;
      updatedAt: Date;
    }
  ) {}

  get aggregateId(): string {
    return this.payload.applicationId;
  }
}