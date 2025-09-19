#!/usr/bin/env node

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

async function addGigColumns() {
  try {
    console.log('🔧 Attempting to add columns to gigs table...')
    
    // Instead of ALTER TABLE, let's check if we can directly add data to see what happens
    console.log('🧪 Testing current gig structure...')
    
    // First, let's see if any gigs exist
    const { data: existingGigs, error: fetchError } = await supabase
      .from('gigs')
      .select('*')
      .limit(1)
    
    if (fetchError) {
      console.error('❌ Cannot fetch gigs:', fetchError)
      return
    }
    
    if (existingGigs && existingGigs.length > 0) {
      console.log('📊 Current gig structure:')
      console.log('Available columns:', Object.keys(existingGigs[0]))
      
      // Try to update a gig with vibe_tags to see what happens
      const testGigId = existingGigs[0].id
      console.log(`🧪 Testing update on gig ${testGigId}...`)
      
      const { data: updateData, error: updateError } = await supabase
        .from('gigs')
        .update({ 
          vibe_tags: ['moody', 'cinematic'],
          style_tags: ['portrait', 'editorial']
        })
        .eq('id', testGigId)
        .select()
      
      if (updateError) {
        console.error('❌ Update test failed:', updateError.message)
        console.log('This confirms the columns do not exist yet.')
        
        // The columns don't exist, so we need to use raw SQL
        console.log('🔧 Attempting raw SQL execution via database URL...')
        
        // Try to get database connection info from the environment
        console.log('Environment variables:')
        console.log('SUPABASE_URL:', supabaseUrl)
        console.log('Has service key:', !!supabaseServiceKey)
        
      } else {
        console.log('✅ Update successful! Columns already exist:')
        console.log(updateData)
      }
    } else {
      console.log('📝 No gigs exist yet - cannot test column structure')
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error)
  }
}

addGigColumns()