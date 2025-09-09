const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminTables() {
  console.log('🔍 Testing Admin Dashboard Tables...\n');
  
  const tables = [
    'reports',
    'moderation_actions', 
    'verification_requests',
    'verification_badges',
    'user_violations',
    'violation_thresholds'
  ];
  
  let allPassed = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allPassed = false;
      } else {
        console.log(`✅ ${table}: Table accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n📊 Testing Admin Views...\n');
  
  const views = [
    'admin_reports_dashboard',
    'admin_moderation_audit',
    'admin_verification_dashboard',
    'admin_violations_dashboard'
  ];
  
  for (const view of views) {
    try {
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${view}: ${error.message}`);
        allPassed = false;
      } else {
        console.log(`✅ ${view}: View accessible`);
      }
    } catch (err) {
      console.log(`❌ ${view}: ${err.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n🧪 Testing Functions...\n');
  
  // Test get_user_violation_count
  try {
    const { data, error } = await supabase.rpc('get_user_violation_count', {
      p_user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      console.log(`❌ get_user_violation_count: ${error.message}`);
      allPassed = false;
    } else {
      console.log(`✅ get_user_violation_count: Returns ${data}`);
    }
  } catch (err) {
    console.log(`❌ get_user_violation_count: ${err.message}`);
    allPassed = false;
  }
  
  // Test calculate_user_risk_score
  try {
    const { data, error } = await supabase.rpc('calculate_user_risk_score', {
      p_user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      console.log(`❌ calculate_user_risk_score: ${error.message}`);
      allPassed = false;
    } else {
      console.log(`✅ calculate_user_risk_score: Returns ${data}`);
    }
  } catch (err) {
    console.log(`❌ calculate_user_risk_score: ${err.message}`);
    allPassed = false;
  }
  
  // Check violation thresholds
  console.log('\n📋 Checking Violation Thresholds...\n');
  
  try {
    const { data, error } = await supabase
      .from('violation_thresholds')
      .select('*')
      .order('violation_count');
    
    if (error) {
      console.log(`❌ Violation thresholds: ${error.message}`);
      allPassed = false;
    } else if (data && data.length > 0) {
      console.log(`✅ Violation thresholds configured: ${data.length} rules`);
      data.forEach(threshold => {
        console.log(`   - ${threshold.violation_count} violations → ${threshold.action_type}`);
      });
    } else {
      console.log('⚠️ No violation thresholds configured');
    }
  } catch (err) {
    console.log(`❌ Violation thresholds: ${err.message}`);
    allPassed = false;
  }
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All admin dashboard tables are ready!');
    console.log('✅ Phase 1 complete - Database foundation is solid');
  } else {
    console.log('⚠️ Some tables or functions are missing');
    console.log('Run migration 022_admin_functions.sql to add missing functions');
  }
  console.log('='.repeat(50) + '\n');
}

testAdminTables();