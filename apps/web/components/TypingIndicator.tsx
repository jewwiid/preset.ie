'use client'

import React from 'react'
import { useTypingIndicator } from '../lib/hooks/useTypingIndicator'

export interface TypingIndicatorProps {
  conversationId?: string
  
  // Display options
  variant?: 'bubble' | 'inline' | 'minimal' | 'badge'
  size?: 'sm' | 'md' | 'lg'
  showUserNames?: boolean
  maxNames?: number
  
  // Styling
  className?: string
  dotClassName?: string
  textClassName?: string
  
  // Animation options
  animationDelay?: number // ms between dot animations
  animationDuration?: number // total animation cycle duration
  
  // Text customization
  singleUserText?: (name: string) => string
  multipleUsersText?: (names: string[], count: number) => string
  anonymousText?: string
}

export function TypingIndicator({
  conversationId,
  variant = 'bubble',
  size = 'md',
  showUserNames = true,
  maxNames = 2,
  className = '',
  dotClassName = '',
  textClassName = '',
  animationDelay = 150,
  animationDuration = 1500,
  singleUserText = (name) => `${name} is typing...`,
  multipleUsersText = (names, count) => {
    if (count <= maxNames) {
      return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are typing...`
    }
    return `${names.slice(0, maxNames).join(', ')} and ${count - maxNames} other${count - maxNames > 1 ? 's' : ''} are typing...`
  },
  anonymousText = 'Someone is typing...'
}: TypingIndicatorProps) {
  
  const { typingUsers, getTypingUsersForConversation, getTypingUserNames } = useTypingIndicator({
    conversationId
  })

  // Get typing users for this conversation
  const conversationTypingUsers = conversationId 
    ? getTypingUsersForConversation(conversationId)
    : typingUsers

  const typingUserNames = conversationId 
    ? getTypingUserNames(conversationId)
    : typingUsers.map(u => u.displayName || u.handle || 'Someone').filter(name => name !== 'Someone')

  // Don't render if no one is typing
  if (conversationTypingUsers.length === 0) {
    return null
  }

  // Generate text based on typing users
  const generateText = () => {
    if (!showUserNames || typingUserNames.length === 0) {
      return anonymousText
    }

    if (typingUserNames.length === 1) {
      return singleUserText(typingUserNames[0])
    }

    return multipleUsersText(typingUserNames, conversationTypingUsers.length)
  }

  // Size variants
  const sizeClasses = {
    sm: {
      dot: 'w-1 h-1',
      text: 'text-xs',
      container: 'px-2 py-1',
      gap: 'gap-1'
    },
    md: {
      dot: 'w-1.5 h-1.5',
      text: 'text-sm',
      container: 'px-3 py-2',
      gap: 'gap-1.5'
    },
    lg: {
      dot: 'w-2 h-2',
      text: 'text-base',
      container: 'px-4 py-3',
      gap: 'gap-2'
    }
  }

  const currentSize = sizeClasses[size]

  // Animated dots component
  const AnimatedDots = ({ className: dotsClassName = '' }) => (
    <div className={`flex ${currentSize.gap} ${dotsClassName}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${currentSize.dot} bg-current rounded-full animate-bounce ${dotClassName}`}
          style={{
            animationDelay: `${index * animationDelay}ms`,
            animationDuration: `${animationDuration}ms`,
            animationIterationCount: 'infinite'
          }}
        />
      ))}
    </div>
  )

  // Variant renderers
  const renderBubble = () => (
    <div className={`
      inline-flex items-center ${currentSize.gap} ${currentSize.container}
      bg-muted-100 text-muted-foreground-600 rounded-lg
      ${className}
    `}>
      <AnimatedDots />
      {showUserNames && (
        <span className={`${currentSize.text} ${textClassName}`}>
          {generateText()}
        </span>
      )}
    </div>
  )

  const renderInline = () => (
    <div className={`inline-flex items-center ${currentSize.gap} text-muted-foreground-500 ${className}`}>
      <AnimatedDots />
      {showUserNames && (
        <span className={`${currentSize.text} italic ${textClassName}`}>
          {generateText()}
        </span>
      )}
    </div>
  )

  const renderMinimal = () => (
    <div className={`inline-flex items-center text-muted-foreground-400 ${className}`}>
      <AnimatedDots />
    </div>
  )

  const renderBadge = () => (
    <div className={`
      inline-flex items-center ${currentSize.gap} px-2 py-1
      bg-primary-100 text-primary-600 rounded-full text-xs font-medium
      ${className}
    `}>
      <AnimatedDots />
      <span className={textClassName}>
        {conversationTypingUsers.length}
      </span>
    </div>
  )

  // Render based on variant
  switch (variant) {
    case 'inline':
      return renderInline()
    case 'minimal':
      return renderMinimal()
    case 'badge':
      return renderBadge()
    case 'bubble':
    default:
      return renderBubble()
  }
}

// Additional component for header typing indicator
export interface HeaderTypingIndicatorProps {
  conversationId?: string
  className?: string
}

export function HeaderTypingIndicator({ conversationId, className = '' }: HeaderTypingIndicatorProps) {
  return (
    <TypingIndicator
      conversationId={conversationId}
      variant="inline"
      size="sm"
      showUserNames={false}
      className={className}
      textClassName="text-primary-600"
      dotClassName="text-primary-600"
      anonymousText="typing..."
    />
  )
}

// Message bubble typing indicator
export interface MessageTypingIndicatorProps {
  conversationId?: string
  className?: string
  showAvatar?: boolean
  avatarUrl?: string
  userName?: string
}

export function MessageTypingIndicator({ 
  conversationId, 
  className = '', 
  showAvatar = false,
  avatarUrl,
  userName
}: MessageTypingIndicatorProps) {
  const { getTypingUsersForConversation } = useTypingIndicator({ conversationId })
  
  const typingUsers = conversationId ? getTypingUsersForConversation(conversationId) : []
  
  if (typingUsers.length === 0) {
    return null
  }

  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      {showAvatar && (
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={userName || 'User'} 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-muted-300 rounded-full flex items-center justify-center">
              <span className="text-xs text-muted-foreground-600 font-medium">
                {(userName || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="max-w-xs lg:max-w-md px-4 py-2 bg-muted-100 rounded-lg">
        <TypingIndicator
          conversationId={conversationId}
          variant="minimal"
          size="sm"
          className="text-muted-foreground-400"
        />
      </div>
    </div>
  )
}

// Conversation list typing indicator
export interface ConversationTypingIndicatorProps {
  conversationId: string
  className?: string
}

export function ConversationTypingIndicator({ conversationId, className = '' }: ConversationTypingIndicatorProps) {
  return (
    <TypingIndicator
      conversationId={conversationId}
      variant="inline"
      size="sm"
      showUserNames={false}
      className={`italic text-primary-600 ${className}`}
      anonymousText="typing..."
    />
  )
}

export default TypingIndicator