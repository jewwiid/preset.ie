import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../../../../packages/adapters/src/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase environment variables not set' }, { status: 500 });
  }

  const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

  // Authenticate the request
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    console.error('Auth error:', authError?.message);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build query for marketplace notifications
    let query = supabaseAdmin
      .from('notifications')
      .select(`
        id,
        type,
        category,
        title,
        message,
        avatar_url,
        action_url,
        action_data,
        sender_id,
        related_listing_id,
        related_rental_order_id,
        related_sale_order_id,
        related_offer_id,
        related_review_id,
        read_at,
        created_at,
        users_profile:sender_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('recipient_id', user.id)
      .eq('category', 'marketplace')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply category filter if specified
    if (category) {
      query = query.eq('type', category);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching marketplace notifications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('category', 'marketplace');

    if (countError) {
      console.warn('Error getting notification count:', countError.message);
    }

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      limit,
      offset,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Unexpected error in marketplace notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase environment variables not set' }, { status: 500 });
  }

  const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

  // Authenticate the request
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    console.error('Auth error:', authError?.message);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const {
    recipientId,
    type,
    title,
    message,
    avatarUrl,
    actionUrl,
    actionData,
    senderId,
    listingId,
    rentalOrderId,
    saleOrderId,
    offerId,
    reviewId,
  } = await request.json();

  if (!recipientId || !type || !title) {
    return NextResponse.json({ error: 'Missing required fields: recipientId, type, title' }, { status: 400 });
  }

  try {
    // Use the marketplace notification function
    const { data, error } = await supabaseAdmin.rpc('create_marketplace_notification', {
      p_recipient_id: recipientId,
      p_type: type,
      p_title: title,
      p_message: message || null,
      p_avatar_url: avatarUrl || null,
      p_action_url: actionUrl || null,
      p_action_data: actionData || null,
      p_sender_id: senderId || null,
      p_listing_id: listingId || null,
      p_rental_order_id: rentalOrderId || null,
      p_sale_order_id: saleOrderId || null,
      p_offer_id: offerId || null,
      p_review_id: reviewId || null,
    } as any);

    if (error) {
      console.error('Error creating marketplace notification:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notificationId: data,
      message: 'Marketplace notification created successfully',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Unexpected error in marketplace notification creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
