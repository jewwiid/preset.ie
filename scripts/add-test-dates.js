const { createClient } = require('@supabase/supabase-js');

// Production Supabase instance
const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndAddTestDates() {
  console.log('Checking production database users...');
  
  try {
    // First check current users
    const { data: users, error: fetchError } = await supabase
      .from('users_profile')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name} (@${user.handle})`);
      console.log(`   - Date of birth: ${user.date_of_birth || 'NOT SET'}`);
      console.log(`   - Account status: ${user.account_status || 'NOT SET'}`);
      console.log(`   - Age verified: ${user.age_verified}`);
      console.log(`   - Subscription: ${user.subscription_tier}`);
      console.log('');
    });

    // Add missing columns if they don't exist
    console.log('Adding missing columns...');
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE users_profile 
          ADD COLUMN IF NOT EXISTS date_of_birth DATE,
          ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMP WITH TIME ZONE,
          ADD COLUMN IF NOT EXISTS verification_method TEXT,
          ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0;
        `
      });
      console.log('✅ Columns added successfully');
    } catch (columnError) {
      console.log('Note: Columns might already exist or function not available');
    }

    // Update users without date_of_birth with test dates
    const usersToUpdate = users.filter(user => !user.date_of_birth);
    
    if (usersToUpdate.length > 0) {
      console.log(`Updating ${usersToUpdate.length} users with test birth dates...`);
      
      const testDates = [
        '1995-03-15', // 29 years old
        '2000-07-22', // 24 years old  
        '1998-11-08', // 26 years old
        '2008-04-10', // 16 years old (minor)
        '1992-09-30', // 32 years old
        '1997-12-05', // 27 years old
        '2001-08-18', // 23 years old
        '1990-05-25', // 34 years old
      ];

      for (let i = 0; i < usersToUpdate.length && i < testDates.length; i++) {
        const user = usersToUpdate[i];
        const birthDate = testDates[i];
        
        // Calculate age
        const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
        const isAdult = age >= 18;
        
        const { error: updateError } = await supabase
          .from('users_profile')
          .update({
            date_of_birth: birthDate,
            account_status: age < 18 ? 'pending_verification' : 'active',
            age_verified: isAdult,
            age_verified_at: isAdult ? new Date().toISOString() : null,
            verification_method: isAdult ? 'self_attestation' : null
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Error updating ${user.display_name}:`, updateError);
        } else {
          console.log(`✅ Updated ${user.display_name} (@${user.handle}) - Age: ${age} years`);
        }
      }
    } else {
      console.log('All users already have birth dates set.');
    }

    // Show final results
    console.log('\n📊 Final user status:');
    const { data: finalUsers, error: finalError } = await supabase
      .from('users_profile')
      .select('display_name, handle, date_of_birth, account_status, age_verified')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!finalError && finalUsers) {
      finalUsers.forEach((user, index) => {
        const age = user.date_of_birth ? 
          Math.floor((new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
          'Unknown';
        console.log(`${index + 1}. ${user.display_name} (@${user.handle}) - Age: ${age}, Status: ${user.account_status}, Verified: ${user.age_verified}`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkAndAddTestDates().then(() => {
  console.log('\n✅ Script completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});