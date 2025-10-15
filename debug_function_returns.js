const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugFunctionReturns() {
  try {
    console.log('=== DEBUGGING FUNCTION RETURNS ===')

    const gigId = '0cf28b9a-1941-441e-9f5a-3b909b991dac'
    const profileId = '8174a1e6-9734-43ec-8e39-17dccb845879'

    // 1. First test the old working function to see what it returns
    console.log('\n1. 📊 TESTING OLD WORKING FUNCTION...')
    try {
      const { data: oldCompat, error: oldCompatError } = await supabase
        .rpc('calculate_gig_compatibility_with_preferences', {
          p_profile_id: profileId,
          p_gig_id: gigId
        })

      if (oldCompatError) {
        console.error('❌ Old function error:', oldCompatError.message)
      } else if (oldCompat && oldCompat.length > 0) {
        console.log('✅ Old function returns:')
        console.log('   Structure:', Object.keys(oldCompat[0]))
        console.log('   Data:', JSON.stringify(oldCompat[0], null, 2))
      }
    } catch (err) {
      console.error('❌ Old function failed:', err.message)
    }

    // 2. Test the new function to see what structure it has
    console.log('\n2. 📊 TESTING NEW FUNCTION STRUCTURE...')
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/calculate_match_compatibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          p_profile_id: profileId,
          p_gig_id: gigId
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ New function returns:')
        console.log('   Structure:', data.length > 0 ? Object.keys(data[0]) : 'No data')
        console.log('   Sample:', JSON.stringify(data.slice(0, 1), null, 2))
      } else {
        const errorText = await response.text()
        console.error('❌ New function failed:', response.status, errorText)
      }
    } catch (err) {
      console.error('❌ Direct fetch failed:', err.message)
    }

    // 3. Check what columns the gigs table actually has
    console.log('\n3. 📊 CHECKING GIGS TABLE STRUCTURE...')
    try {
      const { data: gigSample, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .limit(1)

      if (gigError) {
        console.error('❌ Gig sample error:', gigError)
      } else if (gigSample && gigSample.length > 0) {
        console.log('✅ Gigs table columns:', Object.keys(gigSample[0]))
      }
    } catch (err) {
      console.error('❌ Gig structure check failed:', err.message)
    }

    // 4. Test with a simpler approach - just the compatibility calculation
    console.log('\n4. 🎯 TESTING SIMPLE COMPATIBILITY...')
    try {
      // Create a simple SQL test using direct SQL
      const testQuery = `
        SELECT
          g.title,
          g.looking_for,
          g.location_text,
          p.primary_skill,
          p.talent_categories,
          CASE
            WHEN p.primary_skill = ANY(g.looking_for) THEN 100
            WHEN p.talent_categories && g.looking_for THEN 70
            ELSE 0
          END as simple_score
        FROM gigs g, users_profile p
        WHERE g.id = '${gigId}' AND p.id = '${profileId}'
      `

      console.log('🔍 Running simple test query...')
      // Note: We can't run arbitrary SQL through the client, but we can test the logic

      // Test with basic gig and profile data
      const { data: gigData } = await supabase
        .from('gigs')
        .select('title, looking_for, location_text, city')
        .eq('id', gigId)
        .single()

      const { data: profileData } = await supabase
        .from('users_profile')
        .select('primary_skill, talent_categories, city')
        .eq('id', profileId)
        .single()

      if (gigData && profileData) {
        console.log('✅ Basic data available:')
        console.log('   Gig:', gigData.title, 'Looking for:', gigData.looking_for)
        console.log('   Profile:', profileData.primary_skill, 'Categories:', profileData.talent_categories)

        // Manual compatibility calculation
        const roleMatch = gigData.looking_for?.includes(profileData.primary_skill) ? 50 : 0
        const categoryMatch = (profileData.talent_categories || []).some(cat => gigData.looking_for?.includes(cat)) ? 30 : 0
        const locationMatch = gigData.city === profileData.city ? 20 : 0
        const totalScore = Math.min(roleMatch + categoryMatch + locationMatch, 100)

        console.log('🎯 Manual calculation:')
        console.log(`   Role match: ${roleMatch} points`)
        console.log(`   Category match: ${categoryMatch} points`)
        console.log(`   Location match: ${locationMatch} points`)
        console.log(`   Total: ${totalScore} points`)
      }

    } catch (err) {
      console.error('❌ Simple test failed:', err.message)
    }

    console.log('\n🎯 DIAGNOSIS:')
    console.log('The issue is likely:')
    console.log('1. Column type mismatch in the function definition')
    console.log('2. Need to check exact data types returned')
    console.log('3. May need to cast VARCHAR to TEXT or vice versa')

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugFunctionReturns()