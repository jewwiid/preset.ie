#!/usr/bin/env node

// Simple test of refund functionality
async function testRefund() {
  console.log('🧪 Testing Refund System\n');
  console.log('=' .repeat(50));
  
  // Test data
  const testUserId = 'test-user-' + Date.now();
  const testTaskId = 'test-task-' + Date.now();
  
  console.log('\n1️⃣ Testing refund API endpoint...');
  console.log('   User ID:', testUserId);
  console.log('   Task ID:', testTaskId);
  
  try {
    // Call the refund API
    const response = await fetch('http://localhost:3000/api/test-refund', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        taskId: testTaskId,
        userId: testUserId,
        reason: 'internal_error'
      })
    });
    
    const result = await response.json();
    
    console.log('\n2️⃣ API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Refund processed successfully!');
      console.log('   Credits refunded:', result.refund.credits_refunded);
      console.log('   Platform loss:', result.refund.platform_loss);
      console.log('   New balance:', result.refund.new_balance);
    } else if (result.error) {
      console.log('\n⚠️  Refund failed:', result.error);
      if (result.details) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error calling API:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('Test complete!\n');
}

// Run the test
testRefund().catch(console.error);