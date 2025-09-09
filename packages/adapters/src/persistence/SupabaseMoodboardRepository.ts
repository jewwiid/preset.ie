import { SupabaseClient } from '@supabase/supabase-js';
import { Moodboard, MoodboardProps } from '@preset/domain/moodboards/entities/Moodboard';
import { MoodboardRepository } from '@preset/domain/moodboards/ports/MoodboardRepository';

export class SupabaseMoodboardRepository implements MoodboardRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Moodboard | null> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return this.toDomainEntity(data);
  }

  async findByGigId(gigId: string): Promise<Moodboard[]> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .select('*')
      .eq('gig_id', gigId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(row => this.toDomainEntity(row));
  }

  async findByOwnerId(ownerId: string): Promise<Moodboard[]> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .select('*')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false });

    if (error || !data) return [];

    return data.map(row => this.toDomainEntity(row));
  }

  async save(moodboard: Moodboard): Promise<void> {
    const data = this.toPersistenceModel(moodboard);
    
    const { error } = await this.supabase
      .from('moodboards')
      .upsert(data, {
        onConflict: 'id'
      });

    if (error) {
      throw new Error(`Failed to save moodboard: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('moodboards')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete moodboard: ${error.message}`);
    }
  }

  async canUserModify(moodboardId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .select('owner_id')
      .eq('id', moodboardId)
      .single();

    if (error || !data) return false;

    return data.owner_id === userId;
  }

  /**
   * Convert database row to domain entity
   */
  private toDomainEntity(row: any): Moodboard {
    const props: MoodboardProps = {
      id: row.id,
      gigId: row.gig_id,
      ownerId: row.owner_id,
      title: row.title,
      summary: row.summary,
      items: row.items || [],
      palette: row.palette || [],
      sourceBreakdown: row.source_breakdown || {
        pexels: 0,
        userUploads: 0,
        aiEnhanced: 0,
        aiGenerated: 0
      },
      enhancementLog: row.enhancement_log || [],
      totalCost: row.total_cost || 0,
      generatedPrompts: row.generated_prompts || [],
      aiProvider: row.ai_provider,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };

    // Create a new Moodboard instance with the retrieved data
    return new (Moodboard as any)(props);
  }

  /**
   * Convert domain entity to database model
   */
  private toPersistenceModel(moodboard: Moodboard): any {
    const json = moodboard.toJSON();
    
    return {
      id: json.id,
      gig_id: json.gigId,
      owner_id: json.ownerId,
      title: json.title,
      summary: json.summary,
      items: json.items,
      palette: json.palette,
      source_breakdown: json.sourceBreakdown,
      enhancement_log: json.enhancementLog,
      total_cost: json.totalCost,
      generated_prompts: json.generatedPrompts,
      ai_provider: json.aiProvider,
      created_at: json.createdAt.toISOString(),
      updated_at: json.updatedAt.toISOString()
    };
  }
}