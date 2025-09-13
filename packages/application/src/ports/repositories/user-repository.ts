import { Profile, EntityId } from '@preset/domain';

export interface UserRepository {
  save(user: Profile): Promise<void>;
  findById(id: EntityId): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  findByHandle(handle: string): Promise<Profile | null>;
  exists(handle: string): Promise<boolean>;
  delete(id: EntityId): Promise<void>;
}