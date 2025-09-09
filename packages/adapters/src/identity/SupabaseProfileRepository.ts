import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '@preset/domain/identity/entities/Profile';
import { ProfileRepository } from '@preset/domain/identity/ports/ProfileRepository';
import { Handle } from '@preset/domain/identity/value-objects/Handle';

/**
 * Supabase implementation of ProfileRepository
 */
export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return this.toDomainEntity(data);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return this.toDomainEntity(data);
  }

  async findByHandle(handle: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('handle', handle.toLowerCase())
      .single();

    if (error || !data) return null;

    return this.toDomainEntity(data);
  }

  async handleExists(handle: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('handle', handle.toLowerCase());

    if (error) {
      throw new Error(`Failed to check handle existence: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  async findByStyleTags(tags: string[], limit: number = 20): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .contains('style_tags', tags)
      .eq('is_public', true)
      .limit(limit);

    if (error || !data) return [];

    return data.map(row => this.toDomainEntity(row));
  }

  async findByLocation(city?: string, country?: string, limit: number = 20): Promise<Profile[]> {
    let query = this.supabase
      .from('profiles')
      .select('*')
      .eq('is_public', true);

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (country) {
      query = query.ilike('country', `%${country}%`);
    }

    const { data, error } = await query.limit(limit);

    if (error || !data) return [];

    return data.map(row => this.toDomainEntity(row));
  }

  async findTrending(limit: number = 20): Promise<Profile[]> {
    // Find profiles with most views in last 30 days
    // This would require a more complex query with analytics
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('is_public', true)
      .order('profile_views', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(row => this.toDomainEntity(row));
  }

  async save(profile: Profile): Promise<void> {
    const data = profile.toPersistence();
    
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

  async incrementViews(profileId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_profile_views', {
      profile_id: profileId
    });

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      const { data } = await this.supabase
        .from('profiles')
        .select('profile_views')
        .eq('id', profileId)
        .single();

      if (data) {
        await this.supabase
          .from('profiles')
          .update({ profile_views: (data.profile_views || 0) + 1 })
          .eq('id', profileId);
      }
    }
  }

  async getStats(profileId: string): Promise<{
    totalViews: number;
    totalShowcases: number;
    totalGigs?: number;
    totalApplications?: number;
  }> {
    // Get profile views
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('profile_views, showcase_ids')
      .eq('id', profileId)
      .single();

    const totalViews = profile?.profile_views || 0;
    const totalShowcases = profile?.showcase_ids?.length || 0;

    // Get gigs count (if contributor)
    const { count: gigsCount } = await this.supabase
      .from('gigs')
      .select('id', { count: 'exact', head: true })
      .eq('owner_user_id', profileId);

    // Get applications count (if talent)
    const { count: applicationsCount } = await this.supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('applicant_user_id', profileId);

    return {
      totalViews,
      totalShowcases,
      totalGigs: gigsCount ?? undefined,
      totalApplications: applicationsCount ?? undefined
    };
  }

  /**
   * Convert database row to domain entity
   */
  private toDomainEntity(row: any): Profile {
    return Profile.fromPersistence({
      id: row.id,
      userId: row.user_id,
      handle: new Handle(row.handle),
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      city: row.city,
      country: row.country,
      website: row.website,
      instagram: row.instagram,
      styleTags: row.style_tags || [],
      showcaseIds: row.showcase_ids || [],
      isPublic: row.is_public ?? true,
      profileViews: row.profile_views || 0,
      lastActiveAt: new Date(row.last_active_at || row.updated_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}