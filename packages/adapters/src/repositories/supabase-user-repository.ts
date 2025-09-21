import { UserRepository } from '@preset/application';
import { Profile, EntityId } from '@preset/domain';
import { SupabaseClient } from '../clients/supabase.client';
import { UserMapper } from '../mappers/user-mapper';
import type { Database } from '../types/database.types';

type UserProfileRow = Database['public']['Tables']['users_profile']['Row'];
type UserProfileInsert = Database['public']['Tables']['users_profile']['Insert'];

export class SupabaseUserRepository implements UserRepository {
  constructor(private client: SupabaseClient) {}

  async save(user: Profile): Promise<void> {
    const row = UserMapper.toRow(user) as UserProfileInsert;
    
    const { error } = await this.client.getClient()
      .from('users_profile')
      .upsert(row);

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`);
    }
  }

  async findById(id: EntityId): Promise<Profile | null> {
    const { data, error } = await this.client.getClient()
      .from('users_profile')
      .select('*')
      .eq('id', id.toString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user by id: ${error.message}`);
    }

    return data ? UserMapper.toDomain(data) : null;
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client.getClient()
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user by userId: ${error.message}`);
    }

    return data ? UserMapper.toDomain(data) : null;
  }

  async findByHandle(handle: string): Promise<Profile | null> {
    const { data, error } = await this.client.getClient()
      .from('users_profile')
      .select('*')
      .eq('handle', handle)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find user by handle: ${error.message}`);
    }

    return data ? UserMapper.toDomain(data) : null;
  }

  async exists(handle: string): Promise<boolean> {
    const { data, error } = await this.client.getClient()
      .from('users_profile')
      .select('id')
      .eq('handle', handle)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check if handle exists: ${error.message}`);
    }

    return !!data;
  }

  async delete(id: EntityId): Promise<void> {
    const { error } = await this.client.getClient()
      .from('users_profile')
      .delete()
      .eq('id', id.toString());

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

}