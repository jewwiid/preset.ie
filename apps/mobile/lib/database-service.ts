// Database Service - Centralized database operations for mobile app
// This ensures consistent database interactions across the mobile app

import { supabase } from './supabase'
import {
  UserProfile,
  Gig,
  GigWithProfile,
  Application,
  Showcase,
  Message,
  UserCredits,
  CreditTransaction,
  LootboxEvent,
  LootboxPackage,
  DatabaseResponse,
  PaginatedResponse,
  GigFilters,
  ApplicationFilters,
  ShowcaseFilters,
  CreateGigData,
  UpdateProfileData,
  CreateApplicationData,
  SendMessageData,
} from './database-types'

// User Profile Operations
export const userProfileService = {
  // Get user profile by user_id
  async getProfile(userId: string): Promise<DatabaseResponse<UserProfile>> {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // Update user profile
  async updateProfile(userId: string, updates: UpdateProfileData): Promise<DatabaseResponse<UserProfile>> {
    const { data, error } = await supabase
      .from('users_profile')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  // Create user profile
  async createProfile(profileData: Partial<UserProfile>): Promise<DatabaseResponse<UserProfile>> {
    const { data, error } = await supabase
      .from('users_profile')
      .insert(profileData)
      .select()
      .single()
    
    return { data, error }
  },
}

// Gig Operations
export const gigService = {
  // Get gigs with filters
  async getGigs(filters: GigFilters = {}): Promise<DatabaseResponse<GigWithProfile[]>> {
    let query = supabase
      .from('gigs')
      .select(`
        *,
        users_profile!owner_user_id (
          display_name,
          avatar_url,
          handle,
          verified_id
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.comp_type) {
      query = query.eq('comp_type', filters.comp_type)
    }
    if (filters.owner_user_id) {
      query = query.eq('owner_user_id', filters.owner_user_id)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Get single gig by ID
  async getGigById(gigId: string): Promise<DatabaseResponse<GigWithProfile>> {
    const { data, error } = await supabase
      .from('gigs')
      .select(`
        *,
        users_profile!owner_user_id (
          display_name,
          avatar_url,
          handle,
          verified_id
        )
      `)
      .eq('id', gigId)
      .single()
    
    return { data, error }
  },

  // Create new gig
  async createGig(gigData: CreateGigData & { owner_user_id: string }): Promise<DatabaseResponse<Gig>> {
    const { data, error } = await supabase
      .from('gigs')
      .insert(gigData)
      .select()
      .single()
    
    return { data, error }
  },

  // Update gig
  async updateGig(gigId: string, updates: Partial<Gig>): Promise<DatabaseResponse<Gig>> {
    const { data, error } = await supabase
      .from('gigs')
      .update(updates)
      .eq('id', gigId)
      .select()
      .single()
    
    return { data, error }
  },

  // Delete gig
  async deleteGig(gigId: string): Promise<DatabaseResponse<void>> {
    const { error } = await supabase
      .from('gigs')
      .delete()
      .eq('id', gigId)
    
    return { data: null, error }
  },
}

// Application Operations
export const applicationService = {
  // Get applications with filters
  async getApplications(filters: ApplicationFilters = {}): Promise<DatabaseResponse<Application[]>> {
    let query = supabase
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.gig_id) {
      query = query.eq('gig_id', filters.gig_id)
    }
    if (filters.applicant_user_id) {
      query = query.eq('applicant_user_id', filters.applicant_user_id)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Create application
  async createApplication(applicationData: CreateApplicationData & { applicant_user_id: string }): Promise<DatabaseResponse<Application>> {
    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single()
    
    return { data, error }
  },

  // Update application status
  async updateApplicationStatus(applicationId: string, status: string): Promise<DatabaseResponse<Application>> {
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single()
    
    return { data, error }
  },
}

// Showcase Operations
export const showcaseService = {
  // Get showcases with filters
  async getShowcases(filters: ShowcaseFilters = {}): Promise<DatabaseResponse<Showcase[]>> {
    let query = supabase
      .from('showcases')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility)
    }
    if (filters.creator_user_id) {
      query = query.eq('creator_user_id', filters.creator_user_id)
    }
    if (filters.talent_user_id) {
      query = query.eq('talent_user_id', filters.talent_user_id)
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Get showcase by ID
  async getShowcaseById(showcaseId: string): Promise<DatabaseResponse<Showcase>> {
    const { data, error } = await supabase
      .from('showcases')
      .select('*')
      .eq('id', showcaseId)
      .single()
    
    return { data, error }
  },

  // Create showcase
  async createShowcase(showcaseData: Partial<Showcase>): Promise<DatabaseResponse<Showcase>> {
    const { data, error } = await supabase
      .from('showcases')
      .insert(showcaseData)
      .select()
      .single()
    
    return { data, error }
  },
}

// Message Operations
export const messageService = {
  // Get messages for a gig
  async getMessages(gigId: string): Promise<DatabaseResponse<Message[]>> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('gig_id', gigId)
      .order('created_at', { ascending: true })
    
    return { data, error }
  },

  // Send message
  async sendMessage(messageData: SendMessageData & { from_user_id: string }): Promise<DatabaseResponse<Message>> {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()
    
    return { data, error }
  },

  // Mark message as read
  async markAsRead(messageId: string): Promise<DatabaseResponse<Message>> {
    const { data, error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single()
    
    return { data, error }
  },
}

// User Credits Operations
export const creditsService = {
  // Get user credits
  async getUserCredits(userId: string): Promise<DatabaseResponse<UserCredits>> {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  },

  // Get credit transactions
  async getCreditTransactions(userId: string): Promise<DatabaseResponse<CreditTransaction[]>> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Consume credits (calls database function)
  async consumeCredits(userId: string, credits: number, enhancementType: string): Promise<DatabaseResponse<{ remaining_balance: number }>> {
    const { data, error } = await supabase
      .rpc('consume_user_credits', {
        p_user_id: userId,
        p_credits: credits,
        p_enhancement_type: enhancementType
      })
    
    return { data, error }
  },
}

// Lootbox Operations
export const lootboxService = {
  // Get available lootbox events
  async getAvailableLootboxes(): Promise<DatabaseResponse<LootboxEvent[]>> {
    const { data, error } = await supabase
      .from('lootbox_events')
      .select('*')
      .eq('event_type', 'available')
      .is('expires_at', null)
      .order('available_at', { ascending: false })
    
    return { data, error }
  },

  // Get lootbox packages
  async getLootboxPackages(): Promise<DatabaseResponse<LootboxPackage[]>> {
    const { data, error } = await supabase
      .from('lootbox_packages')
      .select('*')
      .eq('is_active', true)
      .order('user_credits', { ascending: true })
    
    return { data, error }
  },

  // Purchase lootbox
  async purchaseLootbox(eventId: string, userId: string): Promise<DatabaseResponse<LootboxEvent>> {
    const { data, error } = await supabase
      .from('lootbox_events')
      .update({
        event_type: 'purchased',
        purchased_by: userId,
        purchased_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single()
    
    return { data, error }
  },
}

// Statistics Operations
export const statsService = {
  // Get user statistics
  async getUserStats(userId: string): Promise<DatabaseResponse<{
    totalGigs: number
    totalApplications: number
    totalShowcases: number
    totalMessages: number
  }>> {
    try {
      const [gigsCount, applicationsCount, showcasesCount, messagesCount] = await Promise.all([
        supabase.from('gigs').select('id', { count: 'exact' }).eq('owner_user_id', userId),
        supabase.from('applications').select('id', { count: 'exact' }).eq('applicant_user_id', userId),
        supabase.from('showcases').select('id', { count: 'exact' }).or(`creator_user_id.eq.${userId},talent_user_id.eq.${userId}`),
        supabase.from('messages').select('id', { count: 'exact' }).or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      ])

      const stats = {
        totalGigs: gigsCount.count || 0,
        totalApplications: applicationsCount.count || 0,
        totalShowcases: showcasesCount.count || 0,
        totalMessages: messagesCount.count || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },
}

// Real-time Subscriptions
export const realtimeService = {
  // Subscribe to gig updates
  subscribeToGigs(callback: (payload: any) => void) {
    return supabase
      .channel('gigs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, callback)
      .subscribe()
  },

  // Subscribe to messages
  subscribeToMessages(gigId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${gigId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `gig_id=eq.${gigId}` }, callback)
      .subscribe()
  },

  // Subscribe to applications
  subscribeToApplications(gigId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`applications:${gigId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `gig_id=eq.${gigId}` }, callback)
      .subscribe()
  },
}

// Export all services
export const databaseService = {
  userProfile: userProfileService,
  gig: gigService,
  application: applicationService,
  showcase: showcaseService,
  message: messageService,
  credits: creditsService,
  lootbox: lootboxService,
  stats: statsService,
  realtime: realtimeService,
}
