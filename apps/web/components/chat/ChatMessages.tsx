'use client';

import React from 'react';
import { ChatMessage } from '@/lib/chatbot/chat-context';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/lib/auth-context';
import { useDashboardData } from '@/lib/hooks/dashboard/useDashboardData';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <ChatMessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const { user } = useAuth();
  const { profile } = useDashboardData();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  if (isSystem) {
    // Check if this is a success or error message
    const isSuccessMessage = message.content.includes('Thank you for your feedback') || 
                            message.content.includes('successfully submitted') ||
                            message.content.includes('sent successfully');
    
    const isErrorMessage = message.content.includes('Failed to') ||
                          message.content.includes('Error:') ||
                          message.content.includes('error occurred');
    
    return (
      <div className="flex justify-center">
        <div className={cn(
          "text-sm px-3 py-2 rounded-lg max-w-xs text-center",
          isSuccessMessage 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : isErrorMessage
            ? "bg-red-100 text-red-800 border border-red-200"
            : "bg-muted text-muted-foreground"
        )}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2',
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        {/* Message content */}
        <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-blockquote:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80">
          {isAssistant ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for better UI integration
                h1: ({children}) => <h1 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h1>,
                h2: ({children}) => <h2 className="text-sm font-semibold mt-3 mb-2 first:mt-0">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-medium mt-2 mb-1 first:mt-0">{children}</h3>,
                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({children}) => <li className="text-sm">{children}</li>,
                code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                blockquote: ({children}) => <blockquote className="border-l-2 border-primary/20 pl-3 py-1 bg-muted/50 rounded-r my-2">{children}</blockquote>,
                a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">{children}</a>,
                hr: () => <hr className="my-3 border-border" />,
                em: ({children}) => <em className="italic">{children}</em>,
                strong: ({children}) => <strong className="font-semibold">{children}</strong>
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          'text-xs mt-0.5',
          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

        {/* Assistant avatar */}
        {isAssistant && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <img
                src="/preset_logo.svg"
                alt="Preset"
                width="20"
                height="20"
                className="text-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground">Preset</span>
          </div>
        )}

        {/* User avatar */}
        {isUser && (
          <div className="flex items-center gap-2 mt-1 justify-end">
            <span className="text-xs text-primary-foreground/70">You</span>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Your avatar"
                  width="32"
                  height="32"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
