import { NextRequest, NextResponse } from 'next/server';
import { ImageGenProviderFactory } from '@preset/adapters';
import { ImageGenConfig } from '@preset/adapters';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    // Determine provider from headers or body
    const provider = detectProvider(headers, body);
    
    // Get configuration and create provider
    const config = ImageGenConfig.fromEnvironment();
    config.provider = provider;
    ImageGenConfig.validateConfig(config);
    
    const imageGenService = ImageGenProviderFactory.createProvider(config);
    
    // Parse webhook
    const result = await imageGenService.verifyAndParseWebhook(headers, body);
    
    // Handle the result (update database, notify user, etc.)
    await handleImageGenerationResult(result);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image generation webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function detectProvider(headers: Record<string, string>, body: any): 'nanobanana' | 'seedream' {
  // Check for WaveSpeed signature
  if (headers['x-wavespeed-signature'] || headers['x-signature']) {
    return 'seedream';
  }
  
  // Check for NanoBanana specific fields
  if (body.task_id || body.status) {
    return 'nanobanana';
  }
  
  // Default to configured provider
  return (process.env.IMAGE_PROVIDER as 'nanobanana' | 'seedream') || 'nanobanana';
}

async function handleImageGenerationResult(result: {
  taskId: string;
  state: 'SUCCESS' | 'FAILED';
  resultUrls?: string[];
  errorCode?: string;
  errorMessage?: string;
}) {
  // TODO: Implement your business logic here
  // - Update database with result
  // - Notify user via websocket/email
  // - Update credit balance
  // - Log analytics
  
  console.log('Image generation result:', result);
}
