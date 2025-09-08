const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployMigration() {
  console.log('🚀 Deploying moodboard migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/007_complete_moodboard_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
      }
    }
    
    console.log('\n🎉 Migration deployment completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Add your API keys to environment variables:');
    console.log('   - PEXELS_API_KEY (get from https://www.pexels.com/api/)');
    console.log('   - NANOBANAN_API_KEY (get from https://nanobananapi.ai/)');
    console.log('2. Deploy the Edge Function:');
    console.log('   supabase functions deploy generate-moodboard');
    console.log('3. Test the moodboard creation in your app!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  
  if (error && error.message.includes('function exec_sql')) {
    console.log('📝 Creating exec_sql function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (createError) {
      console.error('❌ Failed to create exec_sql function:', createError);
      throw createError;
    }
    
    console.log('✅ exec_sql function created');
  }
}

deployMigration().catch(console.error);

