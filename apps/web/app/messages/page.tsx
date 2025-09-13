'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useMessagesApi, ConversationDTO, ConversationDetailsDTO, MessageDTO } from '../../lib/api/messages'
import { useRealtimeMessages, RealtimeMessage, MessageStatusUpdate, TypingEvent } from '../../lib/hooks/useRealtimeMessages'
import { MessageSquare, Send, Search, User, Clock, AlertCircle, Wifi, WifiOff, ChevronLeft, ChevronRight, Menu } from 'lucide-react'

interface ExtendedConversationDTO extends ConversationDTO {
  otherUser?: {
    id: string
    display_name: string
    handle: string
  }
}

export default function MessagesPage() {
  const { user } = useAuth()
  const messagesApi = useMessagesApi()
  
  const [conversations, setConversations] = useState<ExtendedConversationDTO[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversationDetails, setConversationDetails] = useState<ConversationDetailsDTO | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check if we're on mobile by default
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024 // lg breakpoint
    }
    return false
  })
  
  // Refs for auto-scrolling and input management
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Real-time event handlers
  function handleNewMessage(message: RealtimeMessage) {
    console.log('New real-time message:', message)
    
    // If message is for the current conversation, add it immediately
    if (selectedConversation === message.conversation_id) {
      setConversationDetails(prev => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [...prev.messages, {
            id: message.id,
            fromUserId: message.fromUserId,
            toUserId: message.toUserId,
            body: message.body,
            attachments: [],
            sentAt: message.sentAt,
            readAt: message.readAt
          }]
        }
      })
    }
    
    // Update conversations list with new last message
    setConversations(prev => prev.map(conv => {
      if (conv.id === message.conversation_id) {
        return {
          ...conv,
          lastMessage: {
            id: message.id,
            body: message.body,
            fromUserId: message.fromUserId,
            sentAt: message.sentAt,
            read: selectedConversation === message.conversation_id
          },
          lastMessageAt: message.sentAt,
          unreadCount: selectedConversation === message.conversation_id ? 0 : (conv.unreadCount + 1)
        }
      }
      return conv
    }))
  }

  function handleMessageStatusUpdate(update: MessageStatusUpdate) {
    console.log('Message status update:', update)
    
    // Update message status in conversation details
    setConversationDetails(prev => {
      if (!prev) return prev
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (msg.id === update.messageId) {
            return {
              ...msg,
              // Note: We'll need to extend MessageDTO to include status in the future
              // For now, just update readAt if status is 'read'
              readAt: update.status === 'read' ? update.updatedAt : msg.readAt
            }
          }
          return msg
        })
      }
    })
  }

  function handleTypingUpdate(typing: TypingEvent) {
    console.log('Typing update:', typing)
    // Typing indicators will be handled by the TypingIndicator component
  }

  function handleConnectionChange(connected: boolean) {
    console.log('Connection status changed:', connected)
    // Connection status will be shown in the UI
  }

  // Real-time messaging integration
  const realtimeMessages = useRealtimeMessages({
    conversationId: selectedConversation || undefined,
    enableTypingIndicators: true,
    enableMessageStatus: true,
    enableToastNotifications: true,
    onNewMessage: handleNewMessage,
    onMessageStatusUpdate: handleMessageStatusUpdate,
    onTypingUpdate: handleTypingUpdate,
    onConnectionChange: handleConnectionChange
  })

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationDetails(selectedConversation)
      // Mark conversation as delivered when viewing
      realtimeMessages.markAsDelivered(selectedConversation)
    }
  }, [selectedConversation, realtimeMessages.markAsDelivered])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [conversationDetails?.messages])

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      setError(null)
      const response = await messagesApi.getConversations({ limit: 50 })
      
      // TODO: We need to enhance the API to include user profile information
      // For now, we'll map the existing structure to work with the new API
      const conversationsWithUserInfo = await Promise.all(
        response.conversations.map(async (conv) => {
          // Extract other participant ID (excluding current user)
          const otherUserId = conv.participants.find(id => id !== user?.id)
          
          // TODO: Make API call to get user profile info
          // For now, we'll use placeholder data
          const extendedConv: ExtendedConversationDTO = {
            ...conv,
            otherUser: {
              id: otherUserId || '',
              display_name: `User ${otherUserId?.slice(-4)}`, // Temporary placeholder
              handle: `user_${otherUserId?.slice(-4)}` // Temporary placeholder
            }
          }
          
          return extendedConv
        })
      )
      
      setConversations(conversationsWithUserInfo)
    } catch (error: any) {
      console.error('Error fetching conversations:', error)
      setError(error.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationDetails = async (conversationId: string) => {
    try {
      setError(null)
      const response = await messagesApi.getConversation(conversationId)
      setConversationDetails(response.data)
      
      // Mark conversation as read when viewing
      try {
        await messagesApi.markConversationAsRead(conversationId)
        // Refresh conversations to update unread counts
        fetchConversations()
      } catch (readError) {
        console.error('Error marking conversation as read:', readError)
        // Don't show error to user for this non-critical operation
      }
    } catch (error: any) {
      console.error('Error fetching conversation details:', error)
      setError(error.message || 'Failed to load conversation')
    }
  }

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // Set typing indicator
    if (selectedConversation && !isTyping) {
      setIsTyping(true)
      realtimeMessages.setTyping(selectedConversation, true)
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedConversation) {
        setIsTyping(false)
        realtimeMessages.setTyping(selectedConversation, false)
      }
    }, 1000) as unknown as NodeJS.Timeout
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Stop typing when message is sent
  const stopTyping = () => {
    if (selectedConversation && isTyping) {
      setIsTyping(false)
      realtimeMessages.setTyping(selectedConversation, false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) {
      return
    }

    // Find the selected conversation to get the other user
    const conversation = conversations.find(c => c.id === selectedConversation)
    if (!conversation?.otherUser) {
      setError('Unable to find conversation recipient')
      return
    }

    setSending(true)
    try {
      setError(null)
      
      await messagesApi.sendMessage({
        gigId: conversation.gigId,
        toUserId: conversation.otherUser.id,
        body: newMessage.trim()
      })

      setNewMessage('')
      stopTyping()
      
      // Note: Real-time subscriptions will handle message updates
      // But we still refresh to ensure consistency
      await fetchConversationDetails(selectedConversation)
      await fetchConversations()
      
      // Focus back on input and scroll to bottom
      inputRef.current?.focus()
      scrollToBottom()
      
    } catch (error: any) {
      console.error('Error sending message:', error)
      setError(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view messages</h2>
          <p className="text-gray-600">You need to be signed in to access your messages.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading messages</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchConversations()
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          {/* Mobile backdrop overlay */}
          {!sidebarCollapsed && (
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-5"
              onClick={() => setSidebarCollapsed(true)}
            />
          )}
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className={`${sidebarCollapsed ? 'w-16' : 'w-1/3'} border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
              sidebarCollapsed ? 'lg:relative absolute lg:translate-x-0 -translate-x-full z-10 lg:z-auto' : 'lg:relative absolute lg:translate-x-0 translate-x-0 z-10 lg:z-auto'
            } lg:static ${!sidebarCollapsed ? 'lg:bg-transparent bg-white lg:shadow-none shadow-lg' : ''}`}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {!sidebarCollapsed && (
                    <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                  )}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>
                {!sidebarCollapsed && (
                  <div className="mt-2 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className={`text-center text-gray-500 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
                    <MessageSquare className={`mx-auto mb-2 text-gray-400 ${sidebarCollapsed ? 'h-6 w-6' : 'h-8 w-8'}`} />
                    {!sidebarCollapsed && <p className="text-sm">No conversations yet</p>}
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    // Check if this conversation has active typing users
                    const hasTypingUsers = selectedConversation !== conversation.id && 
                      Object.values(realtimeMessages.typingUsers).some(user => 
                        user.isTyping && user.conversationId === conversation.id
                      )
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-emerald-50 border-emerald-200' : ''
                        } ${
                          hasTypingUsers ? 'bg-blue-50' : ''
                        }`}
                        title={sidebarCollapsed ? `${conversation.otherUser?.display_name || 'Unknown User'}: ${conversation.lastMessage?.body || 'No messages yet'}` : ''}
                      >
                        <div className={`flex items-start ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                          <div className="flex-shrink-0 relative">
                            <div className={`${sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center`}>
                              <User className={`text-white ${sidebarCollapsed ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center text-xs font-medium text-white bg-emerald-600 rounded-full ${
                                sidebarCollapsed ? 'w-4 h-4 text-xs' : 'px-2 py-1'
                              }`}>
                                {sidebarCollapsed ? conversation.unreadCount : conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {conversation.otherUser?.display_name || 'Unknown User'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {conversation.lastMessageAt && formatDate(conversation.lastMessageAt)}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">@{conversation.otherUser?.handle || 'unknown'}</p>
                              <p className="text-sm text-gray-600 truncate">
                                {hasTypingUsers ? (
                                  <span className="italic text-blue-600">typing...</span>
                                ) : (
                                  conversation.lastMessage?.body || 'No messages yet'
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation && conversationDetails ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Mobile sidebar toggle */}
                        <button
                          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={sidebarCollapsed ? 'Show conversations' : 'Hide conversations'}
                        >
                          <Menu className="h-5 w-5 text-gray-600" />
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-medium text-gray-900">
                            {conversations.find(c => c.id === selectedConversation)?.otherUser?.display_name || 'Unknown User'}
                          </h2>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-gray-500">
                              @{conversations.find(c => c.id === selectedConversation)?.otherUser?.handle || 'unknown'}
                            </p>
                            {/* Typing Indicator */}
                            {Object.values(realtimeMessages.typingUsers).some(user => user.isTyping) && (
                              <p className="text-xs text-emerald-600 italic">
                                typing...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Connection Status */}
                      <div className="flex items-center space-x-2">
                        {realtimeMessages.isConnecting ? (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                            <span>Connecting...</span>
                          </div>
                        ) : realtimeMessages.isConnected ? (
                          <div className="flex items-center space-x-1 text-xs text-emerald-600">
                            <Wifi className="h-3 w-3" />
                            <span>Connected</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-xs text-red-500">
                            <WifiOff className="h-3 w-3" />
                            <span>Disconnected</span>
                            <button
                              onClick={realtimeMessages.reconnect}
                              className="text-xs underline hover:text-red-700"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversationDetails.messages.length === 0 ? (
                      <div className="text-center text-gray-500">
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      conversationDetails.messages.map((message: MessageDTO) => (
                        <div
                          key={message.id}
                          className={`flex ${message.fromUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.fromUserId === user?.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.body}</p>
                            <div className={`flex items-center justify-between mt-1 text-xs ${
                              message.fromUserId === user?.id ? 'text-emerald-200' : 'text-gray-500'
                            }`}>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(message.sentAt)}</span>
                              </div>
                              {message.fromUserId === user?.id && (
                                <div className="flex items-center space-x-1">
                                  {message.readAt ? (
                                    <span className="text-emerald-200" title="Read">✓✓</span>
                                  ) : (
                                    <span className="text-emerald-300" title="Delivered">✓</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Typing Indicators */}
                    {Object.values(realtimeMessages.typingUsers).filter(user => user.isTyping).map(user => (
                      <div key={user.userId} className="flex justify-start">
                        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {user.userDisplayName || 'Someone'} is typing...
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        rows={2}
                        disabled={!realtimeMessages.isConnected}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending || !realtimeMessages.isConnected}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {/* Connection Error */}
                    {realtimeMessages.connectionError && (
                      <div className="px-4 py-2 bg-red-50 border-t border-red-200 mt-2">
                        <div className="flex items-center space-x-2 text-sm text-red-700">
                          <AlertCircle className="h-4 w-4" />
                          <span>Connection error: {realtimeMessages.connectionError}</span>
                          <button
                            onClick={realtimeMessages.reconnect}
                            className="text-red-800 underline hover:text-red-900"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the sidebar to start messaging.</p>
                    
                    {/* Global connection status when no conversation selected */}
                    <div className="mt-4">
                      {realtimeMessages.isConnecting ? (
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          <span>Connecting to real-time messaging...</span>
                        </div>
                      ) : realtimeMessages.isConnected ? (
                        <div className="flex items-center justify-center space-x-2 text-sm text-emerald-600">
                          <Wifi className="h-4 w-4" />
                          <span>Connected to real-time messaging</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 text-sm text-red-500">
                          <WifiOff className="h-4 w-4" />
                          <span>Real-time messaging disconnected</span>
                          <button
                            onClick={realtimeMessages.reconnect}
                            className="underline hover:text-red-700"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}