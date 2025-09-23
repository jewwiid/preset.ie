import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

// Cinematic presets data
const cinematicPresets = [
  {
    name: 'portrait',
    display_name: 'Portrait',
    description: '9:16 ratio, soft lighting, warm tones, intimate mood',
    parameters: {
      aspectRatio: '9:16',
      cameraAngle: 'eye-level',
      lensType: 'portrait-85mm',
      shotSize: 'close-up',
      depthOfField: 'shallow-focus',
      lightingStyle: 'soft-light',
      colorPalette: 'warm-golden',
      compositionTechnique: 'rule-of-thirds',
      sceneMood: 'intimate',
      directorStyle: 'sofia-coppola',
      timeSetting: 'golden-hour',
      subjectCount: 'solo',
      eyeContact: 'direct-gaze'
    },
    category: 'photography',
    sort_order: 1
  },
  {
    name: 'landscape',
    display_name: 'Landscape',
    description: '16:9 ratio, natural light, earth tones, peaceful mood',
    parameters: {
      aspectRatio: '16:9',
      cameraAngle: 'eye-level',
      lensType: 'wide-angle-24mm',
      shotSize: 'wide-shot',
      depthOfField: 'deep-focus',
      lightingStyle: 'natural-light',
      colorPalette: 'earth-tones',
      compositionTechnique: 'rule-of-thirds',
      sceneMood: 'peaceful',
      directorStyle: 'roger-deakins',
      timeSetting: 'golden-hour',
      locationType: 'countryside',
      weatherCondition: 'sunny'
    },
    category: 'photography',
    sort_order: 2
  },
  {
    name: 'cinematic',
    display_name: 'Cinematic',
    description: '21:9 ratio, dramatic lighting, teal/orange, low angle',
    parameters: {
      aspectRatio: '21:9',
      cameraAngle: 'low-angle',
      lensType: 'anamorphic',
      shotSize: 'wide-shot',
      depthOfField: 'shallow-focus',
      lightingStyle: 'chiaroscuro',
      colorPalette: 'teal-and-orange',
      compositionTechnique: 'symmetry',
      sceneMood: 'dramatic',
      directorStyle: 'christopher-nolan',
      timeSetting: 'blue-hour',
      cameraMovement: 'tracking-forward',
      eraEmulation: 'kodak-portra-400'
    },
    category: 'cinematic',
    sort_order: 3
  },
  {
    name: 'fashion',
    display_name: 'Fashion',
    description: '4:3 ratio, rim lighting, jewel tones, romantic mood',
    parameters: {
      aspectRatio: '4:3',
      cameraAngle: 'eye-level',
      lensType: 'portrait-85mm',
      shotSize: 'medium-close-up',
      depthOfField: 'shallow-focus',
      lightingStyle: 'rim-lighting',
      colorPalette: 'jewel-tones',
      compositionTechnique: 'rule-of-thirds',
      sceneMood: 'romantic',
      directorStyle: 'bruno-delbonnel',
      timeSetting: 'golden-hour',
      subjectCount: 'solo',
      eyeContact: 'direct-gaze'
    },
    category: 'photography',
    sort_order: 4
  },
  {
    name: 'street',
    display_name: 'Street',
    description: '3:2 ratio, handheld, monochrome, gritty urban feel',
    parameters: {
      aspectRatio: '3:2',
      cameraAngle: 'eye-level',
      lensType: 'wide-angle-35mm',
      shotSize: 'medium-shot',
      depthOfField: 'deep-focus',
      lightingStyle: 'natural-light',
      colorPalette: 'monochrome',
      compositionTechnique: 'leading-lines',
      sceneMood: 'gritty',
      directorStyle: 'christopher-doyle',
      timeSetting: 'afternoon',
      locationType: 'urban-street',
      cameraMovement: 'handheld'
    },
    category: 'photography',
    sort_order: 5
  },
  {
    name: 'commercial',
    display_name: 'Commercial',
    description: '16:9 ratio, high-key lighting, bright, professional',
    parameters: {
      aspectRatio: '16:9',
      cameraAngle: 'eye-level',
      lensType: 'normal-50mm',
      shotSize: 'medium-shot',
      depthOfField: 'shallow-focus',
      lightingStyle: 'high-key',
      colorPalette: 'high-saturation',
      compositionTechnique: 'central-framing',
      sceneMood: 'bright',
      directorStyle: 'david-fincher',
      timeSetting: 'midday',
      subjectCount: 'solo'
    },
    category: 'commercial',
    sort_order: 6
  },
  {
    name: 'artistic',
    display_name: 'Artistic',
    description: '1:1 ratio, colored gels, neon palette, surreal mood',
    parameters: {
      aspectRatio: '1:1',
      cameraAngle: 'dutch-angle',
      lensType: 'fisheye',
      shotSize: 'extreme-close-up',
      depthOfField: 'tilt-shift-effect',
      lightingStyle: 'colored-gels',
      colorPalette: 'neon',
      compositionTechnique: 'diagonal-composition',
      sceneMood: 'surreal',
      directorStyle: 'wes-anderson',
      timeSetting: 'night',
      eraEmulation: 'lomography'
    },
    category: 'artistic',
    sort_order: 7
  },
  {
    name: 'documentary',
    display_name: 'Documentary',
    description: '16:9 ratio, natural light, desaturated, authentic',
    parameters: {
      aspectRatio: '16:9',
      cameraAngle: 'eye-level',
      lensType: 'normal-50mm',
      shotSize: 'medium-shot',
      depthOfField: 'deep-focus',
      lightingStyle: 'natural-light',
      colorPalette: 'desaturated',
      compositionTechnique: 'rule-of-thirds',
      sceneMood: 'natural',
      directorStyle: 'terrence-malick',
      timeSetting: 'afternoon',
      cameraMovement: 'handheld'
    },
    category: 'documentary',
    sort_order: 8
  },
  {
    name: 'nature',
    display_name: 'Nature',
    description: '3:2 ratio, bird\'s eye view, earth tones, peaceful',
    parameters: {
      aspectRatio: '3:2',
      cameraAngle: 'birds-eye-view',
      lensType: 'wide-angle-24mm',
      shotSize: 'extreme-wide-shot',
      depthOfField: 'hyperfocal',
      lightingStyle: 'natural-light',
      colorPalette: 'earth-tones',
      compositionTechnique: 'rule-of-thirds',
      sceneMood: 'peaceful',
      directorStyle: 'terrence-malick',
      timeSetting: 'dawn',
      locationType: 'forest',
      weatherCondition: 'sunny'
    },
    category: 'photography',
    sort_order: 9
  },
  {
    name: 'urban',
    display_name: 'Urban',
    description: '16:9 ratio, mixed lighting, cool blue, futuristic',
    parameters: {
      aspectRatio: '16:9',
      cameraAngle: 'low-angle',
      lensType: 'wide-angle-24mm',
      shotSize: 'wide-shot',
      depthOfField: 'deep-focus',
      lightingStyle: 'mixed-lighting',
      colorPalette: 'cool-blue',
      compositionTechnique: 'leading-lines',
      sceneMood: 'futuristic',
      directorStyle: 'denis-villeneuve',
      timeSetting: 'night',
      locationType: 'downtown',
      cameraMovement: 'tracking-forward'
    },
    category: 'cinematic',
    sort_order: 10
  }
];

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // Check if the table exists by trying to query it
    let tableExists = false;
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('cinematic_presets')
        .select('id')
        .limit(1);
      
      if (!testError) {
        tableExists = true;
      }
    } catch (error) {
      console.log('Table does not exist yet, will return static data');
    }

    if (tableExists) {
      // Table exists, fetch from database
      const { data: existingPresets, error: fetchError } = await supabaseAdmin
        .from('cinematic_presets')
        .select('name');

      if (fetchError) {
        console.error('Error fetching presets:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
      }

      const existingNames = existingPresets?.map(p => p.name) || [];

      // Insert only new presets
      const newPresets = cinematicPresets.filter(preset => !existingNames.includes(preset.name));
      
      if (newPresets.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('cinematic_presets')
          .insert(newPresets);

        if (insertError) {
          console.error('Error inserting presets:', insertError);
          return NextResponse.json({ error: 'Failed to insert presets' }, { status: 500 });
        }
      }

      // Return all presets from database
      const { data: allPresets, error: allError } = await supabaseAdmin
        .from('cinematic_presets')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (allError) {
        console.error('Error fetching all presets:', allError);
        return NextResponse.json({ error: 'Failed to fetch all presets' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        presets: allPresets,
        inserted: newPresets.length
      });
    } else {
      // Table doesn't exist, return static data for now
      console.log('Table does not exist, returning static presets');
      return NextResponse.json({
        success: true,
        presets: cinematicPresets.map((preset, index) => ({
          id: `static-${preset.name}-${index}`,
          ...preset
        })),
        inserted: 0,
        note: 'Using static presets - table will be created on next migration'
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // Check if table exists first
    let tableExists = false;
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('cinematic_presets')
        .select('id')
        .limit(1);
      
      if (!testError) {
        tableExists = true;
      }
    } catch (error) {
      console.log('Table does not exist, cannot insert presets');
    }

    if (!tableExists) {
      return NextResponse.json({ 
        error: 'Table does not exist. Please run database migration first.',
        suggestion: 'Run: npx supabase db push'
      }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('cinematic_presets')
      .insert(cinematicPresets);

    if (error) {
      console.error('Error inserting presets:', error);
      return NextResponse.json({ error: 'Failed to insert presets' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cinematic presets created successfully',
      count: cinematicPresets.length
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
