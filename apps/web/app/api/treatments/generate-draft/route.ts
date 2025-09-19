import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { generateTreatmentWithAI, TreatmentContext } from '../../../../lib/openai-treatment-service';

/**
 * Extract image URLs from gig media IDs
 */
async function extractGigImages(mediaIds: string[]): Promise<string[]> {
  if (!mediaIds || mediaIds.length === 0 || !supabase) return [];
  
  try {
    const { data: media, error } = await supabase
      .from('media')
      .select('path, bucket')
      .in('id', mediaIds)
      .eq('type', 'image');
    
    if (error) {
      console.warn('Failed to fetch gig media:', error);
      return [];
    }
    
    // Convert to full URLs (assuming Supabase storage)
    return media?.map(m => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${m.bucket}/${m.path}`) || [];
  } catch (error) {
    console.warn('Error extracting gig images:', error);
    return [];
  }
}

// Treatment format templates with AI prompts
const TREATMENT_TEMPLATES = {
  film_tv: {
    systemPrompt: `You are a creative director generating industry-standard film/TV treatments. Keep present tense, concise, persuasive. Avoid camera jargon unless in 'Visual Language' section. Focus on story, character, and emotional impact.`,
    sections: {
      premise: {
        prompt: (title: string) => `Write a compelling premise and theme section for a film/TV project titled "${title}". Include the core concept, central conflict, and thematic elements. Keep it under 200 words.`,
        maxWords: 200
      },
      characters: {
        prompt: (title: string) => `Create character descriptions for the main characters in "${title}". Focus on their motivations, conflicts, and how they drive the story. Include 2-3 key characters maximum.`,
        maxWords: 300
      },
      synopsis: {
        prompt: (title: string) => `Write a detailed synopsis for "${title}" that covers the main story beats, character arcs, and resolution. Keep it engaging and cinematic.`,
        maxWords: 500
      },
      tone: {
        prompt: (title: string) => `Describe the tone and visual language for "${title}". Include visual style, mood, color palette, and cinematic approach. Reference specific visual elements.`,
        maxWords: 250
      },
      audience: {
        prompt: (title: string) => `Define the target audience and provide comparables for "${title}". Use format "In the vein of [Film A] meets [Film B]" and explain why this audience will connect.`,
        maxWords: 200
      }
    }
  },
  commercial_brand: {
    systemPrompt: `You are a creative director generating commercial/brand treatments. Keep it punchy, client-friendly, highly visual. Focus on brand impact, audience connection, and clear deliverables. Use present tense, avoid technical jargon.`,
    sections: {
      big_idea: {
        prompt: (title: string) => `Create "The Big Idea" for a commercial/brand project titled "${title}". Focus on the core creative concept that will resonate with the target audience and drive brand objectives.`,
        maxWords: 200
      },
      audience_insight: {
        prompt: (title: string) => `Define the audience insight and brand voice for "${title}". Explain who the audience is, what they care about, and how the brand voice will connect with them authentically.`,
        maxWords: 250
      },
      treatment_narrative: {
        prompt: (title: string) => `Write the treatment narrative for "${title}" covering the main story beats for 30s and 15s cutdowns. Focus on emotional journey and brand message delivery.`,
        maxWords: 400
      },
      visual_language: {
        prompt: (title: string) => `Describe the visual language for "${title}" including styleframes, typography, color palette, aspect ratios, and placement considerations. Be specific about visual elements.`,
        maxWords: 300
      },
      deliverables: {
        prompt: (title: string) => `Define the deliverables for "${title}" including different cutdowns, aspect ratios, language versions, and platform-specific adaptations.`,
        maxWords: 200
      }
    }
  },
  documentary: {
    systemPrompt: `You are a documentary filmmaker generating treatment content. Focus on authenticity, access, story arc, and ethical considerations. Use present tense, avoid overly technical language.`,
    sections: {
      logline: {
        prompt: (title: string) => `Write a compelling logline and statement of intent for documentary "${title}". Include the central question, access, and why this story matters now.`,
        maxWords: 200
      },
      access: {
        prompt: (title: string) => `Describe the access and research basis for "${title}". Explain what makes this story accessible, what research has been done, and what unique access is available.`,
        maxWords: 250
      },
      story_world: {
        prompt: (title: string) => `Define the story world and participants for "${title}". Introduce key characters, locations, and the world they inhabit. Focus on authenticity and human connection.`,
        maxWords: 300
      },
      narrative_arc: {
        prompt: (title: string) => `Outline the narrative arc and episodes of discovery for "${title}". Show how the story will unfold, what revelations will occur, and how the audience will be engaged throughout.`,
        maxWords: 400
      },
      visual_approach: {
        prompt: (title: string) => `Describe the visual approach for "${title}" including verité, interviews, archival footage, and cinematography style. Explain how visuals will support the story.`,
        maxWords: 250
      }
    }
  },
  music_video: {
    systemPrompt: `You are a music video director generating treatment content. Focus on visual storytelling, artist fit, and creative execution. Keep it energetic and visually driven.`,
    sections: {
      concept_hook: {
        prompt: (title: string) => `Create the concept hook and artist fit for music video "${title}". Explain the core creative idea and how it aligns with the artist's brand and the song's message.`,
        maxWords: 200
      },
      visual_motifs: {
        prompt: (title: string) => `Define the visual motifs and references for "${title}". Include specific visual elements, color schemes, and stylistic references that will drive the aesthetic.`,
        maxWords: 250
      },
      beat_outline: {
        prompt: (title: string) => `Create a beat-by-beat outline for "${title}" showing how the visuals will sync with the music, key moments, and visual transitions throughout the video.`,
        maxWords: 400
      },
      schedule_deliverables: {
        prompt: (title: string) => `Outline the schedule and deliverables for "${title}" including shoot days, post-production timeline, and final deliverables for different platforms.`,
        maxWords: 200
      }
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, format, theme, gig_id, moodboard_id, selected_images } = body;

    if (!title || !format) {
      return NextResponse.json(
        { error: 'Title and format are required' },
        { status: 400 }
      );
    }

    // Get additional context from gig and moodboard
    let gigData = null;
    let moodboardData = null;

    if (gig_id && supabase) {
      const { data: gig } = await supabase
        .from('gigs')
        .select('*')
        .eq('id', gig_id)
        .single();
      gigData = gig;
    }

    if (moodboard_id && supabase) {
      const { data: moodboard } = await supabase
        .from('moodboards')
        .select(`
          *,
          moodboard_images (
            id,
            image_url,
            tags,
            description
          )
        `)
        .eq('id', moodboard_id)
        .single();
      moodboardData = moodboard;
    }

    // Extract image URLs from moodboard
    const moodboardImages = moodboardData?.items 
      ? moodboardData.items
          .filter((item: any) => item.type === 'image' && item.url)
          .map((item: any) => item.enhanced_url || item.url) // Prefer enhanced versions
      : [];

    // Extract image URLs from gig (if any)
    const gigImages = gigData?.media_ids 
      ? await extractGigImages(gigData.media_ids)
      : [];

    // Combine all images (moodboard, gig, and user-selected)
    const allImages = [
      ...moodboardImages,
      ...gigImages,
      ...(selected_images || [])
    ];

    // Build treatment context
    const context: TreatmentContext = {
      title,
      format,
      theme,
      gigData,
      moodboardData,
      moodboardImages: allImages, // Pass all images for analysis
      gigImages,
      ...buildContext(gigData, moodboardData)
    };

    // Generate treatment content using AI (with fallback to templates)
    let loglines, sections, cta_suggestions;
    
    try {
      console.log('🤖 Generating treatment with AI...');
      const aiResult = await generateTreatmentWithAI(context);
      loglines = aiResult.loglines;
      sections = aiResult.sections;
      cta_suggestions = aiResult.cta_suggestions;
      console.log('✅ AI generation successful');
    } catch (aiError) {
      console.warn('⚠️ AI generation failed, falling back to templates:', aiError instanceof Error ? aiError.message : String(aiError));
      
      // Fallback to original template-based generation
      console.log('📝 Using template-based generation...');
      loglines = await generateLoglines(title, format, gigData, moodboardData);
      sections = await generateSections(title, format, gigData, moodboardData);
      cta_suggestions = generateCTASuggestions(format, gigData);
      console.log('✅ Template generation complete');
    }

    return NextResponse.json({
      loglines,
      sections,
      cta_suggestions
    });

  } catch (error) {
    console.error('Error generating treatment draft:', error);
    return NextResponse.json(
      { error: 'Failed to generate treatment draft' },
      { status: 500 }
    );
  }
}

async function generateLoglines(title: string, format: string, gigData: any, moodboardData: any) {
  const template = TREATMENT_TEMPLATES[format as keyof typeof TREATMENT_TEMPLATES];
  if (!template) return [];

  const context = buildContext(gigData, moodboardData);
  
  // For now, return sample loglines - in production, you'd call an AI service
  const sampleLoglines = {
    film_tv: [
      `A ${context.genre || 'dramatic'} story about ${context.theme || 'human connection'} set in ${context.location || 'a compelling world'}.`,
      `When ${context.conflict || 'life takes an unexpected turn'}, ${context.protagonist || 'our hero'} must ${context.challenge || 'face their greatest challenge'} to ${context.stake || 'save what matters most'}.`,
      `In a world where ${context.world || 'reality bends'}, ${context.protagonist || 'one person'} discovers ${context.discovery || 'the power to change everything'}.`
    ],
    commercial_brand: [
      `${context.brand || 'Our brand'} brings ${context.benefit || 'authentic connection'} to ${context.audience || 'everyday moments'}.`,
      `Experience ${context.emotion || 'joy'} like never before with ${context.product || 'our innovative solution'}.`,
      `${context.brand || 'We'} believe in ${context.value || 'making life better'} through ${context.approach || 'genuine human connection'}.`
    ],
    documentary: [
      `An intimate look at ${context.subject || 'human experience'} through the eyes of ${context.participants || 'those who live it'}.`,
      `What happens when ${context.question || 'ordinary people face extraordinary circumstances'}? This documentary explores ${context.theme || 'the human condition'}.`,
      `A journey into ${context.world || 'unknown territory'} reveals ${context.discovery || 'universal truths about humanity'}.`
    ],
    music_video: [
      `${context.artist || 'The artist'} takes us on a ${context.journey || 'visual journey'} through ${context.theme || 'emotion and experience'}.`,
      `Experience ${context.song || 'the song'} through ${context.visual || 'stunning visuals'} that capture ${context.mood || 'the essence of the music'}.`,
      `${context.concept || 'A bold visual concept'} brings ${context.song || 'the music'} to life in ${context.style || 'unexpected ways'}.`
    ]
  };

  return sampleLoglines[format as keyof typeof sampleLoglines] || [];
}

async function generateSections(title: string, format: string, gigData: any, moodboardData: any) {
  const template = TREATMENT_TEMPLATES[format as keyof typeof TREATMENT_TEMPLATES];
  if (!template) return {};

  const context = buildContext(gigData, moodboardData);
  const sections: Record<string, { content: string }> = {};

  // Generate content for each section
  for (const [sectionId, sectionConfig] of Object.entries(template.sections)) {
    const prompt = sectionConfig.prompt(title);
    
    // For now, return sample content - in production, you'd call an AI service
    sections[sectionId] = {
      content: generateSampleContent(sectionId, format, context, sectionConfig.maxWords)
    };
  }

  return sections;
}

function generateSampleContent(sectionId: string, format: string, context: any, maxWords: number) {
  const samples: Record<string, Record<string, string>> = {
    film_tv: {
      premise: `"${context.title || 'Untitled Project'}" explores the universal theme of ${context.theme || 'human connection'} through the lens of ${context.genre || 'contemporary drama'}. Set against the backdrop of ${context.location || 'a vibrant urban landscape'}, the story follows ${context.protagonist || 'our central character'} as they navigate ${context.conflict || 'life\'s greatest challenges'}. The narrative weaves together themes of ${context.themes || 'love, loss, and redemption'} while maintaining a ${context.tone || 'hopeful and authentic'} tone throughout.`,
      characters: `**${context.protagonist || 'Main Character'}**: A ${context.age || '30-something'} ${context.profession || 'professional'} who ${context.motivation || 'seeks meaning in their everyday life'}. Driven by ${context.drive || 'a deep desire for connection'}, they must ${context.challenge || 'overcome personal obstacles'} to ${context.goal || 'achieve their dreams'}.\n\n**${context.antagonist || 'Supporting Character'}**: ${context.relationship || 'A close friend'} who ${context.role || 'provides both support and conflict'}. Their ${context.dynamic || 'complex relationship'} serves as ${context.purpose || 'the emotional core of the story'}.`,
      synopsis: `The story begins when ${context.inciting_incident || 'our protagonist receives unexpected news'} that ${context.catalyst || 'changes everything they thought they knew'}. As they ${context.journey || 'embark on a journey of self-discovery'}, they encounter ${context.obstacles || 'various challenges and opportunities'}. Through ${context.growth || 'personal growth and meaningful connections'}, they learn that ${context.revelation || 'true fulfillment comes from within'}. The climax occurs when ${context.climax || 'they must make a crucial decision'} that will ${context.consequence || 'determine their future'}. The resolution brings ${context.resolution || 'peace and understanding'} as they ${context.outcome || 'embrace their authentic self'}.`,
      tone: `The visual language of "${context.title || 'this project'}" draws inspiration from ${context.visual_style || 'contemporary cinema'} with a focus on ${context.aesthetic || 'natural lighting and authentic performances'}. The color palette emphasizes ${context.colors || 'warm earth tones and cool blues'}, creating a ${context.mood || 'contemplative and intimate'} atmosphere. Cinematography will utilize ${context.camera_style || 'handheld and steady cam techniques'} to ${context.visual_purpose || 'create an immersive, documentary-like feel'}. The overall aesthetic balances ${context.balance || 'realism with cinematic beauty'}, ensuring every frame serves the emotional truth of the story.`
    },
    commercial_brand: {
      big_idea: `The Big Idea centers around ${context.brand_concept || 'authentic human connection'} and how ${context.brand_name || 'our brand'} enables ${context.benefit || 'meaningful moments'} in everyday life. We'll showcase ${context.product_feature || 'the product\'s unique value'} through ${context.creative_approach || 'relatable scenarios'} that ${context.emotional_hook || 'resonate with our target audience'}. The concept leverages ${context.brand_strength || 'our brand\'s core strengths'} to ${context.marketing_goal || 'drive both awareness and conversion'}.`,
      audience_insight: `Our target audience consists of ${context.demographics || 'millennials and Gen Z consumers'} who ${context.psychographics || 'value authenticity and meaningful experiences'}. They're ${context.behaviors || 'digitally native and socially conscious'}, seeking ${context.needs || 'products that align with their values'}. Our brand voice speaks to them through ${context.communication_style || 'genuine storytelling and inclusive messaging'}, addressing their ${context.pain_points || 'desire for connection in an increasingly digital world'}.`,
      treatment_narrative: `**30-Second Cutdown**: Opens with ${context.opening || 'a relatable moment of struggle'}, then introduces ${context.product_intro || 'our solution'} as ${context.transformation || 'the catalyst for positive change'}. Shows ${context.benefit_demo || 'the product in action'} with ${context.emotional_arc || 'increasing joy and satisfaction'}. Closes with ${context.brand_moment || 'a powerful brand statement'}.\n\n**15-Second Cutdown**: Focuses on ${context.key_moment || 'the most impactful moment'} from the longer version, emphasizing ${context.core_message || 'the essential benefit'} with ${context.visual_punch || 'striking visuals'} that ${context.memorable_element || 'stick in the viewer\'s mind'}.`
    }
  };

  const formatSamples = samples[format];
  if (formatSamples && formatSamples[sectionId]) {
    return formatSamples[sectionId];
  }

  return `This is sample content for the ${sectionId} section. In a real implementation, this would be generated by an AI service based on the project details, moodboard images, and format-specific requirements. The content would be tailored to the specific project and optimized for the target audience and brand voice.`;
}

function generateCTASuggestions(format: string, gigData: any) {
  const baseSuggestions = [
    { label: 'Hire DP', target: 'crew:dp' },
    { label: 'Book Equipment', target: 'gear:rental' },
    { label: 'Find Location', target: 'locations:search' }
  ];

  const formatSpecificSuggestions = {
    commercial_brand: [
      { label: 'Cast Talent', target: 'talent:casting' },
      { label: 'Brand Guidelines', target: 'brand:assets' }
    ],
    music_video: [
      { label: 'Book Artist', target: 'talent:artist' },
      { label: 'VFX Services', target: 'post:vfx' }
    ],
    documentary: [
      { label: 'Research Access', target: 'research:contacts' },
      { label: 'Archive Footage', target: 'archive:search' }
    ]
  };

  return [
    ...baseSuggestions,
    ...(formatSpecificSuggestions[format as keyof typeof formatSpecificSuggestions] || [])
  ];
}

function buildContext(gigData: any, moodboardData: any) {
  const context: any = {};

  if (gigData) {
    context.title = gigData.title;
    context.description = gigData.description;
    context.purpose = gigData.purpose;
    context.location = gigData.location_text;
    context.genre = gigData.comp_type;
    context.audience = gigData.target_audience;
    context.budget = gigData.budget_range;
  }

  if (moodboardData) {
    context.moodboard_title = moodboardData.title;
    context.moodboard_description = moodboardData.description;
    context.image_count = moodboardData.moodboard_images?.length || 0;
    context.tags = moodboardData.moodboard_images?.flatMap((img: any) => img.tags) || [];
  }

  return context;
}
