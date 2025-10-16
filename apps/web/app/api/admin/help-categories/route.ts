import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List all categories
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    if (!profile || !profile.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('help_categories')
      .select(`
        id,
        name,
        slug,
        description,
        icon_name,
        color_class,
        display_order,
        is_active,
        created_at,
        updated_at,
        help_articles!left(count)
      `)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching help categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Get article counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('help_articles')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', category.id);

        return {
          ...category,
          article_count: count || 0
        };
      })
    );

    return NextResponse.json({ categories: categoriesWithCounts });

  } catch (error) {
    console.error('Error in help categories GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new category
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    if (!profile || !profile.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      iconName,
      colorClass,
      displayOrder = 0,
      isActive = true,
      slug
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'Name is required' 
      }, { status: 400 });
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    // Ensure slug is unique
    let slugCounter = 1;
    let uniqueSlug = finalSlug;
    while (true) {
      const { data: existingCategory } = await supabase
        .from('help_categories')
        .select('id')
        .eq('slug', uniqueSlug)
        .single();

      if (!existingCategory) break;
      
      uniqueSlug = `${finalSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Create category
    const { data: category, error } = await supabase
      .from('help_categories')
      .insert({
        name,
        slug: uniqueSlug,
        description,
        icon_name: iconName,
        color_class: colorClass,
        display_order: displayOrder,
        is_active: isActive
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating help category:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json({ category }, { status: 201 });

  } catch (error) {
    console.error('Error in help categories POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update categories (for reordering and bulk updates)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    if (!profile || !profile.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body; // Array of category updates

    if (!Array.isArray(updates)) {
      return NextResponse.json({ 
        error: 'Updates must be an array' 
      }, { status: 400 });
    }

    // Update categories
    const updatePromises = updates.map(async (update: any) => {
      const { id, ...updateData } = update;
      
      const { data, error } = await supabase
        .from('help_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating category ${id}:`, error);
        throw error;
      }

      return data;
    });

    const updatedCategories = await Promise.all(updatePromises);

    return NextResponse.json({ categories: updatedCategories });

  } catch (error) {
    console.error('Error in help categories PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
