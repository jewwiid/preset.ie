const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

async function addMoodboardColumns() {
  console.log('🚀 Adding missing columns to moodboards table...\n');
  
  const alterStatements = [
    {
      name: 'description',
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS description TEXT`
    },
    {
      name: 'vibe_summary', 
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS vibe_summary TEXT`
    },
    {
      name: 'items',
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb`
    },
    {
      name: 'is_public',
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`
    },
    {
      name: 'view_count',
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`
    },
    {
      name: 'source_breakdown',
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS source_breakdown JSONB DEFAULT '{"pexels": 0, "user_upload": 0, "ai_enhanced": 0, "ai_generated": 0}'::jsonb`
    },
    {
      name: 'enhancement_log',
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS enhancement_log JSONB DEFAULT '[]'::jsonb`
    },
    {
      name: 'total_cost',
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,4) DEFAULT 0`
    },
    {
      name: 'ai_provider',
      sql: `ALTER TABLE public.moodboards ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50)`
    }
  ];

  console.log('📝 SQL statements to execute:\n');
  console.log('=' .repeat(60));
  
  const fullSQL = alterStatements.map(s => s.sql).join(';\n') + ';';
  console.log(fullSQL);
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n🔗 Please execute this SQL in Supabase:');
  console.log('1. Go to: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/sql/new');
  console.log('2. Copy and paste the SQL above');
  console.log('3. Click "Run" to execute\n');
  
  // Also try via psql command if available
  console.log('Alternatively, you can use the Supabase CLI:\n');
  console.log('npx supabase db query --sql "' + fullSQL.replace(/"/g, '\\"').replace(/\n/g, ' ') + '"');
  
  console.log('\n✨ After running the SQL, your moodboard table will be fully configured!');
}

addMoodboardColumns();