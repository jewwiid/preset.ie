import { ProfileRepository } from '@preset/domain/identity/ports/ProfileRepository';
import { Profile } from '@preset/domain/identity/entities/Profile';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
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
      .from('profiles')
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
      .from('profiles')
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
      .from('profiles')
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
      .from('profiles')
      .upsert(data, {
        onConflict: 'id'
      });

    if (error) {
      throw new Error(`Failed to save profile: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
  }

  async search(query: string, limit?: number): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
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
      .from('profiles')
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
    return new Profile({
      id: row.id,
      userId: row.user_id,
      handle: row.handle,
      displayName: row.display_name,
      avatarUrl: row.avatar_url || undefined,
      bio: row.bio || undefined,
      city: row.city || undefined,
      styleTags: row.style_tags || [],
      showcaseIds: row.showcase_ids || [],
      websiteUrl: row.website_url || undefined,
      instagramHandle: row.instagram_handle || undefined,
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
      handle: profile.getHandle(),
      display_name: profile.getDisplayName(),
      avatar_url: profile.getAvatarUrl(),
      bio: profile.getBio(),
      city: profile.getCity(),
      style_tags: profile.getStyleTags(),
      showcase_ids: profile.getShowcaseIds(),
      website_url: profile.getWebsiteUrl(),
      instagram_handle: profile.getInstagramHandle(),
      created_at: profile.getCreatedAt().toISOString(),
      updated_at: profile.getUpdatedAt().toISOString()
    };
  }
}