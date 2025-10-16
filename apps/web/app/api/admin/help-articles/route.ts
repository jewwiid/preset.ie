import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List all articles (admin view with unpublished)
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const isPublished = searchParams.get('isPublished');

    let query = supabase
      .from('help_articles')
      .select(`
        id,
        title,
        slug,
        excerpt,
        is_published,
        is_featured,
        meta_title,
        meta_description,
        display_order,
        created_at,
        updated_at,
        published_at,
        help_categories!inner(
          id,
          name,
          slug
        ),
        users_profile!inner(
          id,
          display_name,
          first_name,
          last_name
        )
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (isPublished !== null && isPublished !== undefined) {
      query = query.eq('is_published', isPublished === 'true');
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: articles, error } = await query;

    if (error) {
      console.error('Error fetching help articles:', error);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('help_articles')
      .select('id', { count: 'exact', head: true });

    if (categoryId) {
      countQuery = countQuery.eq('category_id', categoryId);
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (isPublished !== null && isPublished !== undefined) {
      countQuery = countQuery.eq('is_published', isPublished === 'true');
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

// POST: Create new article
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
      title,
      content,
      excerpt,
      categoryId,
      isPublished = false,
      isFeatured = false,
      metaTitle,
      metaDescription,
      metaKeywords = [],
      displayOrder = 0,
      slug
    } = body;

    // Validate required fields
    if (!title || !content || !categoryId) {
      return NextResponse.json({ 
        error: 'Title, content, and category are required' 
      }, { status: 400 });
    }

    // Check if category exists
    const { data: category } = await supabase
      .from('help_categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check if slug is unique
    let finalSlug = slug;
    if (!finalSlug) {
      // Generate slug from title
      finalSlug = title
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
      const { data: existingArticle } = await supabase
        .from('help_articles')
        .select('id')
        .eq('slug', uniqueSlug)
        .single();

      if (!existingArticle) break;
      
      uniqueSlug = `${finalSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Create article
    const { data: article, error } = await supabase
      .from('help_articles')
      .insert({
        title,
        content,
        excerpt,
        category_id: categoryId,
        author_id: user.id,
        is_published: isPublished,
        is_featured: isFeatured,
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        display_order: displayOrder,
        slug: uniqueSlug,
        published_at: isPublished ? new Date().toISOString() : null
      })
      .select(`
        id,
        title,
        slug,
        excerpt,
        is_published,
        is_featured,
        meta_title,
        meta_description,
        display_order,
        created_at,
        updated_at,
        published_at,
        help_categories!inner(
          id,
          name,
          slug
        ),
        users_profile!inner(
          id,
          display_name,
          first_name,
          last_name
        )
      `)
      .single();

    if (error) {
      console.error('Error creating help article:', error);
      return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }

    return NextResponse.json({ article }, { status: 201 });

  } catch (error) {
    console.error('Error in help articles POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
