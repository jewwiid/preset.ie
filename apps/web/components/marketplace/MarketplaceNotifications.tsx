'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  ShoppingBag, 
  Euro, 
  MessageSquare, 
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  CreditCard,
  User,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface MarketplaceNotification {
  id: string;
  type: string;
  category: string;
  title: string;
  message?: string;
  avatar_url?: string;
  action_url?: string;
  action_data?: any;
  sender_id?: string;
  related_listing_id?: string;
  related_rental_order_id?: string;
  related_sale_order_id?: string;
  related_offer_id?: string;
  related_review_id?: string;
  read_at?: string;
  created_at: string;
  users_profile?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

interface MarketplaceNotificationsProps {
  limit?: number;
  showTabs?: boolean;
  compact?: boolean;
}

export default function MarketplaceNotifications({ 
  limit = 10, 
  showTabs = true,
  compact = false 
}: MarketplaceNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<MarketplaceNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/marketplace/notifications?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
      } else {
        setError(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching marketplace notifications:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'listing_created':
      case 'listing_updated':
        return <Package className="h-4 w-4" />;
      case 'offer_received':
      case 'offer_accepted':
      case 'offer_declined':
        return <Euro className="h-4 w-4" />;
      case 'rental_request':
      case 'rental_confirmed':
      case 'rental_cancelled':
      case 'rental_completed':
        return <Calendar className="h-4 w-4" />;
      case 'sale_request':
      case 'sale_confirmed':
      case 'sale_cancelled':
      case 'sale_completed':
        return <ShoppingBag className="h-4 w-4" />;
      case 'payment_received':
      case 'payment_failed':
        return <CreditCard className="h-4 w-4" />;
      case 'review_received':
      case 'review_updated':
        return <Star className="h-4 w-4" />;
      case 'listing_inquiry':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'offer_accepted':
      case 'rental_confirmed':
      case 'sale_confirmed':
      case 'payment_received':
        return 'text-green-600 bg-green-100';
      case 'offer_declined':
      case 'rental_cancelled':
      case 'sale_cancelled':
      case 'payment_failed':
        return 'text-red-600 bg-red-100';
      case 'offer_received':
      case 'rental_request':
      case 'sale_request':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'offers') return notification.type.includes('offer');
    if (activeTab === 'orders') return notification.type.includes('rental') || notification.type.includes('sale');
    if (activeTab === 'payments') return notification.type.includes('payment');
    if (activeTab === 'reviews') return notification.type.includes('review');
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in to view notifications</h3>
          <p className="text-gray-600">You need to be signed in to see your marketplace notifications.</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No marketplace notifications</p>
          </div>
        ) : (
          filteredNotifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
                !notification.read_at ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                if (!notification.read_at) {
                  markAsRead(notification.id);
                }
                if (notification.action_url) {
                  window.location.href = notification.action_url;
                }
              }}
            >
              <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="text-xs text-gray-600 truncate">
                    {notification.message}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(notification.created_at)}
                </p>
              </div>
              {!notification.read_at && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Marketplace Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading notifications</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchNotifications}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {showTabs && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="offers">Offers</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {filteredNotifications.length === 0 ? (
              <div className="text-center p-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">
                  {activeTab === 'all' 
                    ? "You don't have any marketplace notifications yet."
                    : `No ${activeTab} notifications found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read_at ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => {
                      if (!notification.read_at) {
                        markAsRead(notification.id);
                      }
                      if (notification.action_url) {
                        window.location.href = notification.action_url;
                      }
                    }}
                  >
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {notification.message && (
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <p className="text-xs text-gray-400">
                              {formatTime(notification.created_at)}
                            </p>
                            {notification.users_profile && (
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {notification.users_profile.display_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read_at && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                          {notification.action_url && (
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
