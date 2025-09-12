const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addDateOfBirthColumn() {
    console.log('🔧 Adding date_of_birth column directly...\n');
    
    try {
        // Try to use Supabase's SQL execution capabilities
        // We'll attempt to create an RPC function to add the column
        
        console.log('1️⃣ Creating a temporary RPC function to add the column...');
        
        // First, let's try a different approach - update a record with the new field
        // and let Supabase auto-create the column if possible (this won't work, but let's see the error)
        
        console.log('2️⃣ Attempting to test column creation...');
        
        // Try inserting a record with date_of_birth to see if we can force column creation
        const { data: testInsert, error: insertError } = await supabase
            .from('users_profile')
            .update({ date_of_birth: '1990-01-01' })
            .eq('id', 'non-existent-id'); // This will fail but show us the column error
            
        console.log('Insert test result:', { data: testInsert, error: insertError });
        
        // Since we can't execute raw SQL directly through the JS client,
        // let's use the built-in Supabase CLI approach
        console.log('\n3️⃣ Alternative approaches:');
        console.log('📋 The column needs to be added via one of these methods:');
        console.log('   A) Supabase Dashboard: Database → users_profile → Add Column');
        console.log('   B) SQL Editor in Dashboard: ALTER TABLE users_profile ADD COLUMN date_of_birth date;');
        console.log('   C) CLI: npx supabase db push (to apply pending migrations)');
        
        // Let's check if we can use the supabase admin API
        console.log('\n4️⃣ Checking current database status...');
        
        // Test if the column exists after potential addition
        const { data: retest, error: retestError } = await supabase
            .from('users_profile')
            .select('date_of_birth')
            .limit(1);
            
        if (retestError && retestError.code === '42703') {
            console.log('❌ Column still missing - manual intervention required');
            return false;
        } else if (retestError) {
            console.log('❓ Unexpected error:', retestError.message);
            return false;
        } else {
            console.log('✅ Column exists now!');
            return true;
        }

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
        return false;
    }
}

addDateOfBirthColumn();