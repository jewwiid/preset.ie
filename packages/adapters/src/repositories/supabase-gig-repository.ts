import { GigRepository } from '@preset/application';
import { Gig, EntityId } from '@preset/domain';
import { SupabaseClient } from '../clients/supabase.client';

interface GigRow {
  id: string;
  owner_user_id: string;
  title: string;
  description: string;
  comp_type: string;
  comp_details?: string;
  location_text: string;
  location?: any; // PostGIS geography
  radius_meters?: number;
  start_time: string;
  end_time: string;
  application_deadline: string;
  max_applicants: number;
  usage_rights: string;
  safety_notes?: string;
  status: string;
  boost_level: number;
  created_at: string;
  updated_at: string;
}

export class SupabaseGigRepository implements GigRepository {
  constructor(private client: SupabaseClient) {}

  async save(gig: Gig): Promise<void> {
    const row = this.domainToRow(gig);
    
    const { error } = await this.client.getClient()
      .from('gigs')
      .upsert(row);

    if (error) {
      throw new Error(`Failed to save gig: ${error.message}`);
    }
  }

  async findById(id: EntityId): Promise<Gig | null> {
    const { data, error } = await this.client.getClient()
      .from('gigs')
      .select('*')
      .eq('id', id.toString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find gig by id: ${error.message}`);
    }

    return data ? this.rowToDomain(data) : null;
  }

  async findByOwner(ownerUserId: EntityId): Promise<Gig[]> {
    const { data, error } = await this.client.getClient()
      .from('gigs')
      .select('*')
      .eq('owner_user_id', ownerUserId.toString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find gigs by owner: ${error.message}`);
    }

    return data ? data.map(row => this.rowToDomain(row)) : [];
  }

  async findPublished(
    filters?: {
      location?: { lat: number; lng: number; radiusKm: number };
      startDate?: Date;
      endDate?: Date;
      compensationType?: string;
    },
    pagination?: { limit: number; offset: number }
  ): Promise<Gig[]> {
    let query = this.client.getClient()
      .from('gigs')
      .select('*')
      .eq('status', 'PUBLISHED');

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('end_time', filters.endDate.toISOString());
    }

    if (filters?.compensationType) {
      query = query.eq('comp_type', filters.compensationType);
    }

    // Location filtering would require PostGIS functions - simplified for now
    if (filters?.location) {
      // This would need proper PostGIS ST_DWithin function
      console.warn('Location filtering not yet implemented - needs PostGIS functions');
    }

    if (pagination) {
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find published gigs: ${error.message}`);
    }

    return data ? data.map(row => this.rowToDomain(row)) : [];
  }

  async countByOwner(ownerUserId: EntityId, status?: string): Promise<number> {
    let query = this.client.getClient()
      .from('gigs')
      .select('*', { count: 'exact' })
      .eq('owner_user_id', ownerUserId.toString());

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count gigs by owner: ${error.message}`);
    }

    return count || 0;
  }

  async delete(id: EntityId): Promise<void> {
    const { error } = await this.client.getClient()
      .from('gigs')
      .delete()
      .eq('id', id.toString());

    if (error) {
      throw new Error(`Failed to delete gig: ${error.message}`);
    }
  }

  private domainToRow(gig: Gig): Partial<GigRow> {
    return {
      id: gig.id.toString(),
      owner_user_id: gig.ownerUserId.toString(),
      title: gig.title,
      description: gig.description,
      comp_type: gig.compensation.type.toString(),
      comp_details: gig.compensation.details,
      location_text: gig.location.text,
      // location: PostGIS point - would need proper conversion
      radius_meters: gig.location.radiusMeters,
      start_time: gig.startTime.toISOString(),
      end_time: gig.endTime.toISOString(),
      application_deadline: gig.applicationDeadline.toISOString(),
      max_applicants: gig.maxApplicants,
      usage_rights: gig.usageRights,
      safety_notes: gig.safetyNotes,
      status: gig.status.toString(),
      boost_level: gig.boostLevel,
      created_at: gig.createdAt.toISOString(),
      updated_at: gig.updatedAt.toISOString(),
    };
  }

  private rowToDomain(row: GigRow): Gig {
    // Note: This will need to be implemented with proper value object reconstruction
    // For now, creating a simplified version that would need the actual domain constructors
    throw new Error('Domain reconstruction not yet implemented - needs value object factories');
  }
}