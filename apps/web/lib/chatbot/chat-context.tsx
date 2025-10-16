'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
  isTyping?: boolean;
}

export interface ChatState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  conversationId?: string;
  unreadCount: number;
  isTyping: boolean;
  error?: string;
  sessionId: string;
}

export type ChatAction =
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'MINIMIZE_CHAT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_CONVERSATION_ID'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'INCREMENT_UNREAD' }
  | { type: 'RESET_UNREAD' }
  | { type: 'SET_SESSION_ID'; payload: string };

const initialState: ChatState = {
  isOpen: false,
  isMinimized: false,
  messages: [],
  isLoading: false,
  conversationId: undefined,
  unreadCount: 0,
  isTyping: false,
  error: undefined,
  sessionId: ''
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'OPEN_CHAT':
      // Add welcome message if this is the first time opening the chat
      const shouldAddWelcome = state.messages.length === 0;
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'system',
        content: "Hi! I'm Preset, your AI assistant. I'm here to help you navigate the platform. What can I help you with today?",
        created_at: new Date().toISOString()
      };
      
      return {
        ...state,
        isOpen: true,
        isMinimized: false,
        unreadCount: 0,
        error: undefined,
        messages: shouldAddWelcome ? [welcomeMessage] : state.messages
      };
    
    case 'CLOSE_CHAT':
      return {
        ...state,
        isOpen: false,
        isMinimized: false,
        unreadCount: 0
      };
    
    case 'MINIMIZE_CHAT':
      return {
        ...state,
        isOpen: false,
        isMinimized: false
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        unreadCount: state.isOpen ? 0 : state.unreadCount + (action.payload.role === 'assistant' ? 1 : 0)
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      };
    
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload
      };
    
    case 'SET_CONVERSATION_ID':
      return {
        ...state,
        conversationId: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isTyping: false
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined
      };
    
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        conversationId: undefined
      };
    
    case 'INCREMENT_UNREAD':
      return {
        ...state,
        unreadCount: state.isOpen ? 0 : state.unreadCount + 1
      };
    
    case 'RESET_UNREAD':
      return {
        ...state,
        unreadCount: 0
      };
    
    case 'SET_SESSION_ID':
      return {
        ...state,
        sessionId: action.payload
      };
    
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (message: string, isVoiceToText?: boolean) => Promise<void>;
  submitFeedback: (category: string, description: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();

  // Generate session ID for anonymous users
  useEffect(() => {
    if (!state.sessionId) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
    }
  }, [state.sessionId]);

  // Save chat state to localStorage
  useEffect(() => {
    const chatState = {
      isOpen: state.isOpen,
      isMinimized: state.isMinimized,
      conversationId: state.conversationId,
      timestamp: Date.now()
    };
    localStorage.setItem('preset_chat_state', JSON.stringify(chatState));
  }, [state.isOpen, state.isMinimized, state.conversationId]);

  // Load chat state from localStorage and cleanup old sessions
  useEffect(() => {
    try {
      // Cleanup old chat sessions (older than 7 days)
      const cleanupOldSessions = () => {
        const keys = Object.keys(localStorage);
        const chatKeys = keys.filter(key => key.startsWith('preset_chat_'));
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        chatKeys.forEach(key => {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.timestamp && parsed.timestamp < sevenDaysAgo) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Remove corrupted data
            localStorage.removeItem(key);
          }
        });
      };

      cleanupOldSessions();

      const savedState = localStorage.getItem('preset_chat_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.isOpen) {
          dispatch({ type: 'OPEN_CHAT' });
        }
        if (parsedState.isMinimized) {
          dispatch({ type: 'MINIMIZE_CHAT' });
        }
        if (parsedState.conversationId) {
          dispatch({ type: 'SET_CONVERSATION_ID', payload: parsedState.conversationId });
        }
      }
    } catch (error) {
      console.error('Failed to load chat state from localStorage:', error);
    }
  }, []);

  const sendMessage = async (message: string, isVoiceToText: boolean = false): Promise<void> => {
    if (!message.trim()) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          conversationId: state.conversationId,
          userId: user?.id,
          sessionId: state.sessionId,
          isVoiceToText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      if (data.flagged) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: data.message || 'Your message was flagged for inappropriate content.' 
        });
        return;
      }

      // Update conversation ID if new conversation was created
      if (data.conversationId && data.conversationId !== state.conversationId) {
        dispatch({ type: 'SET_CONVERSATION_ID', payload: data.conversationId });
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: data.messageId || `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message,
        metadata: data.metadata,
        created_at: new Date().toISOString()
      };
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to send message. Please try again.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitFeedback = async (category: string, description: string): Promise<void> => {
    if (!description.trim()) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const requestData = {
        category,
        description: description.trim(),
        userId: user?.id,
        conversationId: state.conversationId,
        metadata: {
          currentPage: window.location.pathname,
          userAgent: navigator.userAgent,
          browserInfo: `${navigator.platform} - ${navigator.language}`,
          timestamp: new Date().toISOString()
        }
      };

      console.log('Submitting feedback with user data:', {
        userId: user?.id,
        userEmail: user?.email,
        userMetadata: user?.user_metadata,
        fullUser: user
      });

      const response = await fetch('/api/chatbot/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      // Add system message confirming feedback submission
      const feedbackMessage: ChatMessage = {
        id: `feedback_${Date.now()}`,
        role: 'system',
        content: data.message || 'Thank you for your feedback! We\'ll review it and get back to you if needed.',
        created_at: new Date().toISOString()
      };
      dispatch({ type: 'ADD_MESSAGE', payload: feedbackMessage });

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to submit feedback. Please try again.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  const value: ChatContextType = {
    state,
    dispatch,
    sendMessage,
    submitFeedback,
    clearMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
