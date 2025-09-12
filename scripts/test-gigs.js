const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  'https://zbsmgymyfhnwjdnmlelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U'
)

async function testGigs() {
  console.log('🔍 Testing Gigs and Profiles...')

  try {
    // Check if users_profile table has any data
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profile')
      .select('id, user_id, display_name, handle')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
    } else {
      console.log(`📋 Found ${profiles?.length || 0} profiles:`)
      profiles?.forEach((profile, i) => {
        console.log(`   ${i+1}. ${profile.display_name} (@${profile.handle}) - ID: ${profile.id}`)
      })
    }

    // Check if gigs table has any data
    const { data: gigs, error: gigsError } = await supabase
      .from('gigs')
      .select('id, title, owner_user_id, status, created_at')
      .limit(5)
    
    if (gigsError) {
      console.error('❌ Error fetching gigs:', gigsError)
    } else {
      console.log(`\n🎯 Found ${gigs?.length || 0} gigs:`)
      gigs?.forEach((gig, i) => {
        console.log(`   ${i+1}. "${gig.title}" (${gig.status}) - Owner: ${gig.owner_user_id}`)
      })
    }

    // Check if there's any relationship issue
    if (profiles?.length && gigs?.length) {
      console.log('\n🔍 Checking relationships...')
      
      // Get gigs with profiles
      const { data: gigsWithProfiles, error: joinError } = await supabase
        .from('gigs')
        .select(`
          id, title, status,
          users_profile!owner_user_id (
            display_name, handle
          )
        `)
        .limit(3)
      
      if (joinError) {
        console.error('❌ Error joining gigs with profiles:', joinError)
      } else {
        console.log(`✅ Successfully joined ${gigsWithProfiles?.length || 0} gigs with profiles`)
        gigsWithProfiles?.forEach((gig, i) => {
          console.log(`   ${i+1}. "${gig.title}" by ${gig.users_profile?.display_name || 'Unknown'}`)
        })
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✅ Database test complete`)
    console.log(`📊 Profiles: ${profiles?.length || 0}, Gigs: ${gigs?.length || 0}`)
    console.log('='.repeat(50))

  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

testGigs()