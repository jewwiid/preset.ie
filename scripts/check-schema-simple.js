#!/usr/bin/env node

/**
 * Check Table Schema - Simple Approach
 * This script checks the actual schema by trying to select from the table
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

async function checkSchemaSimple() {
  try {
    console.log('🔍 Checking verification_requests table schema...\n')
    
    // Try to get a sample record to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('verification_requests')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.log('❌ Error getting sample data:', sampleError.message)
      return
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('📋 Current verification_requests columns:')
      const columns = Object.keys(sampleData[0])
      columns.forEach(col => {
        console.log(`   - ${col}`)
      })
      
      // Check for specific columns we need
      const hasVerificationType = columns.includes('verification_type')
      const hasRequestType = columns.includes('request_type')
      const hasEnhancedFields = ['verification_data', 'social_links', 'professional_info', 'business_info', 'contact_info']
        .every(field => columns.includes(field))
      
      console.log('\n🔍 Column Status:')
      console.log(`   ${hasVerificationType ? '✅' : '❌'} verification_type`)
      console.log(`   ${hasRequestType ? '✅' : '❌'} request_type`)
      console.log(`   ${hasEnhancedFields ? '✅' : '❌'} enhanced fields (verification_data, social_links, etc.)`)
      
      // Show sample data
      console.log('\n📊 Sample record:')
      console.log(JSON.stringify(sampleData[0], null, 2))
      
    } else {
      console.log('⚠️  No records found in verification_requests table')
      
      // Try to get table info by attempting to insert a test record
      console.log('\n🧪 Testing table structure with insert attempt...')
      
      const testData = {
        user_id: '00000000-0000-0000-0000-000000000000',
        verification_type: 'age',
        status: 'pending',
        document_url: 'test/document.jpg',
        document_type: 'image/jpeg'
      }
      
      const { error: insertError } = await supabase
        .from('verification_requests')
        .insert(testData)
      
      if (insertError) {
        console.log('❌ Insert test error:', insertError.message)
        console.log('   This tells us about the table structure')
      } else {
        console.log('✅ Insert test successful - table accepts basic fields')
        
        // Clean up test record
        await supabase
          .from('verification_requests')
          .delete()
          .eq('user_id', '00000000-0000-0000-0000-000000000000')
      }
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
}

checkSchemaSimple()
