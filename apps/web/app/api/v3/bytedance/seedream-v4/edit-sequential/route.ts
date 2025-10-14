import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';
import { getUserFromRequest } from '../../../../../../lib/auth-utils';
import CinematicPromptBuilder from '../../../../../../../../packages/services/src/cinematic-prompt-builder';
import { getProviderCost } from '../../../../../../lib/credits';

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      prompt,
      images,
      max_images,
      size,
      aspect_ratio = '1:1',
      cinematic_parameters,
      provider = 'seedream',
      enable_base64_output = false,
      enable_sync_mode = true,
    } = body;

    // Validation
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'At least one source image is required' },
        { status: 400 }
      );
    }

    if (images.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 source images allowed' },
        { status: 400 }
      );
    }

    if (!max_images || max_images < 1 || max_images > 15) {
      return NextResponse.json(
        { error: 'max_images must be between 1 and 15' },
        { status: 400 }
      );
    }

    // Calculate credits needed using proper credit system
    const creditsNeeded = getProviderCost('seedream', max_images);

    // Check user credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !userCredits) {
      return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 500 });
    }

    if (userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Need ${creditsNeeded} credits but have ${userCredits.current_balance} credits.`,
        },
        { status: 403 }
      );
    }

    // Prepare images payload for API
    const imagesPayload = images.map((img: any) => {
      if (typeof img === 'string') {
        return { url: img, type: 'reference' };
      }
      return {
        url: img.url,
        type: img.type || 'reference',
        customLabel: img.customLabel,
        attribution: img.attribution,
      };
    });

    // Store source images permanently in Supabase Storage
    const storedSourceImages = await Promise.all(
      imagesPayload.map(async (img: any, index: number) => {
        try {
          // Download image from URL
          const imageResponse = await fetch(img.url);
          const imageBuffer = await imageResponse.arrayBuffer();
          
          // Generate storage path
          const fileName = `${user.id}/${Date.now()}_source_${index}.jpg`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('source-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/jpeg',
              upsert: false
            });
          
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('source-images')
            .getPublicUrl(fileName);
          
          // Save to source_images table
          const { data: sourceImage, error: dbError } = await supabase
            .from('source_images')
            .insert({
              user_id: user.id,
              storage_bucket: 'source-images',
              storage_path: fileName,
              original_url: img.url,
              thumbnail_url: publicUrl,
              source_type: img.url.includes('pexels') ? 'pexels' : 'url',
              image_type: img.type,
              custom_label: img.customLabel,
              source_metadata: { 
                original_type: img.type,
                attribution: img.attribution
              }
            })
            .select()
            .single();
          
          if (dbError) throw dbError;
          
          return {
            ...img,
            source_image_id: sourceImage.id,
            stored_url: publicUrl
          };
        } catch (error) {
          console.error('Error storing source image:', error);
          return img; // Fallback to original
        }
      })
    );

    // Validate Nanobanana aspect ratios
    const NANOBANANA_RATIOS = ['1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];

    if (provider === 'nanobanana' && !NANOBANANA_RATIOS.includes(aspect_ratio)) {
      return NextResponse.json(
        {
          success: false,
          error: `Nanobanana only supports these aspect ratios: ${NANOBANANA_RATIOS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Calculate final dimensions based on size + aspect_ratio
    const calculateDimensions = (baseSize: number, ratio: string) => {
      const [w, h] = ratio.split(':').map(Number);
      const aspectValue = w / h;
      
      if (aspectValue >= 1) {
        return { width: baseSize, height: Math.round(baseSize / aspectValue) };
      } else {
        return { width: Math.round(baseSize * aspectValue), height: baseSize };
      }
    };

    // Determine resolution
    let finalSize = size;
    if (provider === 'seedream') {
      // For Seedream: calculate dimensions from size + aspect_ratio
      const dimensions = calculateDimensions(size, aspect_ratio);
      finalSize = `${dimensions.width}*${dimensions.height}`;
    } else {
      // For Nanobanana: use square base size (aspect ratio sent separately)
      if (typeof size === 'number') {
        finalSize = `${size}*${size}`;
      } else if (typeof size === 'string' && !size.includes('*')) {
        finalSize = `${size}*${size}`;
      }
    }

    // Enhance prompt with cinematic parameters if provided
    let enhancedPrompt = prompt.trim();
    if (cinematic_parameters && Object.keys(cinematic_parameters).length > 0) {
      const promptBuilder = new CinematicPromptBuilder();
      const result = promptBuilder.constructPrompt({
        basePrompt: prompt.trim(),
        cinematicParameters: cinematic_parameters,
        enhancementType: 'generate',
        includeTechnicalDetails: true,
        includeStyleReferences: true,
      });
      enhancedPrompt = result.fullPrompt;
      console.log('Enhanced prompt with cinematic parameters:', enhancedPrompt);
    }

    console.log('Stitch API Request:', {
      prompt: enhancedPrompt,
      images: imagesPayload,
      max_images,
      size: finalSize,
      provider,
    });

    // Prepare API-specific payload
    let apiUrl: string;
    let requestBody: any;

    if (provider === 'nanobanana') {
      // Nanobanana uses different schema
      apiUrl = 'https://api.wavespeed.ai/api/v3/google/nano-banana/edit';
      requestBody = {
        prompt: enhancedPrompt,
        images: imagesPayload.map((img: any) => img.url), // Nanobanana expects string[] not object[]
        aspect_ratio: aspect_ratio,
        output_format: 'png',
        enable_base64_output,
        enable_sync_mode,
      };
    } else {
      // Seedream uses edit-sequential schema
      apiUrl = 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit-sequential';
      requestBody = {
        prompt: enhancedPrompt,
        images: imagesPayload,
        max_images,
        size: finalSize,
        enable_base64_output,
        enable_sync_mode,
      };
    }

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error('Wavespeed API error:', errorData);
      throw new Error(errorData.message || 'API request failed');
    }

    const apiData = await apiResponse.json();

    // Handle response format
    let generatedImages: string[] = [];
    if (apiData.code === 200 && apiData.data?.outputs) {
      generatedImages = apiData.data.outputs;
    } else if (apiData.images && Array.isArray(apiData.images)) {
      generatedImages = apiData.images;
    } else if (apiData.data?.images && Array.isArray(apiData.data.images)) {
      generatedImages = apiData.data.images;
    } else {
      throw new Error('Invalid API response format');
    }

    if (generatedImages.length === 0) {
      throw new Error('No images generated');
    }

    // Deduct credits
    await supabase
      .from('user_credits')
      .update({
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded,
      })
      .eq('user_id', user.id);

    // Create project record
    const projectData = {
      user_id: user.id,
      title: `Stitch: ${prompt.substring(0, 50)}`,
      prompt: prompt.trim(),
      style: 'stitch',
      aspect_ratio: aspect_ratio,
      resolution: finalSize,
      generated_images: generatedImages.map((imgUrl: string, index: number) => ({
        url: imgUrl,
        width: parseInt(finalSize.split('*')[0]),
        height: parseInt(finalSize.split('*')[1]),
        generated_at: new Date().toISOString(),
        sequence_index: index,
        source_images: storedSourceImages,
        source_image_ids: storedSourceImages.map(s => s.source_image_id).filter(Boolean)
      })),
      // Store comprehensive generation metadata in the same format as existing system
      generation_metadata: {
        prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        provider: provider,
        resolution: finalSize,
        aspect_ratio: aspect_ratio,
        cinematic_parameters: cinematic_parameters,
        generation_mode: 'stitch',
        credits_used: creditsNeeded,
        source_images: storedSourceImages,
        source_image_ids: storedSourceImages.map(s => s.source_image_id).filter(Boolean),
        generated_at: new Date().toISOString(),
        // Preserve original request data
        max_images: max_images,
        size: finalSize,
        images_count: images.length,
        source_types: imagesPayload.map(img => img.type),
        custom_labels: imagesPayload.map(img => img.customLabel).filter(Boolean),
        source_attributions: imagesPayload.map(img => img.attribution).filter(Boolean)
      },
      credits_used: creditsNeeded,
      status: 'generated',
      last_generated_at: new Date().toISOString(),
      generation_type: 'stitch',
      cinematic_parameters: cinematic_parameters,
      provider: provider,
    };

    const { data: project, error: projectError } = await supabase
      .from('playground_projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error('Failed to save project:', projectError);
    } else if (project) {
      // Create generation source references for Stitch
      const sourceReferences = storedSourceImages
        .filter(img => img.source_image_id)
        .map((img, index) => ({
          generation_id: project.id,
          generation_type: 'project',
          source_image_id: img.source_image_id,
          sequence_order: index,
          image_role: img.type
        }));

      if (sourceReferences.length > 0) {
        const { error: refError } = await supabase
          .from('generation_source_references')
          .insert(sourceReferences);

        if (refError) {
          console.error('Failed to create source references:', refError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      images: generatedImages,
      project: project || null,
      creditsUsed: creditsNeeded,
      metadata: {
        prompt,
        max_images,
        size: finalSize,
        provider,
        source_images_count: images.length,
      },
    });
  } catch (error) {
    console.error('Stitch generation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate stitched images',
      },
      { status: 500 }
    );
  }
}
