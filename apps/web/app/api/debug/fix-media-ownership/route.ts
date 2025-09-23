import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's profile ID
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Find media records that have the wrong owner_user_id (using auth user ID instead of profile ID)
    const { data: incorrectMedia, error: findError } = await supabaseAdmin
      .from('media')
      .select('*')
      .eq('owner_user_id', user.id); // This should be the profile ID, not auth user ID

    if (findError) {
      console.error('Error finding incorrect media records:', findError);
      return NextResponse.json(
        { error: 'Failed to find media records' },
        { status: 500 }
      );
    }

    console.log(`Found ${incorrectMedia?.length || 0} media records with incorrect ownership`);

    if (incorrectMedia && incorrectMedia.length > 0) {
      // Update the media records to use the correct profile ID
      const { data: updatedMedia, error: updateError } = await supabaseAdmin
        .from('media')
        .update({ owner_user_id: userProfile.id })
        .eq('owner_user_id', user.id)
        .select();

      if (updateError) {
        console.error('Error updating media records:', updateError);
        return NextResponse.json(
          { error: 'Failed to update media records' },
          { status: 500 }
        );
      }

      console.log(`Successfully updated ${updatedMedia?.length || 0} media records`);

      return NextResponse.json({
        success: true,
        message: `Fixed ${updatedMedia?.length || 0} media records`,
        updatedRecords: updatedMedia?.length || 0,
        profileId: userProfile.id,
        authUserId: user.id
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No incorrect media records found',
        updatedRecords: 0,
        profileId: userProfile.id,
        authUserId: user.id
      });
    }

  } catch (error: any) {
    console.error('Fix media ownership API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
