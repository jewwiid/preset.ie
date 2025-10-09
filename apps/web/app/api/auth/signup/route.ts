import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role, dateOfBirth } = body;

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile (this will fire the welcome_email_trigger!)
    const { data: profileData, error: profileError } = await supabase
      .from('users_profile')
      .insert({
        user_id: authData.user.id,
        display_name: `${firstName} ${lastName}`,
        handle: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`,
        role_flags: [role],
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        availability_status: 'Available',
        city: 'Manchester',  // From Jewdie's profile
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      profile: profileData,
      message: 'Account created successfully! Welcome email trigger should fire.'
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

