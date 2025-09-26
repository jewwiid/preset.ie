import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/equipment - Get equipment types, brands, and models
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'types', 'brands', 'models', or 'all'
    const category = searchParams.get('category'); // Filter models by category
    const search = searchParams.get('search'); // Search term for models

    if (type === 'types' || type === 'all') {
      const { data: equipmentTypes, error: typesError } = await supabase
        .from('equipment_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (typesError) {
        console.error('Error fetching equipment types:', typesError);
        return NextResponse.json({ 
          error: 'Failed to fetch equipment types' 
        }, { status: 500 });
      }

      if (type === 'types') {
        return NextResponse.json({ equipmentTypes });
      }
    }

    if (type === 'brands' || type === 'all') {
      const { data: equipmentBrands, error: brandsError } = await supabase
        .from('equipment_brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (brandsError) {
        console.error('Error fetching equipment brands:', brandsError);
        return NextResponse.json({ 
          error: 'Failed to fetch equipment brands' 
        }, { status: 500 });
      }

      if (type === 'brands') {
        return NextResponse.json({ equipmentBrands });
      }
    }

    if (type === 'models' || type === 'all') {
      let query = supabase
        .from('equipment_predefined_models')
        .select(`
          *,
          equipment_types!inner(
            id,
            name,
            display_name,
            category
          )
        `)
        .eq('is_active', true)
        .order('sort_order');

      // Filter by category if provided
      if (category) {
        query = query.eq('equipment_types.name', category);
      }

      // Search by brand or model if provided
      if (search) {
        query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);
      }

      const { data: predefinedModels, error: modelsError } = await query;

      if (modelsError) {
        console.error('Error fetching predefined models:', modelsError);
        return NextResponse.json({ 
          error: 'Failed to fetch predefined models' 
        }, { status: 500 });
      }

      if (type === 'models') {
        return NextResponse.json({ predefinedModels });
      }
    }

    // Return all data if type is 'all' or not specified
    const { data: equipmentTypes, error: typesError } = await supabase
      .from('equipment_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    const { data: equipmentBrands, error: brandsError } = await supabase
      .from('equipment_brands')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    const { data: predefinedModels, error: modelsError } = await supabase
      .from('equipment_predefined_models')
      .select(`
        *,
        equipment_types!inner(
          id,
          name,
          display_name,
          category
        )
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (typesError || brandsError || modelsError) {
      console.error('Error fetching equipment data:', { typesError, brandsError, modelsError });
      return NextResponse.json({ 
        error: 'Failed to fetch equipment data' 
      }, { status: 500 });
    }

    return NextResponse.json({
      equipmentTypes: equipmentTypes || [],
      equipmentBrands: equipmentBrands || [],
      predefinedModels: predefinedModels || []
    });

  } catch (error) {
    console.error('Equipment API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
