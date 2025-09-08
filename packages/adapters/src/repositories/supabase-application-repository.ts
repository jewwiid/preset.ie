import { ApplicationRepository } from '@preset/application';
import { Application, EntityId } from '@preset/domain';
import { SupabaseClient } from '../clients/supabase.client';

interface ApplicationRow {
  id: string;
  gig_id: string;
  applicant_user_id: string;
  note?: string;
  status: string;
  applied_at: string;
  updated_at: string;
}

export class SupabaseApplicationRepository implements ApplicationRepository {
  constructor(private client: SupabaseClient) {}

  async save(application: Application): Promise<void> {
    const row = this.domainToRow(application);
    
    const { error } = await this.client.getClient()
      .from('applications')
      .upsert(row);

    if (error) {
      throw new Error(`Failed to save application: ${error.message}`);
    }
  }

  async findById(id: EntityId): Promise<Application | null> {
    const { data, error } = await this.client.getClient()
      .from('applications')
      .select('*')
      .eq('id', id.toString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find application by id: ${error.message}`);
    }

    return data ? this.rowToDomain(data) : null;
  }

  async findByGig(gigId: EntityId): Promise<Application[]> {
    const { data, error } = await this.client.getClient()
      .from('applications')
      .select('*')
      .eq('gig_id', gigId.toString())
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find applications by gig: ${error.message}`);
    }

    return data ? data.map(row => this.rowToDomain(row)) : [];
  }

  async findByApplicant(applicantUserId: EntityId): Promise<Application[]> {
    const { data, error } = await this.client.getClient()
      .from('applications')
      .select('*')
      .eq('applicant_user_id', applicantUserId.toString())
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find applications by applicant: ${error.message}`);
    }

    return data ? data.map(row => this.rowToDomain(row)) : [];
  }

  async findByGigAndApplicant(gigId: EntityId, applicantUserId: EntityId): Promise<Application | null> {
    const { data, error } = await this.client.getClient()
      .from('applications')
      .select('*')
      .eq('gig_id', gigId.toString())
      .eq('applicant_user_id', applicantUserId.toString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find application by gig and applicant: ${error.message}`);
    }

    return data ? this.rowToDomain(data) : null;
  }

  async countByApplicant(applicantUserId: EntityId, since?: Date): Promise<number> {
    let query = this.client.getClient()
      .from('applications')
      .select('*', { count: 'exact' })
      .eq('applicant_user_id', applicantUserId.toString());

    if (since) {
      query = query.gte('applied_at', since.toISOString());
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count applications by applicant: ${error.message}`);
    }

    return count || 0;
  }

  async countByGig(gigId: EntityId): Promise<number> {
    const { count, error } = await this.client.getClient()
      .from('applications')
      .select('*', { count: 'exact' })
      .eq('gig_id', gigId.toString());

    if (error) {
      throw new Error(`Failed to count applications by gig: ${error.message}`);
    }

    return count || 0;
  }

  async delete(id: EntityId): Promise<void> {
    const { error } = await this.client.getClient()
      .from('applications')
      .delete()
      .eq('id', id.toString());

    if (error) {
      throw new Error(`Failed to delete application: ${error.message}`);
    }
  }

  private domainToRow(application: Application): Partial<ApplicationRow> {
    return {
      id: application.id.toString(),
      gig_id: application.gigId.toString(),
      applicant_user_id: application.applicantUserId.toString(),
      note: application.note,
      status: application.status.toString(),
      applied_at: application.appliedAt.toISOString(),
      updated_at: application.updatedAt.toISOString(),
    };
  }

  private rowToDomain(row: ApplicationRow): Application {
    // Note: This will need to be implemented with proper value object reconstruction
    // For now, creating a simplified version that would need the actual domain constructors
    throw new Error('Domain reconstruction not yet implemented - needs value object factories');
  }
}