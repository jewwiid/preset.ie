import { ShowcaseRepository } from '@preset/application';
import { Showcase, EntityId } from '@preset/domain';
import { SupabaseClient } from '../clients/supabase.client';
import { Database } from '../types/database.types';

type ShowcaseRow = Database['public']['Tables']['showcases']['Row'];
type ShowcaseInsert = Database['public']['Tables']['showcases']['Insert'];

export class SupabaseShowcaseRepository implements ShowcaseRepository {
  constructor(private client: SupabaseClient) {}

  async save(showcase: Showcase): Promise<void> {
    const row = this.domainToRow(showcase);
    
    const { error } = await this.client.getClient()
      .from('showcases')
      .upsert(row);

    if (error) {
      throw new Error(`Failed to save showcase: ${error.message}`);
    }
  }

  async findById(id: EntityId): Promise<Showcase | null> {
    const { data, error } = await this.client.getClient()
      .from('showcases')
      .select('*')
      .eq('id', id.toString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find showcase by id: ${error.message}`);
    }

    return data ? this.rowToDomain(data) : null;
  }

  async findByGig(gigId: EntityId): Promise<Showcase[]> {
    const { data, error } = await this.client.getClient()
      .from('showcases')
      .select('*')
      .eq('gig_id', gigId.toString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find showcases by gig: ${error.message}`);
    }

    return data ? data.map(row => this.rowToDomain(row)) : [];
  }

  async findByCreator(creatorUserId: EntityId): Promise<Showcase[]> {
    const { data, error } = await this.client.getClient()
      .from('showcases')
      .select('*')
      .eq('creator_user_id', creatorUserId.toString())
      .eq('visibility', 'PUBLIC')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find showcases by creator: ${error.message}`);
    }

    return data ? data.map(row => this.rowToDomain(row)) : [];
  }

  async findByTalent(talentUserId: EntityId): Promise<Showcase[]> {
    const { data, error } = await this.client.getClient()
      .from('showcases')
      .select('*')
      .eq('talent_user_id', talentUserId.toString())
      .eq('visibility', 'PUBLIC')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find showcases by talent: ${error.message}`);
    }

    return data ? data.map(row => this.rowToDomain(row)) : [];
  }

  async countByUser(userId: EntityId, visibility?: string): Promise<number> {
    let query = this.client.getClient()
      .from('showcases')
      .select('*', { count: 'exact' })
      .or(`creator_user_id.eq.${userId.toString()},talent_user_id.eq.${userId.toString()}`);

    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count showcases by user: ${error.message}`);
    }

    return count || 0;
  }

  async delete(id: EntityId): Promise<void> {
    const { error } = await this.client.getClient()
      .from('showcases')
      .delete()
      .eq('id', id.toString());

    if (error) {
      throw new Error(`Failed to delete showcase: ${error.message}`);
    }
  }

  private domainToRow(showcase: Showcase): ShowcaseInsert {
    return {
      id: showcase.getId(),
      gig_id: showcase.getGigId(),
      creator_user_id: showcase.getCreatorId(),
      talent_user_id: showcase.getTalentId(),
      caption: showcase.getCaption(),
      tags: showcase.getTags(),
      palette: showcase.getPalette(), // Assumes palette is already JSON-serializable
      approved_by_creator_at: showcase.getApprovals().find(a => a.getUserId() === showcase.getCreatorId())?.getApprovedAt().toISOString(),
      approved_by_talent_at: showcase.getApprovals().find(a => a.getUserId() === showcase.getTalentId())?.getApprovedAt().toISOString(),
      visibility: showcase.getVisibility().toString(),
      created_at: showcase.getCreatedAt().toISOString(),
      updated_at: new Date().toISOString(), // Use current time as updated_at
    };
  }

  private rowToDomain(row: ShowcaseRow): Showcase {
    // Note: This will need to be implemented with proper value object reconstruction
    // For now, creating a simplified version that would need the actual domain constructors
    throw new Error('Domain reconstruction not yet implemented - needs value object factories');
  }
}