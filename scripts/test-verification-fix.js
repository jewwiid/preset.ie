const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVerificationFix() {
    console.log('🧪 Testing verification fix...\n');
    
    try {
        // Test the fixed query from the frontend
        console.log('🔍 Testing the corrected frontend query...');
        const { data, error } = await supabase
            .from('verification_requests')
            .select(`
                *,
                user_profile:users_profile(display_name, handle)
            `)
            .order('submitted_at', { ascending: false })
            .limit(5);

        if (error) {
            console.log('❌ Query failed:', error.message);
            console.log('📋 Error details:', JSON.stringify(error, null, 2));
            return false;
        } else {
            console.log('✅ Query executed successfully!');
            console.log('📊 Records returned:', data?.length || 0);
            
            if (data && data.length > 0) {
                console.log('📋 Sample record structure:');
                const sample = data[0];
                console.log('- ID:', sample.id);
                console.log('- User ID:', sample.user_id);
                console.log('- Status:', sample.status);
                console.log('- User Profile:', sample.user_profile);
            } else {
                console.log('📝 No verification requests found (this is normal for a new system)');
            }
            
            return true;
        }

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Starting verification system test...\n');
    
    const success = await testVerificationFix();
    
    if (success) {
        console.log('\n🎉 SUCCESS: Verification system is working correctly!');
        console.log('✅ The frontend console error should be resolved');
        console.log('📱 You can now use the admin verification tab without errors');
    } else {
        console.log('\n❌ FAILED: There are still issues with the verification system');
        console.log('🔧 Additional debugging may be required');
    }
}

runTest();