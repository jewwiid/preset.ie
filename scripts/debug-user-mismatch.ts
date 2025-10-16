#!/usr/bin/env tsx

/**
 * Debug user ID mismatch between auth user and playground gallery items
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

async function debugUserMismatch() {
  console.log('🔍 Debugging user ID mismatch...')
  console.log('=' .repeat(50))

  try {
    // Step 1: Get all playground gallery items with user info
    console.log('\n=== Step 1: Checking playground gallery items ===')
    const { data: galleryItems, error: galleryError } = await supabaseAdmin
      .from('playground_gallery')
      .select('id, user_id, title, created_at')
      .order('created_at', { ascending: false })

    if (galleryError) {
      throw new Error(`Failed to fetch gallery items: ${galleryError.message}`)
    }

    console.log(`✅ Found ${galleryItems?.length || 0} playground gallery items`)

    const uniqueUserIds = new Set<string>()
    galleryItems?.forEach(item => {
      uniqueUserIds.add(item.user_id)
      console.log(`📋 Item: ${item.title?.substring(0, 50) || 'Untitled'}...`)
      console.log(`   ID: ${item.id}`)
      console.log(`   User ID: ${item.user_id}`)
      console.log(`   Created: ${item.created_at}`)
      console.log('')
    })

    console.log(`👥 Unique user IDs in playground_gallery: ${uniqueUserIds.size}`)
    uniqueUserIds.forEach(userId => console.log(`   - ${userId}`))

    // Step 2: Get all users_profile records
    console.log('\n=== Step 2: Checking user profiles ===')
    const { data: userProfiles, error: profilesError } = await supabaseAdmin
      .from('users_profile')
      .select('id, user_id, display_name, email')
      .order('created_at', { ascending: false })

    if (profilesError) {
      throw new Error(`Failed to fetch user profiles: ${profilesError.message}`)
    }

    console.log(`✅ Found ${userProfiles?.length || 0} user profiles`)

    userProfiles?.forEach(profile => {
      console.log(`👤 Profile: ${profile.display_name || 'Unknown'}`)
      console.log(`   Profile ID: ${profile.id}`)
      console.log(`   Auth User ID: ${profile.user_id}`)
      console.log(`   Email: ${profile.email || 'No email'}`)
      console.log('')
    })

    // Step 3: Get auth users
    console.log('\n=== Step 3: Checking auth users ===')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.log(`⚠️  Cannot fetch auth users (likely due to permissions): ${authError.message}`)
    } else {
      console.log(`✅ Found ${authUsers.users.length} auth users`)

      authUsers.users.forEach(user => {
        console.log(`🔐 Auth User:`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Created: ${user.created_at}`)
        console.log('')
      })
    }

    // Step 4: Find matches and mismatches
    console.log('\n=== Step 4: Analysis ===')

    if (galleryItems && userProfiles) {
      console.log('🔍 Matching playground items to user profiles:')

      galleryItems.forEach(item => {
        const matchingProfile = userProfiles.find(profile => profile.user_id === item.user_id)

        if (matchingProfile) {
          console.log(`✅ Match found:`)
          console.log(`   Item: ${item.title?.substring(0, 30)}...`)
          console.log(`   Item User ID: ${item.user_id}`)
          console.log(`   Profile: ${matchingProfile.display_name}`)
          console.log(`   Profile Auth User ID: ${matchingProfile.user_id}`)
        } else {
          console.log(`❌ No profile match:`)
          console.log(`   Item: ${item.title?.substring(0, 30)}...`)
          console.log(`   Item User ID: ${item.user_id}`)
          console.log(`   -> No matching user profile found`)
        }
        console.log('')
      })
    }

    // Step 5: Current session check
    console.log('\n=== Step 5: Current session info ===')
    console.log('From the API logs:')
    console.log('   Auth User ID: a7138172-d10e-417a-acbf-e346616ea70c')
    console.log('   Profile ID: f97f181e-e0e1-4fad-999c-5d2b044b9816')
    console.log('   Profile Auth User ID: (should match auth user ID)')

    console.log('\n' + '=' .repeat(50))
    console.log('🎯 Analysis Complete!')
    console.log('\n📋 Possible Issues:')
    console.log('   1. Playground items belong to a different user')
    console.log('   2. User profile mapping is incorrect')
    console.log('   3. Auth user ID is different than expected')
    console.log('   4. Current user is not the owner of playground items')

  } catch (error) {
    console.error('❌ Debug failed:', error)
    process.exit(1)
  }
}

// Run the debug
debugUserMismatch().catch(console.error)