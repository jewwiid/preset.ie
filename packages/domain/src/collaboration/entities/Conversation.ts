import { BaseAggregateRoot } from '../../shared/BaseAggregateRoot';
import { ConversationStatus } from '../value-objects/ConversationStatus';
import { Message } from './Message';
import { MessageBody } from '../value-objects/MessageBody';
import { Attachment } from '../value-objects/Attachment';

export interface ConversationProps {
  id: string;
  gigId: string;
  participants: string[]; // [contributorId, talentId]
  messages: Message[];
  status: ConversationStatus;
  startedAt: Date;
  lastMessageAt?: Date;
  blockedBy?: string;
  blockedAt?: Date;
  archivedBy?: string[];
  archivedAt?: Date;
}

/**
 * Conversation aggregate root for per-gig messaging
 */
export class Conversation extends BaseAggregateRoot {
  private props: ConversationProps;

  constructor(props: ConversationProps) {
    super();
    this.props = { ...props };
  }

  static create(params: {
    id: string;
    gigId: string;
    contributorId: string;
    talentId: string;
  }): Conversation {
    const conversation = new Conversation({
      id: params.id,
      gigId: params.gigId,
      participants: [params.contributorId, params.talentId],
      messages: [],
      status: ConversationStatus.ACTIVE,
      startedAt: new Date()
    });

    // Add domain event
    conversation.addDomainEvent({
      aggregateId: params.id,
      eventType: 'ConversationStarted',
      occurredAt: new Date(),
      payload: {
        conversationId: params.id,
        gigId: params.gigId,
        participants: [params.contributorId, params.talentId]
      }
    });

    return conversation;
  }

  /**
   * Send a message in this conversation
   */
  sendMessage(params: {
    messageId: string;
    fromUserId: string;
    body: string;
    attachments?: Attachment[];
  }): Message {
    // Validate sender is a participant
    if (!this.props.participants.includes(params.fromUserId)) {
      throw new Error('Sender is not a participant in this conversation');
    }

    // Check if conversation allows messages
    if (this.props.status !== ConversationStatus.ACTIVE) {
      throw new Error(`Cannot send messages in ${this.props.status} conversation`);
    }

    // Check rate limiting (e.g., max 1 message per second)
    if (this.props.lastMessageAt) {
      const timeSinceLastMessage = Date.now() - this.props.lastMessageAt.getTime();
      if (timeSinceLastMessage < 1000) {
        throw new Error('Please wait before sending another message');
      }
    }

    // Determine recipient
    const toUserId = this.props.participants.find(p => p !== params.fromUserId);
    if (!toUserId) {
      throw new Error('Could not determine message recipient');
    }

    // Create the message
    const message = Message.create({
      id: params.messageId,
      conversationId: this.props.id,
      fromUserId: params.fromUserId,
      toUserId,
      body: params.body,
      attachments: params.attachments
    });

    // Add to conversation
    this.props.messages.push(message);
    this.props.lastMessageAt = new Date();

    // Add domain event
    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'MessageSent',
      occurredAt: new Date(),
      payload: {
        conversationId: this.props.id,
        messageId: message.getId(),
        fromUserId: params.fromUserId,
        toUserId,
        gigId: this.props.gigId
      }
    });

    return message;
  }

  /**
   * Mark a message as read
   */
  markMessageAsRead(messageId: string, userId: string): void {
    const message = this.props.messages.find(m => m.getId() === messageId);
    if (!message) {
      throw new Error('Message not found in conversation');
    }

    // Only the recipient can mark as read
    if (!message.isTo(userId)) {
      throw new Error('Only the recipient can mark a message as read');
    }

    message.markAsRead();

    // Add domain event
    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'MessageRead',
      occurredAt: new Date(),
      payload: {
        conversationId: this.props.id,
        messageId,
        readBy: userId
      }
    });
  }

  /**
   * Block this conversation
   */
  block(userId: string): void {
    if (!this.props.participants.includes(userId)) {
      throw new Error('Only participants can block a conversation');
    }

    if (this.props.status === ConversationStatus.BLOCKED) {
      throw new Error('Conversation is already blocked');
    }

    this.props.status = ConversationStatus.BLOCKED;
    this.props.blockedBy = userId;
    this.props.blockedAt = new Date();

    // Add domain event
    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'UserBlocked',
      occurredAt: new Date(),
      payload: {
        conversationId: this.props.id,
        blockedBy: userId,
        gigId: this.props.gigId
      }
    });
  }

  /**
   * Unblock this conversation
   */
  unblock(userId: string): void {
    if (this.props.blockedBy !== userId) {
      throw new Error('Only the user who blocked can unblock');
    }

    this.props.status = ConversationStatus.ACTIVE;
    this.props.blockedBy = undefined;
    this.props.blockedAt = undefined;

    // Add domain event
    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'UserUnblocked',
      occurredAt: new Date(),
      payload: {
        conversationId: this.props.id,
        unblockedBy: userId,
        gigId: this.props.gigId
      }
    });
  }

  /**
   * Archive this conversation for a user
   */
  archive(userId: string): void {
    if (!this.props.participants.includes(userId)) {
      throw new Error('Only participants can archive a conversation');
    }

    if (!this.props.archivedBy) {
      this.props.archivedBy = [];
    }

    if (this.props.archivedBy.includes(userId)) {
      throw new Error('Conversation is already archived for this user');
    }

    this.props.archivedBy.push(userId);

    // If both participants archived, mark conversation as archived
    if (this.props.archivedBy.length === this.props.participants.length) {
      this.props.status = ConversationStatus.ARCHIVED;
      this.props.archivedAt = new Date();
    }
  }

  /**
   * Close conversation (when gig is completed)
   */
  close(): void {
    this.props.status = ConversationStatus.CLOSED;

    // Add domain event
    this.addDomainEvent({
      aggregateId: this.props.id,
      eventType: 'ConversationClosed',
      occurredAt: new Date(),
      payload: {
        conversationId: this.props.id,
        gigId: this.props.gigId
      }
    });
  }

  // Getters
  getId(): string {
    return this.props.id;
  }

  getGigId(): string {
    return this.props.gigId;
  }

  getParticipants(): string[] {
    return [...this.props.participants];
  }

  getMessages(): Message[] {
    return [...this.props.messages];
  }

  getStatus(): ConversationStatus {
    return this.props.status;
  }

  getStartedAt(): Date {
    return new Date(this.props.startedAt);
  }

  getLastMessageAt(): Date | undefined {
    return this.props.lastMessageAt ? new Date(this.props.lastMessageAt) : undefined;
  }

  getBlockedBy(): string | undefined {
    return this.props.blockedBy;
  }

  getBlockedAt(): Date | undefined {
    return this.props.blockedAt ? new Date(this.props.blockedAt) : undefined;
  }

  isActive(): boolean {
    return this.props.status === ConversationStatus.ACTIVE;
  }

  isBlocked(): boolean {
    return this.props.status === ConversationStatus.BLOCKED;
  }

  isArchived(): boolean {
    return this.props.status === ConversationStatus.ARCHIVED;
  }

  isClosed(): boolean {
    return this.props.status === ConversationStatus.CLOSED;
  }

  /**
   * Check if user is a participant
   */
  hasParticipant(userId: string): boolean {
    return this.props.participants.includes(userId);
  }

  /**
   * Get the other participant
   */
  getOtherParticipant(userId: string): string | undefined {
    return this.props.participants.find(p => p !== userId);
  }

  /**
   * Get unread messages for a user
   */
  getUnreadMessages(userId: string): Message[] {
    return this.props.messages.filter(m => m.isTo(userId) && !m.isRead());
  }

  /**
   * Get unread count for a user
   */
  getUnreadCount(userId: string): number {
    return this.getUnreadMessages(userId).length;
  }

  toJSON() {
    return {
      id: this.props.id,
      gigId: this.props.gigId,
      participants: this.props.participants,
      messages: this.props.messages.map(m => m.toJSON()),
      status: this.props.status,
      startedAt: this.props.startedAt.toISOString(),
      lastMessageAt: this.props.lastMessageAt?.toISOString(),
      blockedBy: this.props.blockedBy,
      blockedAt: this.props.blockedAt?.toISOString(),
      archivedBy: this.props.archivedBy,
      archivedAt: this.props.archivedAt?.toISOString()
    };
  }
}