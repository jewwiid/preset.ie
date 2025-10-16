import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List published articles with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';

    // Build the query
    let query = supabase
      .from('help_articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        is_featured,
        published_at,
        help_categories!inner(
          id,
          name,
          slug,
          icon_name,
          color_class
        ),
        users_profile!inner(
          id,
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('is_published', true)
      .eq('help_categories.is_active', true);

    // Apply filters
    if (categorySlug) {
      query = query.eq('help_categories.slug', categorySlug);
    }

    if (search) {
      // Use full-text search if available, fallback to ILIKE
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    if (featured) {
      query = query.eq('is_featured', true);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by featured first, then by display order, then by published date
    query = query
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false });

    const { data: articles, error } = await query;

    if (error) {
      console.error('Error fetching help articles:', error);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('help_articles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    if (categorySlug) {
      countQuery = countQuery.eq('help_categories.slug', categorySlug);
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    if (featured) {
      countQuery = countQuery.eq('is_featured', true);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      articles: articles || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in help articles GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
