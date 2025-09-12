'use client'

import React from 'react'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { useMessageStatus, MessageStatus } from '../lib/hooks/useMessageStatus'

export interface MessageStatusIndicatorProps {
  messageId: string
  fromUserId: string
  currentUserId?: string
  status?: MessageStatus
  
  // Display options
  variant?: 'default' | 'minimal' | 'detailed'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  
  // Styling
  className?: string
  iconClassName?: string
  textClassName?: string
  
  // Colors
  sentColor?: string
  deliveredColor?: string
  readColor?: string
  failedColor?: string
}

export function MessageStatusIndicator({
  messageId,
  fromUserId,
  currentUserId,
  status,
  variant = 'default',
  size = 'sm',
  showText = false,
  className = '',
  iconClassName = '',
  textClassName = '',
  sentColor = 'text-gray-400',
  deliveredColor = 'text-gray-500',
  readColor = 'text-blue-500',
  failedColor = 'text-red-500'
}: MessageStatusIndicatorProps) {
  
  const { getMessageStatus, isMessageDelivered, isMessageRead } = useMessageStatus()

  // Don't show status for received messages (only for sent messages)
  if (fromUserId !== currentUserId) {
    return null
  }

  // Get status from hook if not provided
  const messageStatus = status || getMessageStatus(messageId) || 'sent'

  // Size variants
  const sizeClasses = {
    sm: {
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  }

  const currentSize = sizeClasses[size]

  // Status configuration
  const statusConfig = {
    sent: {
      icon: Check,
      color: sentColor,
      text: 'Sent',
      description: 'Message sent'
    },
    delivered: {
      icon: CheckCheck,
      color: deliveredColor,
      text: 'Delivered',
      description: 'Message delivered'
    },
    read: {
      icon: CheckCheck,
      color: readColor,
      text: 'Read',
      description: 'Message read'
    },
    failed: {
      icon: AlertCircle,
      color: failedColor,
      text: 'Failed',
      description: 'Message failed to send'
    },
    sending: {
      icon: Clock,
      color: sentColor,
      text: 'Sending',
      description: 'Sending message'
    }
  }

  const config = statusConfig[messageStatus as keyof typeof statusConfig] || statusConfig.sent
  const IconComponent = config.icon

  // Render based on variant
  const renderDefault = () => (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      <IconComponent 
        className={`${currentSize.icon} ${config.color} ${iconClassName}`}
      />
      {showText && (
        <span className={`${currentSize.text} ${config.color} ${textClassName}`}>
          {config.text}
        </span>
      )}
    </div>
  )

  const renderMinimal = () => (
    <IconComponent 
      className={`${currentSize.icon} ${config.color} ${iconClassName} ${className}`}
    />
  )

  const renderDetailed = () => (
    <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full bg-gray-100 ${className}`}>
      <IconComponent 
        className={`${currentSize.icon} ${config.color} ${iconClassName}`}
      />
      <span className={`${currentSize.text} ${config.color} font-medium ${textClassName}`}>
        {config.text}
      </span>
    </div>
  )

  // Render based on variant
  switch (variant) {
    case 'minimal':
      return renderMinimal()
    case 'detailed':
      return renderDetailed()
    case 'default':
    default:
      return renderDefault()
  }
}

// Specialized component for chat message bubbles
export interface ChatMessageStatusProps {
  messageId: string
  fromUserId: string
  currentUserId?: string
  status?: MessageStatus
  timestamp?: string
  className?: string
}

export function ChatMessageStatus({
  messageId,
  fromUserId,
  currentUserId,
  status,
  timestamp,
  className = ''
}: ChatMessageStatusProps) {
  
  // Don't show for received messages
  if (fromUserId !== currentUserId) {
    return null
  }

  return (
    <div className={`flex items-center space-x-1 text-xs ${className}`}>
      {timestamp && (
        <span className="opacity-75">
          {new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
      <MessageStatusIndicator
        messageId={messageId}
        fromUserId={fromUserId}
        currentUserId={currentUserId}
        status={status}
        variant="minimal"
        size="sm"
      />
    </div>
  )
}

// Batch status indicator for multiple messages
export interface BatchStatusIndicatorProps {
  messageIds: string[]
  fromUserId: string
  currentUserId?: string
  className?: string
}

export function BatchStatusIndicator({
  messageIds,
  fromUserId,
  currentUserId,
  className = ''
}: BatchStatusIndicatorProps) {
  
  const { getMessageStatus } = useMessageStatus()

  // Don't show for received messages
  if (fromUserId !== currentUserId) {
    return null
  }

  // Calculate overall status
  const statuses = messageIds.map(id => getMessageStatus(id) || 'sent')
  
  // Determine the lowest common status
  let overallStatus: MessageStatus = 'read'
  
  if (statuses.some(status => status === 'sent')) {
    overallStatus = 'sent'
  } else if (statuses.some(status => status === 'delivered')) {
    overallStatus = 'delivered'
  }

  const readCount = statuses.filter(status => status === 'read').length
  const totalCount = messageIds.length

  return (
    <div className={`inline-flex items-center space-x-1 text-xs ${className}`}>
      <MessageStatusIndicator
        messageId={messageIds[0]} // Use first message for display
        fromUserId={fromUserId}
        currentUserId={currentUserId}
        status={overallStatus}
        variant="minimal"
        size="sm"
      />
      {readCount > 0 && (
        <span className="text-blue-500 font-medium">
          {readCount}/{totalCount}
        </span>
      )}
    </div>
  )
}

// Conversation status summary
export interface ConversationStatusProps {
  conversationId: string
  className?: string
}

export function ConversationStatus({
  conversationId,
  className = ''
}: ConversationStatusProps) {
  
  const { getUnreadCount, getDeliveredCount } = useMessageStatus({
    conversationId
  })

  const unreadCount = getUnreadCount()
  const deliveredCount = getDeliveredCount()

  if (unreadCount === 0 && deliveredCount === 0) {
    return null
  }

  return (
    <div className={`inline-flex items-center space-x-2 text-xs ${className}`}>
      {unreadCount > 0 && (
        <div className="flex items-center space-x-1 text-red-500">
          <AlertCircle className="w-3 h-3" />
          <span>{unreadCount} unread</span>
        </div>
      )}
      {deliveredCount > 0 && (
        <div className="flex items-center space-x-1 text-gray-500">
          <CheckCheck className="w-3 h-3" />
          <span>{deliveredCount} delivered</span>
        </div>
      )}
    </div>
  )
}

export default MessageStatusIndicator