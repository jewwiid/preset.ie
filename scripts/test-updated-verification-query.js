const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdatedVerificationQuery() {
    console.log('🧪 Testing updated verification query approach...\n');
    
    try {
        // Test the new approach: separate queries
        console.log('1️⃣ Testing verification_requests query...');
        const { data: verificationsData, error: verificationError } = await supabase
            .from('verification_requests')
            .select('*')
            .order('submitted_at', { ascending: false })
            .limit(5);

        if (verificationError) {
            console.log('❌ Verification query failed:', verificationError.message);
            return false;
        } else {
            console.log('✅ Verification query successful');
            console.log('📊 Records found:', verificationsData?.length || 0);
        }

        // If we have verification data, test the profile query
        if (verificationsData && verificationsData.length > 0) {
            console.log('\n2️⃣ Testing users_profile query...');
            const userIds = verificationsData.map(v => v.user_id);
            console.log('👥 User IDs to lookup:', userIds);

            const { data: profilesData, error: profilesError } = await supabase
                .from('users_profile')
                .select('user_id, display_name, handle')
                .in('user_id', userIds);

            if (profilesError) {
                console.log('❌ Profile query failed:', profilesError.message);
                return false;
            } else {
                console.log('✅ Profile query successful');
                console.log('📊 Profiles found:', profilesData?.length || 0);

                // Test the merge logic
                console.log('\n3️⃣ Testing data merge...');
                const merged = verificationsData.map(verification => ({
                    ...verification,
                    user_profile: profilesData?.find(profile => profile.user_id === verification.user_id) || null
                }));

                console.log('✅ Data merge successful');
                console.log('📋 Sample merged record:');
                if (merged.length > 0) {
                    const sample = merged[0];
                    console.log('- ID:', sample.id);
                    console.log('- Status:', sample.status);
                    console.log('- User Profile:', sample.user_profile);
                }
            }
        } else {
            console.log('\n2️⃣ No verification data to test profile lookup');
            console.log('📝 This is normal for a new system - testing profile query independently...');
            
            const { data: profilesData, error: profilesError } = await supabase
                .from('users_profile')
                .select('user_id, display_name, handle')
                .limit(1);

            if (profilesError) {
                console.log('❌ Profile query failed:', profilesError.message);
                return false;
            } else {
                console.log('✅ Profile query works independently');
                console.log('📊 Sample profiles:', profilesData?.length || 0);
            }
        }

        return true;

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Testing updated verification system approach...\n');
    
    const success = await testUpdatedVerificationQuery();
    
    if (success) {
        console.log('\n🎉 SUCCESS: Updated query approach works correctly!');
        console.log('✅ The frontend should no longer have the PostgREST relationship error');
        console.log('📱 The admin verification tab should now load without console errors');
        console.log('🔧 The fix separates the queries and merges data in the frontend');
    } else {
        console.log('\n❌ FAILED: There are still issues with the query approach');
        console.log('🔧 Additional debugging may be required');
    }
}

runTest();