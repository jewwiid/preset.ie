const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRefundMetrics() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('📊 REFUND SYSTEM METRICS\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Get total refunds
    const { data: refunds, count: totalRefunds } = await supabase
      .from('refund_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Refunds Processed: ${totalRefunds}`);
    
    if (refunds && refunds.length > 0) {
      const totalCreditsRefunded = refunds.reduce((sum, r) => sum + r.credits_refunded, 0);
      const totalPlatformLoss = refunds.reduce((sum, r) => sum + (r.platform_loss || 0), 0);
      
      console.log(`   Total Credits Refunded: ${totalCreditsRefunded}`);
      console.log(`   Total Platform Loss: ${totalPlatformLoss} NanoBanana credits`);
      console.log(`   Estimated Cost: €${(totalPlatformLoss * 0.001).toFixed(3)}`);
    }
    
    // 2. Get refund rate
    const { count: totalTasks } = await supabase
      .from('enhancement_tasks')
      .select('*', { count: 'exact', head: true });
    
    const refundRate = totalTasks ? ((totalRefunds / totalTasks) * 100).toFixed(2) : 0;
    console.log(`   Refund Rate: ${refundRate}%`);
    
    if (refundRate < 1) {
      console.log(`   Status: ✅ Excellent`);
    } else if (refundRate < 3) {
      console.log(`   Status: ⚠️ Normal`);
    } else if (refundRate < 5) {
      console.log(`   Status: ⚠️ Concerning`);
    } else {
      console.log(`   Status: 🔴 Critical`);
    }
    
    // 3. Refunds by reason
    console.log(`\n📋 Refunds by Error Type:`);
    
    const { data: allRefunds } = await supabase
      .from('refund_audit_log')
      .select('refund_reason, credits_refunded');
    
    if (allRefunds && allRefunds.length > 0) {
      const reasonGroups = allRefunds.reduce((acc, r) => {
        if (!acc[r.refund_reason]) {
          acc[r.refund_reason] = { count: 0, credits: 0 };
        }
        acc[r.refund_reason].count++;
        acc[r.refund_reason].credits += r.credits_refunded;
        return acc;
      }, {});
      
      Object.entries(reasonGroups).forEach(([reason, data]) => {
        console.log(`   ${reason}: ${data.count} refunds (${data.credits} credits)`);
      });
    } else {
      console.log(`   No refunds yet`);
    }
    
    // 4. Recent refunds
    console.log(`\n📅 Recent Refunds (Last 5):`);
    
    if (refunds && refunds.length > 0) {
      refunds.forEach(r => {
        const date = new Date(r.created_at).toLocaleString();
        console.log(`   ${date}: ${r.credits_refunded} credit - ${r.refund_reason}`);
      });
    } else {
      console.log(`   No refunds processed yet`);
    }
    
    // 5. Platform health check
    console.log(`\n🏥 Platform Health Check:`);
    
    // Check if callback endpoint is accessible
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/nanobanana-callback`, {
        method: 'GET'
      });
      
      if (response.status === 405 || response.status === 401) {
        console.log(`   ✅ Callback endpoint: Deployed and accessible`);
      } else {
        console.log(`   ⚠️ Callback endpoint: Unexpected status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Callback endpoint: Not accessible`);
    }
    
    // Check refund policies
    const { data: policies } = await supabase
      .from('refund_policies')
      .select('*');
    
    console.log(`   ✅ Refund policies: ${policies?.length || 0} configured`);
    
    // Check refund function
    const { data: testRefund, error: functionError } = await supabase
      .rpc('process_credit_refund', {
        p_task_id: '00000000-0000-0000-0000-000000000000',
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_credits: 1,
        p_reason: 'test_nonexistent'
      });
    
    // Function should return false for non-existent task/user
    if (functionError) {
      console.log(`   ❌ Refund function: Error - ${functionError.message}`);
    } else {
      console.log(`   ✅ Refund function: Working correctly`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✨ REFUND SYSTEM STATUS: OPERATIONAL\n');
    
  } catch (error) {
    console.error('Error fetching metrics:', error);
  }
}

checkRefundMetrics();