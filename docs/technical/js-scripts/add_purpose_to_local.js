const { Client } = require('pg');

async function addPurposeColumn() {
  // Connect to local Supabase database
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('🔧 Connected to local database...\n');

    // Check current columns in gigs table
    const checkResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns in gigs table:');
    checkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Check if purpose column exists
    const hasPurpose = checkResult.rows.some(row => row.column_name === 'purpose');
    
    if (!hasPurpose) {
      console.log('\n⚠️  Purpose column not found. Adding it now...');
      
      // Add the purpose column
      await client.query('ALTER TABLE gigs ADD COLUMN purpose TEXT;');
      console.log('✅ Purpose column added successfully to local database!');
    } else {
      console.log('\n✅ Purpose column already exists!');
    }

    await client.end();
    console.log('\n🎉 Local database updated successfully!');
    console.log('\nNow updating the remote database...\n');
    
  } catch (error) {
    console.error('Error with local database:', error.message);
    await client.end();
  }
}

// For remote database, we'll use the Supabase client
async function addPurposeToRemote() {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Since we can't execute raw SQL directly, we'll test if the column exists by trying to insert
  console.log('Testing remote database...');
  
  // Try to fetch gigs with purpose column
  const { data, error } = await supabase
    .from('gigs')
    .select('id, title, purpose')
    .limit(1);
  
  if (error && error.message.includes('purpose')) {
    console.log('❌ Purpose column missing in remote database.');
    console.log('\n📝 To add it, please run this SQL in your Supabase Dashboard:');
    console.log('----------------------------------------');
    console.log('ALTER TABLE gigs ADD COLUMN purpose TEXT;');
    console.log('----------------------------------------');
    console.log('\nGo to: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/editor');
    console.log('Then click "SQL Editor" and run the command above.\n');
  } else {
    console.log('✅ Remote database appears to have purpose column or no gigs exist yet.');
  }
}

// Run both
async function main() {
  await addPurposeColumn();
  await addPurposeToRemote();
}

main().catch(console.error);