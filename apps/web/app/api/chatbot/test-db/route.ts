import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  return testDatabase();
}

export async function POST() {
  return testDatabase();
}

async function testDatabase() {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!SUPABASE_URL,
          hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Test 1: Check if tables exist by trying to select from them
    const tableChecks = await Promise.allSettled([
      supabase.from('chatbot_conversations').select('id').limit(1),
      supabase.from('chatbot_messages').select('id').limit(1),
      supabase.from('chatbot_feedback').select('id').limit(1)
    ]);

    const tables = [];
    const tableErrors = [];
    
    if (tableChecks[0].status === 'fulfilled' && !tableChecks[0].value.error) {
      tables.push('chatbot_conversations');
    } else {
      tableErrors.push(`chatbot_conversations: ${tableChecks[0].status === 'rejected' ? tableChecks[0].reason : tableChecks[0].value?.error?.message}`);
    }
    
    if (tableChecks[1].status === 'fulfilled' && !tableChecks[1].value.error) {
      tables.push('chatbot_messages');
    } else {
      tableErrors.push(`chatbot_messages: ${tableChecks[1].status === 'rejected' ? tableChecks[1].reason : tableChecks[1].value?.error?.message}`);
    }
    
    if (tableChecks[2].status === 'fulfilled' && !tableChecks[2].value.error) {
      tables.push('chatbot_feedback');
    } else {
      tableErrors.push(`chatbot_feedback: ${tableChecks[2].status === 'rejected' ? tableChecks[2].reason : tableChecks[2].value?.error?.message}`);
    }

    // Test 3: Try to create a test conversation
    const testConversationData = {
      user_id: null,
      session_id: `test_session_${Date.now()}`,
      started_at: new Date().toISOString()
    };

    console.log('🧪 Testing conversation creation with data:', testConversationData);

    const { data: testConversation, error: testError } = await supabase
      .from('chatbot_conversations')
      .insert(testConversationData)
      .select()
      .single();

    console.log('🧪 Conversation creation result:', {
      success: !testError,
      data: testConversation,
      error: testError
    });

    // Clean up test conversation
    if (testConversation) {
      await supabase
        .from('chatbot_conversations')
        .delete()
        .eq('id', testConversation.id);
      console.log('🧪 Test conversation cleaned up');
    }

    return NextResponse.json({
      success: true,
      results: {
        tables: tables,
        tableErrors: tableErrors,
        testConversation: testConversation ? 'SUCCESS' : 'FAILED',
        testError: testError ? {
          message: testError.message,
          code: testError.code,
          hint: testError.hint,
          details: testError.details
        } : null,
        environment: {
          hasUrl: !!SUPABASE_URL,
          hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
          serviceKeyPrefix: SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
