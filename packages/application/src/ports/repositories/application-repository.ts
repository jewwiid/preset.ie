import { Application, EntityId } from '@preset/domain';

export interface ApplicationRepository {
  save(application: Application): Promise<void>;
  findById(id: EntityId): Promise<Application | null>;
  findByGig(gigId: EntityId): Promise<Application[]>;
  findByApplicant(applicantUserId: EntityId): Promise<Application[]>;
  findByGigAndApplicant(gigId: EntityId, applicantUserId: EntityId): Promise<Application | null>;
  countByApplicant(applicantUserId: EntityId, since?: Date): Promise<number>;
  countByGig(gigId: EntityId): Promise<number>;
  delete(id: EntityId): Promise<void>;
}