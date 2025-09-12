import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('Testing database setup...')
  
  try {
    // Check users_profile table structure
    console.log('1. Checking users_profile table structure...')
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .limit(1)
      
      if (error) {
        console.log('Profile table check error:', error.message)
      } else {
        console.log('✓ users_profile table exists and accessible')
      }
    } catch (err) {
      console.error('Table check failed:', err.message)
    }

    // Test vibe/style tags database operations
    console.log('2. Testing vibe/style tags operations...')
    const testUserId = '00000000-0000-0000-0000-000000000001' // dummy UUID for testing

    // Test insert with style and vibe tags
    const testData = {
      user_id: testUserId,
      handle: 'testuser123',
      display_name: 'Test User',
      bio: 'Test bio',
      city: 'Test City',
      style_tags: ['minimal', 'urban', 'vintage'],
      vibe_tags: ['calm', 'energetic', 'creative'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Attempting to upsert test profile...')
    const { data: insertData, error: insertError } = await supabase
      .from('users_profile')
      .upsert(testData)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
    } else {
      console.log('✓ Test profile insert successful')
      console.log('Inserted data:', insertData)
    }

    // Test retrieval of style and vibe tags
    console.log('3. Testing retrieval of vibe/style tags...')
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('users_profile')
      .select('user_id, display_name, style_tags, vibe_tags')
      .eq('user_id', testUserId)
      .single()

    if (retrieveError) {
      console.error('Retrieve error:', retrieveError)
    } else {
      console.log('✓ Retrieved profile data:')
      console.log('Style tags:', retrievedData?.style_tags)
      console.log('Vibe tags:', retrievedData?.vibe_tags)
    }

    // Test update of style and vibe tags
    console.log('4. Testing update of vibe/style tags...')
    const updatedTags = {
      style_tags: ['contemporary', 'bold', 'artistic'],
      vibe_tags: ['dynamic', 'inspiring', 'professional'],
      updated_at: new Date().toISOString()
    }

    const { data: updateData, error: updateError } = await supabase
      .from('users_profile')
      .update(updatedTags)
      .eq('user_id', testUserId)
      .select('style_tags, vibe_tags')

    if (updateError) {
      console.error('Update error:', updateError)
    } else {
      console.log('✓ Profile tags updated successfully')
      console.log('Updated data:', updateData)
    }

    // Check user_settings table
    console.log('5. Testing user_settings table...')
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1)

    if (settingsError) {
      console.log('User settings table not found or error:', settingsError.message)
    } else {
      console.log('✓ user_settings table exists and accessible')
    }

    // Clean up test data
    console.log('6. Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('users_profile')
      .delete()
      .eq('user_id', testUserId)

    if (!deleteError) {
      console.log('✓ Test cleanup successful')
    }

  } catch (error) {
    console.error('Database test failed:', error)
  }
}

testDatabase()