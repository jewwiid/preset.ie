#!/usr/bin/env node

// Test various refund scenarios
async function testRefundScenarios() {
  console.log('🧪 Testing Refund System - Multiple Scenarios\n');
  console.log('=' .repeat(60));
  
  const scenarios = [
    {
      name: '✅ Valid Refund - Internal Error',
      taskId: 'task-internal-' + Date.now(),
      userId: 'user-' + Date.now(),
      reason: 'internal_error',
      expectedRefund: true
    },
    {
      name: '✅ Valid Refund - Content Policy Violation',
      taskId: 'task-policy-' + Date.now(),
      userId: 'user-' + Date.now(),
      reason: 'content_policy_violation',
      expectedRefund: true
    },
    {
      name: '✅ Valid Refund - Generation Failed',
      taskId: 'task-failed-' + Date.now(),
      userId: 'user-' + Date.now(),
      reason: 'generation_failed',
      expectedRefund: true
    },
    {
      name: '✅ Valid Refund - Timeout',
      taskId: 'task-timeout-' + Date.now(),
      userId: 'user-' + Date.now(),
      reason: 'timeout',
      expectedRefund: true
    },
    {
      name: '❌ No Refund - Invalid Input',
      taskId: 'task-invalid-' + Date.now(),
      userId: 'user-' + Date.now(),
      reason: 'invalid_input',
      expectedRefund: false
    },
    {
      name: '❌ No Refund - Insufficient Credits',
      taskId: 'task-nocredits-' + Date.now(),
      userId: 'user-' + Date.now(),
      reason: 'insufficient_credits',
      expectedRefund: false
    },
    {
      name: '❌ No Refund - Rate Limit',
      taskId: 'task-ratelimit-' + Date.now(),
      userId: 'user-' + Date.now(),
      reason: 'rate_limit',
      expectedRefund: false
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    console.log('   Reason:', scenario.reason);
    
    try {
      const response = await fetch('http://localhost:3000/api/refund-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: scenario.taskId,
          userId: scenario.userId,
          reason: scenario.reason
        })
      });
      
      const result = await response.json();
      
      if (result.success === scenario.expectedRefund) {
        console.log('   ✅ Result: PASSED');
        if (result.success) {
          console.log(`   💰 Refunded: ${result.refund.credits_refunded} credit(s)`);
          console.log(`   📉 Platform loss: ${result.refund.platform_loss} NB credits`);
        } else {
          console.log(`   ℹ️  Message: ${result.message}`);
        }
      } else {
        console.log('   ❌ Result: FAILED');
        console.log('   Expected refund:', scenario.expectedRefund);
        console.log('   Got success:', result.success);
      }
      
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ All scenarios tested!\n');
  
  console.log('📊 Summary:');
  console.log('✅ Refundable reasons: internal_error, content_policy_violation, generation_failed, timeout');
  console.log('❌ Non-refundable reasons: invalid_input, insufficient_credits, rate_limit');
  console.log('\n💡 Credit ratio: 1 user credit = 4 NanoBanana credits');
  console.log('   When refunding 1 credit to user, platform loses 4 NB credits\n');
}

// Run the tests
testRefundScenarios().catch(console.error);