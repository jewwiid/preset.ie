import { Gig, EntityId } from '@preset/domain';

export interface GigRepository {
  save(gig: Gig): Promise<void>;
  findById(id: EntityId): Promise<Gig | null>;
  findByOwner(ownerUserId: EntityId): Promise<Gig[]>;
  findPublished(
    filters?: {
      location?: { lat: number; lng: number; radiusKm: number };
      startDate?: Date;
      endDate?: Date;
      compensationType?: string;
    },
    pagination?: { limit: number; offset: number }
  ): Promise<Gig[]>;
  countByOwner(ownerUserId: EntityId, status?: string): Promise<number>;
  delete(id: EntityId): Promise<void>;
}