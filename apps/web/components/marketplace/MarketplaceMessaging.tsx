'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Clock, AlertCircle } from 'lucide-react';
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
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
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
        setMessages(data.data.messages || []);
      } else {
        setError(data.error || 'Failed to fetch conversation messages');
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      setError('An unexpected error occurred');
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border"></div>
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
        {/* Messages */}
        <div className="h-64 overflow-y-auto border border-border-200 rounded-lg p-4 space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
