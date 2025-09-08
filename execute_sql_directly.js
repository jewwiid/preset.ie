const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

async function executeSQLDirectly() {
  console.log('🚀 Executing SQL to add missing columns...\n');
  
  const alterStatements = [
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS vibe_summary TEXT`,
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`,
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`,
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS source_breakdown JSONB DEFAULT '{"pexels": 0, "user_upload": 0, "ai_enhanced": 0, "ai_generated": 0}'::jsonb`,
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS enhancement_log JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0`,
    `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50)`
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const sql of alterStatements) {
    try {
      // Extract column name for logging
      const columnMatch = sql.match(/COLUMN IF NOT EXISTS (\w+)/);
      const columnName = columnMatch ? columnMatch[1] : 'unknown';
      
      // Use fetch to make direct REST API call with SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: sql
        })
      });
      
      if (response.ok || response.status === 404) {
        // 404 might mean RPC endpoint doesn't exist, but let's continue
        console.log(`⚠️  Column '${columnName}' - May already exist or RPC not available`);
      } else {
        console.log(`❌ Column '${columnName}' - Failed to add`);
        errorCount++;
      }
    } catch (error) {
      console.log(`❌ Error executing SQL:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '=' .repeat(60));
  
  // Now verify what columns exist
  console.log('\n📊 Verifying column status...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const columnsToCheck = [
    'description', 'vibe_summary', 'items', 'is_public', 
    'view_count', 'source_breakdown', 'enhancement_log', 
    'total_cost', 'ai_provider'
  ];
  
  for (const col of columnsToCheck) {
    try {
      const { data, error } = await supabase
        .from('moodboards')
        .select(col)
        .limit(1);
      
      if (!error) {
        console.log(`✅ ${col} - EXISTS`);
      } else {
        console.log(`❌ ${col} - MISSING`);
      }
    } catch (e) {
      console.log(`❌ ${col} - ERROR`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📝 Manual Step Required:');
  console.log('Since direct SQL execution is limited, please:');
  console.log('\n1. Go to Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/editor');
  console.log('\n2. Click on the "SQL Editor" tab');
  console.log('\n3. Paste this SQL and click "Run":\n');
  
  console.log(alterStatements.join(';\n') + ';');
  
  console.log('\n✨ This will add all missing columns to your moodboards table!');
}

executeSQLDirectly();