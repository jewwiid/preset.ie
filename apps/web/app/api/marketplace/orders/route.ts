import { NextRequest, NextResponse } from 'next/server';
import { OrderProcessingService } from '@/lib/services/order-processing.service';

// GET /api/marketplace/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const orderType = searchParams.get('type') as 'rental' | 'sale' | undefined;
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const orders = await OrderProcessingService.getUserOrders(userId, orderType, status || undefined);

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/marketplace/orders/rental - Create rental order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...orderData } = body;

    if (type === 'rental') {
      const result = await OrderProcessingService.createRentalOrder(orderData);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          orderId: result.orderId,
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret
        });
      } else {
        return NextResponse.json({ 
          error: result.error 
        }, { status: 400 });
      }
    } else if (type === 'sale') {
      const result = await OrderProcessingService.createSaleOrder(orderData);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          orderId: result.orderId,
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret
        });
      } else {
        return NextResponse.json({ 
          error: result.error 
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({ 
        error: 'Invalid order type. Must be "rental" or "sale"' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
