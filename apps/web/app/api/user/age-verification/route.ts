import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's age verification status
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('date_of_birth, age_verified, age_verified_at, account_status, verification_method')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get NSFW preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('user_content_preferences')
      .select('nsfw_consent_given, nsfw_consent_given_at, show_nsfw_content, blur_nsfw_content')
      .eq('user_id', user.id)
      .single();

    // Calculate age if date of birth exists
    let calculatedAge = null;
    if (profile.date_of_birth) {
      const birthDate = new Date(profile.date_of_birth);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    return NextResponse.json({
      age_verified: profile.age_verified,
      age_verified_at: profile.age_verified_at,
      account_status: profile.account_status,
      verification_method: profile.verification_method,
      date_of_birth: profile.date_of_birth,
      calculated_age: calculatedAge,
      nsfw_consent_given: preferences?.nsfw_consent_given || false,
      nsfw_consent_given_at: preferences?.nsfw_consent_given_at,
      show_nsfw_content: preferences?.show_nsfw_content || false,
      blur_nsfw_content: preferences?.blur_nsfw_content !== false, // Default to true
      can_view_nsfw: profile.age_verified && (preferences?.nsfw_consent_given || false) && (preferences?.show_nsfw_content || false)
    });

  } catch (error) {
    console.error('Age verification check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date_of_birth, verification_method = 'self_attestation' } = body;

    if (!date_of_birth) {
      return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 });
    }

    // Validate date of birth format
    const birthDate = new Date(date_of_birth);
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Check if user is 18 or older
    if (age < 18) {
      return NextResponse.json({ 
        error: 'You must be 18 or older to verify your age',
        age_verified: false,
        calculated_age: age
      }, { status: 403 });
    }

    // Update user profile with age verification
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({
        date_of_birth: date_of_birth,
        age_verified: true,
        age_verified_at: new Date().toISOString(),
        verification_method: verification_method,
        account_status: 'age_verified',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Log the verification
    const { error: logError } = await supabase
      .from('age_verification_logs')
      .insert({
        user_id: user.id,
        verification_type: 'age',
        verification_method: verification_method,
        verification_data: {
          date_of_birth: date_of_birth,
          calculated_age: age
        },
        success: true,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      });

    if (logError) {
      console.error('Log error:', logError);
      // Don't fail the request for logging errors
    }

    return NextResponse.json({
      success: true,
      age_verified: true,
      calculated_age: age,
      message: 'Age verification successful'
    });

  } catch (error) {
    console.error('Age verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
