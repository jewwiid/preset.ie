import { NextRequest, NextResponse } from 'next/server';
import { OrderProcessingService } from '@/lib/services/order-processing.service';

// GET /api/marketplace/orders/[id] - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const orderType = searchParams.get('type') as 'rental' | 'sale';

    if (!orderType) {
      return NextResponse.json({ 
        error: 'Order type is required' 
      }, { status: 400 });
    }

    const order = await OrderProcessingService.getOrderDetails(id, orderType);

    if (!order) {
      return NextResponse.json({ 
        error: 'Order not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ order });

  } catch (error) {
    console.error('Get order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/marketplace/orders/[id] - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { orderType, status, notes } = body;

    if (!orderType || !status) {
      return NextResponse.json({ 
        error: 'Order type and status are required' 
      }, { status: 400 });
    }

    const result = await OrderProcessingService.updateOrderStatus(
      id,
      orderType,
      status,
      notes
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Update order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
