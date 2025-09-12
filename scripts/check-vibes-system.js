const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkVibesSystem() {
  console.log('🔍 Checking vibes system setup...\n')
  
  try {
    // Check if vibes_master table exists
    const { data: vibesMaster, error: vibesMasterError } = await supabase
      .from('vibes_master')
      .select('name, display_name, category')
      .limit(10)
    
    if (vibesMasterError) {
      console.log('❌ vibes_master table does not exist:', vibesMasterError.message)
    } else {
      console.log('✅ vibes_master table exists with', vibesMaster.length, 'entries')
      console.log('Sample entries:')
      vibesMaster.forEach(vibe => {
        console.log(`  - ${vibe.display_name} (${vibe.name}) [${vibe.category}]`)
      })
      console.log()
    }
    
    // Check current gigs vibe/style structure
    const { data: gigs, error: gigsError } = await supabase
      .from('gigs')
      .select('id, title, vibe_tags, style_tags')
      .not('vibe_tags', 'is', null)
      .limit(3)
    
    if (gigsError) {
      console.log('❌ Error checking gigs:', gigsError.message)
    } else {
      console.log('✅ Found', gigs.length, 'gigs with vibe_tags:')
      gigs.forEach(gig => {
        console.log(`  - "${gig.title}":`)
        console.log(`    Vibes: ${JSON.stringify(gig.vibe_tags)}`)
        console.log(`    Styles: ${JSON.stringify(gig.style_tags)}`)
      })
      console.log()
    }
    
    // Check moodboard vibes structure
    const { data: moodboards, error: moodboardsError } = await supabase
      .from('moodboards')
      .select('id, vibes')
      .not('vibes', 'is', null)
      .limit(3)
    
    if (moodboardsError) {
      console.log('❌ Error checking moodboards:', moodboardsError.message)
    } else {
      console.log('✅ Found', moodboards.length, 'moodboards with vibes:')
      moodboards.forEach(board => {
        console.log(`  - Moodboard ${board.id}: ${JSON.stringify(board.vibes)}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkVibesSystem()