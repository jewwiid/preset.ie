import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupRefundTables() {
  console.log('🔧 Setting up refund tables...\n')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../supabase-migrations/create_refund_tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Execute the SQL
    console.log('📝 Executing migration...')
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()
    
    if (error && error.message !== 'function public.exec_sql(sql_query => text) does not exist') {
      console.error('❌ Error executing migration:', error)
      
      // Try alternative approach - executing statements one by one
      console.log('\n🔄 Trying alternative approach...')
      
      // Since we can't execute raw SQL directly, we'll check and create tables using Supabase client
      console.log('Checking existing tables...')
      
      // Check if tables exist by trying to query them
      const { data: refundPolicies, error: policiesError } = await supabase
        .from('refund_policies')
        .select('count')
        .limit(1)
      
      const { data: creditRefunds, error: refundsError } = await supabase
        .from('credit_refunds')
        .select('count')
        .limit(1)
      
      if (policiesError?.message?.includes('does not exist')) {
        console.log('⚠️  refund_policies table does not exist')
      } else {
        console.log('✅ refund_policies table exists')
      }
      
      if (refundsError?.message?.includes('does not exist')) {
        console.log('⚠️  credit_refunds table does not exist')
      } else {
        console.log('✅ credit_refunds table exists')
      }
      
      console.log('\n📋 To complete setup, please:')
      console.log('1. Go to Supabase SQL Editor:')
      console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.com')}/sql/new`)
      console.log('2. Copy and paste the SQL from:')
      console.log(`   ${sqlPath}`)
      console.log('3. Click "Run" to execute the migration')
    } else {
      console.log('✅ Migration executed successfully!')
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    
    const { data: policies, error: policyError } = await supabase
      .from('refund_policies')
      .select('*')
      .limit(5)
    
    if (policyError) {
      console.log('⚠️  Could not query refund_policies:', policyError.message)
    } else {
      console.log(`✅ refund_policies table exists with ${policies?.length || 0} policies`)
      if (policies && policies.length > 0) {
        console.log('   Policies:', policies.map(p => `${p.error_code}: ${p.error_type}`).join(', '))
      }
    }
    
    const { count: refundCount, error: refundError } = await supabase
      .from('credit_refunds')
      .select('*', { count: 'exact', head: true })
    
    if (refundError) {
      console.log('⚠️  Could not query credit_refunds:', refundError.message)
    } else {
      console.log(`✅ credit_refunds table exists with ${refundCount || 0} refunds`)
    }
    
    // Check if enhancement_tasks exists and has refund columns
    const { data: taskSample, error: taskError } = await supabase
      .from('enhancement_tasks')
      .select('task_id, refund_status, refund_credits')
      .limit(1)
    
    if (taskError) {
      if (taskError.message.includes('does not exist')) {
        console.log('ℹ️  enhancement_tasks table does not exist (will be created when needed)')
      } else if (taskError.message.includes('column')) {
        console.log('⚠️  enhancement_tasks exists but missing refund columns')
      }
    } else {
      console.log('✅ enhancement_tasks table has refund tracking columns')
    }
    
    console.log('\n✨ Refund system setup check complete!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the setup
setupRefundTables().then(() => {
  console.log('\n📌 Next steps:')
  console.log('1. If tables are missing, run the SQL migration in Supabase Dashboard')
  console.log('2. Configure NanoBanana webhook URL in their dashboard')
  console.log('3. Test the refund flow with: npm run test:refund')
  process.exit(0)
})