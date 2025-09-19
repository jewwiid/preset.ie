#!/usr/bin/env node

/**
 * Fix Database Schema
 * This script applies the missing database schema to fix user creation
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDatabaseSchema() {
  try {
    console.log('🔧 Fixing database schema...\n')
    
    // Read the initial schema file
    const schemaPath = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql')
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath)
      return
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    console.log('📄 Schema file loaded')
    
    // Split into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        console.log(`\n${i + 1}/${statements.length} Executing statement...`)
        
        // Use the REST API to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: statement })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.log(`   ⚠️  Statement ${i + 1} failed:`, errorText.substring(0, 100))
          // Continue with other statements
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`)
        }
        
      } catch (error) {
        console.log(`   ⚠️  Statement ${i + 1} error:`, error.message)
        // Continue with other statements
      }
    }
    
    console.log('\n🎉 Schema application completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Go to Supabase Dashboard → Authentication → Users')
    console.log('2. Create admin user: admin@preset.ie / Admin123!@#')
    console.log('3. Create admin profile in users_profile table')
    console.log('4. Test sign in at http://localhost:3000/auth/signin')
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error)
  }
}

fixDatabaseSchema()
