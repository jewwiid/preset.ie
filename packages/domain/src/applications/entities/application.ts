import { Entity } from '../../shared/entity';
import { EntityId } from '../../shared/value-objects/entity-id';
import { ApplicationStatus } from '../value-objects/application-status';

export interface ApplicationProps {
  gigId: EntityId;
  applicantUserId: EntityId;
  note?: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
}

export class Application extends Entity<ApplicationProps> {
  private props: ApplicationProps;

  constructor(id: EntityId, props: ApplicationProps) {
    super(id);
    this.props = props;
  }

  static create(
    gigId: EntityId,
    applicantUserId: EntityId,
    note?: string
  ): Application {
    const id = EntityId.generate();
    const now = new Date();

    return new Application(id, {
      gigId,
      applicantUserId,
      note,
      status: ApplicationStatus.PENDING,
      appliedAt: now,
      updatedAt: now
    });
  }

  shortlist(): void {
    if (this.props.status !== ApplicationStatus.PENDING) {
      throw new Error('Can only shortlist pending applications');
    }
    
    this.props.status = ApplicationStatus.SHORTLISTED;
    this.props.updatedAt = new Date();
  }

  accept(): void {
    if (this.props.status !== ApplicationStatus.SHORTLISTED && 
        this.props.status !== ApplicationStatus.PENDING) {
      throw new Error('Cannot accept application in current status');
    }
    
    this.props.status = ApplicationStatus.ACCEPTED;
    this.props.updatedAt = new Date();
  }

  decline(): void {
    if (this.props.status === ApplicationStatus.ACCEPTED) {
      throw new Error('Cannot decline accepted application');
    }
    
    this.props.status = ApplicationStatus.DECLINED;
    this.props.updatedAt = new Date();
  }

  withdraw(): void {
    if (this.props.status === ApplicationStatus.ACCEPTED) {
      throw new Error('Cannot withdraw accepted application');
    }
    
    this.props.status = ApplicationStatus.WITHDRAWN;
    this.props.updatedAt = new Date();
  }

  get gigId(): EntityId { return this.props.gigId; }
  get applicantUserId(): EntityId { return this.props.applicantUserId; }
  get note(): string | undefined { return this.props.note; }
  get status(): ApplicationStatus { return this.props.status; }
  get appliedAt(): Date { return this.props.appliedAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}