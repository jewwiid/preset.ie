const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateGigNaming() {
  try {
    console.log('=== UPDATING GIG TO USE SIMPLE NAMING ===')

    // Update the existing gig
    const { data: gig, error: updateError } = await supabase
      .from('gigs')
      .update({
        looking_for_types: ['Model', 'Fashion Model'],
        looking_for: ['Actor', 'Model']
      })
      .eq('id', '0cf28b9a-1941-441e-9f5a-3b909b991dac')
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return
    }

    console.log('Updated gig:', gig)

    // Verify the update
    const { data: verified, error: verifyError } = await supabase
      .from('gigs')
      .select('id, title, looking_for_types, looking_for, status')
      .eq('id', '0cf28b9a-1941-441e-9f5a-3b909b991dac')
      .single()

    if (verifyError) {
      console.error('Verify error:', verifyError)
      return
    }

    console.log('Verified gig:', verified)

  } catch (error) {
    console.error('Update failed:', error)
  }
}

updateGigNaming()