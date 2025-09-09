const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjMzMTQ4OSwiZXhwIjoyMDUxOTA3NDg5fQ.xJo8b95fhqj1JKYOVHhYxlBTm5dzktJL3JvGMh9VfBs';

async function deployRefundSystem() {
  console.log('🚀 Deploying Credit Refund System...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/010_credit_refund_system.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing refund system migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSql
    });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution through admin API
      console.log('⚠️ Direct RPC failed, trying alternative method...');
      
      // Split SQL into statements and execute individually
      const statements = migrationSql
        .split(';')
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim() + ';');
      
      for (const statement of statements) {
        if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('INSERT')) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          // Note: This would need actual SQL execution through Supabase admin API
          // For now, we'll document that manual execution is needed
        }
      }
      
      console.log('\n⚠️ Automated deployment not available.');
      console.log('Please run the migration manually through Supabase Dashboard SQL Editor.');
      console.log(`Migration file: ${migrationPath}`);
      return;
    }
    
    console.log('✅ Refund system migration completed successfully!\n');
    
    // Verify the tables were created
    console.log('🔍 Verifying deployment...');
    
    const { data: policies } = await supabase
      .from('refund_policies')
      .select('*');
    
    if (policies) {
      console.log(`✅ Refund policies table created with ${policies.length} default policies`);
    }
    
    console.log('✅ Credit Refund System deployed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy the nanobanana-callback edge function');
    console.log('2. Configure NanoBanana webhook to point to your callback URL');
    console.log('3. Test with a deliberate failure to verify refund processing');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    console.log('\nPlease deploy manually through Supabase Dashboard.');
  }
}

deployRefundSystem();