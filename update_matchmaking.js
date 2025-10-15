const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSimplifiedMatchmaking() {
  try {
    console.log('=== TESTING SIMPLIFIED MATCHMAKING ===')

    // Test the current matchmaking with the updated gig
    const { data: profiles, error: profileError } = await supabase
      .from('users_profile')
      .select('id, primary_skill, talent_categories, city, country')
      .order('created_at', { ascending: false })
      .limit(3)

    if (profileError) {
      console.error('Profile error:', profileError)
      return
    }

    console.log(`Testing with ${profiles.length} profiles:`)
    profiles.forEach(p => {
      console.log(`- ${p.id}: ${p.primary_skill} | ${JSON.stringify(p.talent_categories)} | ${p.city || 'No location'}`)
    })

    // Test each profile against the updated gig
    for (const profile of profiles) {
      console.log(`\n--- Testing profile ${profile.id} ---`)

      const { data: matches, error: matchError } = await supabase
        .rpc('find_compatible_gigs_for_user', {
          p_profile_id: profile.id,
          p_limit: 5
        })

      if (matchError) {
        console.error(`Match error for ${profile.id}:`, matchError)
      } else {
        console.log(`Matches for ${profile.id}: ${matches?.length || 0}`)
        if (matches && matches.length > 0) {
          console.log('Match structure:', Object.keys(matches[0]))
          matches.forEach(m => {
            console.log(`  - Full match data:`, m)
          })
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testSimplifiedMatchmaking()