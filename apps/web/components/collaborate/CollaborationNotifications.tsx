'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Bell, 
  Users, 
  Package, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  MessageCircle,
  X
} from 'lucide-react';

interface CollaborationNotification {
  id: string;
  type: string;
  metadata: any;
  read: boolean;
  created_at: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: { [key: string]: number };
}

interface CollaborationNotificationsProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaborationNotifications({
  userId,
  isOpen,
  onClose
}: CollaborationNotificationsProps) {
  const [notifications, setNotifications] = useState<CollaborationNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notifications/collaboration?user_id=${userId}&limit=50`);

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setStats(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/collaboration', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          notificationIds
        })
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Update stats
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            unread: Math.max(0, prev.unread - notificationIds.length)
          } : null);
        }
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      await markAsRead(unreadNotifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('project')) return <Calendar className="h-4 w-4" />;
    if (type.includes('application')) return <Users className="h-4 w-4" />;
    if (type.includes('gear') || type.includes('offer')) return <Package className="h-4 w-4" />;
    if (type.includes('match')) return <Star className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('accepted') || type.includes('completed')) return 'text-primary-600 bg-primary-50';
    if (type.includes('rejected') || type.includes('cancelled')) return 'text-destructive-600 bg-destructive-50';
    if (type.includes('received') || type.includes('published')) return 'text-primary-600 bg-primary-50';
    return 'text-muted-foreground-600 bg-muted-50';
  };

  const getNotificationTitle = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'collab_project_published': 'New Project Published',
      'collab_project_updated': 'Project Updated',
      'collab_role_application_received': 'New Role Application',
      'collab_role_application_accepted': 'Application Accepted',
      'collab_role_application_rejected': 'Application Rejected',
      'collab_gear_offer_received': 'New Gear Offer',
      'collab_gear_offer_accepted': 'Gear Offer Accepted',
      'collab_gear_offer_rejected': 'Gear Offer Rejected',
      'collab_match_found': 'New Match Found',
      'collab_participant_added': 'New Participant Added',
      'collab_project_started': 'Project Started',
      'collab_project_completed': 'Project Completed',
      'collab_project_cancelled': 'Project Cancelled'
    };
    return typeMap[type] || 'Collaboration Notification';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotification = (notification: CollaborationNotification) => (
    <div
      key={notification.id}
      className={`p-4 border-b border-border-100 hover:bg-muted-50 cursor-pointer ${
        !notification.read ? 'bg-primary-50' : ''
      }`}
      onClick={() => !notification.read && markAsRead([notification.id])}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm">{getNotificationTitle(notification.type)}</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground-500">{formatDate(notification.created_at)}</span>
              {!notification.read && (
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              )}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground-600">
            {notification.type === 'collab_project_published' && (
              <p>
                <strong>{notification.metadata.project_title}</strong> has been published
                {notification.metadata.project_city && ` in ${notification.metadata.project_city}`}
              </p>
            )}
            
            {notification.type === 'collab_role_application_received' && (
              <p>New application received for a role in your project</p>
            )}
            
            {notification.type === 'collab_role_application_accepted' && (
              <p>Your application has been accepted!</p>
            )}
            
            {notification.type === 'collab_role_application_rejected' && (
              <p>Your application was not selected</p>
            )}
            
            {notification.type === 'collab_gear_offer_received' && (
              <p>New equipment offer received for your project</p>
            )}
            
            {notification.type === 'collab_gear_offer_accepted' && (
              <p>Your equipment offer has been accepted!</p>
            )}
            
            {notification.type === 'collab_gear_offer_rejected' && (
              <p>Your equipment offer was not selected</p>
            )}
            
            {notification.type === 'collab_match_found' && (
              <p>New potential match found for your project</p>
            )}
            
            {notification.type === 'collab_participant_added' && (
              <p>New participant has joined your project</p>
            )}
            
            {notification.type === 'collab_project_started' && (
              <p>Project has started</p>
            )}
            
            {notification.type === 'collab_project_completed' && (
              <p>Project has been completed</p>
            )}
            
            {notification.type === 'collab_project_cancelled' && (
              <p>Project has been cancelled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-xl">Collaboration Notifications</CardTitle>
            {stats && stats.unread > 0 && (
              <Badge variant="destructive">{stats.unread}</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {stats && stats.unread > 0 && (
              <Button size="sm" variant="outline" onClick={markAllAsRead}>
                Mark All Read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="lg" />
              <p className="text-muted-foreground-500">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground-900 mb-2">Failed to Load Notifications</h3>
              <p className="text-muted-foreground-500 mb-4">{error}</p>
              <Button onClick={loadNotifications}>Try Again</Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground-900 mb-2">No Notifications</h3>
              <p className="text-muted-foreground-500">You don't have any collaboration notifications yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="divide-y divide-muted-primary/20">
                {notifications.map(renderNotification)}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
