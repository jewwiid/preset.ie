const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testRefundSimple() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🧪 SIMPLE REFUND TEST\n');
  console.log('=' .repeat(60));
  
  try {
    // Use admin user
    const adminUserId = '9696aa46-2664-4a35-824b-7749379c05be'; // Admin user ID
    
    // 1. Check current balance
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', adminUserId)
      .single();
    
    console.log(`Current admin balance: ${currentCredits.current_balance} credits`);
    
    // 2. Create a test task
    const { data: task } = await supabase
      .from('enhancement_tasks')
      .insert({
        user_id: adminUserId,
        api_task_id: 'simple-test-' + Date.now(),
        input_image_url: 'https://example.com/test.jpg',
        enhancement_type: 'upscale',
        prompt: 'Simple refund test',
        status: 'processing',
        provider: 'nanobanana'
      })
      .select()
      .single();
    
    console.log(`Created task: ${task.id}`);
    
    // 3. Simulate credit deduction
    await supabase
      .from('user_credits')
      .update({
        current_balance: currentCredits.current_balance - 1,
        consumed_this_month: currentCredits.consumed_this_month + 1
      })
      .eq('user_id', adminUserId);
    
    console.log(`Deducted 1 credit. New balance: ${currentCredits.current_balance - 1}`);
    
    // 4. Call refund function directly
    console.log('\nCalling refund function directly...');
    
    const { data: refundResult, error: refundError } = await supabase
      .rpc('process_credit_refund', {
        p_task_id: task.id,
        p_user_id: adminUserId,
        p_credits: 1,
        p_reason: 'internal_error'
      });
    
    if (refundError) {
      console.error('❌ Refund failed:', refundError);
      return;
    }
    
    console.log('✅ Refund function result:', refundResult);
    
    // 5. Check new balance
    const { data: newCredits } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', adminUserId)
      .single();
    
    console.log(`Balance after refund: ${newCredits.current_balance} credits`);
    
    if (newCredits.current_balance === currentCredits.current_balance) {
      console.log('✅ REFUND SUCCESSFUL! Credit returned.');
    } else {
      console.log('❌ Balance unchanged.');
    }
    
    // 6. Check audit log
    const { data: refundLog } = await supabase
      .from('refund_audit_log')
      .select('*')
      .eq('task_id', task.id)
      .single();
    
    if (refundLog) {
      console.log('\n✅ Refund in audit log:');
      console.log(`   Credits refunded: ${refundLog.credits_refunded}`);
      console.log(`   Platform loss: ${refundLog.platform_loss} NanoBanana credits`);
      console.log(`   Reason: ${refundLog.refund_reason}`);
    }
    
    // 7. Check task status
    const { data: updatedTask } = await supabase
      .from('enhancement_tasks')
      .select('refunded, refund_processed_at')
      .eq('id', task.id)
      .single();
    
    console.log(`\nTask marked as refunded: ${updatedTask.refunded}`);
    if (updatedTask.refund_processed_at) {
      console.log(`Refund processed at: ${new Date(updatedTask.refund_processed_at).toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testRefundSimple();