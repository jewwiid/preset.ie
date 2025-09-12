const { createClient } = require('@supabase/supabase-js');

// Local Supabase instance
const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  {
    email: 'john.doe@example.com',
    password: 'Test123!@#',
    display_name: 'John Doe',
    handle: 'johndoe',
    date_of_birth: '1995-03-15', // 29 years old
    account_status: 'active',
    role_flags: ['CONTRIBUTOR']
  },
  {
    email: 'jane.smith@example.com',
    password: 'Test123!@#',
    display_name: 'Jane Smith',
    handle: 'janesmith',
    date_of_birth: '2000-07-22', // 24 years old
    account_status: 'active',
    role_flags: ['TALENT']
  },
  {
    email: 'mike.jones@example.com',
    password: 'Test123!@#',
    display_name: 'Mike Jones',
    handle: 'mikejones',
    date_of_birth: '1998-11-08', // 26 years old
    account_status: 'active',
    role_flags: ['CONTRIBUTOR', 'TALENT']
  },
  {
    email: 'emily.young@example.com',
    password: 'Test123!@#',
    display_name: 'Emily Young',
    handle: 'emilyyoung',
    date_of_birth: '2008-04-10', // 16 years old (minor for testing)
    account_status: 'pending_verification',
    role_flags: ['TALENT']
  },
  {
    email: 'admin@preset.ie',
    password: 'Admin123!@#',
    display_name: 'Admin User',
    handle: 'admin',
    date_of_birth: '1992-09-30', // 32 years old
    account_status: 'active',
    role_flags: ['ADMIN']
  }
];

async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const userData of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`Error creating auth user ${userData.email}:`, authError);
        continue;
      }

      console.log(`Created auth user: ${userData.email}`);

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .insert({
          user_id: authData.user.id,
          display_name: userData.display_name,
          handle: userData.handle,
          date_of_birth: userData.date_of_birth,
          account_status: userData.account_status,
          role_flags: userData.role_flags,
          age_verified: userData.account_status === 'active',
          age_verified_at: userData.account_status === 'active' ? new Date().toISOString() : null,
          verification_method: userData.account_status === 'active' ? 'self_attestation' : null,
          city: 'Dublin',
          country: 'Ireland',
          bio: `Test user profile for ${userData.display_name}`,
          verified_id: userData.role_flags.includes('ADMIN')
        });

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError);
        continue;
      }

      console.log(`Created profile for: ${userData.display_name}`);
      
      // Calculate and display age
      const birthDate = new Date(userData.date_of_birth);
      const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      console.log(`  - Age: ${age} years old`);
      console.log(`  - Status: ${userData.account_status}`);
      console.log(`  - Roles: ${userData.role_flags.join(', ')}`);
      
    } catch (error) {
      console.error(`Unexpected error for ${userData.email}:`, error);
    }
  }

  console.log('\n✅ Test users created successfully!');
  console.log('\nYou can now sign in with:');
  testUsers.forEach(user => {
    console.log(`  - ${user.email} / ${user.password}`);
  });
}

createTestUsers().then(() => {
  console.log('\nScript completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});