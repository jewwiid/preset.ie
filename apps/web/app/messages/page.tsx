'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useMessagesApi, ConversationDTO, ConversationDetailsDTO, MessageDTO } from '../../lib/api/messages'
import { useRealtimeMessages, RealtimeMessage, MessageStatusUpdate, TypingEvent } from '../../lib/hooks/useRealtimeMessages'
import { MessageSquare, Send, Search, User, Clock, AlertCircle, Wifi, WifiOff, ChevronLeft, ChevronRight, Menu, Briefcase, ShoppingCart, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ExtendedConversationDTO extends ConversationDTO {
  otherUser?: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
    verified_id?: boolean
  }
  // Marketplace-specific fields
  context?: {
    type: 'gig' | 'marketplace'
    listing?: {
      id: string
      title: string
      category: string
      mode: string
      status: string
      owner_id: string
      users_profile?: {
        id: string
        display_name: string
        handle: string
        avatar_url?: string
        verified_id?: boolean
      }
      listing_images?: Array<{
        id: string
        url: string
        sort_order: number
      }>
    }
    offer?: {
      id: string
      status: string
      offer_amount_cents: number
      message?: string
      offerer_id: string
      owner_id: string
    }
    rental_order?: {
      id: string
      status: string
      start_date: string
      end_date: string
      calculated_total_cents: number
    }
    sale_order?: {
      id: string
      status: string
      total_cents: number
    }
  }
}

export default function MessagesPage() {
  const { user } = useAuth()
  const messagesApi = useMessagesApi()
  
  // Helper function to get auth token
  const getAuthToken = async (): Promise<string> => {
    const { supabase } = await import('../../lib/supabase')
    if (!supabase) {
      return 'dummy-token'
    }
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || 'dummy-token'
  }
  
  // Get current user profile ID for message alignment
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!user) return
      
      try {
        const { supabase } = await import('../../lib/supabase')
        if (!supabase) return
        
        const { data: userProfile } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (userProfile) {
          setCurrentUserProfileId(userProfile.id)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    
    fetchCurrentUserProfile()
  }, [user])
  
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
    return true // Default to collapsed on mobile
  })
  
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return true
  })
  
  const [showConversations, setShowConversations] = useState(false)
  
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

  // Real-time messaging integration - temporarily disabled due to WebSocket issues
  // const realtimeMessages = useRealtimeMessages({
  //   conversationId: selectedConversation || undefined,
  //   enableTypingIndicators: true,
  //   enableMessageStatus: true,
  //   enableToastNotifications: true,
  //   onNewMessage: handleNewMessage,
  //   onMessageStatusUpdate: handleMessageStatusUpdate,
  //   onTypingUpdate: handleTypingUpdate,
  //   onConnectionChange: handleConnectionChange
  // })

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user])

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(true)
        setShowConversations(false)
      } else {
        // On desktop, keep sidebar expanded by default
        setSidebarCollapsed(false)
        setShowConversations(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationDetails(selectedConversation)
      // Mark conversation as delivered when viewing
      // realtimeMessages.markAsDelivered(selectedConversation)
    }
  }, [selectedConversation])

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
      
      // Fetch both gig and marketplace conversations
      const [gigConversations, marketplaceConversations] = await Promise.all([
        messagesApi.getConversations({ limit: 50 }),
        fetch('/api/marketplace/messages/conversations?limit=50', {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        }).then(res => res.ok ? res.json() : { conversations: [], total: 0, totalUnread: 0 })
      ])
      
      // Process gig conversations
      const processedGigConversations = await Promise.all(
        gigConversations.conversations.map(async (conv) => {
          return {
            ...conv,
            context: { type: 'gig' as const }
          }
        })
      )
      
      // Process marketplace conversations
      const processedMarketplaceConversations = marketplaceConversations.conversations.map((conv: any) => {
        console.log('Processing marketplace conversation:', conv.id, conv.context)
        return {
          ...conv,
          context: {
            type: 'marketplace' as const,
            listing: conv.context?.listing,
            offer: conv.context?.offer,
            rental_order: conv.context?.rental_order,
            sale_order: conv.context?.sale_order
          }
        }
      })
      
      // Combine and sort by last message time
      const allConversations = [...processedGigConversations, ...processedMarketplaceConversations]
        .sort((a, b) => new Date(b.lastMessageAt || b.startedAt).getTime() - new Date(a.lastMessageAt || a.startedAt).getTime())
      
      setConversations(allConversations)
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
      
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) {
        throw new Error('Conversation not found')
      }
      
      console.log('Fetching conversation details for:', conversationId)
      console.log('Conversation found:', conversation)
      console.log('Conversation context:', conversation.context)
      console.log('Conversation type:', conversation.context?.type)
      
      if (conversation.context?.type === 'marketplace') {
        // For marketplace conversations, fetch messages using the new API endpoint
        const response = await fetch(`/api/marketplace/messages/${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch marketplace conversation details')
        }
        
        const conversationDetails = await response.json()
        setConversationDetails(conversationDetails)
        
        // Mark conversation as read when viewing
        try {
          // Refresh conversations to update unread counts
          fetchConversations()
        } catch (readError) {
          console.error('Error refreshing conversations:', readError)
          // Don't show error to user for this non-critical operation
        }
      } else {
        // Handle gig conversations normally
        try {
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
          // If the gig API says this is a marketplace conversation, try marketplace API
          if (error.message.includes('marketplace conversation') || error.message.includes('400')) {
            console.log('Retrying with marketplace API for conversation:', conversationId)
            const response = await fetch(`/api/marketplace/messages/${conversationId}`, {
              headers: {
                'Authorization': `Bearer ${await getAuthToken()}`
              }
            })
            
            if (!response.ok) {
              throw new Error('Failed to fetch marketplace conversation details')
            }
            
            const conversationDetails = await response.json()
            setConversationDetails(conversationDetails)
            
            // Refresh conversations to update unread counts
            try {
              fetchConversations()
            } catch (readError) {
              console.error('Error refreshing conversations:', readError)
            }
          } else {
            throw error
          }
        }
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
      // realtimeMessages.setTyping(selectedConversation, true)
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedConversation) {
        setIsTyping(false)
        // realtimeMessages.setTyping(selectedConversation, false)
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
      // realtimeMessages.setTyping(selectedConversation, false)
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
      
      // Handle different message types
      if (conversation.context?.type === 'marketplace') {
        // Send marketplace message
        console.log('Sending marketplace message to:', conversation.otherUser.id);
        console.log('Listing ID:', conversation.context.listing?.id);
        const response = await fetch('/api/marketplace/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify({
            listing_id: conversation.context.listing?.id,
            to_user_id: conversation.otherUser.id,
            message_body: newMessage.trim(),
            offer_id: conversation.context.offer?.id,
            rental_order_id: conversation.context.rental_order?.id,
            sale_order_id: conversation.context.sale_order?.id
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to send marketplace message')
        }
      } else {
        // Send gig message
        console.log('Sending gig message to:', conversation.otherUser.id);
        console.log('Gig ID:', conversation.gigId);
        await messagesApi.sendMessage({
          gigId: conversation.gigId,
          toUserId: conversation.otherUser.id,
          body: newMessage.trim()
        })
      }

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

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)
      
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation) {
        throw new Error('Conversation not found')
      }
      
      // Determine the API endpoint based on conversation type
      const apiEndpoint = conversation.context?.type === 'marketplace' 
        ? `/api/marketplace/messages/${conversationId}`
        : `/api/messages/${conversationId}`
      
      const response = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete conversation')
      }
      
      // Remove conversation from local state
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      // If this was the selected conversation, clear it
      if (selectedConversation === conversationId) {
        setSelectedConversation(null)
        setConversationDetails(null)
      }
      
    } catch (error: any) {
      console.error('Error deleting conversation:', error)
      setError(error.message || 'Failed to delete conversation')
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view messages</h2>
          <p className="text-muted-foreground">You need to be signed in to access your messages.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Error loading messages</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchConversations()
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          {/* Mobile conversation overlay */}
          {showConversations && isMobile && (
            <div className="lg:hidden fixed inset-0 bg-background z-50 flex flex-col">
              {/* Mobile conversation header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-semibold text-foreground">Messages</h1>
                  <button
                    onClick={() => setShowConversations(false)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    title="Close conversations"
                  >
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="mt-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Mobile conversations list */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    <MessageSquare className="mx-auto mb-2 text-muted-foreground h-8 w-8" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation.id)
                        setShowConversations(false)
                      }}
                      className="p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 relative">
                          {conversation.otherUser?.avatar_url ? (
                            <img 
                              src={conversation.otherUser.avatar_url} 
                              alt={conversation.otherUser.display_name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-primary rounded-full flex items-center justify-center ${conversation.otherUser?.avatar_url ? 'hidden' : ''}`}>
                            <User className="h-5 w-5 text-primary-foreground" />
                          </div>
                          {conversation.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-xs font-medium text-primary-foreground bg-primary rounded-full px-2 py-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-foreground truncate">
                                {conversation.otherUser?.display_name || 'Unknown User'}
                              </h3>
                              {/* Context badge */}
                              {conversation.context?.type === 'gig' ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Briefcase className="h-3 w-3 mr-1" />
                                  Gig
                                </Badge>
                              ) : conversation.context?.type === 'marketplace' ? (
                                <Badge variant="outline" className="text-xs">
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Marketplace
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs text-muted-foreground">
                                {conversation.lastMessageAt && formatDate(conversation.lastMessageAt)}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteConversation(conversation.id)
                                }}
                                className="p-1 hover:bg-destructive/10 rounded text-destructive hover:text-destructive-foreground transition-colors"
                                title="Delete conversation"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">@{conversation.otherUser?.handle || 'unknown'}</p>
                          {/* Show listing preview for marketplace conversations */}
                          {conversation.context?.type === 'marketplace' && conversation.context?.listing && (
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                                  <Tag className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </div>
                              <p className="text-xs text-primary truncate">
                                {conversation.context.listing.title}
                              </p>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage?.body || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className={`${sidebarCollapsed ? 'lg:w-16 w-16' : 'lg:w-1/3 w-80'} border-r border-border flex flex-col transition-all duration-300 ease-in-out ${
              sidebarCollapsed ? 'lg:relative relative lg:translate-x-0 translate-x-0' : 'lg:relative relative lg:translate-x-0 translate-x-0'
            } lg:static ${!sidebarCollapsed ? 'lg:bg-transparent bg-card lg:shadow-none shadow-none' : ''}`}>
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  {!sidebarCollapsed && (
                    <h1 className="text-xl font-semibold text-foreground">Messages</h1>
                  )}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2 hover:bg-accent rounded-lg transition-colors"
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {!sidebarCollapsed && (
                  <div className="mt-2 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className={`text-center text-muted-foreground ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
                    <MessageSquare className={`mx-auto mb-2 text-muted-foreground ${sidebarCollapsed ? 'h-6 w-6' : 'h-8 w-8'}`} />
                    {!sidebarCollapsed && <p className="text-sm">No conversations yet</p>}
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    // Check if this conversation has active typing users
                    // const hasTypingUsers = selectedConversation !== conversation.id && 
                    //   Object.values(realtimeMessages.typingUsers).some(user => 
                    //     user.isTyping && user.conversationId === conversation.id
                    //   )
                    const hasTypingUsers = false // Temporarily disabled
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          setSelectedConversation(conversation.id)
                          // On mobile, keep sidebar visible but show conversation details
                          if (isMobile) {
                            setShowConversations(false)
                          }
                        }}
                        className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                          selectedConversation === conversation.id ? 'bg-primary/10 border-primary/20' : ''
                        } ${
                          hasTypingUsers ? 'bg-secondary/10' : ''
                        }`}
                        title={sidebarCollapsed ? `${conversation.otherUser?.display_name || 'Unknown User'}: ${conversation.lastMessage?.body || 'No messages yet'}` : ''}
                      >
                        <div className={`flex items-start ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                          <div className="flex-shrink-0 relative">
                            {conversation.otherUser?.avatar_url ? (
                              <img 
                                src={conversation.otherUser.avatar_url} 
                                alt={conversation.otherUser.display_name}
                                className={`${sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`}
                                onError={(e) => {
                                  // Fallback to default avatar if image fails to load
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className={`${sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} bg-primary rounded-full flex items-center justify-center ${conversation.otherUser?.avatar_url ? 'hidden' : ''}`}>
                              <User className={`text-primary-foreground ${sidebarCollapsed ? 'h-4 w-4' : 'h-5 w-5'}`} />
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center text-xs font-medium text-primary-foreground bg-primary rounded-full ${
                                sidebarCollapsed ? 'w-4 h-4 text-xs' : 'px-2 py-1'
                              }`}>
                                {sidebarCollapsed ? conversation.unreadCount : conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-sm font-medium text-foreground truncate">
                                    {conversation.otherUser?.display_name || 'Unknown User'}
                                  </h3>
                                  {/* Context badge */}
                                  {conversation.context?.type === 'gig' ? (
                                    <Badge variant="secondary" className="text-xs">
                                      <Briefcase className="h-3 w-3 mr-1" />
                                      Gig
                                    </Badge>
                                  ) : conversation.context?.type === 'marketplace' ? (
                                    <Badge variant="outline" className="text-xs">
                                      <ShoppingCart className="h-3 w-3 mr-1" />
                                      Marketplace
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs text-muted-foreground">
                                    {conversation.lastMessageAt && formatDate(conversation.lastMessageAt)}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteConversation(conversation.id)
                                    }}
                                    className="p-1 hover:bg-destructive/10 rounded text-destructive hover:text-destructive-foreground transition-colors"
                                    title="Delete conversation"
                                  >
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">@{conversation.otherUser?.handle || 'unknown'}</p>
                              {/* Show listing preview for marketplace conversations */}
                              {conversation.context?.type === 'marketplace' && conversation.context?.listing && (
                                <div className="flex items-center space-x-2 mb-1">
                                  <div className="flex-shrink-0">
                                    <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                                      <Tag className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </div>
                                  <p className="text-xs text-primary truncate">
                                    {conversation.context.listing.title}
                                  </p>
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground truncate">
                                {hasTypingUsers ? (
                                  <span className="italic text-primary">typing...</span>
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
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Desktop sidebar toggle */}
                        <button
                          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                          className="hidden lg:block p-2 hover:bg-accent rounded-lg transition-colors"
                          title={sidebarCollapsed ? 'Show conversations' : 'Hide conversations'}
                        >
                          <Menu className="h-5 w-5 text-muted-foreground" />
                        </button>
                        
                        {/* Mobile back button */}
                        {isMobile && (
                          <button
                            onClick={() => setSelectedConversation(null)}
                            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                            title="Back to conversations"
                          >
                            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                          </button>
                        )}
                        
                        {/* User Avatar */}
                        <div className="flex-shrink-0 relative">
                          {conversations.find(c => c.id === selectedConversation)?.otherUser?.avatar_url ? (
                            <img 
                              src={conversations.find(c => c.id === selectedConversation)?.otherUser?.avatar_url} 
                              alt={conversations.find(c => c.id === selectedConversation)?.otherUser?.display_name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-primary rounded-full flex items-center justify-center ${conversations.find(c => c.id === selectedConversation)?.otherUser?.avatar_url ? 'hidden' : ''}`}>
                            <User className="h-5 w-5 text-primary-foreground" />
                          </div>
                        </div>
                        
              <div className="flex-1 min-w-0 flex items-center justify-between">
                {/* Left side: User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h2 className="text-lg font-medium text-foreground truncate">
                      {conversations.find(c => c.id === selectedConversation)?.otherUser?.display_name || 'Unknown User'}
                    </h2>
                    {/* Context badge in header */}
                    {conversations.find(c => c.id === selectedConversation)?.context?.type === 'gig' ? (
                      <Badge variant="secondary" className="text-xs">
                        <Briefcase className="h-3 w-3 mr-1" />
                        Gig
                      </Badge>
                    ) : conversations.find(c => c.id === selectedConversation)?.context?.type === 'marketplace' ? (
                      <Badge variant="outline" className="text-xs">
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Marketplace
                      </Badge>
                    ) : null}
                  </div>
                  
                  {/* User Handle and Typing Indicator */}
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                      @{conversations.find(c => c.id === selectedConversation)?.otherUser?.handle || 'unknown'}
                    </p>
                    {/* Typing Indicator - Temporarily disabled */}
                    {/* {Object.values(realtimeMessages.typingUsers).some(user => user.isTyping) && (
                      <p className="text-xs text-primary italic">
                        typing...
                      </p>
                    )} */}
                  </div>
                </div>
                
                {/* Right side: Listing Preview for Marketplace Conversations */}
                {conversations.find(c => c.id === selectedConversation)?.context?.type === 'marketplace' && 
                 conversations.find(c => c.id === selectedConversation)?.context?.listing && (
                  <a
                    href={`/gear/listings/${conversations.find(c => c.id === selectedConversation)?.context?.listing?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-2 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors cursor-pointer ml-4 flex-shrink-0"
                  >
                    {/* Listing Image */}
                    <div className="flex-shrink-0">
                      {conversations.find(c => c.id === selectedConversation)?.context?.listing?.listing_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ? (
                        <img 
                          src={conversations.find(c => c.id === selectedConversation)?.context?.listing?.listing_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url}
                          alt={conversations.find(c => c.id === selectedConversation)?.context?.listing?.title}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 bg-muted rounded-lg flex items-center justify-center ${conversations.find(c => c.id === selectedConversation)?.context?.listing?.listing_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ? 'hidden' : ''}`}>
                        <Tag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    
                    {/* Listing Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conversations.find(c => c.id === selectedConversation)?.context?.listing?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conversations.find(c => c.id === selectedConversation)?.context?.listing?.category} • 
                        {conversations.find(c => c.id === selectedConversation)?.context?.listing?.mode}
                      </p>
                    </div>
                  </a>
                )}
              </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversationDetails.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      conversationDetails.messages.map((message: MessageDTO) => (
                        <div
                          key={message.id}
                          className={`flex ${message.fromUserId === currentUserProfileId ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                        >
                          {/* Avatar for other user's messages */}
                          {message.fromUserId !== currentUserProfileId && (
                            <div className="flex-shrink-0">
                              {message.fromUser?.avatar_url ? (
                                <img 
                                  src={message.fromUser.avatar_url} 
                                  alt={message.fromUser.display_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <div className={`w-8 h-8 bg-muted rounded-full flex items-center justify-center ${message.fromUser?.avatar_url ? 'hidden' : ''}`}>
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          )}
                          
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.fromUserId === currentUserProfileId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.body}</p>
                            <div className={`flex items-center justify-between mt-1 text-xs ${
                              message.fromUserId === currentUserProfileId ? 'text-primary-200' : 'text-muted-foreground'
                            }`}>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(message.sentAt)}</span>
                              </div>
                              {message.fromUserId === currentUserProfileId && (
                                <div className="flex items-center space-x-1">
                                  {message.readAt ? (
                                    <span className="text-primary-200" title="Read">✓✓</span>
                                  ) : (
                                    <span className="text-primary-300" title="Delivered">✓</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Avatar for current user's messages */}
                          {message.fromUserId === currentUserProfileId && (
                            <div className="flex-shrink-0">
                              {user?.user_metadata?.avatar_url ? (
                                <img 
                                  src={user.user_metadata.avatar_url} 
                                  alt={user.user_metadata.full_name || 'You'}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <div className={`w-8 h-8 bg-primary rounded-full flex items-center justify-center ${user?.user_metadata?.avatar_url ? 'hidden' : ''}`}>
                                <User className="h-4 w-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    
                    {/* Typing Indicators - Temporarily disabled */}
                    {/* {Object.values(realtimeMessages.typingUsers).filter(user => user.isTyping).map(user => (
                      <div key={user.userId} className="flex justify-start">
                        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-accent">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {user.userDisplayName || 'Someone'} is typing...
                            </span>
                          </div>
                        </div>
                      </div>
                    ))} */}
                    
                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex space-x-2">
                      <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                        rows={2}
                        disabled={false}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[44px]"
                      >
                        {sending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {/* Connection Error - Temporarily disabled */}
                    {/* {realtimeMessages.connectionError && (
                      <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 mt-2">
                        <div className="flex items-center space-x-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span>Connection error: {realtimeMessages.connectionError}</span>
                          <button
                            onClick={realtimeMessages.reconnect}
                            className="text-destructive underline hover:text-destructive"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )} */}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground mb-4">Choose a conversation from the sidebar to start messaging.</p>
                    
                    {/* Show conversations button when no conversation selected */}
                    {isMobile && (
                      <button
                        onClick={() => setShowConversations(true)}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Menu className="h-4 w-4" />
                        <span>Show Conversations</span>
                      </button>
                    )}
                    
                    {/* Global connection status when no conversation selected - Temporarily disabled */}
                    {/* <div className="mt-4">
                      {realtimeMessages.isConnecting ? (
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                          <LoadingSpinner size="sm" />
                          <span>Connecting to real-time messaging...</span>
                        </div>
                      ) : realtimeMessages.isConnected ? (
                        <div className="flex items-center justify-center space-x-2 text-sm text-primary">
                          <Wifi className="h-4 w-4" />
                          <span>Connected to real-time messaging</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 text-sm text-destructive">
                          <WifiOff className="h-4 w-4" />
                          <span>Real-time messaging disconnected</span>
                          <button
                            onClick={realtimeMessages.reconnect}
                            className="underline hover:text-destructive"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div> */}
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