import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch single article for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const { data: article, error } = await supabase
      .from('help_articles')
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        category_id,
        is_published,
        is_featured,
        meta_title,
        meta_description,
        meta_keywords,
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching help article:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    }

    return NextResponse.json({ article });

  } catch (error) {
    console.error('Error in help article GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      isPublished,
      isFeatured,
      metaTitle,
      metaDescription,
      metaKeywords,
      displayOrder,
      slug
    } = body;

    // Validate required fields
    if (!title || !content || !categoryId) {
      return NextResponse.json({ 
        error: 'Title, content, and category are required' 
      }, { status: 400 });
    }

    // Check if article exists
    const { data: existingArticle } = await supabase
      .from('help_articles')
      .select('id, slug, is_published')
      .eq('id', id)
      .single();

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
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

    // Handle slug uniqueness if it's being changed
    let finalSlug = slug || existingArticle.slug;
    if (slug && slug !== existingArticle.slug) {
      // Check if new slug is unique
      const { data: slugConflict } = await supabase
        .from('help_articles')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (slugConflict) {
        // Generate unique slug
        let slugCounter = 1;
        let uniqueSlug = slug;
        while (true) {
          const { data: existingSlug } = await supabase
            .from('help_articles')
            .select('id')
            .eq('slug', uniqueSlug)
            .neq('id', id)
            .single();

          if (!existingSlug) break;
          
          uniqueSlug = `${slug}-${slugCounter}`;
          slugCounter++;
        }
        finalSlug = uniqueSlug;
      }
    }

    // Prepare update data
    const updateData: any = {
      title,
      content,
      excerpt,
      category_id: categoryId,
      is_published: isPublished,
      is_featured: isFeatured,
      meta_title: metaTitle,
      meta_description: metaDescription,
      meta_keywords: metaKeywords,
      display_order: displayOrder,
      slug: finalSlug,
      updated_at: new Date().toISOString()
    };

    // Handle published_at based on publication status
    if (isPublished && !existingArticle.is_published) {
      updateData.published_at = new Date().toISOString();
    } else if (!isPublished) {
      updateData.published_at = null;
    }

    // Update article
    const { data: article, error } = await supabase
      .from('help_articles')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        category_id,
        is_published,
        is_featured,
        meta_title,
        meta_description,
        meta_keywords,
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
      console.error('Error updating help article:', error);
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }

    return NextResponse.json({ article });

  } catch (error) {
    console.error('Error in help article PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete article (soft delete option)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Check if article exists
    const { data: existingArticle } = await supabase
      .from('help_articles')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Delete article (hard delete)
    const { error } = await supabase
      .from('help_articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting help article:', error);
      return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in help article DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
