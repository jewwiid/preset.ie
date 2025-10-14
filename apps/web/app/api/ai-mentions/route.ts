/**
 * AI Mention Detection API Route
 * 
 * Analyzes text and automatically inserts @mentions for recognized entities
 * like cinematic parameters, subjects, locations, colors, dimensions, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { MentionableEntity } from '@/lib/utils/mention-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AIMentionRequest {
  text: string;
  context: {
    mode: 'text-to-image' | 'image-to-image' | 'video' | 'edit' | 'batch';
    availableImages?: string[];
    currentPreset?: any;
    cinematicParams?: any;
    selectedImages?: string[];
  };
  availableEntities: MentionableEntity[];
  options?: {
    confidence?: number;
    maxMentions?: number;
    preserveOriginal?: boolean;
  };
}

interface AIMentionResponse {
  originalText: string;
  mentionedText: string;
  detectedEntities: MentionableEntity[];
  confidence: number;
  suggestions?: string[];
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('AI Mention Detection API called');
    
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get user session
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      console.log('No auth token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Supabase auth error:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription tier (PLUS or PRO only)
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to verify subscription' }, { status: 500 });
    }

    const tier = profile?.subscription_tier || 'FREE';
    if (tier === 'FREE') {
      console.log('Free tier user attempted AI mention detection');
      return NextResponse.json({ 
        error: 'AI mention detection requires a PLUS or PRO subscription. Please upgrade to use this feature.' 
      }, { status: 403 });
    }

    // Parse request body
    const body: AIMentionRequest = await req.json();
    const { text, context, availableEntities, options = {} } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!availableEntities || !Array.isArray(availableEntities)) {
      return NextResponse.json({ error: 'Available entities are required' }, { status: 400 });
    }

    console.log(`Processing text: "${text.substring(0, 100)}..."`);
    console.log(`Available entities: ${availableEntities.length}`);
    console.log(`Context mode: ${context.mode}`);

    // Build entity list for AI prompt
    const entityList = availableEntities.map(entity => 
      `- ${entity.label} (${entity.type}): ${entity.value}`
    ).join('\n');

    // Build context information
    const contextInfo = [];
    if (context.mode) contextInfo.push(`Mode: ${context.mode}`);
    if (context.selectedImages?.length) contextInfo.push(`Selected images: ${context.selectedImages.length}`);
    if (context.currentPreset) contextInfo.push(`Current preset: ${context.currentPreset.name || 'Custom'}`);
    if (context.cinematicParams) contextInfo.push(`Cinematic parameters: ${Object.keys(context.cinematicParams).length} set`);

    // Create AI prompt
    const prompt = `You are an AI assistant that analyzes text and automatically inserts @mentions for recognized entities in creative prompts.

CONTEXT:
${contextInfo.join('\n')}

AVAILABLE ENTITIES TO RECOGNIZE:
${entityList}

TASK:
Analyze the following text and insert @mentions for any recognized entities. Be conservative - only add @mentions for entities you're confident about.

RULES:
1. Only mention entities that are clearly referenced in the text
2. Use the exact label from the available entities list
3. Preserve the original meaning and flow of the text
4. Don't over-mention - be selective and accurate
5. Consider context (e.g., "16:9" in video context likely means aspect ratio)
6. Handle multi-word entities properly (e.g., "golden hour" -> @golden-hour)

TEXT TO ANALYZE:
"${text}"

RESPONSE FORMAT:
Return a JSON object with:
{
  "enhancedText": "text with @mentions inserted",
  "detectedEntities": [
    {
      "label": "entity label",
      "type": "entity type",
      "confidence": 0.95,
      "originalText": "text that was mentioned"
    }
  ],
  "confidence": 0.85,
  "reasoning": "brief explanation of changes made"
}

Only return the JSON, no other text.`;

    // Call OpenAI API
    console.log('Sending request to OpenAI for mention detection...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing creative prompts and identifying technical parameters, artistic styles, and creative elements. You help users by automatically adding @mentions to make their prompts more precise and structured.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    console.log(`OpenAI API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json({ 
        error: 'AI mention detection failed. Please try again.' 
      }, { status: 502 });
    }

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices?.[0]?.message?.content) {
      console.error('No content in OpenAI response');
      return NextResponse.json({ 
        error: 'Invalid response from AI service' 
      }, { status: 502 });
    }

    // Parse AI response
    let aiResult;
    try {
      aiResult = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({ 
        error: 'Invalid response format from AI service' 
      }, { status: 502 });
    }

    // Validate and process AI response
    const enhancedText = aiResult.enhancedText || text;
    const detectedEntities = aiResult.detectedEntities || [];
    const confidence = Math.min(Math.max(aiResult.confidence || 0.5, 0), 1);
    const reasoning = aiResult.reasoning || '';

    console.log(`AI detected ${detectedEntities.length} entities with ${Math.round(confidence * 100)}% confidence`);

    // Map detected entities back to our entity objects
    const mappedEntities: MentionableEntity[] = detectedEntities.map((detected: any) => {
      const matchingEntity = availableEntities.find(entity => 
        entity.label === detected.label && entity.type === detected.type
      );
      
      if (matchingEntity) {
        return {
          ...matchingEntity,
          metadata: {
            ...matchingEntity.metadata,
            confidence: detected.confidence || confidence
          }
        };
      }
      
      return null;
    }).filter(Boolean) as MentionableEntity[];

    // Build response
    const result: AIMentionResponse = {
      originalText: text,
      mentionedText: enhancedText,
      detectedEntities: mappedEntities,
      confidence,
      suggestions: reasoning ? [reasoning] : undefined
    };

    console.log('AI mention detection completed successfully');
    return NextResponse.json(result);

  } catch (error) {
    console.error('AI mention detection error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'AI mention detection failed' 
    }, { status: 500 });
  }
}
