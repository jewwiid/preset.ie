const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDateOfBirthColumn() {
    console.log('🔧 Adding date_of_birth column to users_profile table...\n');
    
    try {
        // First, check if the column already exists
        console.log('🔍 Checking if date_of_birth column exists...');
        const { data: existingTest, error: existingError } = await supabase
            .from('users_profile')
            .select('date_of_birth')
            .limit(1);

        if (!existingError) {
            console.log('✅ date_of_birth column already exists');
            return true;
        }

        if (existingError.code !== '42703') {
            console.log('❌ Unexpected error checking column:', existingError.message);
            return false;
        }

        // Column doesn't exist, let's add it using SQL
        console.log('➕ Adding date_of_birth column...');
        
        // We'll use a simple approach - create the SQL to add the column
        // Since we can't execute raw SQL directly, let's try using the RPC approach
        
        // Alternative: Use supabase client to add the column by attempting an upsert
        // This will fail gracefully if the column doesn't exist and show us the exact error
        
        console.log('🧪 Testing column addition via schema inspection...');
        
        // Let's check what columns we should have vs what we do have
        const { data: currentData } = await supabase
            .from('users_profile')
            .select('*')
            .limit(1);
            
        const currentColumns = currentData && currentData.length > 0 ? Object.keys(currentData[0]) : [];
        console.log('📊 Current columns:', currentColumns);
        
        const expectedColumns = [
            'id', 'user_id', 'display_name', 'handle', 'avatar_url', 'bio', 'city',
            'role_flags', 'style_tags', 'subscription_tier', 'subscription_status',
            'subscription_started_at', 'subscription_expires_at', 'verified_id',
            'created_at', 'updated_at', 'date_of_birth'
        ];
        
        const missingColumns = expectedColumns.filter(col => !currentColumns.includes(col));
        console.log('❌ Missing columns:', missingColumns);
        
        if (missingColumns.includes('date_of_birth')) {
            console.log('\n🚨 The date_of_birth column needs to be added manually');
            console.log('💡 This requires applying the migration: 20250911075325_add_missing_date_of_birth_column.sql');
            console.log('🔧 You can run: npx supabase db push');
            console.log('⚠️  Or add the column manually in the Supabase dashboard');
            
            return false;
        }

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
        return false;
    }
}

async function runFix() {
    console.log('🚀 Attempting to fix date_of_birth column issue...\n');
    
    const success = await applyDateOfBirthColumn();
    
    if (success) {
        console.log('\n🎉 SUCCESS: date_of_birth column is available!');
    } else {
        console.log('\n📋 MANUAL ACTION REQUIRED:');
        console.log('The date_of_birth column needs to be added to the users_profile table.');
        console.log('This can be done by:');
        console.log('1. Running: npx supabase db push (to apply pending migrations)');
        console.log('2. Or manually in Supabase dashboard: ALTER TABLE users_profile ADD COLUMN date_of_birth date;');
    }
}

runFix();