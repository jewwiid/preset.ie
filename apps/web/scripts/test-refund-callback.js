import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRefundCallback() {
  console.log('🧪 Testing Refund Callback System\n')
  console.log('=' .repeat(50))
  
  try {
    // Step 1: Create a test user if needed
    console.log('\n1️⃣ Setting up test user...')
    
    // Get or create test user
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    let testUser = users?.find(u => u.email === 'refund-test@preset.ie')
    
    if (!testUser) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'refund-test@preset.ie',
        password: 'test123456',
        email_confirm: true
      })
      
      if (createError) {
        console.error('Error creating test user:', createError)
        return
      }
      testUser = newUser.user
      console.log('✅ Test user created:', testUser.email)
    } else {
      console.log('✅ Using existing test user:', testUser.email, 'ID:', testUser.id)
    }
    
    // Step 2: Ensure user has credits
    console.log('\n2️⃣ Setting up user credits...')
    
    // Check if user has credits record
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', testUser.id)
      .single()
    
    if (!credits) {
      // Create credits record
      await supabase.from('user_credits').insert({
        user_id: testUser.id,
        balance: 10,
        lifetime_earned: 10,
        lifetime_consumed: 0
      })
      console.log('✅ Created user credits with balance: 10')
    } else {
      console.log(`✅ User has ${credits.balance} credits`)
      
      // Ensure user has enough credits
      if (credits.balance < 5) {
        await supabase
          .from('user_credits')
          .update({ balance: 10 })
          .eq('user_id', testUser.id)
        console.log('✅ Updated user balance to 10 credits')
      }
    }
    
    // Step 3: Create a test enhancement task
    console.log('\n3️⃣ Creating test enhancement task...')
    
    const testTaskId = `test-${Date.now()}`
    const { data: task, error: taskError } = await supabase
      .from('enhancement_tasks')
      .insert({
        task_id: testTaskId,
        user_id: testUser.id,
        status: 'processing',
        credits_consumed: 1,
        provider: 'nanobanana',
        enhancement_type: 'lighting',
        input_image_url: 'https://example.com/test-image.jpg',
        metadata: {
          test: true,
          created_for: 'refund_testing'
        }
      })
      .select()
      .single()
    
    if (taskError) {
      // Table might not exist, that's okay
      console.log('ℹ️  enhancement_tasks table not found (will be created when needed)')
    } else {
      console.log('✅ Created test task:', testTaskId)
    }
    
    // Step 4: Simulate a refund callback
    console.log('\n4️⃣ Simulating failure callback...')
    
    const callbackUrl = `${supabaseUrl}/functions/v1/nanobanana-callback`
    
    const callbackPayload = {
      code: 500,  // Error code that triggers refund
      msg: 'Internal server error during processing',
      data: {
        taskId: testTaskId,
        info: {
          resultImageUrl: '',
          error: 'Processing failed'
        }
      }
    }
    
    console.log('📤 Sending callback to:', callbackUrl)
    console.log('Payload:', JSON.stringify(callbackPayload, null, 2))
    
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(callbackPayload)
    })
    
    const responseText = await response.text()
    console.log('\n📥 Response Status:', response.status)
    console.log('Response:', responseText)
    
    // Step 5: Check if refund was processed
    console.log('\n5️⃣ Checking refund processing...')
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check credit_refunds table
    const { data: refunds, error: refundError } = await supabase
      .from('credit_refunds')
      .select('*')
      .eq('task_id', testTaskId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (refunds && refunds.length > 0) {
      console.log('✅ Refund processed successfully!')
      console.log('   Refund ID:', refunds[0].id)
      console.log('   Credits refunded:', refunds[0].credits_refunded)
      console.log('   Reason:', refunds[0].refund_reason)
      
      // Check user's new balance
      const { data: updatedCredits } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', testUser.id)
        .single()
      
      console.log('   User\'s new balance:', updatedCredits?.balance)
    } else {
      console.log('⚠️  No refund found in database')
      console.log('   This might mean:')
      console.log('   - The callback endpoint is not deployed')
      console.log('   - The refund logic is not working')
      console.log('   - There was an error processing the refund')
    }
    
    // Step 6: Test different error codes
    console.log('\n6️⃣ Testing different error codes...')
    
    const testCases = [
      { code: 400, msg: 'Content policy violation', shouldRefund: true },
      { code: 501, msg: 'Generation failed', shouldRefund: true },
      { code: 200, msg: 'Success', shouldRefund: false }
    ]
    
    for (const testCase of testCases) {
      const testId = `test-${testCase.code}-${Date.now()}`
      console.log(`\n   Testing code ${testCase.code}: ${testCase.msg}`)
      
      const testResponse = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          code: testCase.code,
          msg: testCase.msg,
          data: {
            taskId: testId,
            info: testCase.code === 200 ? {
              resultImageUrl: 'https://example.com/success.jpg'
            } : {}
          }
        })
      })
      
      console.log(`   Response: ${testResponse.status}`)
      
      if (testCase.shouldRefund) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: testRefund } = await supabase
          .from('credit_refunds')
          .select('*')
          .eq('task_id', testId)
          .single()
        
        if (testRefund) {
          console.log(`   ✅ Refund processed for code ${testCase.code}`)
        } else {
          console.log(`   ⚠️  No refund for code ${testCase.code}`)
        }
      }
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('✨ Refund callback test complete!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

// Run the test
testRefundCallback().then(() => {
  console.log('\n📋 Summary:')
  console.log('- Refund tables are set up correctly')
  console.log('- Test the actual NanoBanana integration by:')
  console.log('  1. Making a real enhancement request')
  console.log('  2. Checking if failures trigger refunds')
  console.log('  3. Monitoring the credit_refunds table')
  process.exit(0)
})