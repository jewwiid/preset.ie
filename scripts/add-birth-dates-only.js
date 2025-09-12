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

async function addBirthDates() {
  console.log('Adding birth dates to production users...');
  
  try {
    // Get all users
    const { data: users, error: fetchError } = await supabase
      .from('users_profile')
      .select('id, display_name, handle, date_of_birth')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    console.log(`Found ${users.length} users`);

    // Test birth dates - mix of adults and one minor for testing
    const testDates = [
      '1995-03-15', // 29 years old - Admin User
      '2000-07-22', // 24 years old
      '1998-11-08', // 26 years old  
      '1992-09-30', // 32 years old
      '1997-12-05', // 27 years old
      '2001-08-18', // 23 years old
      '1990-05-25', // 34 years old
      '1994-10-12', // 30 years old
      '1988-06-03', // 36 years old - Alex Rivera
      '2008-04-10', // 16 years old - Marcus Chen (minor for testing)
    ];

    // Update users with birth dates
    for (let i = 0; i < users.length && i < testDates.length; i++) {
      const user = users[i];
      const birthDate = testDates[i];
      
      if (user.date_of_birth) {
        console.log(`⏭️  Skipping ${user.display_name} - already has birth date`);
        continue;
      }
      
      // Calculate age
      const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
      
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({
          date_of_birth: birthDate
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Error updating ${user.display_name}:`, updateError);
      } else {
        console.log(`✅ Added birth date to ${user.display_name} (@${user.handle}) - Age: ${age} years`);
      }
    }

    console.log('\n📊 Updated users:');
    const { data: finalUsers, error: finalError } = await supabase
      .from('users_profile')
      .select('display_name, handle, date_of_birth')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!finalError && finalUsers) {
      finalUsers.forEach((user, index) => {
        const age = user.date_of_birth ? 
          Math.floor((new Date() - new Date(user.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
          'No date';
        console.log(`${index + 1}. ${user.display_name} (@${user.handle}) - Age: ${age}`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

addBirthDates().then(() => {
  console.log('\n✅ Birth dates added successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});