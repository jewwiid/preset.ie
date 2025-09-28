import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/messages/conversations - Get marketplace conversations
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get marketplace conversations with listing details and user profiles
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        gig_id,
        listing_id,
        rental_order_id,
        sale_order_id,
        offer_id,
        from_user_id,
        to_user_id,
        body,
        created_at,
        read_at,
        from_user:users_profile!messages_from_user_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        to_user:users_profile!messages_to_user_id_fkey(
          id,
          display_name,
          handle,
          avatar_url,
          verified_id
        ),
        listings!messages_listing_id_fkey(
          id,
          title,
          category,
          mode,
          status,
          owner_id,
          users_profile!listings_owner_id_fkey(
            id,
            display_name,
            handle,
            avatar_url,
            verified_id
          ),
          listing_images!listing_images_listing_id_fkey(
            id,
            url,
            sort_order
          )
        ),
        rental_orders!messages_rental_order_id_fkey(
          id,
          status,
          start_date,
          end_date,
          calculated_total_cents
        ),
        sale_orders!messages_sale_order_id_fkey(
          id,
          status,
          total_cents
        ),
        offers!messages_offer_id_fkey(
          id,
          status,
          offer_amount_cents,
          message,
          offerer_id,
          owner_id
        )
      `)
      .eq('context_type', 'marketplace')
      .or(`from_user_id.eq.${userProfile.id},to_user_id.eq.${userProfile.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (conversationsError) {
      console.error('Error fetching marketplace conversations:', conversationsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    // Group messages by conversation (gig_id for marketplace)
    const conversationMap = new Map();
    
    for (const message of conversations || []) {
      const conversationId = message.gig_id || message.listing_id; // Use listing_id if gig_id is NULL
      
      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          listing_id: message.listing_id,
          rental_order_id: message.rental_order_id,
          sale_order_id: message.sale_order_id,
          offer_id: message.offer_id,
          participants: new Set(),
          lastMessage: null,
          unreadCount: 0,
          context: {
            listing: message.listings || null,
            rental_order: message.rental_orders || null,
            sale_order: message.sale_orders || null,
            offer: message.offers || null
          },
          startedAt: message.created_at,
          lastMessageAt: message.created_at
        });
      }
      
      const conversation = conversationMap.get(conversationId);
      conversation.participants.add(message.from_user_id);
      conversation.participants.add(message.to_user_id);
      
          // Update last message
          if (!conversation.lastMessage || new Date(message.created_at) > new Date(conversation.lastMessage.sentAt)) {
            conversation.lastMessage = {
              id: message.id,
              body: message.body,
              fromUserId: message.from_user_id,
              sentAt: message.created_at,
              read: !!message.read_at
            };
            conversation.lastMessageAt = message.created_at;
            // Store the other user's profile data
            conversation.otherUserProfile = message.from_user_id === userProfile.id ? message.to_user : message.from_user;
            
            // Debug logging
            console.log('Message user data:', {
              from_user_id: message.from_user_id,
              to_user_id: message.to_user_id,
              userProfile_id: userProfile.id,
              from_user: message.from_user,
              to_user: message.to_user,
              otherUserProfile: conversation.otherUserProfile
            });
          }
      
      // Count unread messages
      if (message.to_user_id === userProfile.id && !message.read_at) {
        conversation.unreadCount++;
      }
    }

    // Convert to array and format participants
    const formattedConversations = await Promise.all(Array.from(conversationMap.values()).map(async conv => {
      // If otherUserProfile is missing, fetch it manually
      if (!conv.otherUserProfile) {
        const otherUserId = conv.participants.find((id: string) => id !== userProfile.id);
        if (otherUserId) {
          const { data: otherUserProfile } = await supabaseAdmin
            .from('users_profile')
            .select('id, display_name, handle, avatar_url, verified_id')
            .eq('id', otherUserId)
            .single();
          conv.otherUserProfile = otherUserProfile;
        }
      }
      
      return {
        ...conv,
        participants: Array.from(conv.participants),
        gigId: conv.id, // For compatibility with existing messaging system
        otherUser: conv.otherUserProfile ? {
          id: conv.otherUserProfile.id,
          display_name: conv.otherUserProfile.display_name,
          handle: conv.otherUserProfile.handle,
          avatar_url: conv.otherUserProfile.avatar_url,
          verified_id: conv.otherUserProfile.verified_id
        } : {
          id: conv.participants.find((id: string) => id !== userProfile.id) || '',
          display_name: 'Unknown User',
          handle: 'unknown',
          avatar_url: null,
          verified_id: false
        }
      };
    }));

    return NextResponse.json({
      conversations: formattedConversations,
      total: formattedConversations.length,
      totalUnread: formattedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
    });

  } catch (error) {
    console.error('Marketplace conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
