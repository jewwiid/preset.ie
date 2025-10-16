import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Load published help articles from the database
    const { data: articles, error } = await supabase
      .from('help_articles')
      .select(`
        id,
        title,
        content,
        excerpt,
        meta_keywords,
        is_featured,
        display_order,
        created_at,
        help_categories!inner(
          id,
          name,
          slug,
          description
        )
      `)
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load help articles:', error);
      // Fallback to basic knowledge items
      const fallbackItems = getFallbackKnowledgeItems();
      return NextResponse.json({
        success: true,
        items: fallbackItems,
        count: fallbackItems.length,
        fallback: true,
        error: error.message
      });
    }

    // Convert help articles to knowledge base format
    const items = (articles || []).map(article => {
      const category = Array.isArray(article.help_categories) 
        ? article.help_categories[0] 
        : article.help_categories;
      
      return {
        id: `article-${article.id}`,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        category: category?.name || 'General',
        categorySlug: category?.slug || 'general',
        keywords: article.meta_keywords || [],
        priority: article.is_featured ? 10 : 5,
        source: 'help_articles',
        publishedAt: article.created_at,
        section: category?.name || 'General' // Required by KnowledgeItem interface
      };
    });

    // Add fallback knowledge items if no articles found
    if (items.length === 0) {
      console.log('No help articles found, using fallback knowledge');
      items.push(...getFallbackKnowledgeItems());
    }

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
      source: 'help_articles'
    });

  } catch (error) {
    console.error('Failed to load knowledge base:', error);
    
    // Return fallback knowledge items
    const fallbackItems = getFallbackKnowledgeItems();
    
    return NextResponse.json({
      success: true,
      items: fallbackItems,
      count: fallbackItems.length,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function getFallbackKnowledgeItems(): any[] {
  return [
    {
      id: 'platform-overview',
      title: 'Preset Platform Overview',
      content: 'Preset is a subscription-based creative collaboration platform connecting Contributors (photographers/videographers) with Talent (models/creative partners) for professional shoots.',
      category: 'Platform',
      section: 'Platform',
      priority: 10,
      keywords: ['preset', 'platform', 'creative', 'collaboration', 'photographers', 'models', 'shoots'],
      source: 'fallback'
    },
    {
      id: 'subscription-tiers',
      title: 'Subscription Tiers',
      content: 'Preset offers three subscription tiers: Free (basic features), Plus (enhanced features and AI tools), and Pro (full access to all features including premium AI tools).',
      category: 'Subscription',
      section: 'Subscription',
      priority: 9,
      keywords: ['subscription', 'tiers', 'free', 'plus', 'pro', 'features', 'ai', 'tools'],
      source: 'fallback'
    },
    {
      id: 'gig-system',
      title: 'Gig System',
      content: 'Users can create and discover gigs for creative collaborations. Contributors post gigs, and Talent can apply to participate in shoots.',
      category: 'Gigs',
      section: 'Gigs',
      priority: 8,
      keywords: ['gigs', 'create', 'discover', 'apply', 'collaborations', 'shoots', 'contributors', 'talent'],
      source: 'fallback'
    },
    {
      id: 'messaging-system',
      title: 'Messaging System',
      content: 'Preset includes an in-app messaging system for secure communication between users during the collaboration process.',
      category: 'Communication',
      section: 'Communication',
      priority: 7,
      keywords: ['messaging', 'communication', 'in-app', 'secure', 'users', 'collaboration'],
      source: 'fallback'
    },
    {
      id: 'ai-tools',
      title: 'AI-Powered Tools',
      content: 'Preset offers AI-powered image enhancement, voice-to-text transcription, and other creative tools to enhance the collaboration experience.',
      category: 'AI Tools',
      section: 'AI Tools',
      priority: 6,
      keywords: ['ai', 'tools', 'enhancement', 'voice', 'text', 'transcription', 'creative'],
      source: 'fallback'
    }
  ];
}
