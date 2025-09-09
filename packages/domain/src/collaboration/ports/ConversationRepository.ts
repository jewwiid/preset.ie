import { Conversation } from '../entities/Conversation';
import { ConversationStatus } from '../value-objects/ConversationStatus';

/**
 * Filter criteria for searching conversations
 */
export interface ConversationFilters {
  gigId?: string;
  participantId?: string;
  status?: ConversationStatus;
  hasUnread?: boolean;
}

/**
 * Port interface for Conversation persistence
 */
export interface ConversationRepository {
  /**
   * Find a conversation by ID
   */
  findById(id: string): Promise<Conversation | null>;

  /**
   * Find conversation by gig and participants
   */
  findByGigAndParticipants(
    gigId: string,
    participant1: string,
    participant2: string
  ): Promise<Conversation | null>;

  /**
   * Find all conversations for a gig
   */
  findByGigId(gigId: string): Promise<Conversation[]>;

  /**
   * Find all conversations for a participant
   */
  findByParticipant(
    participantId: string,
    filters?: ConversationFilters
  ): Promise<Conversation[]>;

  /**
   * Get conversations with unread messages for a user
   */
  findUnreadForUser(userId: string): Promise<Conversation[]>;

  /**
   * Get conversation count for a user
   */
  countForUser(userId: string, status?: ConversationStatus): Promise<number>;

  /**
   * Get total unread message count for a user
   */
  countUnreadMessagesForUser(userId: string): Promise<number>;

  /**
   * Save a conversation (create or update)
   */
  save(conversation: Conversation): Promise<void>;

  /**
   * Delete a conversation
   */
  delete(id: string): Promise<void>;

  /**
   * Check if users have an existing conversation for a gig
   */
  hasConversation(
    gigId: string,
    user1: string,
    user2: string
  ): Promise<boolean>;

  /**
   * Get recent conversations for dashboard
   */
  findRecent(
    userId: string,
    limit?: number
  ): Promise<Conversation[]>;

  /**
   * Mark all messages as read in a conversation for a user
   */
  markAllAsRead(
    conversationId: string,
    userId: string
  ): Promise<void>;
}