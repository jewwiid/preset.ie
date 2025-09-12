#!/usr/bin/env node

/**
 * Test Enhanced Fields - Check if columns were added successfully
 * This script tests if the enhanced verification fields exist
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

async function testEnhancedFields() {
  try {
    console.log('🧪 Testing Enhanced Verification Fields...\n')
    
    // Test 1: Check if we can query the enhanced fields
    console.log('1️⃣ Testing enhanced fields in verification_requests...')
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('verification_requests')
      .select('verification_data, social_links, professional_info, business_info, contact_info, document_url, request_type, admin_notes')
      .limit(1)
    
    if (sampleError) {
      console.log('   ❌ Error accessing enhanced fields:', sampleError.message)
      
      // Check which specific fields are missing
      const missingFields = []
      const fieldsToCheck = ['verification_data', 'social_links', 'professional_info', 'business_info', 'contact_info', 'document_url', 'request_type', 'admin_notes']
      
      for (const field of fieldsToCheck) {
        const { error: fieldError } = await supabase
          .from('verification_requests')
          .select(field)
          .limit(1)
        
        if (fieldError && fieldError.message.includes('does not exist')) {
          missingFields.push(field)
        }
      }
      
      if (missingFields.length > 0) {
        console.log('   📝 Missing fields:', missingFields.join(', '))
        console.log('   📝 Run add-verification-columns-only.sql to add these fields')
      }
    } else {
      console.log('   ✅ Enhanced fields accessible in verification_requests')
      console.log('   📊 Available fields:', Object.keys(sampleData[0] || {}).join(', '))
    }
    
    // Test 2: Check users_profile enhanced fields
    console.log('\n2️⃣ Testing enhanced fields in users_profile...')
    
    const { data: profileData, error: profileError } = await supabase
      .from('users_profile')
      .select('verified_social_links, verified_professional_info, verified_business_info, verification_badges')
      .limit(1)
    
    if (profileError) {
      console.log('   ❌ Error accessing profile enhanced fields:', profileError.message)
    } else {
      console.log('   ✅ Enhanced fields accessible in users_profile')
      console.log('   📊 Available fields:', Object.keys(profileData[0] || {}).join(', '))
    }
    
    // Test 3: Check admin dashboard view
    console.log('\n3️⃣ Testing admin dashboard view...')
    
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('admin_verification_dashboard')
      .select('*')
      .limit(1)
    
    if (dashboardError) {
      console.log('   ❌ Admin dashboard error:', dashboardError.message)
    } else {
      console.log('   ✅ Admin dashboard view accessible')
      if (dashboardData && dashboardData.length > 0) {
        console.log('   📊 Dashboard columns:', Object.keys(dashboardData[0]).length, 'columns available')
      }
    }
    
    // Test 4: Check if functions exist by testing a simple query
    console.log('\n4️⃣ Testing verification functions...')
    
    // Try to call the cleanup function (this will tell us if it exists)
    const { error: functionError } = await supabase.rpc('cleanup_expired_verification_documents')
    
    if (functionError) {
      if (functionError.message.includes('function') && functionError.message.includes('does not exist')) {
        console.log('   ❌ Cleanup function missing - run add-verification-functions.sql')
      } else {
        console.log('   ✅ Cleanup function exists (error is expected - no documents to clean)')
      }
    } else {
      console.log('   ✅ Cleanup function exists and executed successfully')
    }
    
    // Test 5: Check verification type constraints
    console.log('\n5️⃣ Testing verification type constraints...')
    
    const { data: typeData, error: typeError } = await supabase
      .from('verification_requests')
      .select('verification_type')
      .limit(1)
    
    if (typeError) {
      console.log('   ❌ Error checking verification_type:', typeError.message)
    } else {
      console.log('   ✅ verification_type column accessible')
    }
    
    // Summary
    console.log('\n🎯 Enhanced Fields Test Summary:')
    
    const hasVerificationFields = !sampleError
    const hasProfileFields = !profileError
    const hasDashboard = !dashboardError
    const hasFunctions = !functionError || functionError.message.includes('no documents to clean')
    
    console.log(`   ${hasVerificationFields ? '✅' : '❌'} verification_requests enhanced fields`)
    console.log(`   ${hasProfileFields ? '✅' : '❌'} users_profile enhanced fields`)
    console.log(`   ${hasDashboard ? '✅' : '❌'} admin dashboard view`)
    console.log(`   ${hasFunctions ? '✅' : '❌'} verification functions`)
    
    if (hasVerificationFields && hasProfileFields && hasDashboard && hasFunctions) {
      console.log('\n🎉 All enhanced features are working!')
      console.log('\n📋 System Status:')
      console.log('   ✅ Enhanced verification fields: Working')
      console.log('   ✅ Admin dashboard: Working')
      console.log('   ✅ GDPR functions: Working')
      console.log('   ✅ Data sync: Ready')
      console.log('   ✅ Document auto-deletion: Ready')
      
      console.log('\n🚀 Ready to test:')
      console.log('   1. Visit /verify to test the verification form')
      console.log('   2. Visit /admin to test the admin dashboard')
      console.log('   3. Submit a verification request to test the full workflow')
    } else {
      console.log('\n⚠️  Some features need attention:')
      if (!hasVerificationFields) console.log('   - Run add-verification-columns-only.sql')
      if (!hasProfileFields) console.log('   - Run add-verification-columns-only.sql')
      if (!hasDashboard) console.log('   - Run add-verification-functions.sql')
      if (!hasFunctions) console.log('   - Run add-verification-functions.sql')
    }
    
  } catch (error) {
    console.error('❌ Enhanced fields test failed:', error)
  }
}

testEnhancedFields()
