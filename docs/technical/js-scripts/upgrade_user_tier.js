const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function upgradeUserTier() {
  console.log('🚀 Upgrading user tiers for testing...\n');
  console.log('=' .repeat(60));
  
  try {
    // Get users
    const { data: users, error: fetchError } = await supabase
      .from('users_profile')
      .select('id, user_id, display_name, handle, subscription_tier')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.log('❌ Error fetching users:', fetchError.message);
      return;
    }
    
    console.log(`Found ${users.length} users\n`);
    
    // Upgrade Sarah to Plus and Alex to Pro
    const upgrades = [
      { handle: 'sarah_photographer', newTier: 'PLUS', credits: 15 },
      { handle: 'alex_creative', newTier: 'PRO', credits: 30 }
    ];
    
    for (const upgrade of upgrades) {
      const user = users.find(u => u.handle === upgrade.handle);
      
      if (user) {
        // Update user profile tier
        const { error: profileError } = await supabase
          .from('users_profile')
          .update({ subscription_tier: upgrade.newTier })
          .eq('id', user.id);
        
        if (profileError) {
          console.log(`❌ Error upgrading ${user.display_name}:`, profileError.message);
          continue;
        }
        
        // Update user credits
        const { error: creditsError } = await supabase
          .from('user_credits')
          .upsert({
            user_id: user.user_id,
            subscription_tier: upgrade.newTier,
            monthly_allowance: upgrade.credits,
            current_balance: upgrade.credits,
            consumed_this_month: 0,
            last_reset_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        
        if (creditsError) {
          console.log(`❌ Error updating credits for ${user.display_name}:`, creditsError.message);
        } else {
          console.log(`✅ ${user.display_name} (@${user.handle}) upgraded to ${upgrade.newTier} with ${upgrade.credits} credits`);
        }
        
        // Record the upgrade transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: user.user_id,
            transaction_type: 'allocation',
            credits_used: upgrade.credits,
            description: `Upgraded to ${upgrade.newTier} tier - monthly allocation`,
            status: 'completed'
          });
      }
    }
    
    console.log('\n📊 Updated User Tiers:');
    console.log('=' .repeat(60));
    
    // Show final status
    const { data: finalUsers } = await supabase
      .from('users_profile')
      .select('display_name, handle, subscription_tier')
      .order('created_at', { ascending: false });
    
    const { data: finalCredits } = await supabase
      .from('user_credits')
      .select('user_id, current_balance, monthly_allowance');
    
    for (const user of finalUsers || []) {
      const credit = finalCredits?.find(c => c.user_id === users.find(u => u.handle === user.handle)?.user_id);
      console.log(`${user.display_name} (@${user.handle})`);
      console.log(`  Tier: ${user.subscription_tier}`);
      console.log(`  Credits: ${credit?.current_balance || 0}/${credit?.monthly_allowance || 0}`);
      console.log('');
    }
    
    console.log('✨ User tiers upgraded successfully!');
    console.log('\n📝 Testing Instructions:');
    console.log('1. Sign in as sarah_photographer (Plus tier)');
    console.log('2. Go to /credits/purchase to buy more credits');
    console.log('3. Or click "Buy more" in the moodboard builder');
    console.log('4. Pro users (alex_creative) can also purchase credits');
    console.log('5. Free users (marcus_model) cannot purchase credits');
    
  } catch (error) {
    console.error('❌ Upgrade failed:', error.message);
  }
}

upgradeUserTier();