import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/marketplace/conversations/[id]/contacts - Get shared contact details for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
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

    // Determine conversation type by checking what exists
    let conversationType = 'listing';
    
    // Check if it's a rental order
    const { data: rentalOrder } = await supabaseAdmin
      .from('rental_orders')
      .select('id')
      .eq('id', conversationId)
      .single();
    
    if (rentalOrder) {
      conversationType = 'rental_order';
    } else {
      // Check if it's a sale order
      const { data: saleOrder } = await supabaseAdmin
        .from('sale_orders')
        .select('id')
        .eq('id', conversationId)
        .single();
      
      if (saleOrder) {
        conversationType = 'sale_order';
      }
    }

    // Get shared contact details using the database function
    const { data: sharedContacts, error: contactsError } = await supabaseAdmin
      .rpc('get_shared_contacts', {
        p_conversation_id: conversationId,
        p_conversation_type: conversationType,
        p_user_id: userProfile.id
      });

    if (contactsError) {
      console.error('Error fetching shared contacts:', contactsError);
      return NextResponse.json(
        { error: 'Failed to fetch shared contacts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sharedContacts || []
    });

  } catch (error) {
    console.error('Get shared contacts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
