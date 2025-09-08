import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export class SupabaseClient {
  private static instance: SupabaseClient;
  private client: ReturnType<typeof createClient<Database>>;
  private adminClient?: ReturnType<typeof createClient<Database>>;

  constructor(config: SupabaseConfig) {
    // Public client for user operations
    this.client = createClient<Database>(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    // Admin client for service operations (if service key provided)
    if (config.serviceRoleKey) {
      this.adminClient = createClient<Database>(config.url, config.serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }
  }

  static initialize(config: SupabaseConfig): SupabaseClient {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = new SupabaseClient(config);
    }
    return SupabaseClient.instance;
  }

  static getInstance(): SupabaseClient {
    if (!SupabaseClient.instance) {
      throw new Error('SupabaseClient not initialized. Call initialize() first.');
    }
    return SupabaseClient.instance;
  }

  getClient() {
    return this.client;
  }

  getAdminClient() {
    if (!this.adminClient) {
      throw new Error('Admin client not available. Service role key not provided.');
    }
    return this.adminClient;
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.client.auth.getSession();
      
      if (error && error.message !== 'Auth session missing!') {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Test admin connection
  async testAdminConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.adminClient) {
      return { success: false, error: 'Admin client not available' };
    }

    try {
      const { data, error } = await this.adminClient.auth.getSession();
      
      if (error && error.message !== 'Auth session missing!') {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}