'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/lib/chatbot/chat-context';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { FeedbackForm } from './FeedbackForm';
import { cn } from '@/lib/utils';
import { Bug, MessageSquare, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const { state, dispatch, sendMessage, submitFeedback } = useChat();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<string>('');
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Handle escape key to close chat
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isOpen) {
        dispatch({ type: 'CLOSE_CHAT' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, dispatch]);

  const handleToggleChat = () => {
    if (state.isOpen) {
      dispatch({ type: 'MINIMIZE_CHAT' });
    } else {
      dispatch({ type: 'OPEN_CHAT' });
    }
  };

  const handleCloseChat = () => {
    dispatch({ type: 'CLOSE_CHAT' });
  };

  const handleQuickAction = (category: string) => {
    setFeedbackCategory(category);
    setShowFeedbackForm(true);
  };

  if (!state.isOpen) {
    return (
      <div className={cn('fixed bottom-6 right-6 z-50', className)}>
        <button
          onClick={handleToggleChat}
          className={cn(
            'relative w-10 h-10 bg-brand-primary text-white rounded-full shadow-lg',
            'hover:bg-brand-primary/90 transition-all duration-200',
            'flex items-center justify-center group',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2'
          )}
          aria-label="Open Preset chat"
        >
          {/* Preset Logo */}
          <img
            src="/preset_logo.svg"
            alt="Preset"
            width="24"
            height="24"
            className="transition-transform duration-200 group-hover:scale-110"
          />

          {/* Unread count badge */}
          {state.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {state.unreadCount > 9 ? '9+' : state.unreadCount}
            </div>
          )}

          {/* Pulse animation for new messages */}
          {state.unreadCount > 0 && (
            <div className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-20" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Chat Window */}
          <div
            className={cn(
              'bg-background border border-border rounded-lg shadow-xl',
              'transition-all duration-300 ease-in-out',
              showFeedbackForm 
                ? 'w-96 h-[600px]' 
                : isInputCollapsed 
                  ? 'w-96 h-[600px]' 
                  : 'w-96 h-[500px]',
              'flex flex-col overflow-hidden'
            )}
          >
        {/* Header */}
        <ChatHeader
          onClose={handleCloseChat}
          onMinimize={() => dispatch({ type: 'MINIMIZE_CHAT' })}
          unreadCount={state.unreadCount}
        />

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Messages */}
                <ChatMessages messages={state.messages} />
                
                {/* Quick Action Buttons - Show after welcome message */}
                {state.messages.length === 1 && state.messages[0].id === 'welcome' && (
                  <div className="flex gap-3 py-4">
                    <button
                      onClick={() => handleQuickAction('feedback')}
                      className="flex-1 bg-primary text-primary-foreground preset-branding py-3 px-4 rounded-lg hover:bg-primary/80 transition-colors text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send Feedback
                    </button>
                    <button
                      onClick={() => handleQuickAction('help')}
                      className="flex-1 bg-secondary text-secondary-foreground preset-branding py-3 px-4 rounded-lg hover:bg-secondary/80 transition-colors text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Get Help
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {state.error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-destructive text-sm">{state.error}</span>
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {state.isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm">Preset is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {!showFeedbackForm && !isInputCollapsed && (
                <div className="relative">
                  {/* Collapse Icon - positioned above input */}
                  <div className="flex justify-center pb-1">
                    <button
                      onClick={() => setIsInputCollapsed(true)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                      aria-label="Hide input area"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <ChatInput />
                </div>
              )}

              {/* Expand Icon - shown when input is collapsed */}
              {!showFeedbackForm && isInputCollapsed && (
                <div className="flex justify-center py-2">
                  <button
                    onClick={() => setIsInputCollapsed(false)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                    aria-label="Show input area"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              )}

              {showFeedbackForm && (
                <div className="overflow-y-auto">
                  <FeedbackForm
                    category={feedbackCategory}
                    onCancel={() => setShowFeedbackForm(false)}
                    onSubmit={() => setShowFeedbackForm(false)}
                  />
                </div>
              )}
            </div>
      </div>
    </div>
  );
}
