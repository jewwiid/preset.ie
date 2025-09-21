'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Package, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Star,
  MessageCircle,
  Truck
} from 'lucide-react';
import { OrderProcessingService } from '@/lib/services/order-processing.service';

interface Order {
  id: string;
  order_type: 'rental' | 'sale';
  status: string;
  created_at: string;
  payment_confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  notes?: string;
  listing: {
    id: string;
    title: string;
    description?: string;
    category: string;
    condition: string;
    images?: string[];
    owner: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      verified: boolean;
      rating?: number;
    };
  };
  // Rental specific fields
  start_date?: string;
  end_date?: string;
  total_days?: number;
  daily_rate_cents?: number;
  // Sale specific fields
  // Common fields
  total_amount_cents: number;
  delivery_method: 'pickup' | 'delivery';
  delivery_address?: string;
  special_requests?: string;
  // User info (renter/buyer)
  renter?: any;
  buyer?: any;
}

interface OrderManagementProps {
  userId: string;
  userRole: 'owner' | 'renter' | 'buyer' | 'all';
}

export default function OrderManagement({
  userId,
  userRole = 'all'
}: OrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, [userId, userRole]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderType = userRole === 'renter' ? 'rental' : userRole === 'buyer' ? 'sale' : undefined;
      const userOrders = await OrderProcessingService.getUserOrders(userId, orderType);
      setOrders(userOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const result = await OrderProcessingService.updateOrderStatus(
        orderId,
        order.order_type,
        status,
        notes
      );

      if (result.success) {
        loadOrders(); // Reload orders
      } else {
        setError(result.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'text-yellow-600 bg-yellow-50';
      case 'confirmed':
        return 'text-blue-600 bg-blue-50';
      case 'in_progress':
        return 'text-purple-600 bg-purple-50';
      case 'completed':
        return 'text-primary-600 bg-primary-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Truck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium truncate">{order.listing.title}</h3>
              <Badge variant="outline" className="text-xs">
                {order.order_type}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{order.status.replace('_', ' ')}</span>
              </Badge>
            </div>
            
            <p className="text-sm text-gray-500 mb-2">{order.listing.category}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(order.created_at)}
              </div>
              
              {order.order_type === 'rental' && order.start_date && order.end_date && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(order.start_date)} - {formatDate(order.end_date)}
                </div>
              )}
              
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {order.delivery_method}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={order.listing.owner.avatar_url} />
                  <AvatarFallback>
                    {order.listing.owner.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{order.listing.owner.display_name}</span>
                    {order.listing.owner.verified && (
                      <Badge variant="secondary" className="text-xs">Verified</Badge>
                    )}
                  </div>
                  {order.listing.owner.rating && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {order.listing.owner.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-primary-600">
                  {formatPrice(order.total_amount_cents)}
                </div>
                {order.order_type === 'rental' && order.daily_rate_cents && (
                  <div className="text-xs text-gray-500">
                    {formatPrice(order.daily_rate_cents)}/day
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2 mt-3">
              <Button size="sm" variant="outline">
                <MessageCircle className="h-3 w-3 mr-1" />
                Message
              </Button>
              
              {order.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'in_progress')}
                >
                  Start
                </Button>
              )}
              
              {order.status === 'in_progress' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                >
                  Complete
                </Button>
              )}
              
              {(order.status === 'pending_payment' || order.status === 'confirmed') && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <h2 className="text-lg font-medium">Order Management</h2>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Orders</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={loadOrders}>Try Again</Button>
      </div>
    );
  }

  const rentalOrders = orders.filter(order => order.order_type === 'rental');
  const saleOrders = orders.filter(order => order.order_type === 'sale');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Package className="h-5 w-5" />
        <h2 className="text-lg font-medium">Order Management</h2>
        <Badge variant="outline">{orders.length} orders</Badge>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="rental">Rentals ({rentalOrders.length})</TabsTrigger>
          <TabsTrigger value="sale">Sales ({saleOrders.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders</h3>
              <p className="text-gray-500">You don't have any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(renderOrderCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rental" className="mt-4">
          {rentalOrders.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Rentals</h3>
              <p className="text-gray-500">You don't have any rental orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rentalOrders.map(renderOrderCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sale" className="mt-4">
          {saleOrders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales</h3>
              <p className="text-gray-500">You don't have any sale orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {saleOrders.map(renderOrderCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
