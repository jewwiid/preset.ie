const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAfterColumnAdd() {
    console.log('🧪 Testing users_profile after manual column addition...\n');
    
    try {
        // Test if the column now exists
        console.log('1️⃣ Testing date_of_birth column access...');
        const { data: dobTest, error: dobError } = await supabase
            .from('users_profile')
            .select('date_of_birth, display_name, handle')
            .limit(3);

        if (dobError) {
            console.log('❌ date_of_birth column still missing:', dobError.message);
            console.log('🔧 Manual action needed:');
            console.log('   1. Go to Supabase Dashboard');
            console.log('   2. Navigate to Database > Tables > users_profile');
            console.log('   3. Click "Add Column"');
            console.log('   4. Name: date_of_birth, Type: date, Nullable: true');
            console.log('   5. Save');
            return false;
        } else {
            console.log('✅ date_of_birth column is now accessible!');
            console.log('📊 Sample data:', dobTest);
        }

        // Test a query that might be failing in the frontend
        console.log('\n2️⃣ Testing typical frontend query pattern...');
        const { data: userTest, error: userError } = await supabase
            .from('users_profile')
            .select('id, display_name, handle, date_of_birth, role_flags')
            .limit(5);

        if (userError) {
            console.log('❌ Frontend-style query failed:', userError.message);
            return false;
        } else {
            console.log('✅ Frontend-style query successful');
            console.log('📊 Records returned:', userTest?.length || 0);
            if (userTest && userTest.length > 0) {
                console.log('📋 Sample record:');
                const sample = userTest[0];
                console.log(`   - ID: ${sample.id}`);
                console.log(`   - Name: ${sample.display_name}`);
                console.log(`   - Handle: ${sample.handle}`);
                console.log(`   - Date of Birth: ${sample.date_of_birth || 'null'}`);
                console.log(`   - Role Flags: ${JSON.stringify(sample.role_flags)}`);
            }
        }

        return true;

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Testing users_profile table with date_of_birth column...\n');
    
    const success = await testAfterColumnAdd();
    
    if (success) {
        console.log('\n🎉 SUCCESS: users_profile table is working correctly!');
        console.log('✅ The date_of_birth column error should be resolved');
        console.log('📱 Frontend queries should now work without column errors');
    } else {
        console.log('\n❌ ISSUE: The date_of_birth column still needs to be added');
        console.log('📋 Please add it manually in the Supabase Dashboard');
        console.log('💡 Column details: name="date_of_birth", type="date", nullable=true');
    }
}

runTest();