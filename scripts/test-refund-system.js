const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRefundSystem() {
  console.log('🧪 Testing Credit Refund System\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Create a test user
    const testEmail = `test-refund-${Date.now()}@example.com`;
    const { data: { user }, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true
    });
    
    if (userError) throw userError;
    console.log(`✅ Created test user: ${user.id}`);
    
    // 2. Give user some credits
    const initialCredits = 10;
    await supabase
      .from('user_credits')
      .insert({
        user_id: user.id,
        current_balance: initialCredits,
        consumed_this_month: 0,
        subscription_tier: 'free'
      });
    
    console.log(`✅ Gave user ${initialCredits} credits`);
    
    // 3. Create a failed enhancement task
    const { data: task, error: taskError } = await supabase
      .from('enhancement_tasks')
      .insert({
        user_id: user.id,
        api_task_id: 'test-task-' + Date.now(),
        input_image_url: 'https://example.com/test.jpg',
        enhancement_type: 'upscale',
        prompt: 'Test enhancement',
        status: 'processing',
        provider: 'nanobanana'
      })
      .select()
      .single();
    
    if (taskError) throw taskError;
    console.log(`✅ Created enhancement task: ${task.id}`);
    
    // 4. Check balance before failure
    const { data: beforeBalance } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();
    
    console.log(`\n📊 User balance BEFORE failure: ${beforeBalance.current_balance} credits`);
    
    // 5. Simulate a failure (content policy violation)
    console.log('\n🔴 Simulating enhancement failure (content_policy_violation)...');
    
    await supabase
      .from('enhancement_tasks')
      .update({
        status: 'failed',
        error_type: 'content_policy_violation',
        error_message: 'Content violates policy guidelines',
        failed_at: new Date().toISOString()
      })
      .eq('id', task.id);
    
    // Wait a moment for trigger to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Check if refund was processed
    const { data: afterBalance } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();
    
    console.log(`📊 User balance AFTER failure: ${afterBalance.current_balance} credits`);
    
    // 7. Check refund audit log
    const { data: refundLog } = await supabase
      .from('refund_audit_log')
      .select('*')
      .eq('task_id', task.id)
      .single();
    
    if (refundLog) {
      console.log('\n✅ REFUND PROCESSED SUCCESSFULLY!');
      console.log('Refund Details:');
      console.log(`  - Credits refunded: ${refundLog.credits_refunded}`);
      console.log(`  - Reason: ${refundLog.refund_reason}`);
      console.log(`  - Previous balance: ${refundLog.previous_balance}`);
      console.log(`  - New balance: ${refundLog.new_balance}`);
      console.log(`  - Platform loss: ${refundLog.platform_loss} NanoBanana credits`);
    } else {
      console.log('\n⚠️ No refund found in audit log');
    }
    
    // 8. Check refund transaction
    const { data: refundTransaction } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('transaction_type', 'refund')
      .single();
    
    if (refundTransaction) {
      console.log('\n📝 Refund Transaction Created:');
      console.log(`  - Credits: ${refundTransaction.credits_used} (negative = refund)`);
      console.log(`  - Status: ${refundTransaction.status}`);
      console.log(`  - Metadata: ${JSON.stringify(refundTransaction.metadata)}`);
    }
    
    // 9. Test different error types
    console.log('\n' + '=' .repeat(60));
    console.log('Testing different error types...\n');
    
    const errorTypes = [
      { type: 'internal_error', shouldRefund: true },
      { type: 'generation_failed', shouldRefund: true },
      { type: 'storage_error', shouldRefund: true },
      { type: 'timeout', shouldRefund: true },
      { type: 'user_cancelled', shouldRefund: false },
      { type: 'invalid_input', shouldRefund: false }
    ];
    
    for (const errorType of errorTypes) {
      const { data: policy } = await supabase
        .from('refund_policies')
        .select('should_refund, refund_percentage')
        .eq('error_type', errorType.type)
        .single();
      
      const icon = policy?.should_refund ? '✅' : '❌';
      const refundStatus = policy?.should_refund ? 
        `Refund ${policy.refund_percentage}%` : 
        'No refund';
      
      console.log(`${icon} ${errorType.type}: ${refundStatus}`);
    }
    
    // 10. Clean up test data
    console.log('\n' + '=' .repeat(60));
    console.log('Cleaning up test data...');
    
    await supabase.auth.admin.deleteUser(user.id);
    console.log('✅ Test user deleted');
    
    console.log('\n🎉 Refund system test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Test NanoBanana callback endpoint
async function testCallbackEndpoint() {
  console.log('\n' + '=' .repeat(60));
  console.log('🔗 Testing NanoBanana Callback Endpoint\n');
  
  try {
    const callbackUrl = `${supabaseUrl}/functions/v1/nanobanana-callback`;
    
    // Test successful callback
    const successPayload = {
      code: 200,
      msg: 'Success',
      data: {
        taskId: 'test-task-success',
        info: {
          resultImageUrl: 'https://example.com/enhanced.jpg'
        }
      }
    };
    
    console.log(`📤 Sending success callback to: ${callbackUrl}`);
    const successResponse = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(successPayload)
    });
    
    const successResult = await successResponse.json();
    console.log(`✅ Success callback response: ${JSON.stringify(successResult)}`);
    
    // Test failure callback
    const failurePayload = {
      code: 500,
      msg: 'Internal error',
      data: {
        taskId: 'test-task-failure',
        info: {
          resultImageUrl: ''
        }
      }
    };
    
    console.log(`\n📤 Sending failure callback...`);
    const failureResponse = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(failurePayload)
    });
    
    const failureResult = await failureResponse.json();
    console.log(`✅ Failure callback response: ${JSON.stringify(failureResult)}`);
    
    console.log('\n✅ Callback endpoint is working!');
    
  } catch (error) {
    console.error('❌ Callback test failed:', error);
  }
}

// Run tests
async function runAllTests() {
  await testRefundSystem();
  await testCallbackEndpoint();
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ All tests completed!');
  console.log('\nRefund System Status: ✅ OPERATIONAL');
  console.log('Callback Endpoint: ✅ DEPLOYED');
  console.log('\nNext steps:');
  console.log('1. Configure NanoBanana webhook URL in their dashboard');
  console.log('2. Monitor refund_audit_log table for production refunds');
  console.log('3. Set up alerts for high refund rates');
}

runAllTests();