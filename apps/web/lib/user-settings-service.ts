/**
 * Production-ready User Settings Service
 * Handles user settings operations with proper error handling and fallbacks
 */

import { supabase } from './supabase'

export interface UserSettings {
  id: string
  user_id: string
  profile_id?: string
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  profile_visibility: 'public' | 'private'
  show_contact_info: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

export interface UserSettingsInput {
  email_notifications?: boolean
  push_notifications?: boolean
  marketing_emails?: boolean
  profile_visibility?: 'public' | 'private'
  show_contact_info?: boolean
  two_factor_enabled?: boolean
}

export class UserSettingsService {
  private static instance: UserSettingsService
  private cache = new Map<string, UserSettings>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  static getInstance(): UserSettingsService {
    if (!UserSettingsService.instance) {
      UserSettingsService.instance = new UserSettingsService()
    }
    return UserSettingsService.instance
  }

  /**
   * Get user settings with caching and fallbacks
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      // Check cache first
      const cached = this.cache.get(userId)
      if (cached && this.isCacheValid(cached)) {
        return cached
      }

      if (!supabase) {
        console.error('Supabase client not available')
        return this.getDefaultSettings(userId)
      }

      // Try to get settings using the helper function
      const { data, error } = await supabase
        .rpc('get_user_settings', { user_uuid: userId })

      if (error) {
        console.error('Error fetching user settings:', error)
        
        // If no settings found, create default settings
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          return await this.createDefaultSettings(userId)
        }
        
        // For other errors, return default settings
        return this.getDefaultSettings(userId)
      }

      if (data && data.length > 0) {
        const settings = data[0] as UserSettings
        this.cache.set(userId, settings)
        return settings
      }

      // No settings found, create default
      return await this.createDefaultSettings(userId)

    } catch (error) {
      console.error('Unexpected error in getUserSettings:', error)
      return this.getDefaultSettings(userId)
    }
  }

  /**
   * Update user settings with proper error handling
   */
  async updateUserSettings(userId: string, settings: UserSettingsInput): Promise<UserSettings | null> {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return null
      }

      // Use the helper function for upsert
      const { data, error } = await supabase
        .rpc('upsert_user_settings', { 
          user_uuid: userId, 
          settings_data: settings 
        })

      if (error) {
        console.error('Error updating user settings:', error)
        
        // Try fallback method
        return await this.fallbackUpdateSettings(userId, settings)
      }

      if (data && data.length > 0) {
        const updatedSettings = data[0] as UserSettings
        this.cache.set(userId, updatedSettings)
        return updatedSettings
      }

      return null

    } catch (error) {
      console.error('Unexpected error in updateUserSettings:', error)
      return null
    }
  }

  /**
   * Create default settings for a user
   */
  private async createDefaultSettings(userId: string): Promise<UserSettings> {
    try {
      if (!supabase) {
        return this.getDefaultSettings(userId)
      }

      const defaultSettings = this.getDefaultSettingsData()
      
      // Try using the helper function first
      const { data, error } = await supabase
        .rpc('upsert_user_settings', { 
          user_uuid: userId, 
          settings_data: defaultSettings 
        })

      if (error) {
        console.error('Error creating default settings:', error)
        return this.getDefaultSettings(userId)
      }

      if (data && data.length > 0) {
        const settings = data[0] as UserSettings
        this.cache.set(userId, settings)
        return settings
      }

      return this.getDefaultSettings(userId)

    } catch (error) {
      console.error('Unexpected error creating default settings:', error)
      return this.getDefaultSettings(userId)
    }
  }

  /**
   * Fallback method for updating settings (direct table access)
   */
  private async fallbackUpdateSettings(userId: string, settings: UserSettingsInput): Promise<UserSettings | null> {
    try {
      if (!supabase) {
        return null
      }

      // Try to update using user_id
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Fallback update failed:', error)
        return null
      }

      if (data) {
        this.cache.set(userId, data as UserSettings)
        return data as UserSettings
      }

      return null

    } catch (error) {
      console.error('Unexpected error in fallback update:', error)
      return null
    }
  }

  /**
   * Get default settings object
   */
  private getDefaultSettings(userId: string): UserSettings {
    return {
      id: `default-${userId}`,
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      marketing_emails: false,
      profile_visibility: 'public',
      show_contact_info: true,
      two_factor_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Get default settings data for creation
   */
  private getDefaultSettingsData(): UserSettingsInput {
    return {
      email_notifications: true,
      push_notifications: true,
      marketing_emails: false,
      profile_visibility: 'public',
      show_contact_info: true,
      two_factor_enabled: false
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(settings: UserSettings): boolean {
    const now = Date.now()
    const updatedAt = new Date(settings.updated_at).getTime()
    return (now - updatedAt) < this.cacheTimeout
  }

  /**
   * Clear cache for a specific user
   */
  clearCache(userId: string): void {
    this.cache.delete(userId)
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear()
  }

  /**
   * Validate settings input
   */
  validateSettings(settings: UserSettingsInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (settings.profile_visibility && !['public', 'private'].includes(settings.profile_visibility)) {
      errors.push('profile_visibility must be "public" or "private"')
    }

    if (settings.email_notifications !== undefined && typeof settings.email_notifications !== 'boolean') {
      errors.push('email_notifications must be a boolean')
    }

    if (settings.push_notifications !== undefined && typeof settings.push_notifications !== 'boolean') {
      errors.push('push_notifications must be a boolean')
    }

    if (settings.marketing_emails !== undefined && typeof settings.marketing_emails !== 'boolean') {
      errors.push('marketing_emails must be a boolean')
    }

    if (settings.show_contact_info !== undefined && typeof settings.show_contact_info !== 'boolean') {
      errors.push('show_contact_info must be a boolean')
    }

    if (settings.two_factor_enabled !== undefined && typeof settings.two_factor_enabled !== 'boolean') {
      errors.push('two_factor_enabled must be a boolean')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const userSettingsService = UserSettingsService.getInstance()

// Export convenience functions
export const getUserSettings = (userId: string) => userSettingsService.getUserSettings(userId)
export const updateUserSettings = (userId: string, settings: UserSettingsInput) => 
  userSettingsService.updateUserSettings(userId, settings)
export const clearUserSettingsCache = (userId: string) => userSettingsService.clearCache(userId)
