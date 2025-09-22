import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import { getUserFromRequest } from '../../../../lib/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Since cinematic_prompt_templates table doesn't exist, return default templates
    const defaultTemplates = [
      {
        id: '1',
        name: 'Portrait Cinematic',
        description: 'Professional portrait with cinematic lighting and depth',
        category: 'portrait',
        base_prompt: 'professional portrait, cinematic lighting, shallow depth of field, film grain, dramatic shadows',
        cinematic_parameters: {
          cameraAngle: 'medium-shot',
          lensType: 'portrait-85mm',
          shotSize: 'medium-shot',
          depthOfField: 'shallow-focus',
          lightingStyle: 'dramatic',
          colorPalette: 'warm-tones'
        },
        difficulty: 'beginner',
        tags: ['portrait', 'cinematic', 'professional'],
        usage_count: 0,
        is_public: true,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Landscape Epic',
        description: 'Wide cinematic landscape with epic composition',
        category: 'landscape',
        base_prompt: 'epic landscape, wide angle view, golden hour lighting, dramatic clouds, cinematic composition',
        cinematic_parameters: {
          cameraAngle: 'eye-level',
          lensType: 'wide-angle-24mm',
          shotSize: 'wide-shot',
          depthOfField: 'deep-focus',
          lightingStyle: 'golden-hour',
          colorPalette: 'warm-tones'
        },
        difficulty: 'intermediate',
        tags: ['landscape', 'cinematic', 'epic'],
        usage_count: 0,
        is_public: true,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Fashion Editorial',
        description: 'High-fashion editorial with artistic composition',
        category: 'fashion',
        base_prompt: 'fashion editorial, high-end photography, artistic composition, dramatic lighting, studio quality',
        cinematic_parameters: {
          cameraAngle: 'low-angle',
          lensType: 'telephoto-135mm',
          shotSize: 'medium-shot',
          depthOfField: 'shallow-focus',
          lightingStyle: 'studio',
          colorPalette: 'high-contrast'
        },
        difficulty: 'advanced',
        tags: ['fashion', 'editorial', 'artistic'],
        usage_count: 0,
        is_public: true,
        created_at: new Date().toISOString()
      }
    ];

    // Filter templates based on query parameters
    let filteredTemplates = defaultTemplates;
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    
    if (difficulty && difficulty !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.difficulty === difficulty);
    }

    return NextResponse.json({
      success: true,
      templates: filteredTemplates,
      pagination: {
        total: filteredTemplates.length,
        limit: filteredTemplates.length,
        offset: 0,
        hasMore: false
      }
    });

  } catch (error) {
    console.error('Cinematic prompts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // const user = await getUserFromRequest(request);
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await request.json();
    const {
      name,
      description,
      category,
      base_prompt,
      cinematic_parameters,
      difficulty = 'beginner',
      tags = [],
      is_public = false
    } = body;

    // Validate required fields
    if (!name || !category || !base_prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, base_prompt' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['portrait', 'landscape', 'street', 'cinematic', 'artistic', 'commercial', 'fashion', 'architecture', 'nature', 'abstract'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error } = await supabaseAdmin
      .from('cinematic_prompt_templates')
      .insert({
        name,
        description,
        category,
        base_prompt,
        cinematic_parameters: cinematic_parameters || {},
        difficulty,
        tags,
        is_public,
        created_by: 'temp-user-id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cinematic prompt template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('Create cinematic prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
