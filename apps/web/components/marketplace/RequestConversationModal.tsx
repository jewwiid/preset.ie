'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MessageCircle, Send, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RequestConversationModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  responderId: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export default function RequestConversationModal({ 
  requestId, 
  isOpen, 
  onClose, 
  responderId 
}: RequestConversationModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      getCurrentUser();
    }
  }, [isOpen, requestId]);

  const getCurrentUser = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('id, display_name, avatar_url')
          .eq('user_id', user.id)
          .single();
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('request_conversations')
        .select(`
          id,
          messages:request_conversation_messages(
            id,
            content,
            sender_id,
            created_at,
            sender:users_profile!request_conversation_messages_sender_id_fkey(
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('request_id', requestId)
        .eq('responder_id', responderId)
        .single();

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Transform the data to match the Message interface
      const transformedMessages = data?.messages?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      })) || [];

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      setSending(true);

      if (!supabase) {
        console.error('Supabase client not initialized');
        setSending(false);
        return;
      }

      // First, ensure conversation exists
      const { data: conversation, error: convError } = await supabase
        .from('request_conversations')
        .upsert({
          request_id: requestId,
          responder_id: responderId,
          requester_id: currentUser.id, // This should be the requester, but we're using responder for now
          status: 'active'
        })
        .select('id')
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return;
      }

      // Send the message
      const { data: message, error } = await supabase
        .from('request_conversation_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          content: newMessage.trim()
        })
        .select(`
          id,
          content,
          sender_id,
          created_at,
          sender:users_profile!request_conversation_messages_sender_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Transform the message data to match the Message interface
      const transformedMessage = {
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        created_at: message.created_at,
        sender: Array.isArray(message.sender) ? message.sender[0] : message.sender
      };

      setMessages(prev => [...prev, transformedMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <Card className="border-0 shadow-none flex-1 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Request Conversation
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
              {loading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                  <p className="text-muted-foreground mt-2">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.sender_id === currentUser?.id ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          {message.sender.avatar_url ? (
                            <img
                              src={message.sender.avatar_url}
                              alt={message.sender.display_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{message.sender.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          message.sender_id === currentUser?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
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
                className="flex-1 min-h-[60px] resize-none"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="icon"
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}