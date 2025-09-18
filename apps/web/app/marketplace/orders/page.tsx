'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Euro, 
  Calendar, 
  MapPin,
  ShoppingBag,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  type: 'rental' | 'sale';
  status: string;
  total_cents: number;
  created_at: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
    images?: Array<{
      id: string;
      url: string;
      alt_text?: string;
    }>;
  };
  owner?: {
    id: string;
    display_name: string;
    handle: string;
  };
  renter?: {
    id: string;
    display_name: string;
    handle: string;
  };
  buyer?: {
    id: string;
    display_name: string;
    handle: string;
  };
  start_date?: string;
  end_date?: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/marketplace/rental-orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'accepted':
      case 'confirmed':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'rental') return order.type === 'rental';
    if (activeTab === 'sale') return order.type === 'sale';
    return order.status.toLowerCase() === activeTab;
  });

  if (!user) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your orders</h2>
            <p className="text-gray-600">You need to be signed in to access your marketplace orders.</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-2">Track your marketplace orders and rentals</p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your orders...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading orders</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchOrders}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All Orders</TabsTrigger>
                  <TabsTrigger value="rental">Rentals</TabsTrigger>
                  <TabsTrigger value="sale">Sales</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h2>
                    <p className="text-gray-600 mb-4">
                      {activeTab === 'all' 
                        ? "You haven't placed any orders yet."
                        : `No ${activeTab} orders found.`
                      }
                    </p>
                    <Button asChild>
                      <Link href="/marketplace">
                        Browse Marketplace
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          {/* Order Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {order.listing.title}
                              </h3>
                              <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Euro className="h-4 w-4 mr-2" />
                                <span className="font-medium">{formatPrice(order.total_cents)}</span>
                                <span className="ml-1 text-gray-500">
                                  {order.type === 'rental' ? '/rental' : 'total'}
                                </span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>Ordered {formatDate(order.created_at)}</span>
                              </div>

                              {order.type === 'rental' && order.start_date && order.end_date && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span>
                                    {formatDate(order.start_date)} - {formatDate(order.end_date)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Counterparty Info */}
                            <div className="text-sm text-gray-600">
                              {order.type === 'rental' ? (
                                order.renter ? (
                                  <span>Renting from <strong>{order.renter.display_name}</strong></span>
                                ) : (
                                  <span>Rented by <strong>{order.owner?.display_name}</strong></span>
                                )
                              ) : (
                                order.buyer ? (
                                  <span>Sold to <strong>{order.buyer.display_name}</strong></span>
                                ) : (
                                  <span>Bought from <strong>{order.owner?.display_name}</strong></span>
                                )
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2 ml-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/marketplace/listings/${order.listing.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View Listing
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MarketplaceLayout>
  );
}
