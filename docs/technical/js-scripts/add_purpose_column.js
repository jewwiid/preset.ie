const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPurposeColumn() {
  console.log('🔧 Adding purpose column to gigs table...\n');
  
  try {
    // Add the purpose column using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE gigs ADD COLUMN IF NOT EXISTS purpose TEXT;`
    });
    
    if (error) {
      console.log('Note: Direct SQL execution not available via RPC.');
      console.log('Alternative: Creating migration file for purpose column...\n');
      
      // Create a migration file instead
      const migrationSQL = `-- Add purpose column to gigs table
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Update existing rows with a default value if needed
UPDATE gigs SET purpose = 'Not specified' WHERE purpose IS NULL;`;
      
      console.log('Migration SQL to run in Supabase Dashboard:\n');
      console.log('----------------------------------------');
      console.log(migrationSQL);
      console.log('----------------------------------------\n');
      
      return migrationSQL;
    }
    
    console.log('✅ Purpose column added successfully!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

addPurposeColumn();