'use client'

import { useRouter } from 'next/navigation'
import { Conversation } from '../../lib/types/dashboard'
import { getTimeAgo, getUserInitials } from '../../lib/utils/dashboard'
import { LoadingSpinner } from '../ui/loading-spinner'
import { IconBadge } from '../ui/icon-badge'
import { MessageCircle } from 'lucide-react'

interface RecentMessagesCardProps {
  messages: Conversation[]
  loading?: boolean
}

export function RecentMessagesCard({ messages, loading = false }: RecentMessagesCardProps) {
  const router = useRouter()

  const handleConversationClick = (conversation: Conversation) => {
    if (conversation.context_type === 'gig') {
      router.push(`/messages?gig=${conversation.gig_id}&user=${conversation.other_user?.id}`)
    } else if (conversation.context_type === 'marketplace') {
      router.push(`/messages?listing=${conversation.listing_id}&user=${conversation.other_user?.id}`)
    } else {
      router.push('/messages')
    }
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <IconBadge icon={MessageCircle} size="md" variant="primary" />
        <div>
          <h3 className="text-lg font-bold text-foreground">Recent Messages</h3>
          <p className="text-sm text-muted-foreground">Your latest conversations</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => router.push('/messages')}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View All →
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <LoadingSpinner size="md" className="py-8" />
        ) : messages.length > 0 ? (
          messages.map((conversation, index) => {
            const colors = [
              'from-primary/10 to-primary/20 border-primary/20 hover:bg-primary/20',
              'from-primary/10 to-primary/20 border-primary/20 hover:bg-primary/20',
              'from-primary/20 to-primary/30 border-primary/20 hover:bg-primary/30',
              'from-primary/10 to-primary/20 border-primary/20 hover:bg-primary/20',
              'from-muted/10 to-muted/20 border-border hover:bg-muted/20'
            ]
            const colorClass = colors[index % colors.length]
            const timeAgo = getTimeAgo(conversation.last_message_time)
            const initials = getUserInitials(conversation.other_user?.display_name || '')

            return (
              <div
                key={conversation.id}
                className={`p-3 bg-gradient-to-r ${colorClass} rounded-xl border transition-colors cursor-pointer`}
                onClick={() => handleConversationClick(conversation)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    {conversation.other_user?.avatar_url ? (
                      <img
                        src={conversation.other_user.avatar_url}
                        alt={conversation.other_user.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-foreground text-sm font-bold">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conversation.other_user?.display_name || 'Unknown User'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo}
                      </span>
                    </div>

                    {/* Message Preview Section */}
                    <div className="mb-1">
                      <p className="text-sm text-foreground truncate leading-relaxed">
                        {conversation.last_message}
                      </p>
                    </div>

                    {/* Status Indicator */}
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-xs text-primary font-medium">
                          {conversation.unread_count} new
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-foreground mb-1">No recent messages</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Start conversations with other creators
            </p>
            <button
              onClick={() => router.push('/messages')}
              className="inline-flex items-center px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
