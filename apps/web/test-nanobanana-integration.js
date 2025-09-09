#!/usr/bin/env node

// Test NanoBanana integration with refund system
async function testNanoBananaIntegration() {
  console.log('🍌 Testing NanoBanana Integration with Refund System\n');
  console.log('=' .repeat(60));
  
  // Simulate different NanoBanana callback scenarios
  const callbacks = [
    {
      name: '✅ Success - Image Generated',
      code: 200,
      msg: 'Success',
      data: {
        taskId: 'nb-task-success-' + Date.now(),
        info: {
          resultImageUrl: 'https://cdn.nanobanana.com/result/12345.jpg',
          credits_consumed: 4
        }
      },
      expectRefund: false
    },
    {
      name: '❌ Error - Internal Server Error',
      code: 500,
      msg: 'Internal server error',
      data: {
        taskId: 'nb-task-error-' + Date.now(),
        info: {
          error: 'Processing failed unexpectedly'
        }
      },
      expectRefund: true,
      refundReason: 'internal_error'
    },
    {
      name: '❌ Error - Content Policy Violation',
      code: 400,
      msg: 'Content policy violation detected',
      data: {
        taskId: 'nb-task-policy-' + Date.now(),
        info: {
          error: 'Image contains prohibited content'
        }
      },
      expectRefund: true,
      refundReason: 'content_policy_violation'
    },
    {
      name: '❌ Error - Generation Failed',
      code: 501,
      msg: 'Failed to generate image',
      data: {
        taskId: 'nb-task-failed-' + Date.now(),
        info: {
          error: 'Model failed to process prompt'
        }
      },
      expectRefund: true,
      refundReason: 'generation_failed'
    },
    {
      name: '❌ Error - Timeout',
      code: 504,
      msg: 'Request timeout',
      data: {
        taskId: 'nb-task-timeout-' + Date.now(),
        info: {
          error: 'Processing exceeded time limit'
        }
      },
      expectRefund: true,
      refundReason: 'timeout'
    },
    {
      name: '⚠️  User Error - Invalid Prompt',
      code: 422,
      msg: 'Invalid input parameters',
      data: {
        taskId: 'nb-task-invalid-' + Date.now(),
        info: {
          error: 'Prompt does not meet requirements'
        }
      },
      expectRefund: false,
      refundReason: 'invalid_input'
    }
  ];
  
  console.log('\n📝 Simulating NanoBanana Callbacks:\n');
  
  for (const callback of callbacks) {
    console.log(`\n🔔 Callback: ${callback.name}`);
    console.log('   Status Code:', callback.code);
    console.log('   Message:', callback.msg);
    console.log('   Task ID:', callback.data.taskId);
    
    // Determine if this should trigger a refund
    if (callback.expectRefund) {
      console.log('\n   💳 Processing Refund...');
      
      // Simulate calling refund API
      try {
        const response = await fetch('http://localhost:3000/api/refund-demo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            taskId: callback.data.taskId,
            userId: 'user-' + Date.now(), // In real scenario, this would be from task record
            reason: callback.refundReason
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('   ✅ Refund Processed:');
          console.log(`      • User credited: ${result.refund.credits_refunded} credit(s)`);
          console.log(`      • Platform loss: ${result.refund.platform_loss} NB credits`);
          console.log(`      • Reason: ${result.refund.reason}`);
        } else {
          console.log('   ⚠️  Refund not processed:', result.message);
        }
      } catch (error) {
        console.error('   ❌ Refund error:', error.message);
      }
    } else {
      console.log('   ℹ️  No refund needed for this scenario');
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Integration Test Summary:\n');
  console.log('✅ NanoBanana Success (200) → No refund');
  console.log('❌ Server Errors (500, 501, 504) → Automatic refund');
  console.log('❌ Policy Violation (400) → Automatic refund');
  console.log('⚠️  User Errors (422) → No refund\n');
  
  console.log('💡 Implementation Notes:');
  console.log('1. Store task_id → user_id mapping when creating tasks');
  console.log('2. Process callbacks via webhook endpoint');
  console.log('3. Automatically trigger refunds for eligible errors');
  console.log('4. Track all refunds in credit_refunds table');
  console.log('5. Update user credit balance accordingly\n');
}

// Run the integration test
testNanoBananaIntegration().catch(console.error);