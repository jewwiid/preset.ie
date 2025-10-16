import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    hateThreatening: boolean;
    harassment: boolean;
    harassmentThreatening: boolean;
    selfHarm: boolean;
    selfHarmIntent: boolean;
    selfHarmInstructions: boolean;
    sexual: boolean;
    sexualMinors: boolean;
    violence: boolean;
    violenceGraphic: boolean;
    illicit: boolean;
    illicitViolent: boolean;
  };
  categoryScores: {
    hate: number;
    hateThreatening: number;
    harassment: number;
    harassmentThreatening: number;
    selfHarm: number;
    selfHarmIntent: number;
    selfHarmInstructions: number;
    sexual: number;
    sexualMinors: number;
    violence: number;
    violenceGraphic: number;
    illicit: number;
    illicitViolent: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Content moderation not available',
          flagged: false,
          categories: {},
          categoryScores: {}
        },
        { status: 200 } // Return 200 with fallback data
      );
    }

    const { content, userId, conversationId } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Call OpenAI Moderation API with latest model
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: content,
        model: 'omni-moderation-latest'
      })
    });

    if (!moderationResponse.ok) {
      console.error('OpenAI Moderation API error:', await moderationResponse.text());
      return NextResponse.json(
        { success: false, error: 'Moderation service unavailable' },
        { status: 503 }
      );
    }

    const moderationData = await moderationResponse.json();
    const result = moderationData.results[0];

    const moderationResult: ModerationResult = {
      flagged: result.flagged,
      categories: {
        hate: result.categories.hate,
        hateThreatening: result.categories['hate/threatening'],
        harassment: result.categories.harassment,
        harassmentThreatening: result.categories['harassment/threatening'],
        selfHarm: result.categories['self-harm'],
        selfHarmIntent: result.categories['self-harm/intent'],
        selfHarmInstructions: result.categories['self-harm/instructions'],
        sexual: result.categories.sexual,
        sexualMinors: result.categories['sexual/minors'],
        violence: result.categories.violence,
        violenceGraphic: result.categories['violence/graphic'],
        illicit: result.categories.illicit || false,
        illicitViolent: result.categories['illicit/violent'] || false
      },
      categoryScores: {
        hate: result.category_scores.hate,
        hateThreatening: result.category_scores['hate/threatening'],
        harassment: result.category_scores.harassment,
        harassmentThreatening: result.category_scores['harassment/threatening'],
        selfHarm: result.category_scores['self-harm'],
        selfHarmIntent: result.category_scores['self-harm/intent'],
        selfHarmInstructions: result.category_scores['self-harm/instructions'],
        sexual: result.category_scores.sexual,
        sexualMinors: result.category_scores['sexual/minors'],
        violence: result.category_scores.violence,
        violenceGraphic: result.category_scores['violence/graphic'],
        illicit: result.category_scores.illicit || 0,
        illicitViolent: result.category_scores['illicit/violent'] || 0
      }
    };

    // Log moderation event to database
    try {
      const { error: logError } = await supabase
        .from('content_moderation_log')
        .insert({
          user_id: userId || null,
          content_type: 'chatbot_message',
          content: content.substring(0, 1000), // Truncate for storage
          moderation_result: moderationResult,
          flagged: result.flagged,
          flagged_categories: Object.keys(result.categories).filter(
            key => result.categories[key]
          ),
          conversation_id: conversationId || null,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Failed to log moderation event:', logError);
      }
    } catch (logError) {
      console.error('Error logging moderation event:', logError);
    }

    // Determine response based on moderation result
    if (result.flagged) {
      const flaggedCategories = Object.keys(result.categories).filter(
        key => result.categories[key]
      );

      return NextResponse.json({
        success: true,
        flagged: true,
        categories: moderationResult.categories,
        categoryScores: moderationResult.categoryScores,
        flaggedCategories,
        message: 'Your message contains content that violates our community guidelines. Please revise your message.',
        moderationResult
      });
    }

    return NextResponse.json({
      success: true,
      flagged: false,
      categories: moderationResult.categories,
      categoryScores: moderationResult.categoryScores,
      moderationResult
    });

  } catch (error) {
    console.error('Moderation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        flagged: false,
        categories: {},
        categoryScores: {}
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'Moderation API is running',
    openaiConfigured: !!OPENAI_API_KEY,
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  });
}
