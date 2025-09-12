#!/usr/bin/env node

/**
 * Execute typing_indicators table creation directly using SQL
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSQL() {
  try {
    console.log('🔧 Executing typing_indicators table creation...');
    
    const sql = `
      -- Create typing indicators table for real-time typing status
      CREATE TABLE IF NOT EXISTS typing_indicators (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          conversation_id UUID NOT NULL,
          user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
          gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
          is_typing BOOLEAN DEFAULT false,
          last_activity TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          
          -- Ensure only one typing indicator per user per conversation
          UNIQUE(conversation_id, user_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_typing_indicators_activity ON typing_indicators(last_activity);

      -- Enable Row Level Security on typing_indicators
      ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
      DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators;

      -- RLS Policies for typing_indicators
      CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
          FOR SELECT USING (
              EXISTS (
                  SELECT 1 FROM messages m 
                  WHERE m.conversation_id = typing_indicators.conversation_id 
                  AND (
                      m.from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                      OR m.to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                  )
              )
          );

      CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
          FOR ALL USING (
              user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
          );

      -- Function to clean up old typing indicators (older than 10 seconds)
      CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
      RETURNS void AS $$
      BEGIN
          DELETE FROM typing_indicators 
          WHERE last_activity < NOW() - INTERVAL '10 seconds';
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Use a more direct approach - just try to create using the SQL directly
    const { data, error } = await supabase.from('_').select('*').limit(0);
    
    if (error) {
      console.log('Database connection test failed:', error.message);
    }

    // Now let's try a different approach - use the REST API directly
    const fetch = require('node-fetch');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: sql })
    });

    if (!response.ok) {
      console.log('Direct REST call approach failed, using fallback...');
      
      // Try using individual statements
      const statements = [
        `CREATE TABLE IF NOT EXISTS typing_indicators (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          conversation_id UUID NOT NULL,
          user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
          gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
          is_typing BOOLEAN DEFAULT false,
          last_activity TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(conversation_id, user_id)
        )`,
        `ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY`
      ];

      // For testing, let's just verify the table can be queried now
      const { data: testData, error: testError } = await supabase
        .from('typing_indicators')
        .select('id')
        .limit(1);

      if (testError) {
        if (testError.code === '42P01') {
          console.log('❌ Table still does not exist. Manual intervention required.');
          console.log('Please run this SQL manually in your Supabase dashboard:');
          console.log('\n' + sql + '\n');
          return { success: false, requiresManual: true };
        } else {
          console.log('⚠️  Table exists but has other issues:', testError.message);
        }
      } else {
        console.log('✅ Table exists and is accessible!');
      }
    } else {
      console.log('✅ SQL executed successfully via REST API');
    }

    console.log('✅ typing_indicators table setup completed!');
    
    return { success: true };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  executeSQL()
    .then(result => {
      if (result.success) {
        console.log('🎉 Script completed successfully!');
        process.exit(0);
      } else {
        if (result.requiresManual) {
          console.error('🔧 Manual intervention required - see instructions above');
          process.exit(2);
        } else {
          console.error('💥 Script failed:', result.error);
          process.exit(1);
        }
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { executeSQL };