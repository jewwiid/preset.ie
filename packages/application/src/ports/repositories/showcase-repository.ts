import { Showcase, EntityId } from '@preset/domain';

export interface ShowcaseRepository {
  save(showcase: Showcase): Promise<void>;
  findById(id: EntityId): Promise<Showcase | null>;
  findByGig(gigId: EntityId): Promise<Showcase[]>;
  findByCreator(creatorUserId: EntityId): Promise<Showcase[]>;
  findByTalent(talentUserId: EntityId): Promise<Showcase[]>;
  countByUser(userId: EntityId, visibility?: string): Promise<number>;
  countByUserThisMonth(userId: EntityId, visibility?: string): Promise<number>;
  delete(id: EntityId): Promise<void>;
}