import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch single published article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    // Fetch the article
    const { data: article, error } = await supabase
      .from('help_articles')
      .select(`
        id,
        title,
        slug,
        content,
        excerpt,
        is_featured,
        meta_title,
        meta_description,
        meta_keywords,
        published_at,
        updated_at,
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
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('help_categories.is_active', true)
      .single();

    if (error) {
      console.error('Error fetching help article:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get related articles from the same category
    const { data: relatedArticles } = await supabase
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
          slug
        )
      `)
      .eq('category_id', article.help_categories[0]?.id)
      .eq('is_published', true)
      .neq('id', article.id)
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      article,
      relatedArticles: relatedArticles || []
    });

  } catch (error) {
    console.error('Error in help article GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
