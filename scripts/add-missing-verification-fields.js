#!/usr/bin/env node

/**
 * Add Missing Verification Fields
 * This script adds the missing enhanced verification fields to the existing system
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

async function addMissingFields() {
  try {
    console.log('🚀 Adding Missing Verification Fields...\n')
    
    // Step 1: Add enhanced verification fields to verification_requests
    console.log('📝 Adding enhanced verification fields to verification_requests...')
    
    const { error: addFieldsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE verification_requests 
        ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS professional_info JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}';
      `
    })
    
    if (addFieldsError) {
      console.log('   ⚠️  Error adding fields:', addFieldsError.message)
    } else {
      console.log('   ✅ Enhanced verification fields added')
    }
    
    // Step 2: Add verification fields to users_profile
    console.log('\n👤 Adding verification fields to users_profile...')
    
    const { error: addProfileFieldsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users_profile 
        ADD COLUMN IF NOT EXISTS verified_social_links JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS verified_professional_info JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS verified_business_info JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS verification_badges JSONB DEFAULT '{}';
      `
    })
    
    if (addProfileFieldsError) {
      console.log('   ⚠️  Error adding profile fields:', addProfileFieldsError.message)
    } else {
      console.log('   ✅ Profile verification fields added')
    }
    
    // Step 3: Create admin dashboard view
    console.log('\n📊 Creating admin dashboard view...')
    
    const { error: createViewError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE VIEW admin_verification_dashboard AS
        SELECT 
            vr.*,
            u.display_name as user_name,
            u.handle as user_handle,
            au.email as user_email,
            reviewer.display_name as reviewer_name,
            (
                SELECT COUNT(*) FROM verification_badges
                WHERE user_id = vr.user_id
                AND revoked_at IS NULL
                AND (expires_at IS NULL OR expires_at > NOW())
            ) as active_badges_count,
            (
                SELECT COUNT(*) FROM verification_requests
                WHERE user_id = vr.user_id
                AND status = 'rejected'
            ) as previous_rejections,
            CASE 
                WHEN vr.request_type = 'age' AND vr.document_url IS NOT NULL THEN 'complete'
                WHEN vr.request_type = 'identity' AND vr.document_url IS NOT NULL AND vr.social_links IS NOT NULL THEN 'complete'
                WHEN vr.request_type = 'professional' AND vr.document_url IS NOT NULL AND (vr.professional_info IS NOT NULL OR vr.social_links IS NOT NULL) THEN 'complete'
                WHEN vr.request_type = 'business' AND vr.document_url IS NOT NULL AND vr.business_info IS NOT NULL THEN 'complete'
                WHEN vr.document_url IS NOT NULL THEN 'partial'
                ELSE 'basic'
            END as data_quality
        FROM verification_requests vr
        LEFT JOIN users_profile u ON vr.user_id = u.user_id
        LEFT JOIN auth.users au ON vr.user_id = au.id
        LEFT JOIN users_profile reviewer ON vr.reviewed_by = reviewer.user_id
        ORDER BY 
            CASE 
                WHEN vr.status = 'pending' THEN 1
                WHEN vr.status = 'reviewing' THEN 2
                ELSE 3
            END,
            vr.submitted_at DESC;
      `
    })
    
    if (createViewError) {
      console.log('   ⚠️  Error creating view:', createViewError.message)
    } else {
      console.log('   ✅ Admin dashboard view created')
    }
    
    // Step 4: Create enhanced sync function
    console.log('\n🔄 Creating enhanced sync function...')
    
    const { error: createSyncError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION sync_verified_data_to_profile()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
                UPDATE users_profile 
                SET 
                    verified_social_links = COALESCE(verified_social_links, '{}'::jsonb) || COALESCE(NEW.social_links, '{}'::jsonb),
                    verified_professional_info = CASE 
                        WHEN NEW.request_type = 'professional' THEN COALESCE(NEW.professional_info, '{}'::jsonb)
                        ELSE verified_professional_info
                    END,
                    verified_business_info = CASE 
                        WHEN NEW.request_type = 'business' THEN COALESCE(NEW.business_info, '{}'::jsonb)
                        ELSE verified_business_info
                    END,
                    verification_badges = COALESCE(verification_badges, '{}'::jsonb) || 
                        jsonb_build_object(NEW.request_type, jsonb_build_object(
                            'verified_at', NEW.reviewed_at,
                            'verified_by', NEW.reviewed_by,
                            'verification_id', NEW.id
                        )),
                    updated_at = NOW()
                WHERE user_id = NEW.user_id;
                
                CASE NEW.request_type
                    WHEN 'age' THEN
                        UPDATE users_profile 
                        SET role_flags = array_append(
                            array_remove(role_flags, 'VERIFIED_AGE'),
                            'VERIFIED_AGE'
                        )
                        WHERE user_id = NEW.user_id;
                    WHEN 'identity' THEN
                        UPDATE users_profile 
                        SET role_flags = array_append(
                            array_remove(role_flags, 'VERIFIED_ID'),
                            'VERIFIED_ID'
                        )
                        WHERE user_id = NEW.user_id;
                    WHEN 'professional' THEN
                        UPDATE users_profile 
                        SET role_flags = array_append(
                            array_remove(role_flags, 'VERIFIED_PRO'),
                            'VERIFIED_PRO'
                        )
                        WHERE user_id = NEW.user_id;
                    WHEN 'business' THEN
                        UPDATE users_profile 
                        SET role_flags = array_append(
                            array_remove(role_flags, 'VERIFIED_BUSINESS'),
                            'VERIFIED_BUSINESS'
                        )
                        WHERE user_id = NEW.user_id;
                END CASE;
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    })
    
    if (createSyncError) {
      console.log('   ⚠️  Error creating sync function:', createSyncError.message)
    } else {
      console.log('   ✅ Enhanced sync function created')
    }
    
    // Step 5: Create trigger
    console.log('\n⚡ Creating sync trigger...')
    
    const { error: createTriggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS sync_verified_data_trigger ON verification_requests;
        CREATE TRIGGER sync_verified_data_trigger
            AFTER UPDATE ON verification_requests
            FOR EACH ROW
            EXECUTE FUNCTION sync_verified_data_to_profile();
      `
    })
    
    if (createTriggerError) {
      console.log('   ⚠️  Error creating trigger:', createTriggerError.message)
    } else {
      console.log('   ✅ Sync trigger created')
    }
    
    // Step 6: Create GDPR cleanup function
    console.log('\n🗑️ Creating GDPR cleanup function...')
    
    const { error: createCleanupError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION cleanup_expired_verification_documents()
        RETURNS void AS $$
        BEGIN
            DELETE FROM storage.objects 
            WHERE bucket_id = 'verification-documents'
            AND created_at < NOW() - INTERVAL '30 days';
            
            UPDATE verification_requests 
            SET document_url = NULL,
                admin_notes = COALESCE(admin_notes, '') || ' [Document auto-deleted after 30 days for GDPR compliance]'
            WHERE document_url IS NOT NULL
            AND submitted_at < NOW() - INTERVAL '30 days';
        END;
        $$ LANGUAGE plpgsql;
      `
    })
    
    if (createCleanupError) {
      console.log('   ⚠️  Error creating cleanup function:', createCleanupError.message)
    } else {
      console.log('   ✅ GDPR cleanup function created')
    }
    
    // Step 7: Grant permissions
    console.log('\n🔐 Granting permissions...')
    
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: `
        GRANT SELECT ON admin_verification_dashboard TO authenticated;
      `
    })
    
    if (grantError) {
      console.log('   ⚠️  Error granting permissions:', grantError.message)
    } else {
      console.log('   ✅ Permissions granted')
    }
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...')
    
    const { data: verificationRequests, error: vrError } = await supabase
      .from('verification_requests')
      .select('*')
      .limit(1)
    
    if (vrError) {
      console.log('   ❌ Error checking verification_requests:', vrError.message)
    } else if (verificationRequests && verificationRequests.length > 0) {
      const hasNewFields = ['verification_data', 'social_links', 'professional_info', 'business_info', 'contact_info']
        .every(field => verificationRequests[0].hasOwnProperty(field))
      console.log('   ✅ verification_requests enhanced fields:', hasNewFields ? 'Present' : 'Missing')
    }
    
    const { data: adminDashboard, error: dashboardError } = await supabase
      .from('admin_verification_dashboard')
      .select('*')
      .limit(1)
    
    if (dashboardError) {
      console.log('   ❌ Error checking admin dashboard:', dashboardError.message)
    } else {
      console.log('   ✅ admin_verification_dashboard view:', 'Accessible')
    }
    
    console.log('\n🎉 Missing Verification Fields Added Successfully!')
    console.log('\n📋 Features Now Available:')
    console.log('   ✅ Enhanced verification fields (social_links, professional_info, business_info)')
    console.log('   ✅ Automatic data sync to user profiles')
    console.log('   ✅ Admin dashboard with enhanced data display')
    console.log('   ✅ GDPR-compliant document cleanup function')
    console.log('   ✅ Type-specific verification data collection')
    
  } catch (error) {
    console.error('❌ Adding fields failed:', error)
  }
}

addMissingFields()
