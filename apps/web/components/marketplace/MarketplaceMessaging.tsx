'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MessageCircle, Send, User, Clock, AlertCircle, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthToken } from '@/lib/auth-utils';

interface MarketplaceMessagingProps {
  listingId: string;
  recipientId: string;
  recipientName: string;
  recipientHandle: string;
  recipientAvatar?: string;
  context?: {
    type: 'listing' | 'rental_order' | 'sale_order' | 'offer';
    id: string;
    title?: string;
  };
  onClose?: () => void;
  compact?: boolean;
}

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  attachments: any[];
  created_at: string;
  read_at?: string;
}

interface SharedContact {
  contact_type: 'phone' | 'email';
  contact_value: string;
  sharer_name: string;
  sharer_handle: string;
  shared_at: string;
}

export default function MarketplaceMessaging({
  listingId,
  recipientId,
  recipientName,
  recipientHandle,
  recipientAvatar,
  context,
  onClose,
  compact = false
}: MarketplaceMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedContacts, setSharedContacts] = useState<SharedContact[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
    fetchSharedContacts();
  }, [listingId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        toast.error('Please sign in to view messages');
        return;
      }

      const response = await fetch(`/api/marketplace/messages/conversations?listing_id=${listingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Find the conversation for this listing
        const conversation = data.conversations.find((conv: any) => conv.listing_id === listingId);
        if (conversation) {
          // Fetch detailed messages for this conversation
          await fetchConversationMessages(conversation.id);
        } else {
          setMessages([]);
        }
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Please sign in to view messages');
        return;
      }

      const response = await fetch(`/api/marketplace/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Marketplace API returns data directly, not wrapped in { success: true, data: ... }
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Failed to fetch conversation messages');
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      setError('An unexpected error occurred');
    }
  };

  const fetchSharedContacts = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`/api/marketplace/conversations/${listingId}/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSharedContacts(data.data || []);
      } else {
        console.error('Failed to fetch shared contacts:', data.error);
      }
    } catch (err) {
      console.error('Error fetching shared contacts:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const messageData: any = {
        listing_id: listingId,
        to_user_id: recipientId,
        message_body: newMessage.trim()
      };

      // Add context if provided
      if (context) {
        switch (context.type) {
          case 'rental_order':
            messageData.rental_order_id = context.id;
            break;
          case 'sale_order':
            messageData.sale_order_id = context.id;
            break;
          case 'offer':
            messageData.offer_id = context.id;
            break;
        }
      }

      const token = await getAuthToken();
      if (!token) {
        toast.error('Please sign in to send messages');
        return;
      }

      const response = await fetch('/api/marketplace/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();

      if (response.ok) {
        setNewMessage('');
        toast.success('Message sent successfully');
        // Refresh messages
        await fetchMessages();
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (compact) {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-background rounded-lg shadow-lg border border-border-200 z-50">
        <div className="p-4 border-b border-border-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {recipientAvatar ? (
                <img
                  src={recipientAvatar}
                  alt={recipientName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-muted-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground-600" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground-900">{recipientName}</h3>
                <p className="text-xs text-muted-foreground-500">@{recipientHandle}</p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center text-muted-foreground-500">
              <LoadingSpinner size="md" />
              <p className="text-sm mt-2">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="text-center text-destructive-500">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground-500">
              <MessageCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from_user_id === recipientId ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.from_user_id === recipientId
                      ? 'bg-muted-100 text-muted-foreground-900'
                      : 'bg-primary-600 text-primary-foreground'
                  }`}
                >
                  <p>{message.body}</p>
                  <div className={`text-xs mt-1 ${
                    message.from_user_id === recipientId ? 'text-muted-foreground-500' : 'text-primary-200'
                  }`}>
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-border-200">
          <div className="flex space-x-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 resize-none"
              rows={2}
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {recipientAvatar ? (
              <img
                src={recipientAvatar}
                alt={recipientName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-muted-300 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground-600" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{recipientName}</CardTitle>
              <p className="text-sm text-muted-foreground-500">@{recipientHandle}</p>
            </div>
          </div>
          {context && (
            <Badge variant="outline">
              {context.type.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Shared Contact Details */}
        {sharedContacts.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Contact Details Shared
              </span>
            </div>
            <div className="space-y-2">
              {sharedContacts.map((contact, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  {contact.contact_type === 'phone' ? (
                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                  <div className="flex-1">
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      {contact.contact_value}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 ml-2">
                      ({contact.contact_type})
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    by {contact.sharer_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="h-64 overflow-y-auto border border-border-200 rounded-lg p-4 space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground-500">
              <LoadingSpinner size="lg" />
              <p className="text-sm mt-2">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="text-center text-destructive-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from_user_id === recipientId ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.from_user_id === recipientId
                      ? 'bg-muted-100 text-muted-foreground-900'
                      : 'bg-primary-600 text-primary-foreground'
                  }`}
                >
                  <p className="text-sm">{message.body}</p>
                  <div className={`flex items-center justify-between mt-1 text-xs ${
                    message.from_user_id === recipientId ? 'text-muted-foreground-500' : 'text-primary-200'
                  }`}>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(message.created_at)}</span>
                    </div>
                    {message.from_user_id !== recipientId && (
                      <div className="flex items-center space-x-1">
                        {message.read_at ? (
                          <span title="Read">✓✓</span>
                        ) : (
                          <span title="Delivered">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none"
            rows={3}
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
