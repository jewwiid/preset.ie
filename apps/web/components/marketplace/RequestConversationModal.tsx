'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Clock, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
  created_at: string;
  type: string;
}

interface Conversation {
  id: string;
  requester_id: string;
  responder_id: string;
  status: string;
  last_message_at: string;
  requester: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
  responder: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
  request: {
    id: string;
    title: string;
    status: string;
  };
}

interface RequestConversationModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  responderId?: string;
}

export default function RequestConversationModal({
  requestId,
  isOpen,
  onClose,
  responderId
}: RequestConversationModalProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversation();
    }
  }, [isOpen, requestId]);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Database connection not available');
        return;
      }

      const response = await fetch(`/api/marketplace/requests/${requestId}/conversation`, {
        headers: {
          'Authorization': `Bearer ${(await supabase!.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404 && responderId) {
          // Create new conversation
          await createConversation();
          return;
        }
        throw new Error('Failed to fetch conversation');
      }

      const data = await response.json();
      setConversation(data.conversation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    try {
      if (!supabase) {
        setError('Database connection not available');
        return;
      }

        const response = await fetch(`/api/marketplace/requests/${requestId}/conversation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase!.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({ responder_id: responderId })
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      setConversation(data.conversation);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchMessages = async () => {
    if (!conversation) return;

    try {
      if (!supabase) {
        setError('Database connection not available');
        return;
      }

      const response = await fetch(`/api/marketplace/requests/${requestId}/conversation/messages`, {
        headers: {
          'Authorization': `Bearer ${(await supabase!.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    try {
      setSending(true);
      setError(null);

      const response = await fetch(`/api/marketplace/requests/${requestId}/conversation/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase!.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          message_type: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.message);
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherUser = () => {
    if (!conversation || !user) return null;
    
    if (user.id === conversation.requester_id) {
      return conversation.responder;
    } else {
      return conversation.requester;
    }
  };

  if (!isOpen) return null;

  const otherUser = getOtherUser();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-lg">
                  Conversation about "{conversation?.request.title}"
                </CardTitle>
                {otherUser && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={otherUser.avatar_url} />
                      <AvatarFallback>
                        <User className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {otherUser.display_name} (@{otherUser.handle})
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchConversation}>Try Again</Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={message.sender.avatar_url} />
                              <AvatarFallback>
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className={`rounded-lg px-3 py-2 ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                              <p className="text-sm">{message.content}</p>
                              <div className={`flex items-center mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <Clock className="w-3 h-3 mr-1" />
                                <span className="text-xs opacity-70">
                                  {formatTime(message.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-2">{error}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
