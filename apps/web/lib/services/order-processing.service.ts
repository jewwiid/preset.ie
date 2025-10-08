import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface RentalOrderData {
  listingId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyRate: number;
  totalAmount: number;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  specialRequests?: string;
}

export interface SaleOrderData {
  listingId: string;
  buyerId: string;
  totalAmount: number;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  specialRequests?: string;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export class OrderProcessingService {
  /**
   * Create a rental order with payment processing
   */
  static async createRentalOrder(orderData: RentalOrderData): Promise<OrderResult> {
    try {
      const supabase = getSupabaseClient()
      // Verify listing exists and is available
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', orderData.listingId)
        .eq('status', 'active')
        .single();

      if (listingError || !listing) {
        return { success: false, error: 'Listing not found or not available' };
      }

      // Check if listing is available for the requested dates
      const isAvailable = await this.checkListingAvailability(
        orderData.listingId,
        orderData.startDate,
        orderData.endDate
      );

      if (!isAvailable) {
        return { success: false, error: 'Listing not available for the requested dates' };
      }

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(orderData.totalAmount * 100), // Convert to cents
        currency: 'eur',
        metadata: {
          type: 'rental',
          listing_id: orderData.listingId,
          renter_id: orderData.renterId,
          start_date: orderData.startDate,
          end_date: orderData.endDate,
          total_days: orderData.totalDays.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create rental order in database
      const { data: order, error: orderError } = await supabase
        .from('rental_orders')
        .insert({
          listing_id: orderData.listingId,
          renter_id: orderData.renterId,
          owner_id: listing.owner_id,
          start_date: orderData.startDate,
          end_date: orderData.endDate,
          total_days: orderData.totalDays,
          daily_rate_cents: Math.round(orderData.dailyRate * 100),
          total_amount_cents: Math.round(orderData.totalAmount * 100),
          payment_intent_id: paymentIntent.id,
          delivery_method: orderData.deliveryMethod,
          delivery_address: orderData.deliveryAddress,
          special_requests: orderData.specialRequests,
          status: 'pending_payment'
        })
        .select()
        .single();

      if (orderError) {
        // Cancel payment intent if order creation fails
        await stripe.paymentIntents.cancel(paymentIntent.id);
        return { success: false, error: 'Failed to create rental order' };
      }

      return {
        success: true,
        orderId: order.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined
      };

    } catch (error) {
      console.error('Error creating rental order:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Create a sale order with payment processing
   */
  static async createSaleOrder(orderData: SaleOrderData): Promise<OrderResult> {
    try {
      const supabase = getSupabaseClient()
      // Verify listing exists and is available
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', orderData.listingId)
        .eq('status', 'active')
        .single();

      if (listingError || !listing) {
        return { success: false, error: 'Listing not found or not available' };
      }

      // Check if listing has a sale price
      if (!listing.sale_price_cents) {
        return { success: false, error: 'This listing is not available for sale' };
      }

      // Create Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(orderData.totalAmount * 100), // Convert to cents
        currency: 'eur',
        metadata: {
          type: 'sale',
          listing_id: orderData.listingId,
          buyer_id: orderData.buyerId
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create sale order in database
      const { data: order, error: orderError } = await supabase
        .from('sale_orders')
        .insert({
          listing_id: orderData.listingId,
          buyer_id: orderData.buyerId,
          owner_id: listing.owner_id,
          total_amount_cents: Math.round(orderData.totalAmount * 100),
          payment_intent_id: paymentIntent.id,
          delivery_method: orderData.deliveryMethod,
          delivery_address: orderData.deliveryAddress,
          special_requests: orderData.specialRequests,
          status: 'pending_payment'
        })
        .select()
        .single();

      if (orderError) {
        // Cancel payment intent if order creation fails
        await stripe.paymentIntents.cancel(paymentIntent.id);
        return { success: false, error: 'Failed to create sale order' };
      }

      return {
        success: true,
        orderId: order.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined
      };

    } catch (error) {
      console.error('Error creating sale order:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Check if a listing is available for the requested dates
   */
  static async checkListingAvailability(
    listingId: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()
      // Check for existing rental orders that overlap with the requested dates
      const { data: conflictingOrders, error } = await supabase
        .from('rental_orders')
        .select('id')
        .eq('listing_id', listingId)
        .in('status', ['pending_payment', 'confirmed', 'in_progress'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (error) {
        console.error('Error checking availability:', error);
        return false;
      }

      // Check for availability blocks
      const { data: availabilityBlocks, error: blocksError } = await supabase
        .from('listing_availability')
        .select('id')
        .eq('listing_id', listingId)
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (blocksError) {
        console.error('Error checking availability blocks:', blocksError);
        return false;
      }

      return conflictingOrders.length === 0 && availabilityBlocks.length === 0;

    } catch (error) {
      console.error('Error checking listing availability:', error);
      return false;
    }
  }

  /**
   * Confirm payment and update order status
   */
  static async confirmPayment(paymentIntentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient()
      // Get payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return { success: false, error: 'Payment not completed' };
      }

      const metadata = paymentIntent.metadata;
      const orderType = metadata.type;

      if (orderType === 'rental') {
        // Update rental order status
        const { error: updateError } = await supabase
          .from('rental_orders')
          .update({ 
            status: 'confirmed',
            payment_confirmed_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntentId);

        if (updateError) {
          return { success: false, error: 'Failed to update rental order' };
        }

        // Create notification for owner
        await this.createOrderNotification(
          metadata.owner_id,
          'rental_order_confirmed',
          {
            order_id: metadata.order_id,
            renter_id: metadata.renter_id,
            listing_id: metadata.listing_id
          }
        );

      } else if (orderType === 'sale') {
        // Update sale order status
        const { error: updateError } = await supabase
          .from('sale_orders')
          .update({ 
            status: 'confirmed',
            payment_confirmed_at: new Date().toISOString()
          })
          .eq('payment_intent_id', paymentIntentId);

        if (updateError) {
          return { success: false, error: 'Failed to update sale order' };
        }

        // Mark listing as sold
        const { error: listingError } = await supabase
          .from('listings')
          .update({ status: 'sold' })
          .eq('id', metadata.listing_id);

        if (listingError) {
          console.error('Error updating listing status:', listingError);
        }

        // Create notification for owner
        await this.createOrderNotification(
          metadata.owner_id,
          'sale_order_confirmed',
          {
            order_id: metadata.order_id,
            buyer_id: metadata.buyer_id,
            listing_id: metadata.listing_id
          }
        );
      }

      return { success: true };

    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get order details
   */
  static async getOrderDetails(orderId: string, orderType: 'rental' | 'sale'): Promise<Record<string, unknown> | null> {
    try {
      const supabase = getSupabaseClient()
      const tableName = orderType === 'rental' ? 'rental_orders' : 'sale_orders';
      
      const { data: order, error } = await supabase
        .from(tableName)
        .select(`
          *,
          listing:listings(
            id,
            title,
            description,
            category,
            condition,
            images,
            owner:users_profile!listings_owner_id_fkey(
              id,
              username,
              display_name,
              avatar_url,
              verified,
              rating,
              city,
              country
            )
          ),
          ${orderType === 'rental' ? 'renter' : 'buyer'}:users_profile!${tableName}_${orderType === 'rental' ? 'renter' : 'buyer'}_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified,
            rating
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        throw new Error('Order not found');
      }

      return order;

    } catch (error) {
      console.error('Error getting order details:', error);
      return null;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    orderType: 'rental' | 'sale',
    status: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient()
      const tableName = orderType === 'rental' ? 'rental_orders' : 'sale_orders';
      
      const updateData: Record<string, unknown> = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      // Add specific timestamps based on status
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        return { success: false, error: 'Failed to update order status' };
      }

      return { success: true };

    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Create order notification
   */
  private static async createOrderNotification(
    userId: string,
    type: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient()
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          metadata,
          read: false
        });
    } catch (error) {
      console.error('Error creating order notification:', error);
    }
  }

  /**
   * Calculate rental total
   */
  static calculateRentalTotal(
    dailyRate: number,
    startDate: string,
    endDate: string
  ): { totalDays: number; totalAmount: number } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalAmount = dailyRate * totalDays;

    return { totalDays, totalAmount };
  }

  /**
   * Get user's orders
   */
  static async getUserOrders(
    userId: string,
    orderType?: 'rental' | 'sale',
    status?: string
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const supabase = getSupabaseClient()
      let orders: Array<Record<string, unknown>> = [];

      // Get rental orders
      if (!orderType || orderType === 'rental') {
        const { data: rentalOrders, error: rentalError } = await supabase
          .from('rental_orders')
          .select(`
            *,
            listing:listings(
              id,
              title,
              description,
              category,
              condition,
              images,
              owner:users_profile!listings_owner_id_fkey(
                id,
                username,
                display_name,
                avatar_url,
                verified,
                rating
              )
            )
          `)
          .or(`renter_id.eq.${userId},owner_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (!rentalError && rentalOrders) {
          orders = [...orders, ...rentalOrders.map(order => ({ ...order, order_type: 'rental' }))];
        }
      }

      // Get sale orders
      if (!orderType || orderType === 'sale') {
        const { data: saleOrders, error: saleError } = await supabase
          .from('sale_orders')
          .select(`
            *,
            listing:listings(
              id,
              title,
              description,
              category,
              condition,
              images,
              owner:users_profile!listings_owner_id_fkey(
                id,
                username,
                display_name,
                avatar_url,
                verified,
                rating
              )
            )
          `)
          .or(`buyer_id.eq.${userId},owner_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (!saleError && saleOrders) {
          orders = [...orders, ...saleOrders.map(order => ({ ...order, order_type: 'sale' }))];
        }
      }

      // Filter by status if provided
      if (status) {
        orders = orders.filter(order => order.status === status);
      }

      // Sort by creation date
      orders.sort((a, b) => new Date((b.created_at as string)).getTime() - new Date((a.created_at as string)).getTime());

      return orders;

    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }
}
