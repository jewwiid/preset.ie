const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zbsmgymyfhnwjdnmlelr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U'
)

async function checkVibeTags() {
  console.log('🔍 Checking if vibe_tags column exists...')

  try {
    // Try to select vibe_tags specifically
    const { data, error } = await supabase
      .from('gigs')
      .select('id, vibe_tags')
      .limit(1)

    if (error) {
      console.log('❌ vibe_tags column does not exist:', error.message)
      return false
    } else {
      console.log('✅ vibe_tags column exists!')
      return true
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
    return false
  }
}

checkVibeTags()