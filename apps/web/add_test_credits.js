import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestCredits() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.users.length} users`);

    // Add credits for each user
    for (const user of users.users) {
      console.log(`\nProcessing user: ${user.email}`);
      
      // Check if user_credits record exists
      const { data: existingCredits, error: checkError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`Error checking credits for ${user.email}:`, checkError);
        continue;
      }

      if (existingCredits) {
        // Update existing credits
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            current_balance: 100,
            monthly_allowance: 100,
            last_refreshed: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`Error updating credits for ${user.email}:`, updateError);
        } else {
          console.log(`✅ Updated credits for ${user.email} to 100`);
        }
      } else {
        // Create new credits record
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            current_balance: 100,
            monthly_allowance: 100,
            last_refreshed: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Error creating credits for ${user.email}:`, insertError);
        } else {
          console.log(`✅ Created credits for ${user.email} with balance of 100`);
        }
      }

      // Log a credit transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: 100,
          type: 'credit',
          description: 'Test credits for development',
          metadata: { source: 'development_script' },
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error(`Error logging transaction for ${user.email}:`, transactionError);
      }
    }

    // Also add platform credits for NanoBanana
    const { data: platformCredits, error: platformCheckError } = await supabase
      .from('platform_credits')
      .select('*')
      .eq('provider', 'nanobanana')
      .single();

    if (platformCheckError && platformCheckError.code !== 'PGRST116') {
      console.error('Error checking platform credits:', platformCheckError);
    }

    if (platformCredits) {
      const { error: updatePlatformError } = await supabase
        .from('platform_credits')
        .update({
          available_credits: 1000,
          last_recharged: new Date().toISOString()
        })
        .eq('provider', 'nanobanana');

      if (updatePlatformError) {
        console.error('Error updating platform credits:', updatePlatformError);
      } else {
        console.log('\n✅ Updated NanoBanana platform credits to 1000');
      }
    } else {
      const { error: insertPlatformError } = await supabase
        .from('platform_credits')
        .insert({
          provider: 'nanobanana',
          available_credits: 1000,
          last_recharged: new Date().toISOString(),
          last_used: null
        });

      if (insertPlatformError) {
        console.error('Error creating platform credits:', insertPlatformError);
      } else {
        console.log('\n✅ Created NanoBanana platform credits with 1000 credits');
      }
    }

    console.log('\n✨ Test credits added successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addTestCredits();