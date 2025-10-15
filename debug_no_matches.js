const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugNoMatches() {
  try {
    console.log('=== DEBUGGING NO MATCHES ISSUE ===')

    const gigId = '0cf28b9a-1941-441e-9f5a-3b909b991dac'

    // 1. Check if our new functions exist
    console.log('\n1. 📋 CHECKING FUNCTION AVAILABILITY...')

    try {
      const { data: newFuncTest, error: newFuncError } = await supabase
        .rpc('calculate_match_compatibility', {
          p_profile_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID to test existence
          p_gig_id: gigId
        })

      if (newFuncError?.message?.includes('does not exist')) {
        console.log('❌ New functions NOT deployed yet')
        console.log('📋 Need to run: single_function_fix.sql')
      } else if (newFuncError?.message?.includes('not found')) {
        console.log('✅ New functions exist (got expected "not found" error)')
      } else {
        console.log('✅ New functions exist and seem to work')
      }
    } catch (err) {
      console.log('❌ Error testing new functions:', err.message)
    }

    // 2. Test existing functions as fallback
    console.log('\n2. 🔍 TESTING EXISTING FUNCTIONS...')

    const { data: existingUsers, error: userError } = await supabase
      .from('users_profile')
      .select('id, primary_skill, talent_categories, city')
      .order('created_at', { ascending: false })
      .limit(3)

    if (userError) {
      console.error('❌ Error getting users:', userError)
      return
    }

    console.log('✅ Found users to test:')
    existingUsers.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.primary_skill} | ${JSON.stringify(user.talent_categories)} | ${user.city || 'No location'}`)
    })

    // Test with each user using existing functions
    for (const user of existingUsers) {
      console.log(`\n--- Testing ${user.primary_skill} (${user.id}) ---`)

      // Try the old function that was working
      const { data: oldResult, error: oldError } = await supabase
        .rpc('calculate_gig_compatibility_with_preferences', {
          p_profile_id: user.id,
          p_gig_id: gigId
        })

      if (oldError) {
        console.error('❌ Old function error:', oldError.message)
      } else if (oldResult && oldResult.length > 0) {
        console.log(`✅ Old function result: ${oldResult[0].score} points`)
        console.log(`   Matched: ${JSON.stringify(oldResult[0].matched_attributes)}`)
        console.log(`   Missing: ${JSON.stringify(oldResult[0].missing_requirements)}`)
      }

      // Try the old find function
      const { data: oldMatches, error: oldMatchError } = await supabase
        .rpc('find_compatible_gigs_for_user', {
          p_profile_id: user.id
        })

      if (oldMatchError) {
        console.error('❌ Old find function error:', oldMatchError.message)
      } else {
        console.log(`✅ Old find function: ${oldMatches?.length || 0} matches`)
      }
    }

    // 3. Check gig details
    console.log('\n3. 📋 CHECKING GIG DETAILS...')
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select('*')
      .eq('id', gigId)
      .single()

    if (gigError) {
      console.error('❌ Error getting gig:', gigError)
    } else {
      console.log('✅ Gig details:')
      console.log(`   Title: ${gig.title}`)
      console.log(`   Status: ${gig.status}`)
      console.log(`   Deadline: ${gig.application_deadline}`)
      console.log(`   Looking for: ${JSON.stringify(gig.looking_for)}`)
      console.log(`   Looking for types: ${JSON.stringify(gig.looking_for_types)}`)
      console.log(`   Location: ${gig.city}, ${gig.country}`)

      const deadline = new Date(gig.application_deadline)
      const now = new Date()
      console.log(`   Deadline passed? ${deadline < now ? 'YES ❌' : 'NO ✅'}`)
    }

    // 4. Test direct gig query
    console.log('\n4. 🔍 TESTING DIRECT GIG QUERY...')
    const { data: allGigs, error: allGigsError } = await supabase
      .from('gigs')
      .select('id, title, status, application_deadline')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false })
      .limit(5)

    if (allGigsError) {
      console.error('❌ Error getting all gigs:', allGigsError)
    } else {
      console.log(`✅ Found ${allGigs.length} published gigs:`)
      allGigs.forEach((g, i) => {
        const deadline = new Date(g.application_deadline)
        const now = new Date()
        console.log(`   ${i+1}. ${g.title} (Deadline: ${deadline < now ? 'EXPIRED ❌' : 'ACTIVE ✅'})`)
      })
    }

    console.log('\n🎯 DIAGNOSIS COMPLETE')
    console.log('Based on the results above, the issue is likely:')

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugNoMatches()