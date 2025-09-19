const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// AI Model Configuration
const AI_MODELS = {
  gpt4o: {
    name: 'gpt-4o',
    provider: 'openai',
    costPer1MInput: 5,
    costPer1MOutput: 15,
    bestFor: 'best quality, reliability, complex instructions'
  },
  gpt4o_mini: {
    name: 'gpt-4o-mini',
    provider: 'openai',
    costPer1MInput: 0.15,
    costPer1MOutput: 0.6,
    bestFor: 'cost-effective, high volume, basic generation'
  }
};

// Model selection based on environment or user preference
const getPreferredModel = () => {
  const preferredModel = process.env.AI_TREATMENT_MODEL || 'gpt4o_mini';
  return AI_MODELS[preferredModel as keyof typeof AI_MODELS] || AI_MODELS.gpt4o_mini;
};

export interface TreatmentContext {
  title: string;
  format: string;
  theme?: string;
  gigData?: any;
  moodboardData?: any;
  moodboardImages?: string[]; // Array of image URLs from moodboard
  gigImages?: string[]; // Array of image URLs from gig
  genre?: string;
  location?: string;
  protagonist?: string;
  conflict?: string;
  brand?: string;
  audience?: string;
  mood?: string;
  visualStyle?: string;
  colors?: string;
  [key: string]: any;
}

export interface TreatmentSection {
  content: string;
  wordCount: number;
}

export interface TreatmentLogline {
  text: string;
  type: 'hook' | 'character' | 'conflict' | 'stake';
}

export interface TreatmentResult {
  loglines: TreatmentLogline[];
  sections: Record<string, TreatmentSection>;
  cta_suggestions: Array<{ label: string; target: string }>;
}

/**
 * Generate treatment content using OpenAI GPT-4
 */
export async function generateTreatmentWithAI(context: TreatmentContext): Promise<TreatmentResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Analyze images first if available
    const imageAnalysis = await analyzeImages(context);
    
    // Enhance context with image analysis
    const enhancedContext = { ...context, ...imageAnalysis };
    
    // Generate loglines first
    const loglines = await generateLoglines(enhancedContext);
    
    // Generate sections in parallel for better performance
    const sections = await generateSections(enhancedContext);
    
    // Generate CTA suggestions
    const cta_suggestions = generateCTASuggestions(enhancedContext);

    return {
      loglines,
      sections,
      cta_suggestions
    };
  } catch (error) {
    console.error('AI treatment generation failed:', error);
    throw new Error('Failed to generate treatment content with AI');
  }
}

/**
 * Analyze images from moodboard and gig data
 */
async function analyzeImages(context: TreatmentContext): Promise<Partial<TreatmentContext>> {
  const allImages = [
    ...(context.moodboardImages || []),
    ...(context.gigImages || [])
  ];

  if (allImages.length === 0) {
    return {};
  }

  try {
    console.log(`🖼️ Analyzing ${allImages.length} images for treatment context...`);
    
    // Use existing AI palette batch analysis
    const response = await fetch('/api/ai-palette-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrls: allImages.slice(0, 8), // Limit to 8 images for cost control
        context: `treatment generation for ${context.format} format`,
        gigData: context.gigData
      })
    });

    if (!response.ok) {
      console.warn('Image analysis failed, continuing without visual context');
      return {};
    }

    const analysis = await response.json();
    
    if (analysis.success) {
      console.log('✅ Image analysis successful:', {
        palette: analysis.palette?.length || 0,
        mood: analysis.mood,
        visualAnalysis: analysis.visualAnalysis ? 'Available' : 'None'
      });
      
      return {
        colors: analysis.palette?.join(', ') || context.colors,
        mood: analysis.mood || context.mood,
        visualStyle: analysis.visualAnalysis || context.visualStyle,
        // Add any other visual insights from the analysis
        ...(analysis.treatmentNotes && { visualNotes: analysis.treatmentNotes })
      };
    }
    
    return {};
  } catch (error) {
    console.warn('Image analysis failed:', error);
    return {};
  }
}

/**
 * Generate loglines using OpenAI
 */
async function generateLoglines(context: TreatmentContext): Promise<TreatmentLogline[]> {
  const systemPrompt = getSystemPrompt(context.format);
  const userPrompt = getLoglinePrompt(context);

  const response = await callAI(systemPrompt, userPrompt);
  
  try {
    const parsed = JSON.parse(response);
    return parsed.loglines || [];
  } catch {
    // Fallback: parse response as text and create loglines
    const lines = response.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      text: line.replace(/^\d+\.\s*/, '').trim(),
      type: ['hook', 'character', 'conflict', 'stake'][index % 4] as any
    }));
  }
}

/**
 * Generate treatment sections using OpenAI
 */
async function generateSections(context: TreatmentContext): Promise<Record<string, TreatmentSection>> {
  const template = getTreatmentTemplate(context.format);
  const sections: Record<string, TreatmentSection> = {};

  // Generate sections in parallel for better performance
  const sectionPromises = Object.entries(template.sections).map(async ([sectionId, sectionConfig]) => {
    const systemPrompt = getSystemPrompt(context.format);
    const userPrompt = sectionConfig.prompt(context.title, context);

    try {
      const content = await callAI(systemPrompt, userPrompt);
      const wordCount = content.split(/\s+/).length;
      
      return {
        sectionId,
        section: {
          content: content.trim(),
          wordCount
        }
      };
    } catch (error) {
      console.error(`Failed to generate section ${sectionId}:`, error);
      return {
        sectionId,
        section: {
          content: `Error generating ${sectionId} content. Please try again.`,
          wordCount: 0
        }
      };
    }
  });

  const results = await Promise.all(sectionPromises);
  
  results.forEach(({ sectionId, section }) => {
    sections[sectionId] = section;
  });

  return sections;
}

/**
 * Call OpenAI API
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const model = getPreferredModel();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: model.name,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Get system prompt based on treatment format
 */
function getSystemPrompt(format: string): string {
  const prompts = {
    film_tv: `You are a creative director generating industry-standard film/TV treatments. Keep present tense, concise, persuasive. Avoid camera jargon unless in 'Visual Language' section. Focus on story, character, and emotional impact.`,
    commercial_brand: `You are a creative director generating commercial/brand treatments. Keep it punchy, client-friendly, highly visual. Focus on brand impact, audience connection, and clear deliverables. Use present tense, avoid technical jargon.`,
    documentary: `You are a creative director generating documentary treatments. Focus on authenticity, human stories, and compelling narratives. Emphasize the real people and situations that make this story worth telling.`,
    music_video: `You are a creative director generating music video treatments. Focus on visual storytelling that enhances the music. Emphasize mood, style, and creative concepts that bring the song to life.`,
    short_social: `You are a creative director generating short-form/social media treatments. Focus on immediate impact, shareability, and platform-specific optimization. Keep content concise and engaging.`,
    corporate_promo: `You are a creative director generating corporate promotional treatments. Focus on professional presentation, clear value propositions, and brand alignment. Maintain corporate tone while being engaging.`
  };

  return prompts[format as keyof typeof prompts] || prompts.film_tv;
}

/**
 * Get logline generation prompt
 */
function getLoglinePrompt(context: TreatmentContext): string {
  const baseContext = buildContextString(context);
  
  return `Generate 3-4 compelling loglines for "${context.title}" (${context.format} format).

Context: ${baseContext}

Return as JSON:
{
  "loglines": [
    {"text": "Logline 1", "type": "hook"},
    {"text": "Logline 2", "type": "character"},
    {"text": "Logline 3", "type": "conflict"},
    {"text": "Logline 4", "type": "stake"}
  ]
}

Make each logline distinct and compelling. Focus on different aspects: the hook, character motivation, central conflict, and stakes.`;
}

/**
 * Get treatment template with prompts
 */
function getTreatmentTemplate(format: string) {
  const templates = {
    film_tv: {
      sections: {
        premise: {
          prompt: (title: string, context: TreatmentContext) => 
            `Write a compelling premise and theme section for "${title}". Include the core concept, central conflict, and thematic elements. Keep it under 200 words. Context: ${buildContextString(context)}`,
          maxWords: 200
        },
        characters: {
          prompt: (title: string, context: TreatmentContext) => 
            `Create character descriptions for the main characters in "${title}". Focus on their motivations, conflicts, and how they drive the story. Include 2-3 key characters maximum. Context: ${buildContextString(context)}`,
          maxWords: 300
        },
        synopsis: {
          prompt: (title: string, context: TreatmentContext) => 
            `Write a detailed synopsis for "${title}" that covers the main story beats, character arcs, and resolution. Keep it engaging and cinematic. Context: ${buildContextString(context)}`,
          maxWords: 500
        },
        tone: {
          prompt: (title: string, context: TreatmentContext) => 
            `Describe the tone and visual language for "${title}". Include visual style, mood, color palette, and cinematic approach. Reference specific visual elements. Context: ${buildContextString(context)}`,
          maxWords: 250
        },
        audience: {
          prompt: (title: string, context: TreatmentContext) => 
            `Define the target audience and provide comparables for "${title}". Use format "In the vein of [Film A] meets [Film B]" and explain why this audience will connect. Context: ${buildContextString(context)}`,
          maxWords: 200
        }
      }
    },
    commercial_brand: {
      sections: {
        big_idea: {
          prompt: (title: string, context: TreatmentContext) => 
            `Create "The Big Idea" for "${title}". Focus on the core creative concept that will resonate with the target audience and drive brand objectives. Context: ${buildContextString(context)}`,
          maxWords: 200
        },
        audience_insight: {
          prompt: (title: string, context: TreatmentContext) => 
            `Define the audience insight and brand voice for "${title}". Explain who the audience is, what they care about, and how the brand voice will connect with them authentically. Context: ${buildContextString(context)}`,
          maxWords: 250
        },
        treatment_narrative: {
          prompt: (title: string, context: TreatmentContext) => 
            `Write the treatment narrative for "${title}" covering the main story beats for 30s and 15s cutdowns. Focus on emotional journey and brand message delivery. Context: ${buildContextString(context)}`,
          maxWords: 400
        },
        visual_language: {
          prompt: (title: string, context: TreatmentContext) => 
            `Describe the visual language for "${title}" including styleframes, typography, color palette, aspect ratios, and placement considerations. Be specific about visual elements. Context: ${buildContextString(context)}`,
          maxWords: 300
        },
        deliverables: {
          prompt: (title: string, context: TreatmentContext) => 
            `Define the deliverables and production requirements for "${title}". Include formats, durations, technical specs, and any special considerations. Context: ${buildContextString(context)}`,
          maxWords: 200
        }
      }
    },
    documentary: {
      sections: {
        premise: {
          prompt: (title: string, context: TreatmentContext) => 
            `Write a compelling premise for the documentary "${title}". Focus on the real story, key subjects, and why this story matters now. Context: ${buildContextString(context)}`,
          maxWords: 200
        },
        subjects: {
          prompt: (title: string, context: TreatmentContext) => 
            `Describe the key subjects and participants in "${title}". Focus on their stories, motivations, and what makes them compelling documentary subjects. Context: ${buildContextString(context)}`,
          maxWords: 300
        },
        narrative_arc: {
          prompt: (title: string, context: TreatmentContext) => 
            `Outline the narrative arc for "${title}". Include key story beats, revelations, and how the story will unfold for the audience. Context: ${buildContextString(context)}`,
          maxWords: 400
        },
        visual_approach: {
          prompt: (title: string, context: TreatmentContext) => 
            `Describe the visual approach for "${title}". Include cinematography style, interview setup, archival material, and overall aesthetic. Context: ${buildContextString(context)}`,
          maxWords: 250
        },
        impact: {
          prompt: (title: string, context: TreatmentContext) => 
            `Explain the impact and relevance of "${title}". Why should audiences care about this story? What change or awareness will it create? Context: ${buildContextString(context)}`,
          maxWords: 200
        }
      }
    },
    music_video: {
      sections: {
        concept: {
          prompt: (title: string, context: TreatmentContext) => 
            `Create the core concept for the music video "${title}". Focus on the visual story that enhances the music and creates memorable moments. Context: ${buildContextString(context)}`,
          maxWords: 200
        },
        visual_story: {
          prompt: (title: string, context: TreatmentContext) => 
            `Describe the visual story and narrative for "${title}". Include key visual moments, transitions, and how the visuals support the music. Context: ${buildContextString(context)}`,
          maxWords: 300
        },
        style_aesthetic: {
          prompt: (title: string, context: TreatmentContext) => 
            `Define the style and aesthetic for "${title}". Include color palette, lighting, wardrobe, set design, and overall visual mood. Context: ${buildContextString(context)}`,
          maxWords: 250
        },
        performance: {
          prompt: (title: string, context: TreatmentContext) => 
            `Describe the performance elements for "${title}". Include artist performance, choreography, and how the artist will be featured. Context: ${buildContextString(context)}`,
          maxWords: 200
        },
        technical: {
          prompt: (title: string, context: TreatmentContext) => 
            `Outline the technical requirements for "${title}". Include camera work, special effects, post-production needs, and any unique technical challenges. Context: ${buildContextString(context)}`,
          maxWords: 200
        }
      }
    }
  };

  return templates[format as keyof typeof templates] || templates.film_tv;
}

/**
 * Build context string from treatment context
 */
function buildContextString(context: TreatmentContext): string {
  const parts = [];
  
  if (context.genre) parts.push(`Genre: ${context.genre}`);
  if (context.location) parts.push(`Location: ${context.location}`);
  if (context.protagonist) parts.push(`Protagonist: ${context.protagonist}`);
  if (context.conflict) parts.push(`Conflict: ${context.conflict}`);
  if (context.brand) parts.push(`Brand: ${context.brand}`);
  if (context.audience) parts.push(`Target Audience: ${context.audience}`);
  if (context.mood) parts.push(`Mood: ${context.mood}`);
  if (context.visualStyle) parts.push(`Visual Style: ${context.visualStyle}`);
  if (context.colors) parts.push(`Color Palette: ${context.colors}`);
  
  // Add moodboard context if available
  if (context.moodboardData) {
    parts.push(`Moodboard: ${context.moodboardData.title || 'Available'}`);
    if (context.moodboardData.summary) {
      parts.push(`Moodboard Summary: ${context.moodboardData.summary}`);
    }
  }
  
  // Add gig context if available
  if (context.gigData) {
    if (context.gigData.description) parts.push(`Project Description: ${context.gigData.description}`);
    if (context.gigData.location_text) parts.push(`Location: ${context.gigData.location_text}`);
    if (context.gigData.purpose) parts.push(`Purpose: ${context.gigData.purpose}`);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'No additional context provided';
}

/**
 * Generate CTA suggestions based on format
 */
function generateCTASuggestions(context: TreatmentContext): Array<{ label: string; target: string }> {
  const baseSuggestions = [
    { label: 'Hire DP', target: 'crew:dp' },
    { label: 'Book Equipment', target: 'gear:rental' },
    { label: 'Find Location', target: 'locations:search' },
    { label: 'Hire Editor', target: 'crew:editor' }
  ];

  const formatSpecificSuggestions = {
    film_tv: [
      { label: 'Hire Director', target: 'crew:director' },
      { label: 'Cast Actors', target: 'talent:actors' },
      { label: 'Production Design', target: 'crew:production_designer' }
    ],
    commercial_brand: [
      { label: 'Brand Guidelines', target: 'brand:guidelines' },
      { label: 'Hire Copywriter', target: 'crew:copywriter' },
      { label: 'Product Photography', target: 'services:product_photo' }
    ],
    documentary: [
      { label: 'Research Team', target: 'crew:researcher' },
      { label: 'Interview Setup', target: 'gear:interview_kit' },
      { label: 'Archival Footage', target: 'stock:archival' }
    ],
    music_video: [
      { label: 'Music Producer', target: 'crew:music_producer' },
      { label: 'Choreographer', target: 'crew:choreographer' },
      { label: 'Stylist', target: 'crew:stylist' }
    ]
  };

  const specific = formatSpecificSuggestions[context.format as keyof typeof formatSpecificSuggestions] || [];
  return [...baseSuggestions, ...specific];
}
