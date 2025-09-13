import { ConversationRepository, ConversationStatus } from '@preset/domain';

export interface GetConversationsQuery {
  userId: string;
  gigId?: string;
  status?: ConversationStatus;
  hasUnread?: boolean;
  limit?: number;
  offset?: number;
}

export interface ConversationDTO {
  id: string;
  gigId: string;
  participants: string[];
  lastMessage?: {
    id: string;
    body: string;
    fromUserId: string;
    sentAt: string;
    read: boolean;
  };
  unreadCount: number;
  status: ConversationStatus;
  startedAt: string;
  lastMessageAt?: string;
}

export interface GetConversationsResult {
  conversations: ConversationDTO[];
  total: number;
  totalUnread: number;
}

export class GetConversationsUseCase {
  constructor(
    private conversationRepo: ConversationRepository
  ) {}

  async execute(query: GetConversationsQuery): Promise<GetConversationsResult> {
    // Get conversations for user
    const conversations = await this.conversationRepo.findByParticipant(
      query.userId,
      {
        gigId: query.gigId,
        status: query.status,
        hasUnread: query.hasUnread
      }
    );

    // Sort by last message date
    conversations.sort((a, b) => {
      const aTime = a.getLastMessageAt()?.getTime() || 0;
      const bTime = b.getLastMessageAt()?.getTime() || 0;
      return bTime - aTime;
    });

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const paginatedConversations = conversations.slice(offset, offset + limit);

    // Map to DTOs
    const conversationDTOs: ConversationDTO[] = paginatedConversations.map(conv => {
      const messages = conv.getMessages();
      const lastMessage = messages[messages.length - 1];
      const unreadCount = conv.getUnreadCount(query.userId);

      return {
        id: conv.getId(),
        gigId: conv.getGigId(),
        participants: conv.getParticipants(),
        lastMessage: lastMessage ? {
          id: lastMessage.getId(),
          body: lastMessage.getBody().getPreview(100),
          fromUserId: lastMessage.getFromUserId(),
          sentAt: lastMessage.getSentAt().toISOString(),
          read: lastMessage.isRead() || lastMessage.getFromUserId() === query.userId
        } : undefined,
        unreadCount,
        status: conv.getStatus(),
        startedAt: conv.getStartedAt().toISOString(),
        lastMessageAt: conv.getLastMessageAt()?.toISOString()
      };
    });

    // Get total unread count across all conversations
    const totalUnread = await this.conversationRepo.countUnreadMessagesForUser(query.userId);

    return {
      conversations: conversationDTOs,
      total: conversations.length,
      totalUnread
    };
  }
}

/**
 * Get a single conversation with full message history
 */
export class GetConversationUseCase {
  constructor(
    private conversationRepo: ConversationRepository
  ) {}

  async execute(params: {
    conversationId: string;
    userId: string;
  }) {
    const conversation = await this.conversationRepo.findById(params.conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user is a participant
    if (!conversation.hasParticipant(params.userId)) {
      throw new Error('You are not a participant in this conversation');
    }

    // Mark all messages as read for this user
    await this.conversationRepo.markAllAsRead(params.conversationId, params.userId);

    // Map to detailed DTO
    const messages = conversation.getMessages().map(msg => ({
      id: msg.getId(),
      fromUserId: msg.getFromUserId(),
      toUserId: msg.getToUserId(),
      body: msg.getBody().getValue(),
      attachments: msg.getAttachments().map(a => a.toJSON()),
      sentAt: msg.getSentAt().toISOString(),
      readAt: msg.getReadAt()?.toISOString(),
      editedAt: msg.getEditedAt()?.toISOString(),
      deletedAt: msg.getDeletedAt()?.toISOString()
    }));

    return {
      id: conversation.getId(),
      gigId: conversation.getGigId(),
      participants: conversation.getParticipants(),
      messages,
      status: conversation.getStatus(),
      startedAt: conversation.getStartedAt().toISOString(),
      lastMessageAt: conversation.getLastMessageAt()?.toISOString(),
      blockedBy: conversation.getBlockedBy(),
      blockedAt: conversation.getBlockedAt()?.toISOString()
    };
  }
}