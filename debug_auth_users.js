const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAuthUsers() {
  try {
    console.log('=== DEBUGGING AUTH USERS ===')

    // Check all user profiles to see what exists
    console.log('\n1. 👥 Checking all user profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('id, primary_skill, talent_categories, city, display_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (profilesError) {
      console.error('❌ Error getting profiles:', profilesError)
      return
    }

    console.log('✅ Found user profiles:')
    profiles.forEach((profile, i) => {
      console.log(`   ${i+1}. ${profile.display_name || 'No name'} (${profile.id})`)
      console.log(`      Skill: ${profile.primary_skill || 'No skill'}`)
      console.log(`      Categories: ${JSON.stringify(profile.talent_categories || [])}`)
      console.log(`      Location: ${profile.city || 'No location'}`)
      console.log(`      Created: ${profile.created_at}`)
    })

    // Check which user is currently logged in (from the console output)
    const currentUserId = '33b0e587-0df2-442b-8d15-0dc4991d2119' // james.murphy@email.com
    console.log('\n2. 🔍 Checking current user...')
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', currentUserId)
      .single()

    if (currentUserError) {
      console.log('❌ Current user profile not found:', currentUserError.message)
    } else {
      console.log('✅ Current user found:')
      console.log(`   Name: ${currentUser.display_name || 'No name'}`)
      console.log(`   Skill: ${currentUser.primary_skill || 'No skill'}`)
      console.log(`   Categories: ${JSON.stringify(currentUser.talent_categories || [])}`)
      console.log(`   Location: ${currentUser.city || 'No location'}`)
    }

    // Check which profiles have talent categories
    console.log('\n3. 🎭 Checking profiles with talent categories...')
    const { data: talentProfiles, error: talentError } = await supabase
      .from('users_profile')
      .select('id, display_name, primary_skill, talent_categories, city')
      .not('talent_categories', 'is', null)
      .not('talent_categories', 'eq', '{}')
      .order('created_at', { ascending: false })

    if (talentError) {
      console.log('❌ Error getting talent profiles:', talentError.message)
    } else {
      console.log('✅ Profiles with talent categories:')
      talentProfiles.forEach((profile, i) => {
        console.log(`   ${i+1}. ${profile.display_name || profile.primary_skill} (${profile.id})`)
        console.log(`      Categories: ${JSON.stringify(profile.talent_categories)}`)
        console.log(`      Location: ${profile.city || 'No location'}`)
      })
    }

    // Check which gigs exist
    console.log('\n4. 📋 Checking available gigs...')
    const { data: gigs, error: gigsError } = await supabase
      .from('gigs')
      .select('id, title, looking_for, looking_for_types, city, status')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false })
      .limit(5)

    if (gigsError) {
      console.log('❌ Error getting gigs:', gigsError.message)
    } else {
      console.log('✅ Published gigs:')
      gigs.forEach((gig, i) => {
        console.log(`   ${i+1}. ${gig.title}`)
        console.log(`      Looking for: ${JSON.stringify(gig.looking_for)}`)
        console.log(`      Looking for types: ${JSON.stringify(gig.looking_for_types)}`)
        console.log(`      Location: ${gig.city}`)
      })
    }

    console.log('\n🎯 RECOMMENDATION:')
    console.log('The issue is that the current user may not have a complete profile.')
    console.log('Users need to complete their profile with primary_skill and talent_categories.')

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugAuthUsers()