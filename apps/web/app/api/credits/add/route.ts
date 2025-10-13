import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addUserCredits, TRANSACTION_TYPES } from '@/lib/credits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * POST /api/credits/add
 * Add credits to a user's account
 * Used for referral bonuses, manual adjustments, and other credit allocations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, description, transactionType, metadata } = body;

    // Validate required fields
    if (!userId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes = Object.values(TRANSACTION_TYPES);
    const finalTransactionType = transactionType || TRANSACTION_TYPES.ALLOCATION;

    if (!validTypes.includes(finalTransactionType)) {
      return NextResponse.json(
        {
          error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log(`💰 Adding ${amount} credits to user ${userId}`, {
      transactionType: finalTransactionType,
      description,
    });

    // Add credits using the helper function
    const result = await addUserCredits(
      supabaseAdmin,
      userId,
      amount,
      finalTransactionType,
      {
        description,
        ...metadata,
      }
    );

    if (!result.success) {
      console.error('❌ Failed to add credits:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to add credits' },
        { status: 500 }
      );
    }

    console.log(`✅ Credits added successfully. New balance: ${result.newBalance}`);

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      creditsAdded: amount,
      transactionId: result.transactionId,
      message: `Successfully added ${amount} credit(s)`,
    });
  } catch (error) {
    console.error('❌ Error in /api/credits/add:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
