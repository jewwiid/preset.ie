import { ProfileRepository, Profile, Handle } from '@preset/domain';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

type ProfileRow = Database['public']['Tables']['users_profile']['Row'];
type ProfileInsert = Database['public']['Tables']['users_profile']['Insert'];
type ProfileUpdate = Database['public']['Tables']['users_profile']['Update'];

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('users_profile')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findByHandle(handle: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('users_profile')
      .select('*')
      .eq('handle', handle)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findByStyleTags(tags: string[], limit?: number): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('users_profile')
      .select('*')
      .contains('style_tags', tags)
      .limit(limit || 20);

    if (error || !data) {
      return [];
    }

    return data.map(row => this.toDomain(row));
  }

  async save(profile: Profile): Promise<void> {
    const data = this.toDatabase(profile);

    const { error } = await this.supabase
      .from('users_profile')
      .upsert(data, {
        onConflict: 'id'
      });

    if (error) {
      throw new Error(`Failed to save profile: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users_profile')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
  }

  async search(query: string, limit?: number): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('users_profile')
      .select('*')
      .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(limit || 20);

    if (error || !data) {
      return [];
    }

    return data.map(row => this.toDomain(row));
  }

  async findPopular(limit?: number): Promise<Profile[]> {
    // This would ideally sort by showcase count or follower count
    const { data, error } = await this.supabase
      .from('users_profile')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit || 10);

    if (error || !data) {
      return [];
    }

    return data.map(row => this.toDomain(row));
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: ProfileRow): Profile {
    return Profile.fromPersistence({
      id: row.id,
      userId: row.user_id,
      handle: new Handle(row.handle),
      displayName: row.display_name,
      avatarUrl: row.avatar_url || undefined,
      bio: row.bio || undefined,
      city: row.city || undefined,
      country: undefined, // Not in database schema
      website: undefined, // Not in database schema
      instagram: undefined, // Not in database schema
      styleTags: row.style_tags || [],
      showcaseIds: [], // Not in database schema
      isPublic: true, // Default value
      profileViews: 0, // Default value
      lastActiveAt: new Date(),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }

  /**
   * Convert domain entity to database row
   */
  private toDatabase(profile: Profile): ProfileInsert {
    return {
      id: profile.getId(),
      user_id: profile.getUserId(),
      handle: profile.getHandle().toString(),
      display_name: profile.getDisplayName(),
      avatar_url: profile.getAvatarUrl(),
      bio: profile.getBio(),
      city: profile.getCity(),
      style_tags: profile.getStyleTags(),
      role_flags: [], // Default value
      created_at: profile.getCreatedAt().toISOString(),
      updated_at: profile.getUpdatedAt().toISOString()
    };
  }
}