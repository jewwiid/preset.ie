const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersProfileSchema() {
    console.log('🔍 Checking users_profile table schema...\n');
    
    try {
        // Get a sample record to see the current structure
        const { data: profileData, error: profileError } = await supabase
            .from('users_profile')
            .select('*')
            .limit(1);
            
        if (profileError) {
            console.log('❌ Error accessing users_profile:', profileError.message);
            return;
        }

        if (profileData && profileData.length > 0) {
            console.log('✅ users_profile table exists');
            console.log('📊 Current columns:', Object.keys(profileData[0]));
            console.log('📝 Sample record structure:');
            
            const sample = profileData[0];
            Object.keys(sample).forEach(key => {
                const value = sample[key];
                const type = typeof value;
                console.log(`  - ${key}: ${type} ${type === 'object' && value !== null ? `(${Array.isArray(value) ? 'array' : 'object'})` : ''}`);
            });
        } else {
            console.log('✅ users_profile table exists but is empty');
        }

        // Check if date_of_birth column specifically exists by trying to select it
        console.log('\n🧪 Testing date_of_birth column access...');
        const { data: dobTest, error: dobError } = await supabase
            .from('users_profile')
            .select('date_of_birth')
            .limit(1);

        if (dobError) {
            console.log('❌ date_of_birth column missing:', dobError.message);
            console.log('🔧 Need to add date_of_birth column to users_profile table');
        } else {
            console.log('✅ date_of_birth column exists');
            console.log('📊 Sample date_of_birth values:', dobTest);
        }

        // Check what migrations might be relevant
        console.log('\n📋 Looking for date_of_birth related migrations...');
        const migrations = [
            'add_missing_date_of_birth_column.sql',
            'enhanced_profile_fields.sql', 
            'enhanced_age_verification.sql'
        ];

        for (const migration of migrations) {
            try {
                const fs = require('fs');
                const path = require('path');
                const migrationPath = path.join('supabase/migrations');
                const files = fs.readdirSync(migrationPath).filter(f => f.includes(migration.replace('.sql', '')));
                
                if (files.length > 0) {
                    console.log(`✅ Found migration: ${files[0]}`);
                } else {
                    console.log(`❌ Missing migration: ${migration}`);
                }
            } catch (err) {
                console.log(`⚠️  Could not check migration: ${migration}`);
            }
        }

    } catch (error) {
        console.error('🚨 Unexpected error:', error);
    }
}

checkUsersProfileSchema();