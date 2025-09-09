const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testManualRefund() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🧪 Testing Manual Refund Trigger\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Create a test user
    const testEmail = `test-manual-${Date.now()}@example.com`;
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true
    });
    
    if (userError) throw userError;
    console.log(`✅ Created test user: ${user.id}`);
    
    // 2. Give user credits
    await supabase
      .from('user_credits')
      .insert({
        user_id: user.id,
        current_balance: 10,
        consumed_this_month: 0,
        subscription_tier: 'free'
      });
    console.log('✅ Gave user 10 credits');
    
    // 3. Create a test task in processing state
    const { data: task } = await supabase
      .from('enhancement_tasks')
      .insert({
        user_id: user.id,
        api_task_id: 'manual-test-' + Date.now(),
        input_image_url: 'https://example.com/test.jpg',
        enhancement_type: 'upscale',
        prompt: 'Manual refund test',
        status: 'processing',
        provider: 'nanobanana'
      })
      .select()
      .single();
    
    console.log(`✅ Created task: ${task.id}`);
    
    // 4. Manually deduct a credit (simulate what happens normally)
    await supabase
      .from('user_credits')
      .update({
        current_balance: 9,
        consumed_this_month: 1
      })
      .eq('user_id', user.id);
    
    console.log('✅ Deducted 1 credit (balance now 9)');
    
    // 5. Check balance before failure
    const { data: beforeBalance } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();
    
    console.log(`\n📊 Balance BEFORE failure: ${beforeBalance.current_balance} credits`);
    
    // 6. Update task to failed status to trigger refund
    console.log('\n🔴 Marking task as failed with error_type...');
    
    const { error: updateError } = await supabase
      .from('enhancement_tasks')
      .update({
        status: 'failed',
        error_type: 'internal_error',
        error_message: 'Manual test failure',
        failed_at: new Date().toISOString()
      })
      .eq('id', task.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
    }
    
    // Wait for trigger to process
    console.log('⏳ Waiting for trigger to process refund...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 7. Check balance after failure
    const { data: afterBalance } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();
    
    console.log(`📊 Balance AFTER failure: ${afterBalance.current_balance} credits`);
    
    // 8. Check if refund was processed
    const wasRefunded = afterBalance.current_balance > beforeBalance.current_balance;
    if (wasRefunded) {
      console.log('✅ REFUND SUCCESSFUL! Credit was returned to user.');
    } else {
      console.log('❌ No refund detected.');
    }
    
    // 9. Check refund audit log
    const { data: refundLog } = await supabase
      .from('refund_audit_log')
      .select('*')
      .eq('task_id', task.id)
      .single();
    
    if (refundLog) {
      console.log('\n✅ Refund recorded in audit log:');
      console.log(`   Credits refunded: ${refundLog.credits_refunded}`);
      console.log(`   Reason: ${refundLog.refund_reason}`);
      console.log(`   Platform loss: ${refundLog.platform_loss} NanoBanana credits`);
    } else {
      console.log('\n❌ No refund in audit log');
    }
    
    // 10. Check task refund status
    const { data: updatedTask } = await supabase
      .from('enhancement_tasks')
      .select('status, error_type, refunded')
      .eq('id', task.id)
      .single();
    
    console.log('\n📋 Task final state:');
    console.log(`   Status: ${updatedTask.status}`);
    console.log(`   Error type: ${updatedTask.error_type}`);
    console.log(`   Refunded: ${updatedTask.refunded}`);
    
    // 11. Test calling the refund function directly
    console.log('\n🔧 Testing direct function call...');
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('process_credit_refund', {
        p_task_id: task.id,
        p_user_id: user.id,
        p_credits: 1,
        p_reason: 'internal_error'
      });
    
    if (functionError) {
      console.log('❌ Direct function call failed:', functionError.message);
    } else {
      console.log('✅ Direct function call result:', functionResult);
    }
    
    // Clean up
    await supabase.auth.admin.deleteUser(user.id);
    console.log('\n🧹 Test user cleaned up');
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY\n');
    
    if (wasRefunded && refundLog) {
      console.log('✅ TRIGGER-BASED REFUND WORKS!');
      console.log('The automatic refund system is operational.');
    } else {
      console.log('⚠️ TRIGGER-BASED REFUND NOT WORKING');
      console.log('\nPossible issues:');
      console.log('- Trigger not created properly');
      console.log('- Function not created properly');
      console.log('- RLS policies blocking execution');
      console.log('\nCheck Supabase logs for details.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testManualRefund();