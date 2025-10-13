import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAllSteps, ProfileFormData } from '@/lib/profile-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle parameter is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user from the request headers (set by middleware)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Extract user ID from the auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      new_handle, 
      display_name, 
      bio, 
      city, 
      country,
      // Professional fields
      years_experience,
      languages,
      specializations,
      equipment_list,
      editing_software,
      professional_skills,
      contributor_roles,
      performance_roles,
      experience_level,
      // Contact fields
      instagram_handle,
      tiktok_handle,
      website_url,
      portfolio_url,
      behance_url,
      dribbble_url,
      phone_number,
      // Availability fields
      availability_status,
      hourly_rate_min,
      hourly_rate_max,
      available_for_travel,
      travel_radius_km,
      has_studio,
      studio_name,
      available_weekdays,
      available_weekends,
      available_evenings,
      available_overnight,
      accepts_tfp,
      accepts_expenses_only,
      allow_direct_booking,
      // Privacy fields
      show_experience,
      show_specializations,
      show_equipment,
      show_social_links,
      show_website,
      show_phone,
      phone_public,
      email_public,
      show_rates,
      show_availability
    } = body as ProfileFormData & { new_handle?: string };

    // Validate new handle if provided
    if (new_handle) {
      // Check handle format
      if (!/^[a-z0-9_]{3,30}$/.test(new_handle)) {
        return NextResponse.json(
          { error: 'Handle must be 3-30 characters, lowercase letters, numbers, and underscores only' },
          { status: 400 }
        );
      }

      // Check if new handle is available
      const { data: existingProfile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('handle', new_handle)
        .neq('user_id', user.id) // Exclude current user
        .single();

      if (existingProfile) {
        return NextResponse.json(
          { error: 'Handle is already taken' },
          { status: 409 }
        );
      }
    }

    // Get current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching current profile:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Validate the profile data
    const validationResult = validateAllSteps({
      display_name,
      handle: new_handle || currentProfile.handle,
      bio,
      city,
      country,
      years_experience,
      languages,
      specializations,
      equipment_list,
      editing_software,
      professional_skills,
      contributor_roles,
      performance_roles,
      experience_level,
      instagram_handle,
      tiktok_handle,
      website_url,
      portfolio_url,
      behance_url,
      dribbble_url,
      phone_number,
      availability_status,
      hourly_rate_min,
      hourly_rate_max,
      available_for_travel,
      travel_radius_km,
      has_studio,
      studio_name
    });

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.errors },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Basic fields
    if (new_handle !== undefined) updateData.handle = new_handle;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;

    // Professional fields
    if (years_experience !== undefined) updateData.years_experience = years_experience;
    if (languages !== undefined) updateData.languages = languages;
    if (specializations !== undefined) updateData.specializations = specializations;
    if (equipment_list !== undefined) updateData.equipment_list = equipment_list;
    if (editing_software !== undefined) updateData.editing_software = editing_software;
    if (professional_skills !== undefined) updateData.professional_skills = professional_skills;
    if (contributor_roles !== undefined) updateData.contributor_roles = contributor_roles;
    if (performance_roles !== undefined) updateData.performance_roles = performance_roles;
    if (experience_level !== undefined) updateData.experience_level = experience_level;

    // Contact fields
    if (instagram_handle !== undefined) updateData.instagram_handle = instagram_handle;
    if (tiktok_handle !== undefined) updateData.tiktok_handle = tiktok_handle;
    if (website_url !== undefined) updateData.website_url = website_url;
    if (portfolio_url !== undefined) updateData.portfolio_url = portfolio_url;
    if (behance_url !== undefined) updateData.behance_url = behance_url;
    if (dribbble_url !== undefined) updateData.dribbble_url = dribbble_url;
    if (phone_number !== undefined) updateData.phone_number = phone_number;

    // Availability fields
    if (availability_status !== undefined) updateData.availability_status = availability_status;
    if (hourly_rate_min !== undefined) updateData.hourly_rate_min = hourly_rate_min;
    if (hourly_rate_max !== undefined) updateData.hourly_rate_max = hourly_rate_max;
    if (available_for_travel !== undefined) updateData.available_for_travel = available_for_travel;
    if (travel_radius_km !== undefined) updateData.travel_radius_km = travel_radius_km;
    if (has_studio !== undefined) updateData.has_studio = has_studio;
    if (studio_name !== undefined) updateData.studio_name = studio_name;
    if (available_weekdays !== undefined) updateData.available_weekdays = available_weekdays;
    if (available_weekends !== undefined) updateData.available_weekends = available_weekends;
    if (available_evenings !== undefined) updateData.available_evenings = available_evenings;
    if (available_overnight !== undefined) updateData.available_overnight = available_overnight;
    if (accepts_tfp !== undefined) updateData.accepts_tfp = accepts_tfp;
    if (accepts_expenses_only !== undefined) updateData.accepts_expenses_only = accepts_expenses_only;
    if (allow_direct_booking !== undefined) updateData.allow_direct_booking = allow_direct_booking;

    // Privacy fields
    if (show_experience !== undefined) updateData.show_experience = show_experience;
    if (show_specializations !== undefined) updateData.show_specializations = show_specializations;
    if (show_equipment !== undefined) updateData.show_equipment = show_equipment;
    if (show_social_links !== undefined) updateData.show_social_links = show_social_links;
    if (show_website !== undefined) updateData.show_website = show_website;
    if (show_phone !== undefined) updateData.show_phone = show_phone;
    if (phone_public !== undefined) updateData.phone_public = phone_public;
    if (email_public !== undefined) updateData.email_public = email_public;
    if (show_rates !== undefined) updateData.show_rates = show_rates;
    if (show_availability !== undefined) updateData.show_availability = show_availability;

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users_profile')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      redirect_needed: new_handle && new_handle !== currentProfile.handle
    }, { status: 200 });

  } catch (error: any) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
