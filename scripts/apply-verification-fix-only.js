const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyVerificationFix() {
    console.log('🔧 Applying verification-profile relationship fix...\n');
    
    try {
        // Create the helper view for better joins
        console.log('📋 Creating verification_requests_with_profile view...');
        const { error: viewError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE OR REPLACE VIEW verification_requests_with_profile AS
                SELECT 
                    vr.*,
                    up.display_name,
                    up.handle,
                    up.avatar_url,
                    up.role_flags
                FROM verification_requests vr
                INNER JOIN users_profile up ON vr.user_id = up.user_id;
            `
        });

        if (viewError) {
            console.log('❌ Error creating view:', viewError.message);
        } else {
            console.log('✅ View created successfully');
        }

        // Test the relationship by attempting the join that was failing
        console.log('🧪 Testing the verification-profile relationship...');
        const { data: testData, error: testError } = await supabase
            .from('verification_requests_with_profile')
            .select('id, display_name, handle')
            .limit(1);

        if (testError) {
            console.log('❌ Test failed:', testError.message);
        } else {
            console.log('✅ Relationship test successful');
            if (testData && testData.length > 0) {
                console.log('📊 Sample joined data:', testData[0]);
            }
        }

        // Update the admin dashboard view with correct joins
        console.log('📊 Updating admin dashboard view...');
        const { error: dashboardError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE OR REPLACE VIEW admin_verification_dashboard AS
                SELECT 
                    vr.*,
                    u.display_name as user_name,
                    u.handle as user_handle,
                    au.email as user_email,
                    reviewer.display_name as reviewer_name,
                    (
                        SELECT COUNT(*) FROM verification_badges
                        WHERE user_id = vr.user_id
                        AND revoked_at IS NULL
                        AND (expires_at IS NULL OR expires_at > NOW())
                    ) as active_badges_count,
                    (
                        SELECT COUNT(*) FROM verification_requests
                        WHERE user_id = vr.user_id
                        AND status = 'rejected'
                    ) as previous_rejections
                FROM verification_requests vr
                INNER JOIN users_profile u ON vr.user_id = u.user_id
                LEFT JOIN auth.users au ON vr.user_id = au.id
                LEFT JOIN users_profile reviewer ON vr.reviewed_by = reviewer.user_id
                ORDER BY 
                    CASE 
                        WHEN vr.status = 'pending' THEN 1
                        WHEN vr.status = 'reviewing' THEN 2
                        ELSE 3
                    END,
                    vr.submitted_at DESC;
            `
        });

        if (dashboardError) {
            console.log('❌ Error updating dashboard view:', dashboardError.message);
        } else {
            console.log('✅ Admin dashboard view updated');
        }

        console.log('\n🎉 Verification-profile relationship fix completed!');
        console.log('📝 The frontend should now be able to join verification_requests with users_profile');

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
    }
}

applyVerificationFix();