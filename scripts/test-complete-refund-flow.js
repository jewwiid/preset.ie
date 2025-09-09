const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin user credentials
const ADMIN_EMAIL = 'admin@preset.ie';
const ADMIN_PASSWORD = 'admin123456';

async function testCompleteRefundFlow() {
  console.log('🧪 TESTING COMPLETE REFUND FLOW\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Sign in as admin
    console.log('\n1️⃣ Signing in as admin...');
    const { data: { user: adminUser }, error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (signInError) {
      console.log('⚠️ Admin sign-in failed. Creating test user instead...');
      
      // Create a test user
      const testEmail = `test-refund-${Date.now()}@example.com`;
      const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        email_confirm: true
      });
      
      if (userError) throw userError;
      var testUser = user;
      console.log(`✅ Created test user: ${testUser.id}`);
    } else {
      var testUser = adminUser;
      console.log(`✅ Signed in as: ${adminUser.email}`);
    }
    
    // 2. Check/Give user credits
    console.log('\n2️⃣ Setting up user credits...');
    
    // Check existing balance
    const { data: existingCredits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', testUser.id)
      .single();
    
    if (existingCredits) {
      console.log(`   Current balance: ${existingCredits.current_balance} credits`);
      if (existingCredits.current_balance < 10) {
        // Top up credits
        await supabase
          .from('user_credits')
          .update({ 
            current_balance: existingCredits.current_balance + 10 
          })
          .eq('user_id', testUser.id);
        console.log(`   Added 10 credits. New balance: ${existingCredits.current_balance + 10}`);
      }
    } else {
      // Create credits record
      await supabase
        .from('user_credits')
        .insert({
          user_id: testUser.id,
          current_balance: 10,
          consumed_this_month: 0,
          subscription_tier: 'free'
        });
      console.log('   Created credit balance: 10 credits');
    }
    
    // 3. Create a test enhancement task
    console.log('\n3️⃣ Creating test enhancement task...');
    
    const { data: task, error: taskError } = await supabase
      .from('enhancement_tasks')
      .insert({
        user_id: testUser.id,
        api_task_id: 'test-refund-' + Date.now(),
        input_image_url: 'https://example.com/test-image.jpg',
        enhancement_type: 'upscale',
        prompt: 'Test enhancement for refund system',
        status: 'processing',
        provider: 'nanobanana'
      })
      .select()
      .single();
    
    if (taskError) throw taskError;
    console.log(`✅ Created task: ${task.id}`);
    
    // 4. Deduct credits (simulate what happens in real enhancement)
    console.log('\n4️⃣ Simulating credit deduction...');
    
    const { data: beforeBalance } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', testUser.id)
      .single();
    
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('consumed_this_month')
      .eq('user_id', testUser.id)
      .single();
    
    await supabase
      .from('user_credits')
      .update({
        current_balance: beforeBalance.current_balance - 1,
        consumed_this_month: (currentCredits?.consumed_this_month || 0) + 1
      })
      .eq('user_id', testUser.id);
    
    console.log(`   Balance after deduction: ${beforeBalance.current_balance - 1} credits`);
    
    // 5. Test callback endpoint with failure
    console.log('\n5️⃣ Testing callback endpoint with failure...');
    
    const callbackUrl = `${supabaseUrl}/functions/v1/nanobanana-callback`;
    const failurePayload = {
      code: 500,  // Internal error - should trigger refund
      msg: 'Internal server error during enhancement',
      data: {
        taskId: task.id,
        info: {
          resultImageUrl: ''  // Empty on failure
        }
      }
    };
    
    console.log(`   Sending failure callback to: ${callbackUrl}`);
    console.log(`   Error type: internal_error (code 500)`);
    
    const callbackResponse = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(failurePayload)
    });
    
    const callbackResult = await callbackResponse.json();
    console.log(`   Callback response: ${JSON.stringify(callbackResult)}`);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Check if task was marked as failed
    console.log('\n6️⃣ Checking task status...');
    
    const { data: updatedTask } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('id', task.id)
      .single();
    
    console.log(`   Task status: ${updatedTask.status}`);
    console.log(`   Error type: ${updatedTask.error_type || 'not set'}`);
    console.log(`   Refunded: ${updatedTask.refunded || false}`);
    
    // 7. Check user balance for refund
    console.log('\n7️⃣ Checking user balance for refund...');
    
    const { data: afterBalance } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', testUser.id)
      .single();
    
    console.log(`   Balance before failure: ${beforeBalance.current_balance - 1} credits`);
    console.log(`   Balance after refund: ${afterBalance.current_balance} credits`);
    
    const wasRefunded = afterBalance.current_balance === beforeBalance.current_balance;
    if (wasRefunded) {
      console.log('   ✅ REFUND SUCCESSFUL! Credit was returned to user.');
    } else {
      console.log('   ❌ No refund detected. Balance unchanged.');
    }
    
    // 8. Check refund audit log
    console.log('\n8️⃣ Checking refund audit log...');
    
    const { data: refundLog } = await supabase
      .from('refund_audit_log')
      .select('*')
      .eq('task_id', task.id)
      .single();
    
    if (refundLog) {
      console.log('✅ Refund recorded in audit log:');
      console.log(`   - Credits refunded: ${refundLog.credits_refunded}`);
      console.log(`   - Reason: ${refundLog.refund_reason}`);
      console.log(`   - Platform loss: ${refundLog.platform_loss} NanoBanana credits`);
      console.log(`   - Previous balance: ${refundLog.previous_balance}`);
      console.log(`   - New balance: ${refundLog.new_balance}`);
    } else {
      console.log('❌ No refund found in audit log');
    }
    
    // 9. Check credit transaction
    console.log('\n9️⃣ Checking credit transactions...');
    
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('api_request_id', task.id)
      .order('created_at', { ascending: false });
    
    if (transactions && transactions.length > 0) {
      console.log(`Found ${transactions.length} transaction(s):`);
      transactions.forEach(t => {
        const type = t.transaction_type === 'refund' ? '💚 REFUND' : '💰 CHARGE';
        console.log(`   ${type}: ${t.credits_used} credits (${t.status})`);
      });
    }
    
    // 10. Test different error codes
    console.log('\n🔟 Testing different error codes...');
    
    const errorTests = [
      { code: 400, type: 'content_policy_violation', shouldRefund: true },
      { code: 500, type: 'internal_error', shouldRefund: true },
      { code: 501, type: 'generation_failed', shouldRefund: true }
    ];
    
    for (const test of errorTests) {
      const { data: policies } = await supabase
        .from('refund_policies')
        .select('*')
        .eq('error_type', test.type)
        .single();
      
      if (policies) {
        const icon = policies.should_refund ? '✅' : '❌';
        console.log(`   ${icon} Code ${test.code} (${test.type}): ${policies.should_refund ? `Refund ${policies.refund_percentage}%` : 'No refund'}`);
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY\n');
    
    const allPassed = wasRefunded && refundLog;
    
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\nThe refund system is working correctly:');
      console.log('- Callback endpoint processes failures');
      console.log('- Users receive automatic refunds');
      console.log('- Refunds are tracked in audit log');
      console.log('- Platform losses are recorded');
    } else {
      console.log('⚠️ SOME TESTS FAILED');
      console.log('\nIssues found:');
      if (!wasRefunded) console.log('- User was not refunded');
      if (!refundLog) console.log('- Refund not recorded in audit log');
      console.log('\nPossible causes:');
      console.log('- Refund tables not created (run migration first)');
      console.log('- Callback endpoint not processing correctly');
      console.log('- Refund policies not configured');
    }
    
    console.log('\n' + '=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.log('\nMake sure:');
    console.log('1. Refund migration has been run');
    console.log('2. Edge function is deployed');
    console.log('3. Database tables exist');
    process.exit(1);
  }
}

// Run the test
testCompleteRefundFlow();