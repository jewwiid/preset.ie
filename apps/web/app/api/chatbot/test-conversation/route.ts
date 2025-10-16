import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  console.log('🧪 TEST CONVERSATION ENDPOINT CALLED');
  
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Test conversation creation with exact same data structure as chat API
    const conversationData = {
      user_id: null,
      session_id: `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      started_at: new Date().toISOString()
    };

    console.log('🧪 Testing conversation creation with data:', conversationData);

    const { data: newConversation, error: convError } = await supabase
      .from('chatbot_conversations')
      .insert(conversationData)
      .select()
      .single();

    console.log('🧪 Conversation creation result:', {
      success: !convError,
      data: newConversation,
      error: convError
    });

    if (convError) {
      console.error('🧪 CONVERSATION CREATION FAILED:', convError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create conversation',
        details: convError.message,
        code: convError.code,
        hint: convError.hint,
        fullError: convError
      }, { status: 500 });
    }

    // Clean up test conversation
    await supabase
      .from('chatbot_conversations')
      .delete()
      .eq('id', newConversation.id);

    console.log('🧪 TEST CONVERSATION SUCCESS - cleaned up');

    return NextResponse.json({
      success: true,
      message: 'Conversation creation test passed',
      conversationId: newConversation.id
    });

  } catch (error) {
    console.error('🧪 TEST CONVERSATION ENDPOINT ERROR:', error);
    return NextResponse.json({
      success: false,
      error: 'Test conversation endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
