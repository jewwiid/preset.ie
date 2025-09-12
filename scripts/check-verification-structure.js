const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerificationStructure() {
    console.log('🔍 Checking verification_requests table structure...\n');
    
    try {
        // Get a sample record to see the structure
        const { data: verificationData, error: verificationError } = await supabase
            .from('verification_requests')
            .select('*')
            .limit(1);
            
        if (verificationError) {
            console.log('❌ Error accessing verification_requests:', verificationError.message);
            return;
        }

        if (verificationData && verificationData.length > 0) {
            console.log('📊 verification_requests table columns:', Object.keys(verificationData[0]));
            console.log('📝 Sample record:');
            console.log(JSON.stringify(verificationData[0], null, 2));
        } else {
            // If no data, try to insert a test record to see the expected structure
            console.log('📊 No data found. Trying to see expected structure...');
            
            const { data, error } = await supabase
                .from('verification_requests')
                .select('*')
                .limit(0);
                
            console.log('Table exists but is empty');
        }

        // Check existing migrations for verification_requests
        const { data: migrationData, error: migrationError } = await supabase
            .from('supabase_migrations')
            .select('*')
            .like('name', '%verification%')
            .order('version', { ascending: true });

        if (!migrationError && migrationData) {
            console.log('\n📋 Existing verification-related migrations:');
            migrationData.forEach(migration => {
                console.log(`- ${migration.name} (${migration.version})`);
            });
        }

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
    }
}

checkVerificationStructure();