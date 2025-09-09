const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function deployRefundTables() {
  console.log('🚀 Deploying Refund System Tables...\n');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // 1. Check if tables already exist
    console.log('📋 Checking existing tables...');
    
    const { data: existingPolicies } = await supabase
      .from('refund_policies')
      .select('*')
      .limit(1);
    
    if (existingPolicies) {
      console.log('✅ Refund policies table already exists');
      
      // Check if policies are populated
      const { data: policies, count } = await supabase
        .from('refund_policies')
        .select('*', { count: 'exact' });
      
      console.log(`   Found ${count} refund policies`);
      
      if (policies && policies.length > 0) {
        console.log('\n📊 Current Refund Policies:');
        policies.forEach(p => {
          const icon = p.should_refund ? '✅' : '❌';
          console.log(`   ${icon} ${p.error_type}: ${p.should_refund ? `Refund ${p.refund_percentage}%` : 'No refund'}`);
        });
      }
    } else {
      console.log('⚠️ Refund policies table not found. Please run migration through Supabase Dashboard.');
    }
    
    // 2. Check refund audit log
    const { data: existingAuditLog } = await supabase
      .from('refund_audit_log')
      .select('*')
      .limit(1);
    
    if (existingAuditLog !== null) {
      console.log('✅ Refund audit log table exists');
      
      const { count: refundCount } = await supabase
        .from('refund_audit_log')
        .select('*', { count: 'exact', head: true });
      
      console.log(`   Total refunds processed: ${refundCount || 0}`);
    } else {
      console.log('⚠️ Refund audit log table not found. Please run migration.');
    }
    
    // 3. Check enhancement_tasks columns
    console.log('\n📋 Checking enhancement_tasks columns...');
    const { data: sampleTask } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .limit(1);
    
    if (sampleTask && sampleTask.length > 0) {
      const task = sampleTask[0];
      const hasRefundColumns = 
        'error_type' in task && 
        'refunded' in task && 
        'refund_processed_at' in task;
      
      if (hasRefundColumns) {
        console.log('✅ Enhancement tasks table has refund tracking columns');
      } else {
        console.log('⚠️ Enhancement tasks table missing refund columns. Please run migration.');
      }
    }
    
    // 4. Test refund system readiness
    console.log('\n🧪 Testing Refund System Readiness...');
    
    // Check if we can query refund policies
    const { data: testPolicies, error: policyError } = await supabase
      .from('refund_policies')
      .select('*')
      .eq('error_type', 'internal_error')
      .single();
    
    if (!policyError && testPolicies) {
      console.log('✅ Refund policy query works');
      console.log(`   Internal error policy: ${testPolicies.should_refund ? 'Will refund' : 'No refund'}`);
    } else {
      console.log('❌ Cannot query refund policies:', policyError?.message);
    }
    
    // 5. Check callback endpoint
    console.log('\n🔗 Checking Callback Endpoint...');
    const callbackUrl = `${supabaseUrl}/functions/v1/nanobanana-callback`;
    
    try {
      const response = await fetch(callbackUrl, {
        method: 'GET', // Will return 405 but proves endpoint exists
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status === 405) {
        console.log('✅ Callback endpoint deployed (returns 405 for GET as expected)');
      } else {
        console.log(`⚠️ Callback endpoint returned unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Cannot reach callback endpoint:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 DEPLOYMENT STATUS SUMMARY\n');
    
    const ready = existingPolicies && existingAuditLog !== null;
    
    if (ready) {
      console.log('✅ REFUND SYSTEM IS READY!');
      console.log('\nNext steps:');
      console.log('1. Configure NanoBanana webhook URL:');
      console.log(`   ${callbackUrl}`);
      console.log('2. Test with a deliberate failure');
      console.log('3. Monitor refunds in admin dashboard');
    } else {
      console.log('⚠️ REFUND SYSTEM NOT FULLY DEPLOYED');
      console.log('\nRequired actions:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Run the migration from: execute_refund_migration.sql');
      console.log('3. Run this script again to verify');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Deployment check failed:', error);
    process.exit(1);
  }
}

deployRefundTables();