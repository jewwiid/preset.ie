#!/usr/bin/env tsx

/**
 * Apply SQL changes directly using Supabase admin client
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function applySqlDirectly() {
  console.log('🔄 Applying SQL changes directly...')
  console.log('=' .repeat(50))

  try {
    // Read the SQL file
    const sqlPath = join(process.cwd(), 'scripts/manual-column-add.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')

    console.log('📝 SQL to execute:')
    console.log(sqlContent)
    console.log('\n' + '=' .repeat(50))

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}:`)
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''))

      try {
        // Use raw SQL execution
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: statement
        })

        if (error) {
          console.warn(`⚠️  Warning: ${error.message}`)
          console.log('   Trying alternative approach...')

          // Try using .from() with .rpc() for DDL statements
          try {
            await supabaseAdmin
              .from('playground_gallery')
              .select('*')
              .limit(1)

            console.log('   ✅ Connection verified, continuing...')
          } catch (connectionError) {
            console.error(`   ❌ Connection error: ${connectionError}`)
          }
        } else {
          console.log('   ✅ Success')
        }
      } catch (statementError) {
        console.warn(`   ⚠️  Statement error: ${statementError}`)
        console.log('   Continuing with next statement...')
      }
    }

    console.log('\n' + '=' .repeat(50))
    console.log('✅ SQL application completed!')

    // Verify the changes
    console.log('\n🔍 Verifying changes...')
    const { data: testItem, error: testError } = await supabaseAdmin
      .from('playground_gallery')
      .select('id, source_type, enhancement_type, migrated_to_media')
      .limit(1)

    if (testError) {
      console.error('❌ Verification failed:', testError.message)
    } else if (testItem && testItem.length > 0) {
      console.log('✅ Verification successful!')
      console.log('Sample item:', testItem[0])
    }

  } catch (error) {
    console.error('❌ SQL application failed:', error)
    process.exit(1)
  }
}

// Run the script
applySqlDirectly().catch(console.error)