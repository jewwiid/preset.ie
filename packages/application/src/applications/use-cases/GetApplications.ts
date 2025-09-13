import { ApplicationRepository } from '@preset/domain';
import { ApplicationStatus } from '@preset/types';

export interface GetApplicationsQuery {
  gigId?: string;
  applicantId?: string;
  status?: ApplicationStatus;
  limit?: number;
  offset?: number;
}

export interface ApplicationDTO {
  id: string;
  gigId: string;
  applicantId: string;
  note: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  shortlistedAt?: string;
  decidedAt?: string;
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

export interface GetApplicationsResult {
  applications: ApplicationDTO[];
  total: number;
  hasMore: boolean;
}

export class GetApplicationsUseCase {
  constructor(
    private applicationRepo: ApplicationRepository
  ) {}

  async execute(query: GetApplicationsQuery): Promise<GetApplicationsResult> {
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    const result = await this.applicationRepo.find(
      {
        gigId: query.gigId,
        applicantId: query.applicantId,
        status: query.status
      },
      limit,
      offset
    );

    const applications: ApplicationDTO[] = result.applications.map(app => ({
      id: app.getId(),
      gigId: app.getGigId(),
      applicantId: app.getApplicantId(),
      note: app.getNote().getValue(),
      status: app.getStatus(),
      appliedAt: app.getAppliedAt().toISOString(),
      updatedAt: app.getUpdatedAt().toISOString(),
      shortlistedAt: app.getShortlistedAt()?.toISOString(),
      decidedAt: app.getDecidedAt()?.toISOString(),
      profileSnapshot: app.getProfileSnapshot()
    }));

    return {
      applications,
      total: result.total,
      hasMore: offset + limit < result.total
    };
  }
}

/**
 * Get application statistics for a gig
 */
export class GetGigApplicationStatsUseCase {
  constructor(
    private applicationRepo: ApplicationRepository
  ) {}

  async execute(gigId: string) {
    return await this.applicationRepo.getGigStats(gigId);
  }
}

/**
 * Get application statistics for an applicant
 */
export class GetApplicantStatsUseCase {
  constructor(
    private applicationRepo: ApplicationRepository
  ) {}

  async execute(applicantId: string) {
    return await this.applicationRepo.getApplicantStats(applicantId);
  }
}

/**
 * Get recent applications for dashboard
 */
export class GetRecentApplicationsUseCase {
  constructor(
    private applicationRepo: ApplicationRepository
  ) {}

  async execute(params: {
    userId: string;
    role: 'applicant' | 'gigOwner';
    limit?: number;
  }): Promise<ApplicationDTO[]> {
    const applications = await this.applicationRepo.findRecent(
      params.userId,
      params.role,
      params.limit || 10
    );

    return applications.map(app => ({
      id: app.getId(),
      gigId: app.getGigId(),
      applicantId: app.getApplicantId(),
      note: app.getNote().getValue(),
      status: app.getStatus(),
      appliedAt: app.getAppliedAt().toISOString(),
      updatedAt: app.getUpdatedAt().toISOString(),
      shortlistedAt: app.getShortlistedAt()?.toISOString(),
      decidedAt: app.getDecidedAt()?.toISOString(),
      profileSnapshot: app.getProfileSnapshot()
    }));
  }
}