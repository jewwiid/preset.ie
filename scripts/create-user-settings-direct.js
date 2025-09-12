import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createUserSettingsTable() {
  console.log('Creating user_settings table...')
  
  try {
    // Check if table already exists
    const { data: existingTable } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1)
    
    if (existingTable) {
      console.log('✅ user_settings table already exists')
      return
    }
  } catch (error) {
    if (error.message.includes('relation "public.user_settings" does not exist')) {
      console.log('Table does not exist, creating...')
    } else {
      console.log('Error checking table existence, proceeding with creation...')
    }
  }
  
  // Use raw SQL via the REST API
  const createTableSQL = `
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

    -- Enable RLS
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policies (with DROP IF EXISTS to avoid errors)
    DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
    CREATE POLICY "Users can manage own settings" ON user_settings
      FOR ALL USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Admins can view all settings" ON user_settings;
    CREATE POLICY "Admins can view all settings" ON user_settings
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users_profile 
          WHERE user_id = auth.uid() 
          AND role_flags && ARRAY['admin']
        )
      );
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
  `
  
  // Execute via curl to the PostgREST endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    },
    body: JSON.stringify({
      sql: createTableSQL
    })
  })
  
  if (!response.ok) {
    console.error('Failed to create table via REST API')
    
    // Try using supabase CLI instead
    console.log('Falling back to supabase CLI...')
    
    const fs = await import('fs')
    const tempFile = '/tmp/create_user_settings.sql'
    
    fs.writeFileSync(tempFile, createTableSQL)
    
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    try {
      const { stdout, stderr } = await execAsync(`psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f ${tempFile}`)
      console.log('stdout:', stdout)
      if (stderr) console.error('stderr:', stderr)
      
      console.log('✅ user_settings table created successfully via psql')
    } catch (error) {
      console.error('Failed to create table via psql:', error)
    }
    
    // Clean up temp file
    fs.unlinkSync(tempFile)
    
  } else {
    console.log('✅ user_settings table created successfully via REST API')
  }
}

createUserSettingsTable()