import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('Received callback:', { body, headers });
    
    // Determine provider from headers or body
    const provider = detectProvider(headers, body);
    
    if (provider === 'nanobanana') {
      // Handle NanoBanana callback format
      const { code, msg, data } = body;
      
      console.log('NanoBanana callback:', {
        taskId: data?.taskId,
        status: code,
        message: msg
      });
      
      if (code === 200) {
        // Task completed successfully
        const result = {
          taskId: data.taskId,
          state: 'SUCCESS' as const,
          resultUrls: [data.info?.resultImageUrl]
        };
        await handleImageGenerationResult(result);
      } else {
        // Task failed
        const result = {
          taskId: data?.taskId || 'unknown',
          state: 'FAILED' as const,
          errorCode: code.toString(),
          errorMessage: msg
        };
        await handleImageGenerationResult(result);
      }
    } else {
      // Handle other providers (existing logic)
      const result = {
        taskId: body.taskId || 'mock-task-id',
        state: 'SUCCESS' as const,
        resultUrls: [body.imageUrl || 'https://example.com/mock-image.jpg']
      };
      await handleImageGenerationResult(result);
    }
    
    // Return 200 status code to confirm callback receipt
    return NextResponse.json({ status: 'received' });
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
  
  // Check for NanoBanana specific callback format
  if (body.code !== undefined && body.msg !== undefined && body.data?.taskId) {
    return 'nanobanana';
  }
  
  // Check for other NanoBanana fields
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
