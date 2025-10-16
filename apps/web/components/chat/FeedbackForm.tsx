'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/lib/chatbot/chat-context';
import { cn } from '@/lib/utils';
import VoiceToTextButton from '@/components/ui/VoiceToTextButton';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { typewriterWithMentions } from '@/lib/utils/voice-mention-parser';

interface FeedbackFormProps {
  category: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export function FeedbackForm({ category, onCancel, onSubmit }: FeedbackFormProps) {
  const { state, submitFeedback } = useChat();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when form opens
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // AI-powered categorization when description changes
  const categorizeFeedback = async (content: string) => {
    if (!content.trim() || content.length < 10) {
      setDetectedCategory(null);
      return;
    }

    setIsCategorizing(true);
    
    try {
      const response = await fetch('/api/chatbot/categorize-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      
      if (data.success && data.category !== category) {
        setDetectedCategory(data.category);
      } else {
        setDetectedCategory(null);
      }
    } catch (error) {
      console.error('Failed to categorize feedback:', error);
      setDetectedCategory(null);
    } finally {
      setIsCategorizing(false);
    }
  };

  // Debounced categorization
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (description.trim()) {
        categorizeFeedback(description);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [description]);

  const handleVoiceText = async (text: string) => {
    // Get the base text (current value + space if needed)
    const base = description.endsWith(' ') || !description ? description : description + ' ';
    
    // Use typewriter effect like in playground
    await typewriterWithMentions(
      text,
      [], // No mentionable items for feedback form
      (newText) => setDescription(base + newText),
      {
        delay: 8,
        processMentions: false // No mention processing needed for feedback form
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Use AI-detected category if available, otherwise use the original category
      const finalCategory = detectedCategory || category;
      
      await submitFeedback(finalCategory, description);
      toast.success('Feedback submitted successfully!');
      onSubmit();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryInfo = {
    bug: {
      emoji: '🐛',
      title: 'Report a Bug',
      placeholder: 'Please describe the bug you encountered. Include steps to reproduce, what you expected to happen, and what actually happened...',
      helpText: 'Include details like which page you were on, what actions you took, and any error messages you saw.'
    },
    feedback: {
      emoji: '💡',
      title: 'Send Feedback',
      placeholder: 'Share your thoughts about the platform. What do you like? What could be improved?',
      helpText: 'Your feedback helps us make Preset better for everyone.'
    },
    help: {
      emoji: '🆘',
      title: 'Get Help',
      placeholder: 'Describe what you need help with. I\'ll do my best to assist you!',
      helpText: 'I can help with platform features, account issues, or general questions.'
    },
    suggestion: {
      emoji: '✨',
      title: 'Feature Suggestion',
      placeholder: 'Tell us about your idea for a new feature or improvement...',
      helpText: 'Great ideas come from our community! We\'d love to hear yours.'
    }
  };

  const info = categoryInfo[category as keyof typeof categoryInfo] || categoryInfo.feedback;

  return (
    <div className="border-t border-border p-4 bg-muted/50">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">{info.emoji}</div>
          <div>
            <h3 className="font-semibold text-foreground">{info.title}</h3>
            <p className="text-sm text-muted-foreground">{info.helpText}</p>
          </div>
        </div>

        {/* Description textarea */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description *
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={info.placeholder}
              className={cn(
                'w-full px-3 py-2 pr-12 border border-input rounded-lg resize-none',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                'placeholder:text-muted-foreground text-sm bg-background',
                'min-h-[100px] max-h-[200px]'
              )}
              rows={4}
              disabled={isSubmitting}
            />
            
            {/* Voice-to-text button */}
            <div className="absolute bottom-2 right-2">
              <VoiceToTextButton
                onAppendText={handleVoiceText}
                size={32}
                stroke={2}
                maxSeconds={30}
                disabled={isSubmitting}
                userSubscriptionTier={user?.user_metadata?.subscription_tier as 'FREE' | 'PLUS' | 'PRO'}
              />
            </div>
          </div>
          
          {/* Character count */}
          <div className="text-right text-xs text-muted-foreground">
            {description.length}/1000
          </div>
        </div>

        {/* AI Category Suggestion */}
        {detectedCategory && detectedCategory !== category && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="text-blue-600 dark:text-blue-400">
                {isCategorizing ? (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {isCategorizing ? 'Analyzing your message...' : 'AI suggests this might be a different category:'}
                </p>
                {!isCategorizing && (
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    This looks like a <strong>{categoryInfo[detectedCategory as keyof typeof categoryInfo]?.title.toLowerCase()}</strong> instead of <strong>{info.title.toLowerCase()}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Context information (auto-filled) */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <h4 className="text-sm font-medium text-primary mb-2">Context Information</h4>
          <div className="text-xs text-primary space-y-1">
            <p><strong>Page:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'Unknown'}</p>
            <p><strong>Browser:</strong> {typeof navigator !== 'undefined' ? `${navigator.platform} - ${navigator.language}` : 'Unknown'}</p>
            <p><strong>User Role:</strong> {state.conversationId ? 'Logged in' : 'Anonymous'}</p>
            <p><strong>Submitted:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-muted transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!description.trim() || isSubmitting || description.length > 1000}
            className={cn(
              'px-4 py-2 bg-primary text-primary-foreground rounded-lg',
              'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors text-sm font-medium',
              'flex items-center gap-2'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit {info.title}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9 22,2" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Privacy note */}
        <div className="text-xs text-muted-foreground text-center">
          Your feedback is sent securely to our team. We may contact you for follow-up questions.
        </div>
      </form>
    </div>
  );
}
