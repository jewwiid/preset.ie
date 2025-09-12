#!/usr/bin/env node

/**
 * Check Current Verification System State
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

async function checkVerificationSystem() {
  try {
    console.log('🔍 Checking Current Verification System State...\n')
    
    // Check verification_requests table structure
    console.log('📋 verification_requests table:')
    const { data: vrData, error: vrError } = await supabase
      .from('verification_requests')
      .select('*')
      .limit(1)
    
    if (vrError) {
      console.log('   ❌ Error:', vrError.message)
    } else {
      console.log('   ✅ Table accessible')
      if (vrData && vrData.length > 0) {
        console.log('   📊 Sample record keys:', Object.keys(vrData[0]).join(', '))
      }
    }
    
    // Check verification_badges table
    console.log('\n🏆 verification_badges table:')
    const { data: vbData, error: vbError } = await supabase
      .from('verification_badges')
      .select('*')
      .limit(1)
    
    if (vbError) {
      console.log('   ❌ Error:', vbError.message)
    } else {
      console.log('   ✅ Table accessible')
      if (vbData && vbData.length > 0) {
        console.log('   📊 Sample record keys:', Object.keys(vbData[0]).join(', '))
      }
    }
    
    // Check users_profile table for verification fields
    console.log('\n👤 users_profile table verification fields:')
    const { data: upData, error: upError } = await supabase
      .from('users_profile')
      .select('*')
      .limit(1)
    
    if (upError) {
      console.log('   ❌ Error:', upError.message)
    } else {
      console.log('   ✅ Table accessible')
      if (upData && upData.length > 0) {
        const verificationFields = Object.keys(upData[0]).filter(key => 
          key.includes('verified') || key.includes('verification')
        )
        console.log('   📊 Verification fields:', verificationFields.join(', ') || 'None found')
      }
    }
    
    // Check admin dashboard view
    console.log('\n📊 admin_verification_dashboard view:')
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('admin_verification_dashboard')
      .select('*')
      .limit(1)
    
    if (dashboardError) {
      console.log('   ❌ Error:', dashboardError.message)
    } else {
      console.log('   ✅ View accessible')
      if (dashboardData && dashboardData.length > 0) {
        console.log('   📊 Sample record keys:', Object.keys(dashboardData[0]).join(', '))
      }
    }
    
    // Check storage bucket
    console.log('\n🗄️ verification-documents bucket:')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.log('   ❌ Error:', bucketError.message)
    } else {
      const verificationBucket = buckets.find(bucket => bucket.id === 'verification-documents')
      if (verificationBucket) {
        console.log('   ✅ Bucket exists')
        console.log('   📊 Public:', verificationBucket.public)
        console.log('   📊 File size limit:', verificationBucket.file_size_limit)
        console.log('   📊 Allowed types:', verificationBucket.allowed_mime_types?.join(', '))
      } else {
        console.log('   ❌ Bucket not found')
      }
    }
    
    // Check for existing verification requests
    console.log('\n📝 Existing verification requests:')
    const { data: existingRequests, error: requestsError } = await supabase
      .from('verification_requests')
      .select('id, request_type, status, submitted_at')
      .order('submitted_at', { ascending: false })
      .limit(5)
    
    if (requestsError) {
      console.log('   ❌ Error:', requestsError.message)
    } else {
      console.log('   📊 Count:', existingRequests?.length || 0)
      if (existingRequests && existingRequests.length > 0) {
        existingRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. ${req.request_type} - ${req.status} (${req.submitted_at})`)
        })
      }
    }
    
    console.log('\n🎯 Summary:')
    console.log('   - verification_requests table: ' + (vrError ? '❌' : '✅'))
    console.log('   - verification_badges table: ' + (vbError ? '❌' : '✅'))
    console.log('   - users_profile verification fields: ' + (upError ? '❌' : '✅'))
    console.log('   - admin_verification_dashboard view: ' + (dashboardError ? '❌' : '✅'))
    console.log('   - verification-documents bucket: ' + (buckets?.find(b => b.id === 'verification-documents') ? '✅' : '❌'))
    
  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

checkVerificationSystem()
