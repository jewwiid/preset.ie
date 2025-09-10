import { ApplicationStatus } from '../database/enums';
import { PublicProfileDTO } from './user';
import { GigListItemDTO } from './gig';

export interface ApplicationDTO {
  id: string;
  gig: GigListItemDTO;
  applicant: PublicProfileDTO;
  note?: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
}

export interface ApplicationListItemDTO {
  id: string;
  gigId: string;
  gigTitle: string;
  applicant: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl?: string;
    rating?: number;
    city?: string;
  };
  note?: string;
  status: ApplicationStatus;
  appliedAt: Date;
}

export interface ApplicationCreateDTO {
  gigId: string;
  note?: string;
}

export interface ApplicationUpdateDTO {
  status?: ApplicationStatus;
  note?: string;
}

export interface ApplicationStatsDTO {
  total: number;
  pending: number;
  shortlisted: number;
  accepted: number;
  declined: number;
  withdrawn: number;
}

export interface ApplicantDTO extends PublicProfileDTO {
  applicationId: string;
  applicationNote?: string;
  applicationStatus: ApplicationStatus;
  appliedAt: Date;
}