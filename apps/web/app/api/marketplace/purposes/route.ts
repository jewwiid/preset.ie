import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/purposes - Fetch equipment request purposes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('equipment_request_purposes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .limit(limit);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: purposes, error } = await query;

    if (error) {
      console.error('Error fetching purposes:', error);
      return NextResponse.json({ error: 'Failed to fetch purposes' }, { status: 500 });
    }

    // Group purposes by category for better organization
    const groupedPurposes = purposes?.reduce((acc, purpose) => {
      if (!acc[purpose.category]) {
        acc[purpose.category] = [];
      }
      acc[purpose.category].push(purpose);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      purposes,
      groupedPurposes,
      categories: Object.keys(groupedPurposes || {}).sort()
    });

  } catch (error: any) {
    console.error('Purposes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/marketplace/purposes - Create custom purpose
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { custom_name, custom_display_name, custom_description } = body;

    if (!custom_name) {
      return NextResponse.json({ error: 'Custom purpose name is required' }, { status: 400 });
    }

    // Use the database function to validate and create custom purpose
    const { data, error } = await supabase.rpc('validate_and_create_custom_purpose', {
      p_custom_name: custom_name,
      p_custom_display_name: custom_display_name,
      p_custom_description: custom_description
    });

    if (error) {
      console.error('Error creating custom purpose:', error);
      return NextResponse.json({ error: 'Failed to create custom purpose' }, { status: 500 });
    }

    const result = data as any;

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // If purpose already exists, fetch the existing purpose details
    if (result.exists) {
      const { data: existingPurpose, error: fetchError } = await supabase
        .from('equipment_request_purposes')
        .select('*')
        .eq('id', result.purpose_id)
        .single();

      if (fetchError) {
        console.error('Error fetching existing purpose:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch existing purpose' }, { status: 500 });
      }

      return NextResponse.json({
        message: result.message,
        purpose: existingPurpose,
        exists: true
      });
    }

    // Fetch the newly created purpose
    const { data: newPurpose, error: fetchError } = await supabase
      .from('equipment_request_purposes')
      .select('*')
      .eq('id', result.purpose_id)
      .single();

    if (fetchError) {
      console.error('Error fetching new purpose:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch new purpose' }, { status: 500 });
    }

    return NextResponse.json({
      message: result.message,
      purpose: newPurpose,
      exists: false
    }, { status: 201 });

  } catch (error: any) {
    console.error('Custom purpose API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
