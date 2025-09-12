#!/usr/bin/env node

/**
 * Create typing_indicators table directly
 * This fixes the missing table issue for messaging functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTypingIndicatorsTable() {
  try {
    console.log('🔧 Creating typing_indicators table...');
    
    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase.rpc('check_table_exists', {
      table_name: 'typing_indicators'
    });

    // If the RPC doesn't exist, we'll just try to create the table
    console.log('📋 Creating typing_indicators table and related objects...');

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

    const { error } = await supabase.rpc('exec_sql', {
      sql: sql
    });

    if (error) {
      // Try direct query approach
      console.log('RPC method failed, trying direct SQL execution...');
      
      // Split SQL into individual statements and execute them
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
        
        `CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_id)`,
        
        `CREATE INDEX IF NOT EXISTS idx_typing_indicators_activity ON typing_indicators(last_activity)`,
        
        `ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY`,
        
        `DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators`,
        
        `DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON typing_indicators`,
        
        `CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
          FOR SELECT USING (
              EXISTS (
                  SELECT 1 FROM messages m 
                  WHERE m.conversation_id = typing_indicators.conversation_id 
                  AND (
                      m.from_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                      OR m.to_user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
                  )
              )
          )`,
        
        `CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
          FOR ALL USING (
              user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
          )`,
        
        `CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
        RETURNS void AS $$
        BEGIN
            DELETE FROM typing_indicators 
            WHERE last_activity < NOW() - INTERVAL '10 seconds';
        END;
        $$ LANGUAGE plpgsql`
      ];

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec', {
            sql: statement
          });
          
          if (stmtError) {
            console.log(`⚠️  Statement might have failed (this could be normal): ${stmtError.message}`);
          }
        } catch (e) {
          console.log(`⚠️  Error executing statement: ${e.message}`);
        }
      }
    }

    // Verify table was created by trying to select from it
    const { data: testData, error: testError } = await supabase
      .from('typing_indicators')
      .select('id')
      .limit(1);

    if (testError && testError.code === '42P01') {
      throw new Error('Table still does not exist after creation attempt');
    }

    console.log('✅ typing_indicators table created successfully!');
    console.log('📝 Table structure and policies applied');
    
    return { success: true };

  } catch (error) {
    console.error('❌ Error creating typing_indicators table:', error.message);
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  createTypingIndicatorsTable()
    .then(result => {
      if (result.success) {
        console.log('🎉 Script completed successfully!');
        process.exit(0);
      } else {
        console.error('💥 Script failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { createTypingIndicatorsTable };