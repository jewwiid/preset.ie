#!/usr/bin/env node

/**
 * Check Table Schema
 * This script checks the actual schema of the verification_requests table
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableSchema() {
  try {
    console.log('🔍 Checking verification_requests table schema...\n')
    
    // Get table schema information
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'verification_requests')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (columnError) {
      console.log('❌ Error getting column info:', columnError.message)
      return
    }
    
    console.log('📋 Current verification_requests columns:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
    })
    
    // Check if we have the right columns
    const columnNames = columns.map(col => col.column_name)
    const requiredColumns = ['verification_type', 'request_type', 'verification_data', 'social_links', 'professional_info', 'business_info', 'contact_info']
    
    console.log('\n🔍 Checking required columns:')
    requiredColumns.forEach(col => {
      const exists = columnNames.includes(col)
      console.log(`   ${exists ? '✅' : '❌'} ${col}`)
    })
    
    // Check if verification_type exists and what values it has
    if (columnNames.includes('verification_type')) {
      console.log('\n📊 Checking verification_type values:')
      const { data: typeData, error: typeError } = await supabase
        .from('verification_requests')
        .select('verification_type')
        .limit(10)
      
      if (typeError) {
        console.log('   ❌ Error getting verification_type values:', typeError.message)
      } else {
        const uniqueTypes = [...new Set(typeData.map(row => row.verification_type))]
        console.log('   📊 Current verification_type values:', uniqueTypes.join(', '))
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
}

checkTableSchema()
