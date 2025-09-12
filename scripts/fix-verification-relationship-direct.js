const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVerificationRelationship() {
    console.log('🔧 Fixing verification-profile relationship...\n');
    
    try {
        // First, let's test the current relationship directly
        console.log('🧪 Testing current verification system...');
        
        // Try the join that's failing in the frontend
        const { data: joinTest, error: joinError } = await supabase
            .from('verification_requests')
            .select(`
                *,
                users_profile!inner(
                    display_name,
                    handle,
                    avatar_url
                )
            `)
            .limit(1);

        if (joinError) {
            console.log('❌ Direct join error:', joinError.message);
            console.log('💡 This confirms the frontend issue\n');
        } else {
            console.log('✅ Direct join works:', joinTest);
        }

        // Let's check what foreign keys exist on verification_requests
        console.log('🔍 Checking existing foreign key constraints...');
        const { data: constraintCheck } = await supabase
            .from('information_schema.table_constraints')
            .select('constraint_name, constraint_type')
            .eq('table_name', 'verification_requests')
            .eq('constraint_type', 'FOREIGN KEY');

        console.log('📊 Current constraints:', constraintCheck);

        // Test alternative join approach
        console.log('\n🔄 Testing alternative join approach...');
        const { data: altJoinTest, error: altJoinError } = await supabase
            .from('verification_requests')
            .select(`
                id,
                user_id,
                status,
                verification_type
            `)
            .limit(5);

        if (altJoinError) {
            console.log('❌ Alt join error:', altJoinError.message);
        } else {
            console.log('✅ Base query works, records found:', altJoinTest?.length || 0);
            
            // Now try to manually join with users_profile
            if (altJoinTest && altJoinTest.length > 0) {
                const userIds = altJoinTest.map(r => r.user_id);
                console.log('👥 User IDs from verification_requests:', userIds);
                
                const { data: profileTest, error: profileError } = await supabase
                    .from('users_profile')
                    .select('user_id, display_name, handle')
                    .in('user_id', userIds);
                
                if (profileError) {
                    console.log('❌ Profile lookup error:', profileError.message);
                } else {
                    console.log('✅ Found matching profiles:', profileTest?.length || 0);
                    console.log('📋 Sample profile data:', profileTest?.[0]);
                }
            }
        }

        console.log('\n📋 Diagnosis:');
        console.log('- The issue is that PostgREST expects a named foreign key for the embedded join');
        console.log('- verification_requests.user_id -> auth.users.id');
        console.log('- users_profile.user_id -> auth.users.id');
        console.log('- But PostgREST needs a direct relationship or explicit join syntax');

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
    }
}

fixVerificationRelationship();