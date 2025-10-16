'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/lib/chatbot/chat-context';
import { cn } from '@/lib/utils';
import VoiceToTextButton from '@/components/ui/VoiceToTextButton';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { typewriterWithMentions } from '@/lib/utils/voice-mention-parser';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function ChatInput() {
  const { state, sendMessage } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (state.isOpen && !state.isMinimized) {
      textareaRef.current?.focus();
    }
  }, [state.isOpen, state.isMinimized]);

  const handleVoiceText = async (text: string) => {
    // Get the base text (current value + space if needed)
    const base = input.endsWith(' ') || !input ? input : input + ' ';
    
    // Set flag to indicate this message came from voice-to-text
    setIsVoiceInput(true);
    
    // Use typewriter effect like in playground
    await typewriterWithMentions(
      text,
      [], // No mentionable items for chatbot
      (newText) => setInput(base + newText),
      {
        delay: 8,
        processMentions: false // No mention processing needed for chatbot
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || state.isLoading) return;

    const message = input.trim();
    setInput('');
    setIsTyping(false);

    try {
      await sendMessage(message, isVoiceInput);
      setIsVoiceInput(false); // Reset flag after sending
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Typing indicator logic
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
    } else if (isTyping && !e.target.value.trim()) {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Input area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className={cn(
              'w-full px-3 py-2 pr-12 border border-input rounded-lg resize-none',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              'text-sm bg-background',
              'min-h-[90px] max-h-[120px]',
              'chat-input-placeholder'
            )}
            rows={1}
            disabled={state.isLoading}
          />
          
            {/* Voice-to-text button */}
            <div className="absolute bottom-2 right-2">
              <VoiceToTextButton
                onAppendText={handleVoiceText}
                size={32}
                stroke={2}
                maxSeconds={30}
                disabled={state.isLoading}
                userSubscriptionTier={user?.user_metadata?.subscription_tier as 'FREE' | 'PLUS' | 'PRO'}
              />
            </div>
          
          {/* Character count */}
          {input.length > 100 && (
            <div className="absolute bottom-1 right-12 text-xs text-muted-foreground">
              {input.length}/500
            </div>
          )}
        </div>

        {/* Submit button and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>Typing...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Clear conversation button */}
            {state.messages.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear conversation"
                  >
                    Clear
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Conversation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear the conversation? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setInput('');
                        // Clear messages through context
                        window.location.reload(); // Simple way to clear for now
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear Conversation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || state.isLoading}
              className={cn(
                'px-4 py-2 bg-primary text-primary-foreground rounded-lg',
                'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors text-sm font-medium',
                'flex items-center gap-2'
              )}
            >
              {state.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22,2 15,22 11,13 2,9 22,2" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
