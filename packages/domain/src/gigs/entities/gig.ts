import { AggregateRoot } from '../../shared/aggregate-root';
import { EntityId } from '../../shared/value-objects/entity-id';
import { Compensation } from '../value-objects/compensation-type';
import { Location } from '../value-objects/location';
import { GigStatus } from '../value-objects/gig-status';
import { GigCreatedEvent, GigPublishedEvent, GigBookedEvent } from '../events/gig-events';

export interface GigProps {
  ownerUserId: EntityId;
  title: string;
  description: string;
  compensation: Compensation;
  location: Location;
  startTime: Date;
  endTime: Date;
  applicationDeadline: Date;
  maxApplicants: number;
  usageRights: string;
  safetyNotes?: string;
  status: GigStatus;
  boostLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Gig extends AggregateRoot<GigProps> {
  private props: GigProps;

  constructor(id: EntityId, props: GigProps) {
    super(id);
    this.props = props;
  }

  static create(
    ownerUserId: EntityId,
    title: string,
    description: string,
    compensation: Compensation,
    location: Location,
    startTime: Date,
    endTime: Date,
    applicationDeadline: Date,
    maxApplicants: number,
    usageRights: string,
    safetyNotes?: string
  ): Gig {
    const id = EntityId.generate();
    const now = new Date();
    
    const gig = new Gig(id, {
      ownerUserId,
      title,
      description,
      compensation,
      location,
      startTime,
      endTime,
      applicationDeadline,
      maxApplicants,
      usageRights,
      safetyNotes,
      status: GigStatus.DRAFT,
      boostLevel: 0,
      createdAt: now,
      updatedAt: now
    });

    gig.addDomainEvent(new GigCreatedEvent(id.toString(), ownerUserId.toString()));
    
    return gig;
  }

  publish(): void {
    if (this.props.status !== GigStatus.DRAFT) {
      throw new Error('Can only publish draft gigs');
    }

    this.props.status = GigStatus.PUBLISHED;
    this.props.updatedAt = new Date();
    
    this.addDomainEvent(new GigPublishedEvent(this.id.toString()));
  }

  closeApplications(): void {
    if (this.props.status !== GigStatus.PUBLISHED) {
      throw new Error('Can only close applications for published gigs');
    }

    this.props.status = GigStatus.APPLICATIONS_CLOSED;
    this.props.updatedAt = new Date();
  }

  book(talentUserIds: EntityId[]): void {
    if (this.props.status !== GigStatus.APPLICATIONS_CLOSED && 
        this.props.status !== GigStatus.PUBLISHED) {
      throw new Error('Cannot book talent for this gig status');
    }

    this.props.status = GigStatus.BOOKED;
    this.props.updatedAt = new Date();
    
    this.addDomainEvent(new GigBookedEvent(
      this.id.toString(),
      talentUserIds.map(id => id.toString())
    ));
  }

  complete(): void {
    if (this.props.status !== GigStatus.BOOKED) {
      throw new Error('Can only complete booked gigs');
    }

    this.props.status = GigStatus.COMPLETED;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.props.status === GigStatus.COMPLETED) {
      throw new Error('Cannot cancel completed gigs');
    }

    this.props.status = GigStatus.CANCELLED;
    this.props.updatedAt = new Date();
  }

  updateBoostLevel(level: number): void {
    if (level < 0) {
      throw new Error('Boost level cannot be negative');
    }
    
    this.props.boostLevel = level;
    this.props.updatedAt = new Date();
  }

  isApplicationOpen(): boolean {
    return this.props.status === GigStatus.PUBLISHED && 
           new Date() < this.props.applicationDeadline;
  }

  get ownerUserId(): EntityId { return this.props.ownerUserId; }
  get title(): string { return this.props.title; }
  get description(): string { return this.props.description; }
  get compensation(): Compensation { return this.props.compensation; }
  get location(): Location { return this.props.location; }
  get startTime(): Date { return this.props.startTime; }
  get endTime(): Date { return this.props.endTime; }
  get applicationDeadline(): Date { return this.props.applicationDeadline; }
  get maxApplicants(): number { return this.props.maxApplicants; }
  get usageRights(): string { return this.props.usageRights; }
  get safetyNotes(): string | undefined { return this.props.safetyNotes; }
  get status(): GigStatus { return this.props.status; }
  get boostLevel(): number { return this.props.boostLevel; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}