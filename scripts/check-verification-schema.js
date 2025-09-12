const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVerificationSchema() {
    console.log('🔍 Checking verification_requests table schema...\n');
    
    try {
        // Check if verification_requests table exists and its structure
        const { data: verificationData, error: verificationError } = await supabase
            .from('verification_requests')
            .select('*')
            .limit(1);
            
        if (verificationError) {
            console.log('❌ Error accessing verification_requests:', verificationError.message);
        } else {
            console.log('✅ verification_requests table exists');
            if (verificationData && verificationData.length > 0) {
                console.log('📊 Sample verification_requests record:', Object.keys(verificationData[0]));
            }
        }

        // Check if users_profile table exists and its structure
        const { data: profileData, error: profileError } = await supabase
            .from('users_profile')
            .select('*')
            .limit(1);
            
        if (profileError) {
            console.log('❌ Error accessing users_profile:', profileError.message);
        } else {
            console.log('✅ users_profile table exists');
            if (profileData && profileData.length > 0) {
                console.log('📊 Sample users_profile record:', Object.keys(profileData[0]));
            }
        }

        // Try to perform a join to see what happens
        const { data: joinData, error: joinError } = await supabase
            .from('verification_requests')
            .select(`
                *,
                users_profile!verification_requests_user_id_fkey(
                    id,
                    display_name,
                    handle
                )
            `)
            .limit(1);

        if (joinError) {
            console.log('\n❌ Join Error:', joinError.message);
            console.log('💡 This confirms the foreign key relationship is missing');
        } else {
            console.log('\n✅ Join successful - foreign key exists');
        }

        // Check current foreign key constraints
        const { data: constraintData, error: constraintError } = await supabase.rpc('check_foreign_keys', {
            table_name: 'verification_requests'
        });

        if (constraintError) {
            console.log('\n⚠️  Could not check constraints:', constraintError.message);
        }

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
    }
}

checkVerificationSchema();