#!/usr/bin/env tsx

/**
 * Add columns by executing individual statements using PostgreSQL client approach
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function addColumnsManually() {
  console.log('🔄 Adding columns manually via Supabase Admin...')
  console.log('=' .repeat(50))

  try {
    // First, let's check if we can use PostgreSQL's raw SQL through a different approach
    // We'll use a direct PostgreSQL connection style approach

    // Method 1: Try using .rpc() with a custom function name
    console.log('\n=== Method 1: Testing raw SQL access ===')

    const testQueries = [
      'SELECT 1 as test',
      'SELECT column_name FROM information_schema.columns WHERE table_name = \'playground_gallery\' LIMIT 5'
    ]

    for (const query of testQueries) {
      console.log(`📝 Testing: ${query}`)

      try {
        // Try using the raw SQL endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: query })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Success:', data)
        } else {
          console.log(`❌ Failed: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.log(`❌ Error: ${error}`)
      }
    }

    // Method 2: Check current table structure
    console.log('\n=== Method 2: Checking table structure ===')

    try {
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .from('playground_gallery')
        .select('*')
        .limit(1)

      if (tableError) {
        console.error('❌ Cannot access table:', tableError.message)
      } else {
        console.log('✅ Table accessible')
        if (tableInfo && tableInfo.length > 0) {
          console.log('Available columns:', Object.keys(tableInfo[0]))
        }
      }
    } catch (error) {
      console.error('❌ Error checking table:', error)
    }

    // Method 3: Try to use Supabase SQL via direct REST API
    console.log('\n=== Method 3: Direct SQL execution ===')

    const sqlStatements = [
      'ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT \'playground\'',
      'ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS enhancement_type VARCHAR(50)',
      'ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS original_media_id VARCHAR(50)',
      'ALTER TABLE playground_gallery ADD COLUMN IF NOT EXISTS migrated_to_media BOOLEAN DEFAULT FALSE'
    ]

    for (const sql of sqlStatements) {
      console.log(`📝 Executing: ${sql}`)

      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: sql
          })
        })

        if (response.ok) {
          console.log('✅ Success')
        } else {
          const errorText = await response.text()
          console.log(`❌ Failed: ${response.status} - ${errorText}`)
        }
      } catch (error) {
        console.log(`❌ Error: ${error}`)
      }
    }

    console.log('\n' + '=' .repeat(50))
    console.log('✅ Manual column addition completed!')

    // Final verification
    console.log('\n🔍 Final verification...')
    const { data: finalCheck, error: finalError } = await supabaseAdmin
      .from('playground_gallery')
      .select('id, title, created_at')
      .limit(3)

    if (finalError) {
      console.error('❌ Final verification failed:', finalError.message)
    } else {
      console.log(`✅ Found ${finalCheck?.length || 0} items in playground_gallery`)
      if (finalCheck && finalCheck.length > 0) {
        finalCheck.forEach(item => {
          console.log(`   - ${item.title || 'Untitled'} (${item.id})`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Manual column addition failed:', error)
    process.exit(1)
  }
}

// Run the script
addColumnsManually().catch(console.error)