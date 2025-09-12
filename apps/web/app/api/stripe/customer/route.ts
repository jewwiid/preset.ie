import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/stripe/customer - Get customer details and payment methods
export async function GET(request: NextRequest) {
  // Temporary disabled - Stripe package not installed
  return NextResponse.json(
    { error: 'Stripe integration temporarily disabled' },
    { status: 503 }
  );

  /* Original code (commented out until Stripe is installed)
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();
    
    if (!userData?.stripe_customer_id) {
      return NextResponse.json({
        customer: null,
        paymentMethods: [],
        hasPaymentMethods: false
      });
    }

    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(userData.stripe_customer_id, {
      expand: ['default_source']
    });
    
    if (customer.deleted) {
      return NextResponse.json({
        customer: null,
        paymentMethods: [],
        hasPaymentMethods: false
      });
    }

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: userData.stripe_customer_id,
      type: 'card',
    });

    // Get recent invoices
    const invoices = await stripe.invoices.list({
      customer: userData.stripe_customer_id,
      limit: 10,
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        created: customer.created,
        balance: customer.balance,
        currency: customer.currency,
        default_source: customer.default_source,
      },
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
          funding: pm.card.funding,
        } : null,
        created: pm.created,
      })),
      invoices: invoices.data.map(invoice => ({
        id: invoice.id,
        amount_paid: invoice.amount_paid,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_pdf: invoice.invoice_pdf,
      })),
      hasPaymentMethods: paymentMethods.data.length > 0,
    });
    
  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}

// POST /api/stripe/customer - Create or update customer
export async function POST(request: NextRequest) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, phone } = await request.json();

    // Get user's current Stripe customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customer;
    
    if (userData?.stripe_customer_id) {
      // Update existing customer
      customer = await stripe.customers.update(userData.stripe_customer_id, {
        name: name || undefined,
        phone: phone || undefined,
      });
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: user.email || userData?.email,
        name: name || undefined,
        phone: phone || undefined,
        metadata: {
          user_id: user.id,
          source: 'preset_app'
        }
      });
      
      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id);
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        created: customer.created,
      }
    });
    
  } catch (error: any) {
    console.error('Error creating/updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create/update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/stripe/customer - Delete customer (rarely used)
export async function DELETE(request: NextRequest) {
  try {
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();
    
    if (!userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No customer found' },
        { status: 404 }
      );
    }

    // Delete customer from Stripe
    await stripe.customers.del(userData.stripe_customer_id);
    
    // Remove customer ID from database
    await supabase
      .from('users')
      .update({ 
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_tier: 'FREE',
        subscription_expires_at: null
      })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
  */
}