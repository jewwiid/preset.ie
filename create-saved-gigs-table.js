const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSavedGigsTable() {
  console.log('🔧 Creating saved_gigs table...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('create-saved-gigs-table.sql', 'utf8');
    
    console.log('📝 Note: SQL needs to be run manually in Supabase SQL Editor');
    console.log('📋 Copy and paste the following SQL into Supabase SQL Editor:\n');
    console.log(sql);

    console.log('\n🧪 Testing if table exists...');
    
    // Test if the table exists
    const { data, error } = await supabase
      .from('saved_gigs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist yet:', error.message);
      console.log('📝 Please run the SQL above in Supabase SQL Editor');
    } else {
      console.log('✅ Table exists! Results:', data);
    }

  } catch (err) {
    console.log('💥 Exception:', err.message);
  }
}

createSavedGigsTable();
