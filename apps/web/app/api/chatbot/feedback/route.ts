import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PLUNK_API_KEY = process.env.PLUNK_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHATBOT_ADMIN_EMAIL = process.env.CHATBOT_ADMIN_EMAIL || 'test@preset.ie';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export interface FeedbackRequest {
  category: 'bug' | 'feedback' | 'help' | 'suggestion';
  description: string;
  userId?: string;
  conversationId?: string;
  metadata?: {
    currentPage?: string;
    userAgent?: string;
    browserInfo?: string;
    timestamp?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { category, description, userId, conversationId, metadata }: FeedbackRequest = await request.json();

    console.log('Feedback submission attempt:', { category, userId, conversationId });

    // Validate input
    if (!category || !description) {
      return NextResponse.json(
        { success: false, error: 'Category and description are required' },
        { status: 400 }
      );
    }

    if (!['bug', 'feedback', 'help', 'suggestion'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate UUID format if userId is provided
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Check if user exists in users_profile table and get the correct profile ID
    let validUserId = userId;
    let profileUserId = null;
    console.log('DEBUG: Starting user lookup with userId:', userId);
    
    if (userId) {
      try {
        console.log('DEBUG: Searching for user by user_id (Supabase auth ID):', userId);
        // First try to find by user_id (Supabase auth ID)
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users_profile')
          .select('id, user_id')
          .eq('user_id', userId)
          .single();

        console.log('DEBUG: Search by user_id result:', { existingUser, userCheckError });

        if (!userCheckError && existingUser) {
          // Found user by user_id, use the profile's primary key (id)
          profileUserId = existingUser.id;
          console.log('DEBUG: User found by user_id, using profile ID:', profileUserId);
        } else {
          console.log('DEBUG: User not found by user_id, trying by primary key');
          // Try to find by primary key (id) as fallback
          const { data: userById, error: idCheckError } = await supabase
            .from('users_profile')
            .select('id, user_id')
            .eq('id', userId)
            .single();

          console.log('DEBUG: Search by primary key result:', { userById, idCheckError });

          if (!idCheckError && userById) {
            profileUserId = userById.id;
            console.log('DEBUG: User found by id, using profile ID:', profileUserId);
          } else {
            console.log('DEBUG: User ID not found in users_profile, treating as anonymous:', userId);
            validUserId = null; // Treat as anonymous user
          }
        }
      } catch (error) {
        console.error('DEBUG: Error checking user existence:', error);
        validUserId = null; // Treat as anonymous user on error
      }
    } else {
      console.log('DEBUG: No userId provided, user is anonymous');
    }

    console.log('DEBUG: Final user lookup result:', { validUserId, profileUserId });

    // Get user info if available
    let userInfo = null;
    if (validUserId && profileUserId) {
      try {
        console.log('Looking up user with profile ID:', profileUserId);
        
        // Get profile info from users_profile table
        const { data: profile, error: profileError } = await supabase
          .from('users_profile')
          .select('account_type, display_name, handle')
          .eq('id', profileUserId)
          .single();

        if (!profileError && profile) {
          // Get user email from Supabase auth
          let userEmail = 'Not available';
          try {
            console.log('Looking up user email from auth system for user_id:', validUserId);
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(validUserId);
            
            if (!authError && authUser?.user?.email) {
              userEmail = authUser.user.email;
              console.log('Successfully retrieved user email:', userEmail);
            } else {
              console.log('Failed to get user email from auth:', authError?.message || 'No email found');
            }
          } catch (authLookupError) {
            console.error('Error during auth email lookup:', authLookupError);
          }

          userInfo = {
            email: userEmail,
            role: profile.account_type,
            displayName: profile.display_name,
            handle: profile.handle
          };
          console.log('User profile found with email:', userInfo);
        } else {
          console.log('Profile not found:', profileError);
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
      }
    } else {
      console.log('No valid userId or profileUserId provided, user is anonymous');
    }

    // Save feedback to database
    const feedbackData = {
      user_id: profileUserId || null,
      conversation_id: conversationId || null,
      category,
      description,
      metadata: {
        ...metadata,
        userInfo,
        timestamp: new Date().toISOString()
      },
      status: 'pending'
    };

    console.log('Attempting to insert feedback:', feedbackData);

    const { data: feedback, error: feedbackError } = await supabase
      .from('chatbot_feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (feedbackError) {
      console.error('Failed to save feedback:', feedbackError);
      console.error('Feedback data:', {
        user_id: profileUserId || null,
        conversation_id: conversationId || null,
        category,
        description,
        metadata: {
          ...metadata,
          userInfo,
          timestamp: new Date().toISOString()
        },
        status: 'pending'
      });
      return NextResponse.json(
        { success: false, error: 'Failed to save feedback', details: feedbackError.message },
        { status: 500 }
      );
    }

    // Send email notification to admin if Plunk is configured
    if (PLUNK_API_KEY) {
      console.log('Attempting to send admin notification...');
      try {
        await sendAdminNotification({
          feedback,
          userInfo,
          category,
          description,
          metadata
        });
        console.log('Admin notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log('Plunk API key not configured, skipping email notification');
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      message: 'Thank you for your feedback! We\'ll review it and get back to you if needed.'
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendAdminNotification(data: {
  feedback: any;
  userInfo: any;
  category: string;
  description: string;
  metadata: any;
}) {
  const { feedback, userInfo, category, description, metadata } = data;

  const categoryEmojis = {
    bug: '🐛',
    feedback: '💡',
    help: '🆘',
    suggestion: '✨'
  };

  const categoryTitles = {
    bug: 'Bug Report',
    feedback: 'User Feedback',
    help: 'Help Request',
    suggestion: 'Feature Suggestion'
  };

  const emailSubject = `${categoryEmojis[category as keyof typeof categoryEmojis]} ${categoryTitles[category as keyof typeof categoryTitles]} - Preset Chatbot`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${emailSubject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #00876f; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .category { display: inline-block; background: #2dd4bf; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .description { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #00876f; margin: 15px 0; }
        .metadata { background: #e8f5f3; padding: 10px; border-radius: 6px; font-size: 14px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${categoryEmojis[category as keyof typeof categoryEmojis]} ${categoryTitles[category as keyof typeof categoryTitles]}</h1>
          <p>New feedback received through the Preset chatbot</p>
        </div>
        
        <div class="content">
          <div class="category">${category}</div>
          
          <h3>Description:</h3>
          <div class="description">${description.replace(/\n/g, '<br>')}</div>
          
          <h3>User Information:</h3>
          <div class="metadata">
            <p><strong>User ID:</strong> ${feedback.user_id || 'Anonymous'}</p>
            <p><strong>User Name:</strong> ${userInfo?.displayName || 'Not available'}</p>
            <p><strong>User Email:</strong> ${userInfo?.email || 'Not available'}</p>
            <p><strong>User Handle:</strong> ${userInfo?.handle ? '@' + userInfo.handle : 'Not available'}</p>
            <p><strong>User Role:</strong> ${userInfo?.role || 'Anonymous'}</p>
            <p><strong>Feedback ID:</strong> ${feedback.id}</p>
            <p><strong>Submitted:</strong> ${new Date(feedback.created_at).toLocaleString()}</p>
          </div>
          
          ${metadata.currentPage ? `
          <h3>Context Information:</h3>
          <div class="metadata">
            <p><strong>Current Page:</strong> ${metadata.currentPage}</p>
            <p><strong>Browser:</strong> ${metadata.browserInfo || 'Not available'}</p>
            <p><strong>User Agent:</strong> ${metadata.userAgent || 'Not available'}</p>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>This feedback was automatically generated from the Preset chatbot system.</p>
            <p>To view and manage feedback, please log into the admin dashboard.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
${categoryTitles[category as keyof typeof categoryTitles]} - Preset Chatbot

Description:
${description}

User Information:
- User ID: ${feedback.user_id || 'Anonymous'}
- User Name: ${userInfo?.displayName || 'Not available'}
- User Email: ${userInfo?.email || 'Not available'}
- User Handle: ${userInfo?.handle ? '@' + userInfo.handle : 'Not available'}
- User Role: ${userInfo?.role || 'Not available'}
- Feedback ID: ${feedback.id}
- Submitted: ${new Date(feedback.created_at).toLocaleString()}

${metadata.currentPage ? `
Context Information:
- Current Page: ${metadata.currentPage}
- Browser: ${metadata.browserInfo || 'Not available'}
- User Agent: ${metadata.userAgent || 'Not available'}
` : ''}

This feedback was automatically generated from the Preset chatbot system.
To view and manage feedback, please log into the admin dashboard.
  `;

  console.log('Sending email to:', CHATBOT_ADMIN_EMAIL);
  console.log('Email subject:', emailSubject);
  console.log('Plunk API key length:', PLUNK_API_KEY?.length || 0);
  console.log('Plunk API key prefix:', PLUNK_API_KEY?.substring(0, 10) + '...');
  
  const emailPayload = {
    to: CHATBOT_ADMIN_EMAIL,
    subject: emailSubject,
    body: emailHtml,
    text_body: emailText
  };
  
  console.log('Plunk API payload:', JSON.stringify(emailPayload, null, 2));
  
  const response = await fetch('https://api.useplunk.com/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PLUNK_API_KEY}`
    },
    body: JSON.stringify(emailPayload)
  });

  console.log('Plunk API response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Plunk API error:', errorText);
    throw new Error(`Plunk API error: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log('Plunk API response:', responseData);
  console.log('Admin notification sent successfully');
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'Feedback API is running',
    plunkConfigured: !!PLUNK_API_KEY,
    adminEmail: CHATBOT_ADMIN_EMAIL,
    supabaseConfigured: !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  });
}
