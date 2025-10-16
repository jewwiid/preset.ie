import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { knowledgeBase } from '@/lib/chatbot/knowledge-base';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  isVoiceToText?: boolean;
}

export async function POST(request: NextRequest) {
  console.log('🚀 CHAT API CALLED - STARTING REQUEST');
  
  try {
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Chat service not available',
          message: 'I apologize, but the chat service is currently unavailable. Please try again later or contact support.'
        },
        { status: 503 }
      );
    }

    const { message, conversationId, userId, sessionId, isVoiceToText }: ChatRequest = await request.json();

    console.log('Chat API request data:', {
      messageLength: message?.length,
      conversationId,
      userId,
      sessionId,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString()
    });

    // Verify Supabase configuration
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
      });
      return NextResponse.json(
        { success: false, error: 'Database configuration error' },
        { status: 500 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Step 1: Moderate the user message
    console.log('🔍 STEP 1: Starting moderation check');
    
    let moderationResult;
    try {
      const moderationResponse = await fetch(`${request.nextUrl.origin}/api/chatbot/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          userId,
          conversationId
        })
      });

      if (!moderationResponse.ok) {
        console.error('❌ Moderation API failed:', moderationResponse.status, moderationResponse.statusText);
        // Continue without moderation if it fails
        moderationResult = { flagged: false, moderationResult: null };
      } else {
        moderationResult = await moderationResponse.json();
        console.log('✅ Moderation check completed:', moderationResult.flagged ? 'FLAGGED' : 'CLEAN');
      }
    } catch (moderationError) {
      console.error('❌ Moderation API error:', moderationError);
      // Continue without moderation if it fails
      moderationResult = { flagged: false, moderationResult: null };
    }

    if (moderationResult.flagged) {
      console.log('🚫 Message flagged by moderation');
      return NextResponse.json({
        success: false,
        flagged: true,
        message: 'Your message contains content that violates our community guidelines. Please revise your message and try again.',
        flaggedCategories: moderationResult.flaggedCategories
      });
    }

    // Step 2: Get or create conversation
    let currentConversationId = conversationId;
    
    // Map Supabase auth userId to users_profile.id for foreign key constraint
    let profileUserId = null;
    if (userId) {
      try {
        // First try to find by user_id (Supabase auth ID)
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users_profile')
          .select('id, user_id')
          .eq('user_id', userId)
          .single();

        if (!userCheckError && existingUser) {
          // Found user by user_id, use the profile's primary key (id)
          profileUserId = existingUser.id;
          console.log('User found by user_id, using profile ID:', profileUserId);
        } else {
          // Try to find by primary key (id) as fallback
          const { data: userById, error: idCheckError } = await supabase
            .from('users_profile')
            .select('id, user_id')
            .eq('id', userId)
            .single();

          if (!idCheckError && userById) {
            profileUserId = userById.id;
            console.log('User found by id, using profile ID:', profileUserId);
          } else {
            console.log('User ID not found in users_profile, treating as anonymous:', userId);
          }
        }
      } catch (error) {
        console.error('Error checking user existence:', error);
      }
    }
    
    if (!currentConversationId) {
      const conversationData = {
        user_id: profileUserId || null,
        session_id: sessionId || null,
        started_at: new Date().toISOString()
      };

      console.log('=== CONVERSATION CREATION START ===');
      console.log('Attempting to create conversation:', conversationData);
      console.log('Supabase client initialized:', !!supabase);
      console.log('Service role key present:', !!SUPABASE_SERVICE_ROLE_KEY);

      const { data: newConversation, error: convError } = await supabase
        .from('chatbot_conversations')
        .insert(conversationData)
        .select()
        .single();

      console.log('Conversation creation result:', {
        success: !convError,
        data: newConversation,
        error: convError
      });

      if (convError) {
        console.error('=== CONVERSATION CREATION FAILED ===');
        console.error('Error details:', convError);
        console.error('Error code:', convError.code);
        console.error('Error message:', convError.message);
        console.error('Error details:', convError.details);
        console.error('Error hint:', convError.hint);
        console.error('Conversation data:', conversationData);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create conversation', 
            details: convError.message,
            code: convError.code,
            hint: convError.hint
          },
          { status: 500 }
        );
      }

      currentConversationId = newConversation.id;
      console.log('=== CONVERSATION CREATION SUCCESS ===');
      console.log('Conversation created successfully:', currentConversationId);
    } else {
      console.log('Using existing conversation:', currentConversationId);
    }

    // Step 3: Save user message
    const userMessageData = {
      conversation_id: currentConversationId,
      user_id: profileUserId || null,
      role: 'user',
      content: message,
      moderation_result: moderationResult.moderationResult,
      metadata: isVoiceToText ? { source: 'voice-to-text' } : null
    };

    console.log('=== USER MESSAGE SAVE START ===');
    console.log('Attempting to save user message:', userMessageData);

    const { data: userMessage, error: userMsgError } = await supabase
      .from('chatbot_messages')
      .insert(userMessageData)
      .select()
      .single();

    console.log('User message save result:', {
      success: !userMsgError,
      data: userMessage,
      error: userMsgError
    });

    if (userMsgError) {
      console.error('=== USER MESSAGE SAVE FAILED ===');
      console.error('Error details:', userMsgError);
      console.error('Error code:', userMsgError.code);
      console.error('Error message:', userMsgError.message);
      console.error('User message data:', userMessageData);
      return NextResponse.json(
        { success: false, error: 'Failed to save user message', details: userMsgError.message },
        { status: 500 }
      );
    }

    console.log('=== USER MESSAGE SAVE SUCCESS ===');

    // Step 4: Get conversation history for context
    const { data: historyMessages, error: historyError } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(10); // Last 10 messages for context

    if (historyError) {
      console.error('Failed to get conversation history:', historyError);
    }

    // Step 5: Get user context if available
    let userContext = '';
    if (userId) {
      try {
        const { data: user, error: userError } = await supabase
          .from('users_profile')
          .select('role_flags')
          .eq('user_id', userId)
          .single();

        if (!userError && user) {
          const roles = user.role_flags || [];
          userContext = `User roles: ${roles.join(', ')}`;
        }
      } catch (error) {
        console.error('Failed to get user context:', error);
      }
    }

    // Step 6: Get relevant knowledge base context
    const knowledgeContext = knowledgeBase.getContextForPrompt(message);

    // Step 7: Build system prompt
    const systemPrompt = `You are Preset, the AI assistant for the Preset creative collaboration platform. You help users navigate the platform, answer questions about features, and provide support.

Platform Overview:
Preset is a subscription-based creative collaboration platform that connects Contributors (photographers/videographers) with Talent (models/creative partners) for professional shoots. The platform features gig management, applications, showcases, messaging, and AI-powered tools.

Key Features:
- Gig creation and discovery
- Application and booking system
- Collaborative showcases/portfolios
- In-app messaging
- AI-powered image enhancement
- Subscription tiers (Free, Plus, Pro)
- Safety and verification systems

User Context: ${userContext}

${knowledgeContext}

RESPONSE FORMATTING GUIDELINES:
- Use clear, concise language with proper formatting
- Structure responses with headings, bullet points, and numbered lists
- Include relevant links to help articles when appropriate (format as: [Article Title](https://preset.ie/help/article-slug))
- Use emojis sparingly but effectively for visual appeal
- Break up long responses into digestible sections
- Use markdown formatting for better readability:
  - **Bold** for emphasis
  - *Italic* for secondary emphasis
  - \`Code blocks\` for technical terms
  - > Blockquotes for important notes
  - Horizontal rules (---) to separate sections

COMMUNICATION STYLE:
- Be helpful, friendly, and professional
- Provide accurate information about the platform
- If you don't know something, say so and suggest contacting support
- Keep responses concise but informative
- Use the knowledge base context to provide accurate answers
- Encourage users to explore platform features
- Be supportive of creative collaboration
- Always end responses with a helpful call-to-action or next step

Current conversation history:
${historyMessages?.map(msg => `${msg.role}: ${msg.content}`).join('\n') || 'No previous messages'}

Respond as Preset, the helpful AI assistant with well-formatted, UI-friendly responses.`;

    // Step 8: Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 800,
        temperature: 0.7,
        stream: false
      })
    });

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text());
      return NextResponse.json(
        { success: false, error: 'AI service unavailable' },
        { status: 503 }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate response' },
        { status: 500 }
      );
    }

    // Step 9: Save AI response
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: currentConversationId,
        user_id: profileUserId || null,
        role: 'assistant',
        content: aiResponse,
        metadata: {
          model: 'gpt-4o-mini',
          tokens_used: openaiData.usage?.total_tokens || 0,
          knowledge_context_used: knowledgeContext.length > 100
        }
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Failed to save assistant message:', assistantMsgError);
    }

    // Step 10: Return response
    return NextResponse.json({
      success: true,
      message: aiResponse,
      conversationId: currentConversationId,
      messageId: assistantMessage?.id,
      metadata: {
        tokensUsed: openaiData.usage?.total_tokens || 0,
        knowledgeContextUsed: knowledgeContext.length > 100,
        moderationPassed: true
      }
    });

  } catch (error) {
    console.error('💥 CHAT API MAIN ERROR CATCH:', error);
    console.error('💥 Error type:', typeof error);
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'Chat API is running',
    openaiConfigured: !!OPENAI_API_KEY,
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
    knowledgeBaseLoaded: true
  });
}
