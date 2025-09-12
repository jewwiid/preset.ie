import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createUserSettingsTable() {
  console.log('Creating user_settings table...')
  
  try {
    // First check if table exists
    const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_settings';
      `
    })
    
    if (tableError) {
      console.log('Checking table existence failed, proceeding with creation...')
    } else if (tables && tables.length > 0) {
      console.log('✅ user_settings table already exists')
      return
    }
    
    // Create the table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- User Settings Table
        CREATE TABLE IF NOT EXISTS user_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          
          -- Display preferences
          theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
          language VARCHAR(5) DEFAULT 'en',
          timezone VARCHAR(50) DEFAULT 'UTC',
          
          -- Privacy settings
          profile_visibility VARCHAR(10) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
          show_email_in_profile BOOLEAN DEFAULT false,
          allow_profile_indexing BOOLEAN DEFAULT true,
          
          -- Notification preferences
          email_notifications BOOLEAN DEFAULT true,
          push_notifications BOOLEAN DEFAULT true,
          marketing_emails BOOLEAN DEFAULT false,
          weekly_digest BOOLEAN DEFAULT true,
          
          -- Communication preferences
          allow_direct_messages BOOLEAN DEFAULT true,
          auto_accept_collaborations BOOLEAN DEFAULT false,
          preferred_contact_method VARCHAR(15) DEFAULT 'in_app' CHECK (preferred_contact_method IN ('in_app', 'email', 'phone')),
          
          -- Security preferences
          two_factor_enabled BOOLEAN DEFAULT false,
          session_timeout_minutes INTEGER DEFAULT 480 CHECK (session_timeout_minutes > 0),
          login_alerts BOOLEAN DEFAULT true,
          
          -- Portfolio and showcase settings
          portfolio_auto_publish BOOLEAN DEFAULT false,
          showcase_quality VARCHAR(10) DEFAULT 'high' CHECK (showcase_quality IN ('low', 'medium', 'high')),
          watermark_showcases BOOLEAN DEFAULT false,
          
          -- Collaboration preferences
          default_usage_rights VARCHAR(20) DEFAULT 'personal' CHECK (default_usage_rights IN ('personal', 'commercial', 'editorial', 'unlimited')),
          auto_credit_collaborators BOOLEAN DEFAULT true,
          require_signed_releases BOOLEAN DEFAULT true,
          
          -- Analytics and data
          allow_analytics BOOLEAN DEFAULT true,
          share_anonymized_data BOOLEAN DEFAULT true,
          
          -- Metadata
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Constraints
          UNIQUE(user_id)
        );
      `
    })
    
    if (error) {
      console.error('Error creating user_settings table:', error)
      return
    }
    
    console.log('✅ user_settings table created successfully')
    
    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
        
        -- Users can view and modify their own settings
        CREATE POLICY "Users can manage own settings" ON user_settings
          FOR ALL USING (auth.uid() = user_id);
          
        -- Admins can view all settings (for support)
        CREATE POLICY "Admins can view all settings" ON user_settings
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users_profile 
              WHERE user_id = auth.uid() 
              AND role_flags && ARRAY['admin']
            )
          );
      `
    })
    
    if (rlsError) {
      console.error('Error setting up RLS policies:', rlsError)
    } else {
      console.log('✅ RLS policies created successfully')
    }
    
    // Create index for performance
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
      `
    })
    
    if (indexError) {
      console.error('Error creating index:', indexError)
    } else {
      console.log('✅ Index created successfully')
    }
    
    console.log('🎉 user_settings table setup complete!')
    
  } catch (error) {
    console.error('Failed to create user_settings table:', error)
  }
}

createUserSettingsTable()