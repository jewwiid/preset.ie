#!/usr/bin/env node

// Test script for enhanced signup flow with new profile fields
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testEnhancedSignup() {
  console.log('Testing Enhanced Signup Flow...\n')
  
  // Test user data
  const testEmail = `test${Date.now()}@preset.ie`
  const testPassword = 'TestPassword123!'
  
  try {
    // Step 1: Create auth account
    console.log('1. Creating auth account...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) throw authError
    console.log('✅ Auth account created:', authData.user.id)
    
    // Step 2: Create enhanced profile
    console.log('\n2. Creating enhanced profile...')
    const profileData = {
      user_id: authData.user.id,
      display_name: 'Test Creator',
      handle: `creator${Date.now()}`,
      bio: 'Professional photographer and videographer',
      city: 'Dublin',
      country: 'Ireland',
      date_of_birth: '1995-05-15',
      age_verified: false,
      account_status: 'pending_verification',
      role_flags: ['CONTRIBUTOR', 'TALENT'],
      style_tags: ['Portrait', 'Fashion', 'Editorial'],
      
      // Social media
      instagram_handle: 'testcreator',
      tiktok_handle: 'testcreator',
      website_url: 'https://testcreator.com',
      portfolio_url: 'https://portfolio.testcreator.com',
      phone_number: '+353123456789',
      
      // Contributor fields
      years_experience: 5,
      specializations: ['Portrait Photography', 'Fashion Photography'],
      equipment_list: ['Canon R5', 'Sony A7IV', 'Studio Lighting'],
      editing_software: ['Adobe Lightroom', 'Capture One'],
      languages: ['English', 'Irish'],
      hourly_rate_min: 150,
      hourly_rate_max: 300,
      available_for_travel: true,
      travel_radius_km: 100,
      studio_name: 'Test Studio',
      has_studio: true,
      studio_address: '123 Test Street, Dublin',
      typical_turnaround_days: 7,
      
      // Talent fields
      height_cm: 180,
      measurements: {
        chest: '100cm',
        waist: '80cm',
        hips: '95cm'
      },
      eye_color: 'Blue',
      hair_color: 'Brown',
      shoe_size: '42 EU',
      clothing_sizes: {
        shirt: 'M',
        pants: '32',
        jacket: '40R'
      },
      tattoos: false,
      piercings: false,
      talent_categories: ['Model', 'Actor'],
      
      // Subscription
      subscription_tier: 'FREE',
      subscription_status: 'ACTIVE'
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .insert(profileData)
      .select()
      .single()
    
    if (profileError) throw profileError
    console.log('✅ Enhanced profile created')
    
    // Step 3: Verify age
    console.log('\n3. Running age verification...')
    const { data: ageResult, error: ageError } = await supabase
      .rpc('verify_user_age', {
        p_user_id: authData.user.id,
        p_date_of_birth: '1995-05-15',
        p_method: 'self_attestation'
      })
    
    if (ageError) throw ageError
    console.log('✅ Age verification:', ageResult ? 'Passed' : 'Failed')
    
    // Step 4: Calculate profile completion
    console.log('\n4. Calculating profile completion...')
    const { data: completion, error: completionError } = await supabase
      .rpc('calculate_profile_completion', {
        user_id: authData.user.id
      })
    
    if (completionError) throw completionError
    console.log('✅ Profile completion:', completion + '%')
    
    // Step 5: Fetch and display the created profile
    console.log('\n5. Fetching created profile...')
    const { data: finalProfile, error: fetchError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()
    
    if (fetchError) throw fetchError
    
    console.log('\n📋 Profile Summary:')
    console.log('- Display Name:', finalProfile.display_name)
    console.log('- Handle:', finalProfile.handle)
    console.log('- Location:', finalProfile.city + ', ' + finalProfile.country)
    console.log('- Roles:', finalProfile.role_flags.join(', '))
    console.log('- Instagram:', finalProfile.instagram_handle)
    console.log('- Years Experience:', finalProfile.years_experience)
    console.log('- Equipment:', finalProfile.equipment_list.join(', '))
    console.log('- Height:', finalProfile.height_cm + 'cm')
    console.log('- Age Verified:', finalProfile.age_verified)
    console.log('- Account Status:', finalProfile.account_status)
    console.log('- Profile Completion:', finalProfile.profile_completion_percentage + '%')
    
    console.log('\n✅ Enhanced signup flow test completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run the test
testEnhancedSignup()