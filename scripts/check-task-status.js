const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const taskId = process.argv[2];

if (!taskId) {
  console.error('Usage: node check-task-status.js <task-id>');
  process.exit(1);
}

async function checkTaskStatus() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Check task
  const { data: task } = await supabase
    .from('enhancement_tasks')
    .select('*')
    .eq('id', taskId)
    .single();
  
  if (task) {
    console.log('Task Details:');
    console.log('  ID:', task.id);
    console.log('  Status:', task.status);
    console.log('  Error Type:', task.error_type || 'not set');
    console.log('  Error Message:', task.error_message || 'none');
    console.log('  Refunded:', task.refunded || false);
    console.log('  Failed At:', task.failed_at || 'not set');
    
    // Check refund log
    const { data: refund } = await supabase
      .from('refund_audit_log')
      .select('*')
      .eq('task_id', taskId)
      .single();
    
    if (refund) {
      console.log('\nRefund Details:');
      console.log('  Credits Refunded:', refund.credits_refunded);
      console.log('  Reason:', refund.refund_reason);
      console.log('  Platform Loss:', refund.platform_loss);
      console.log('  Created:', refund.created_at);
    } else {
      console.log('\nNo refund found for this task');
    }
    
    // Check user balance
    const { data: credits } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', task.user_id)
      .single();
    
    if (credits) {
      console.log('\nUser Balance:', credits.current_balance);
    }
  } else {
    console.log('Task not found');
  }
}

checkTaskStatus();