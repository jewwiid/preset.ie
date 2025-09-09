import { BaseAggregateRoot } from '../../shared/BaseAggregateRoot';
import { ApplicationStatus, isValidTransition } from '../value-objects/ApplicationStatus';
import { ApplicationNote } from '../value-objects/ApplicationNote';
import { 
  ApplicationSubmitted,
  ApplicantShortlisted,
  TalentBooked,
  ApplicationDeclined,
  ApplicationWithdrawn,
  ApplicationNoteUpdated
} from '../events/ApplicationEvents';

export interface ApplicationProps {
  id: string;
  gigId: string;
  applicantId: string;
  note: ApplicationNote;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  shortlistedAt?: Date;
  decidedAt?: Date;
  profileSnapshot?: {
    displayName: string;
    handle: string;
    avatarUrl?: string;
    bio?: string;
    city?: string;
    styleTags: string[];
    showcaseCount: number;
    averageRating?: number;
  };
}

/**
 * Application aggregate root
 */
export class Application extends BaseAggregateRoot {
  private props: ApplicationProps;

  constructor(props: ApplicationProps) {
    super();
    this.props = { ...props };
  }

  static create(params: {
    id: string;
    gigId: string;
    applicantId: string;
    note?: string;
    profileSnapshot?: ApplicationProps['profileSnapshot'];
  }): Application {
    const application = new Application({
      id: params.id,
      gigId: params.gigId,
      applicantId: params.applicantId,
      note: params.note ? new ApplicationNote(params.note) : ApplicationNote.empty(),
      status: ApplicationStatus.PENDING,
      appliedAt: new Date(),
      updatedAt: new Date(),
      profileSnapshot: params.profileSnapshot
    });

    application.addDomainEvent(new ApplicationSubmitted({
      applicationId: params.id,
      gigId: params.gigId,
      applicantId: params.applicantId,
      appliedAt: new Date()
    }));

    return application;
  }

  /**
   * Shortlist this applicant
   */
  shortlist(): void {
    if (!isValidTransition(this.props.status, ApplicationStatus.SHORTLISTED)) {
      throw new Error(`Cannot shortlist application in ${this.props.status} status`);
    }

    this.props.status = ApplicationStatus.SHORTLISTED;
    this.props.shortlistedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new ApplicantShortlisted({
      applicationId: this.props.id,
      gigId: this.props.gigId,
      applicantId: this.props.applicantId,
      shortlistedAt: this.props.shortlistedAt
    }));
  }

  /**
   * Accept this application (book the talent)
   */
  accept(): void {
    if (!isValidTransition(this.props.status, ApplicationStatus.ACCEPTED)) {
      throw new Error(`Cannot accept application in ${this.props.status} status`);
    }

    this.props.status = ApplicationStatus.ACCEPTED;
    this.props.decidedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new TalentBooked({
      applicationId: this.props.id,
      gigId: this.props.gigId,
      talentId: this.props.applicantId,
      bookedAt: this.props.decidedAt
    }));
  }

  /**
   * Decline this application
   */
  decline(): void {
    if (!isValidTransition(this.props.status, ApplicationStatus.DECLINED)) {
      throw new Error(`Cannot decline application in ${this.props.status} status`);
    }

    this.props.status = ApplicationStatus.DECLINED;
    this.props.decidedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new ApplicationDeclined({
      applicationId: this.props.id,
      gigId: this.props.gigId,
      applicantId: this.props.applicantId,
      declinedAt: this.props.decidedAt
    }));
  }

  /**
   * Withdraw this application (by applicant)
   */
  withdraw(): void {
    if (!isValidTransition(this.props.status, ApplicationStatus.WITHDRAWN)) {
      throw new Error(`Cannot withdraw application in ${this.props.status} status`);
    }

    this.props.status = ApplicationStatus.WITHDRAWN;
    this.props.decidedAt = new Date();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new ApplicationWithdrawn({
      applicationId: this.props.id,
      gigId: this.props.gigId,
      applicantId: this.props.applicantId,
      withdrawnAt: this.props.decidedAt
    }));
  }

  /**
   * Update the application note
   */
  updateNote(note: string): void {
    if (this.props.status !== ApplicationStatus.PENDING) {
      throw new Error('Can only update note while application is pending');
    }

    this.props.note = new ApplicationNote(note);
    this.props.updatedAt = new Date();

    this.addDomainEvent(new ApplicationNoteUpdated({
      applicationId: this.props.id,
      gigId: this.props.gigId,
      applicantId: this.props.applicantId,
      newNote: note,
      updatedAt: this.props.updatedAt
    }));
  }

  // Getters
  getId(): string { return this.props.id; }
  getGigId(): string { return this.props.gigId; }
  getApplicantId(): string { return this.props.applicantId; }
  getNote(): ApplicationNote { return this.props.note; }
  getStatus(): ApplicationStatus { return this.props.status; }
  getAppliedAt(): Date { return new Date(this.props.appliedAt); }
  getUpdatedAt(): Date { return new Date(this.props.updatedAt); }
  getShortlistedAt(): Date | undefined { 
    return this.props.shortlistedAt ? new Date(this.props.shortlistedAt) : undefined; 
  }
  getDecidedAt(): Date | undefined { 
    return this.props.decidedAt ? new Date(this.props.decidedAt) : undefined; 
  }
  getProfileSnapshot(): ApplicationProps['profileSnapshot'] | undefined { 
    return this.props.profileSnapshot; 
  }

  isPending(): boolean { return this.props.status === ApplicationStatus.PENDING; }
  isShortlisted(): boolean { return this.props.status === ApplicationStatus.SHORTLISTED; }
  isAccepted(): boolean { return this.props.status === ApplicationStatus.ACCEPTED; }
  isDeclined(): boolean { return this.props.status === ApplicationStatus.DECLINED; }
  isWithdrawn(): boolean { return this.props.status === ApplicationStatus.WITHDRAWN; }
  isFinalized(): boolean { 
    return this.isAccepted() || this.isDeclined() || this.isWithdrawn(); 
  }

  toJSON() {
    return {
      id: this.props.id,
      gigId: this.props.gigId,
      applicantId: this.props.applicantId,
      note: this.props.note.getValue(),
      status: this.props.status,
      appliedAt: this.props.appliedAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      shortlistedAt: this.props.shortlistedAt?.toISOString(),
      decidedAt: this.props.decidedAt?.toISOString(),
      profileSnapshot: this.props.profileSnapshot
    };
  }
}