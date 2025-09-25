#!/usr/bin/env node

/**
 * OAuth Monitoring Setup Script
 * 
 * This script sets up comprehensive OAuth monitoring for your Supabase project.
 * Run with: node scripts/setup-oauth-monitoring.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupOAuthMonitoring() {
  console.log('🚀 Setting up OAuth monitoring...\n')

  try {
    // 1. Check if oauth_logs table exists
    console.log('1. Checking oauth_logs table...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'oauth_logs')

    if (tableError) {
      console.log('❌ Error checking tables:', tableError.message)
      console.log('ℹ️  Please run the migration first: supabase/migrations/20250925100000_create_oauth_monitoring.sql')
      return
    }

    if (!tables || tables.length === 0) {
      console.log('❌ oauth_logs table not found')
      console.log('ℹ️  Please run the migration first: supabase/migrations/20250925100000_create_oauth_monitoring.sql')
      return
    }

    console.log('✅ oauth_logs table exists')

    // 2. Test logging functionality
    console.log('\n2. Testing OAuth logging...')
    const testEvent = {
      event_type: 'oauth_start',
      provider: 'google',
      session_id: `test_${Date.now()}`,
      step: 'setup_test',
      metadata: { setup_test: true },
      ip_address: '127.0.0.1',
      user_agent: 'setup-script'
    }

    const { error: logError } = await supabase
      .from('oauth_logs')
      .insert([testEvent])

    if (logError) {
      console.log('❌ Error testing log insertion:', logError.message)
    } else {
      console.log('✅ OAuth logging is working')
    }

    // 3. Test diagnostic functions
    console.log('\n3. Testing diagnostic functions...')
    try {
      const { data: metrics, error: metricsError } = await supabase
        .rpc('get_oauth_metrics', { hours_back: 24 })

      if (metricsError) {
        console.log('❌ Error testing get_oauth_metrics:', metricsError.message)
      } else {
        console.log('✅ OAuth metrics function is working')
        console.log(`   📊 Current metrics: ${JSON.stringify(metrics[0] || {}, null, 2)}`)
      }
    } catch (err) {
      console.log('❌ Diagnostic functions may not be available:', err.message)
    }

    // 4. Check system health
    console.log('\n4. Running system health check...')
    await runSystemHealthCheck()

    // 5. Display monitoring URLs
    console.log('\n5. Monitoring Setup Complete! 🎉')
    console.log('\n📊 Access your monitoring tools:')
    console.log(`   • OAuth Monitor Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/oauth-monitor`)
    console.log(`   • Supabase Dashboard: https://supabase.com/dashboard/project/${extractProjectId()}/editor`)
    
    console.log('\n🔧 Monitoring Tools:')
    console.log('   • Run diagnostics: Use scripts/oauth-diagnostics.sql in Supabase SQL editor')
    console.log('   • Real-time monitoring: node scripts/monitor-oauth-realtime.js')
    console.log('   • Check logs: View oauth_logs table in Supabase')

    console.log('\n📝 Next Steps:')
    console.log('   1. Run the migration if you haven\'t: supabase db push')
    console.log('   2. Test Google OAuth flow and check oauth_logs table')
    console.log('   3. Set up real-time monitoring: node scripts/monitor-oauth-realtime.js')
    console.log('   4. Configure alerts (Slack webhooks, etc.) in monitor-oauth-realtime.js')

  } catch (error) {
    console.log('❌ Setup failed:', error.message)
    console.log('\nℹ️  Troubleshooting:')
    console.log('   1. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env')
    console.log('   2. Run the database migration first')
    console.log('   3. Check Supabase project permissions')
  }
}

async function runSystemHealthCheck() {
  try {
    // Check auth.users
    const { count: userCount } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })

    console.log(`   👥 Total users: ${userCount || 0}`)

    // Check Google users
    const { count: googleUsers } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .eq('raw_app_meta_data->provider', 'google')

    console.log(`   🔵 Google users: ${googleUsers || 0}`)

    // Check users_profile
    const { count: profileCount } = await supabase
      .from('users_profile')
      .select('*', { count: 'exact', head: true })

    console.log(`   👤 User profiles: ${profileCount || 0}`)

    // Check for orphaned users
    if (userCount && profileCount) {
      const orphanedUsers = userCount - profileCount
      if (orphanedUsers > 0) {
        console.log(`   ⚠️  Users without profiles: ${orphanedUsers}`)
      } else {
        console.log(`   ✅ All users have profiles`)
      }
    }

    // Check recent OAuth activity
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentActivity } = await supabase
      .from('oauth_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', oneHourAgo)

    console.log(`   📈 OAuth events (last hour): ${recentActivity || 0}`)

  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`)
  }
}

function extractProjectId() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match ? match[1] : 'your-project-id'
}

// Run the setup
setupOAuthMonitoring().catch(error => {
  console.error('Setup script failed:', error)
  process.exit(1)
})
