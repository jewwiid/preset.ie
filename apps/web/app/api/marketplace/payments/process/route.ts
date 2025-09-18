import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/marketplace/payments/process - Process marketplace payment
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      order_type, // 'rental' or 'sale'
      order_id,
      payment_method, // 'credits' or 'stripe'
      amount_cents,
      retainer_cents = 0,
      deposit_cents = 0
    } = body;

    // Validate required fields
    if (!order_type || !order_id || !payment_method || !amount_cents) {
      return NextResponse.json(
        { error: 'Order type, order ID, payment method, and amount are required' },
        { status: 400 }
      );
    }

    // Get order details
    let order: any;
    if (order_type === 'rental') {
      const { data: rentalOrder, error: orderError } = await supabaseAdmin
        .from('rental_orders')
        .select(`
          id,
          owner_id,
          renter_id,
          listing_id,
          calculated_total_cents,
          retainer_cents,
          deposit_cents,
          status,
          listings!rental_orders_listing_id_fkey (
            id,
            title,
            owner_id
          )
        `)
        .eq('id', order_id)
        .single();

      if (orderError || !rentalOrder) {
        return NextResponse.json(
          { error: 'Rental order not found' },
          { status: 404 }
        );
      }

      // Verify user has access to this order
      if (rentalOrder.owner_id !== userProfile.id && rentalOrder.renter_id !== userProfile.id) {
        return NextResponse.json(
          { error: 'You do not have access to this order' },
          { status: 403 }
        );
      }

      // Verify order is in correct status for payment
      if (rentalOrder.status !== 'accepted') {
        return NextResponse.json(
          { error: 'Order must be accepted before payment' },
          { status: 400 }
        );
      }

      order = rentalOrder;
    } else if (order_type === 'sale') {
      const { data: saleOrder, error: orderError } = await supabaseAdmin
        .from('sale_orders')
        .select(`
          id,
          owner_id,
          buyer_id,
          listing_id,
          total_cents,
          status,
          listings!sale_orders_listing_id_fkey (
            id,
            title,
            owner_id
          )
        `)
        .eq('id', order_id)
        .single();

      if (orderError || !saleOrder) {
        return NextResponse.json(
          { error: 'Sale order not found' },
          { status: 404 }
        );
      }

      // Verify user has access to this order
      if (saleOrder.owner_id !== userProfile.id && saleOrder.buyer_id !== userProfile.id) {
        return NextResponse.json(
          { error: 'You do not have access to this order' },
          { status: 403 }
        );
      }

      // Verify order is in correct status for payment
      if (saleOrder.status !== 'placed') {
        return NextResponse.json(
          { error: 'Order must be placed before payment' },
          { status: 400 }
        );
      }

      order = saleOrder;
    } else {
      return NextResponse.json(
        { error: 'Invalid order type' },
        { status: 400 }
      );
    }

    // Process payment based on method
    if (payment_method === 'credits') {
      return await processCreditsPayment(supabaseAdmin, userProfile.id, order, order_type, amount_cents, retainer_cents, deposit_cents);
    } else if (payment_method === 'stripe') {
      return await processStripePayment(supabaseAdmin, userProfile.id, order, order_type, amount_cents, retainer_cents, deposit_cents);
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Marketplace payment processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processCreditsPayment(
  supabase: any,
  userId: string,
  order: any,
  orderType: string,
  amountCents: number,
  retainerCents: number,
  depositCents: number
) {
  try {
    // Get user's credit balance
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('current_balance, monthly_allowance, consumed_this_month')
      .eq('user_id', userId)
      .single();

    if (creditsError || !userCredits) {
      return NextResponse.json(
        { error: 'User credit account not found' },
        { status: 404 }
      );
    }

    // Convert cents to credits (assuming 1 credit = 1 cent for simplicity)
    const requiredCredits = amountCents + retainerCents + depositCents;

    if (userCredits.current_balance < requiredCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: requiredCredits,
          available: userCredits.current_balance,
          shortfall: requiredCredits - userCredits.current_balance
        },
        { status: 400 }
      );
    }

    // Start transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'deduction',
        credits_used: requiredCredits,
        cost_usd: requiredCredits / 100, // Convert cents to USD
        provider: 'marketplace',
        api_request_id: `${orderType}_${order.id}`,
        enhancement_type: 'marketplace_payment',
        status: 'pending'
      })
      .select('id')
      .single();

    if (transactionError) {
      console.error('Error creating credit transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create payment transaction' },
        { status: 500 }
      );
    }

    // Update user credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        current_balance: userCredits.current_balance - requiredCredits,
        consumed_this_month: userCredits.consumed_this_month + requiredCredits,
        lifetime_consumed: userCredits.lifetime_consumed + requiredCredits
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }

    // Update order status
    const orderUpdateData: any = {
      status: 'paid',
      credits_tx_id: transaction.id
    };

    if (orderType === 'rental') {
      await supabase
        .from('rental_orders')
        .update(orderUpdateData)
        .eq('id', order.id);
    } else {
      await supabase
        .from('sale_orders')
        .update(orderUpdateData)
        .eq('id', order.id);
    }

    // Update transaction status
    await supabase
      .from('credit_transactions')
      .update({ status: 'completed' })
      .eq('id', transaction.id);

    return NextResponse.json({
      success: true,
      payment_method: 'credits',
      transaction_id: transaction.id,
      amount_paid: requiredCredits,
      new_balance: userCredits.current_balance - requiredCredits,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Credits payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process credits payment' },
      { status: 500 }
    );
  }
}

async function processStripePayment(
  supabase: any,
  userId: string,
  order: any,
  orderType: string,
  amountCents: number,
  retainerCents: number,
  depositCents: number
) {
  try {
    // TODO: Implement Stripe payment processing
    // This would involve:
    // 1. Creating a Stripe PaymentIntent
    // 2. Handling retainer holds with capture_method: 'manual'
    // 3. Storing Stripe payment intent ID
    // 4. Updating order status
    
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      payment_method: 'stripe',
      transaction_id: `stripe_${Date.now()}`,
      amount_paid: amountCents + retainerCents + depositCents,
      message: 'Stripe payment processing not yet implemented'
    });

  } catch (error) {
    console.error('Stripe payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process Stripe payment' },
      { status: 500 }
    );
  }
}
