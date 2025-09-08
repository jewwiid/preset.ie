import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PexelsService, PexelsImage } from './pexels.service';

export interface MoodboardItem {
  id: string;
  type: 'image' | 'video' | 'pexels';
  source: 'upload' | 'pexels' | 'url';
  url: string;
  thumbnail_url?: string;
  caption?: string;
  width?: number;
  height?: number;
  photographer?: string;
  photographer_url?: string;
  position: number;
}

export interface Moodboard {
  id: string;
  gig_id?: string;
  owner_user_id: string;
  title?: string;
  description?: string;
  vibe_summary?: string;
  palette: string[];
  items: MoodboardItem[];
  created_at: string;
  updated_at: string;
  is_public: boolean;
  view_count: number;
}

export interface CreateMoodboardInput {
  gig_id?: string;
  title?: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateMoodboardInput {
  title?: string;
  description?: string;
  vibe_summary?: string;
  palette?: string[];
  items?: MoodboardItem[];
  is_public?: boolean;
}

export class MoodboardService {
  private supabase: SupabaseClient;
  private pexelsService: PexelsService | null = null;
  
  constructor(supabaseUrl: string, supabaseKey: string, pexelsApiKey?: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    if (pexelsApiKey) {
      this.pexelsService = new PexelsService(pexelsApiKey);
    }
  }
  
  // Create a new moodboard
  async createMoodboard(userId: string, input: CreateMoodboardInput): Promise<Moodboard> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .insert({
        owner_user_id: userId,
        gig_id: input.gig_id,
        title: input.title || 'Untitled Moodboard',
        description: input.description,
        is_public: input.is_public || false,
        palette: [],
        items: []
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Get a moodboard by ID
  async getMoodboard(moodboardId: string): Promise<Moodboard | null> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .select('*')
      .eq('id', moodboardId)
      .single();
    
    if (error) {
      console.error('Error fetching moodboard:', error);
      return null;
    }
    
    // Increment view count
    await this.supabase
      .from('moodboards')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', moodboardId);
    
    return data;
  }
  
  // Update a moodboard
  async updateMoodboard(moodboardId: string, input: UpdateMoodboardInput): Promise<Moodboard> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodboardId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Add an item to a moodboard
  async addItem(moodboardId: string, item: Omit<MoodboardItem, 'id' | 'position'>): Promise<Moodboard> {
    // Get current moodboard
    const { data: moodboard, error: fetchError } = await this.supabase
      .from('moodboards')
      .select('items')
      .eq('id', moodboardId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const currentItems = moodboard.items || [];
    const newItem: MoodboardItem = {
      ...item,
      id: crypto.randomUUID(),
      position: currentItems.length
    };
    
    const updatedItems = [...currentItems, newItem];
    
    // Update moodboard with new item
    const { data, error } = await this.supabase
      .from('moodboards')
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodboardId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Remove an item from a moodboard
  async removeItem(moodboardId: string, itemId: string): Promise<Moodboard> {
    const { data: moodboard, error: fetchError } = await this.supabase
      .from('moodboards')
      .select('items')
      .eq('id', moodboardId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const updatedItems = (moodboard.items || [])
      .filter((item: MoodboardItem) => item.id !== itemId)
      .map((item: MoodboardItem, index: number) => ({
        ...item,
        position: index
      }));
    
    const { data, error } = await this.supabase
      .from('moodboards')
      .update({
        items: updatedItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodboardId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Reorder items in a moodboard
  async reorderItems(moodboardId: string, itemIds: string[]): Promise<Moodboard> {
    const { data: moodboard, error: fetchError } = await this.supabase
      .from('moodboards')
      .select('items')
      .eq('id', moodboardId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const itemsMap = new Map((moodboard.items || []).map((item: MoodboardItem) => [item.id, item]));
    const reorderedItems = itemIds
      .map((id, index) => {
        const item = itemsMap.get(id);
        if (item) {
          return { ...item, position: index };
        }
        return null;
      })
      .filter(Boolean);
    
    const { data, error } = await this.supabase
      .from('moodboards')
      .update({
        items: reorderedItems,
        updated_at: new Date().toISOString()
      })
      .eq('id', moodboardId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Search Pexels for images
  async searchPexelsImages(query: string, page: number = 1): Promise<PexelsImage[]> {
    if (!this.pexelsService) {
      throw new Error('Pexels API key not configured');
    }
    
    return this.pexelsService.searchPhotos({
      query,
      page,
      per_page: 12
    });
  }
  
  // Add Pexels image to moodboard
  async addPexelsImage(moodboardId: string, pexelsImage: PexelsImage): Promise<Moodboard> {
    const item: Omit<MoodboardItem, 'id' | 'position'> = {
      type: 'image',
      source: 'pexels',
      url: pexelsImage.src.large2x,
      thumbnail_url: pexelsImage.src.medium,
      caption: pexelsImage.alt,
      width: pexelsImage.width,
      height: pexelsImage.height,
      photographer: pexelsImage.photographer,
      photographer_url: pexelsImage.photographer_url
    };
    
    return this.addItem(moodboardId, item);
  }
  
  // Upload user image
  async uploadImage(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;
    const filePath = `moodboards/${fileName}`;
    
    const { data, error } = await this.supabase.storage
      .from('user-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('user-media')
      .getPublicUrl(filePath);
    
    // Save to user_media table
    await this.supabase
      .from('user_media')
      .insert({
        user_id: userId,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      });
    
    return publicUrl;
  }
  
  // Delete a moodboard
  async deleteMoodboard(moodboardId: string): Promise<void> {
    const { error } = await this.supabase
      .from('moodboards')
      .delete()
      .eq('id', moodboardId);
    
    if (error) throw error;
  }
  
  // Get moodboards for a gig
  async getMoodboardsForGig(gigId: string): Promise<Moodboard[]> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .select('*')
      .eq('gig_id', gigId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // Get user's moodboards
  async getUserMoodboards(userId: string): Promise<Moodboard[]> {
    const { data, error } = await this.supabase
      .from('moodboards')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // Extract palette from image URLs
  async extractPalette(imageUrls: string[]): Promise<string[]> {
    // This would typically call an image processing service
    // For now, return a mock palette
    return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  }
  
  // Generate vibe summary using AI
  async generateVibeSummary(items: MoodboardItem[]): Promise<string> {
    // This would typically call an AI service
    // For now, return a mock summary
    return 'A vibrant and energetic mood with bold colors and dynamic compositions';
  }
}