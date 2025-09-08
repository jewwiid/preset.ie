import { UserProfile, EntityId } from '@preset/domain';

export interface UserRepository {
  save(user: UserProfile): Promise<void>;
  findById(id: EntityId): Promise<UserProfile | null>;
  findByUserId(userId: string): Promise<UserProfile | null>;
  findByHandle(handle: string): Promise<UserProfile | null>;
  exists(handle: string): Promise<boolean>;
  delete(id: EntityId): Promise<void>;
}