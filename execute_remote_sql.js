// This script will execute SQL on the remote Supabase database
// We'll use the direct Postgres connection

const { Client } = require('pg');

async function executeRemoteSQL() {
  // Using the direct connection string format for Supabase
  const client = new Client({
    connectionString: 'postgresql://postgres.zbsmgymyfhnwjdnmlelr:preset123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔧 Connecting to remote Supabase database...\n');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Check if purpose column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' AND column_name = 'purpose';
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('⚠️  Purpose column not found. Adding it now...');
      
      // Add the purpose column
      await client.query('ALTER TABLE gigs ADD COLUMN purpose TEXT;');
      console.log('✅ Purpose column added successfully to remote database!');
    } else {
      console.log('✅ Purpose column already exists in remote database!');
    }

    await client.end();
    console.log('\n🎉 Remote database updated successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('password')) {
      console.log('\n💡 Try using the Supabase Dashboard SQL Editor instead:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/editor');
      console.log('   2. Click "SQL Editor"');
      console.log('   3. Run: ALTER TABLE gigs ADD COLUMN purpose TEXT;');
    }
    await client.end();
  }
}

executeRemoteSQL();