import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// POST /api/marketplace/equipment/custom - Add custom equipment to database
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json();
    const {
      equipment_name,
      category,
      brand,
      model
    } = body;

    if (!equipment_name || !category) {
      return NextResponse.json({ 
        error: 'Equipment name and category are required' 
      }, { status: 400 });
    }

    // Get the equipment type ID for the category
    const { data: equipmentType, error: typeError } = await supabase
      .from('equipment_types')
      .select('id')
      .eq('name', category)
      .single();

    if (typeError || !equipmentType) {
      return NextResponse.json({ 
        error: 'Invalid equipment category' 
      }, { status: 400 });
    }

    // Check if this equipment already exists
    const { data: existingEquipment } = await supabase
      .from('equipment_predefined_models')
      .select('id')
      .eq('equipment_type_id', equipmentType.id)
      .eq('brand', brand || equipment_name.split(' ')[0])
      .eq('model', model || equipment_name.split(' ').slice(1).join(' '))
      .single();

    if (existingEquipment) {
      return NextResponse.json({ 
        message: 'Equipment already exists in database',
        equipment: existingEquipment
      });
    }

    // Add the custom equipment to predefined models
    const { data: newEquipment, error } = await supabase
      .from('equipment_predefined_models')
      .insert({
        equipment_type_id: equipmentType.id,
        brand: brand || equipment_name.split(' ')[0],
        model: model || equipment_name.split(' ').slice(1).join(' ') || equipment_name,
        description: `Custom equipment added by user`,
        sort_order: 999, // Put custom equipment at the end
        is_active: true
      })
      .select(`
        *,
        equipment_types!inner(
          id,
          name,
          display_name,
          category
        )
      `)
      .single();

    if (error) {
      console.error('Error adding custom equipment:', error);
      return NextResponse.json({ 
        error: 'Failed to add custom equipment' 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Custom equipment added successfully',
      equipment: newEquipment
    }, { status: 201 });

  } catch (error) {
    console.error('Custom equipment API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
