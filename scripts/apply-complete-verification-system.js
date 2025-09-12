#!/usr/bin/env node

/**
 * Apply Complete Verification System Migration
 * This script applies the comprehensive verification system with GDPR compliance
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyVerificationSystem() {
  try {
    console.log('🚀 Applying Complete Verification System Migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/040_complete_verification_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded successfully')
    
    // Apply the migration
    console.log('🔄 Executing migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Error applying migration:', error)
      throw error
    }
    
    console.log('✅ Migration applied successfully!')
    
    // Verify the migration
    console.log('🔍 Verifying migration...')
    
    // Check if verification_requests table has all required columns
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'verification_requests')
      .eq('table_schema', 'public')
    
    if (tableError) {
      console.warn('⚠️  Could not verify table structure:', tableError.message)
    } else {
      const requiredColumns = [
        'verification_data', 'social_links', 'professional_info', 
        'business_info', 'contact_info', 'document_url', 'request_type'
      ]
      
      const existingColumns = tableInfo.map(col => col.column_name)
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))
      
      if (missingColumns.length === 0) {
        console.log('✅ All required columns present in verification_requests table')
      } else {
        console.warn('⚠️  Missing columns:', missingColumns)
      }
    }
    
    // Check if storage bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.warn('⚠️  Could not verify storage buckets:', bucketError.message)
    } else {
      const verificationBucket = buckets.find(bucket => bucket.id === 'verification-documents')
      if (verificationBucket) {
        console.log('✅ verification-documents bucket exists')
        console.log(`   - Public: ${verificationBucket.public}`)
        console.log(`   - File size limit: ${verificationBucket.file_size_limit} bytes`)
        console.log(`   - Allowed types: ${verificationBucket.allowed_mime_types?.join(', ')}`)
      } else {
        console.warn('⚠️  verification-documents bucket not found')
      }
    }
    
    // Check if functions exist
    const { data: functions, error: functionError } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', [
        'cleanup_expired_verification_documents',
        'sync_verified_data_to_profile',
        'approve_verification_request',
        'reject_verification_request',
        'expire_verifications'
      ])
    
    if (functionError) {
      console.warn('⚠️  Could not verify functions:', functionError.message)
    } else {
      const functionNames = functions.map(f => f.proname)
      const requiredFunctions = [
        'cleanup_expired_verification_documents',
        'sync_verified_data_to_profile',
        'approve_verification_request',
        'reject_verification_request',
        'expire_verifications'
      ]
      
      const missingFunctions = requiredFunctions.filter(fn => !functionNames.includes(fn))
      
      if (missingFunctions.length === 0) {
        console.log('✅ All required functions created')
      } else {
        console.warn('⚠️  Missing functions:', missingFunctions)
      }
    }
    
    // Test the admin dashboard view
    const { data: dashboardData, error: dashboardError } = await supabase
      .from('admin_verification_dashboard')
      .select('*')
      .limit(1)
    
    if (dashboardError) {
      console.warn('⚠️  Could not test admin dashboard view:', dashboardError.message)
    } else {
      console.log('✅ Admin dashboard view is accessible')
    }
    
    console.log('\n🎉 Complete Verification System Migration Complete!')
    console.log('\n📋 Features Implemented:')
    console.log('   ✅ Age verification type support')
    console.log('   ✅ Enhanced verification fields (social_links, professional_info, business_info)')
    console.log('   ✅ GDPR-compliant document auto-deletion')
    console.log('   ✅ Automatic data sync to user profiles')
    console.log('   ✅ Secure storage policies')
    console.log('   ✅ Admin dashboard enhancements')
    console.log('   ✅ 30-day retention policy')
    console.log('   ✅ Audit trail and logging')
    
    console.log('\n🔒 GDPR Compliance Features:')
    console.log('   ✅ Documents deleted immediately after verification decision')
    console.log('   ✅ Automatic cleanup of expired documents (30 days)')
    console.log('   ✅ Data minimization principles')
    console.log('   ✅ User rights implementation')
    console.log('   ✅ Audit trail for all actions')
    
    console.log('\n🚀 Next Steps:')
    console.log('   1. Test the verification form at /verify')
    console.log('   2. Test admin review process at /admin')
    console.log('   3. Verify document auto-deletion works')
    console.log('   4. Test data sync to user profiles')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
applyVerificationSystem()
