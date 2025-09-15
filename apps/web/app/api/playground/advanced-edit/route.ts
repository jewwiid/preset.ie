import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  const { user } = await getUserFromRequest(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    )
  }
  
  const { 
    projectId, 
    imageUrl, 
    editType, 
    editPrompt, 
    strength,
    style,
    maskImage,
    targetSize
  } = await request.json()
  
  try {
    // Check credits for advanced editing
    const creditsNeeded = getCreditsForEditType(editType)
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('current_balance, consumed_this_month')
      .eq('user_id', user.id)
      .single()
    
    if (!userCredits || userCredits.current_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${editType}.` },
        { status: 403 }
      )
    }
    
    // Determine the correct API endpoint based on edit type
    const apiEndpoint = getApiEndpointForEditType(editType)
    
    // Prepare request body based on edit type
    const requestBody = buildRequestBody(editType, {
      imageUrl,
      editPrompt,
      strength,
      style,
      maskImage,
      targetSize
    })
    
    // Call appropriate Seedream API
    const editResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WAVESPEED_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!editResponse.ok) {
      throw new Error(`Seedream ${editType} API error`)
    }
    
    const editData = await editResponse.json()
    
    // Check if edit was successful
    if (editData.code !== 200 || !editData.data.outputs || editData.data.outputs.length === 0) {
      throw new Error(editData.message || `Failed to perform ${editType}`)
    }
    
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({ 
        current_balance: userCredits.current_balance - creditsNeeded,
        consumed_this_month: userCredits.consumed_this_month + creditsNeeded
      })
      .eq('user_id', user.id)
    
    // Save edit record
    const { data: editRecord } = await supabase
      .from('playground_image_edits')
      .insert({
        project_id: projectId,
        user_id: user.id,
        edit_type: editType,
        edit_prompt: editPrompt,
        original_image_url: imageUrl,
        edited_image_url: editData.data.outputs[0],
        strength,
        credits_used: creditsNeeded,
        processing_time_ms: Date.now() - new Date().getTime()
      })
      .select()
      .single()
    
    return NextResponse.json({ 
      success: true, 
      editRecord,
      editedImage: editData.data.outputs[0],
      editType,
      creditsUsed: creditsNeeded
    })
  } catch (error) {
    console.error(`Failed to perform ${editType}:`, error)
    return NextResponse.json({ error: `Failed to perform ${editType}` }, { status: 500 })
  }
}

function getCreditsForEditType(editType: string): number {
  const creditMap: { [key: string]: number } = {
    'inpaint': 3,
    'outpaint': 3,
    'style_transfer': 2,
    'face_swap': 4,
    'object_removal': 3,
    'background_removal': 2,
    'upscale': 1,
    'color_adjustment': 2,
    'enhance': 2
  }
  return creditMap[editType] || 2
}

function getApiEndpointForEditType(editType: string): string {
  // All advanced editing features use the same seedream-v4/edit endpoint
  // The difference is in the prompt and parameters
  return 'https://api.wavespeed.ai/api/v3/bytedance/seedream-v4/edit'
}

function buildRequestBody(editType: string, params: any) {
  const baseBody = {
    images: [params.imageUrl],
    enable_base64_output: false,
    enable_sync_mode: true,
    size: "2048*2048"
  }
  
  // Build appropriate prompt based on edit type
  let prompt = params.editPrompt
  
  switch (editType) {
    case 'inpaint':
      prompt = `Inpaint the following: ${params.editPrompt}. Focus on the specific area mentioned.`
      break
    
    case 'outpaint':
      prompt = `Extend the image beyond its current boundaries: ${params.editPrompt}. Maintain visual consistency.`
      break
    
    case 'style_transfer':
      prompt = `Apply ${params.style} style to this image: ${params.editPrompt}`
      break
    
    case 'face_swap':
      prompt = `Replace the face in this image with: ${params.editPrompt}. Maintain natural lighting and proportions.`
      break
    
    case 'object_removal':
      prompt = `Remove the following objects from the image: ${params.editPrompt}. Fill the area naturally.`
      break
    
    case 'background_removal':
      prompt = `Remove the background from this image, making it transparent or replacing with a simple background.`
      break
    
    case 'upscale':
      prompt = `Enhance the resolution and quality of this image while maintaining all details and visual fidelity.`
      break
    
    case 'color_adjustment':
      prompt = `Adjust the colors of this image: ${params.editPrompt}. Maintain natural appearance.`
      break
    
    case 'enhance':
      prompt = `Enhance this image by improving sharpness, contrast, and overall visual quality: ${params.editPrompt}`
      break
    
    default:
      prompt = params.editPrompt
  }
  
  return {
    ...baseBody,
    prompt: prompt
  }
}
