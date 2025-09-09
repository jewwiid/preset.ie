import { MessageBody } from '../value-objects/MessageBody';
import { Attachment } from '../value-objects/Attachment';

export interface MessageProps {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  body: MessageBody;
  attachments: Attachment[];
  sentAt: Date;
  readAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

/**
 * Message entity (not an aggregate root, belongs to Conversation)
 */
export class Message {
  private props: MessageProps;

  constructor(props: MessageProps) {
    this.props = { ...props };
  }

  static create(params: {
    id: string;
    conversationId: string;
    fromUserId: string;
    toUserId: string;
    body: string;
    attachments?: Attachment[];
  }): Message {
    return new Message({
      id: params.id,
      conversationId: params.conversationId,
      fromUserId: params.fromUserId,
      toUserId: params.toUserId,
      body: new MessageBody(params.body),
      attachments: params.attachments || [],
      sentAt: new Date()
    });
  }

  /**
   * Mark message as read
   */
  markAsRead(): void {
    if (!this.props.readAt) {
      this.props.readAt = new Date();
    }
  }

  /**
   * Edit message content
   */
  edit(newBody: string): void {
    if (this.props.deletedAt) {
      throw new Error('Cannot edit deleted message');
    }

    // Check if edit is within allowed time window (e.g., 15 minutes)
    const fifteenMinutes = 15 * 60 * 1000;
    const timeSinceSent = Date.now() - this.props.sentAt.getTime();
    
    if (timeSinceSent > fifteenMinutes) {
      throw new Error('Message can only be edited within 15 minutes of sending');
    }

    this.props.body = new MessageBody(newBody);
    this.props.editedAt = new Date();
  }

  /**
   * Soft delete message
   */
  delete(): void {
    if (this.props.deletedAt) {
      throw new Error('Message is already deleted');
    }
    this.props.deletedAt = new Date();
  }

  // Getters
  getId(): string {
    return this.props.id;
  }

  getConversationId(): string {
    return this.props.conversationId;
  }

  getFromUserId(): string {
    return this.props.fromUserId;
  }

  getToUserId(): string {
    return this.props.toUserId;
  }

  getBody(): MessageBody {
    return this.props.body;
  }

  getAttachments(): Attachment[] {
    return [...this.props.attachments];
  }

  getSentAt(): Date {
    return new Date(this.props.sentAt);
  }

  getReadAt(): Date | undefined {
    return this.props.readAt ? new Date(this.props.readAt) : undefined;
  }

  getEditedAt(): Date | undefined {
    return this.props.editedAt ? new Date(this.props.editedAt) : undefined;
  }

  getDeletedAt(): Date | undefined {
    return this.props.deletedAt ? new Date(this.props.deletedAt) : undefined;
  }

  isRead(): boolean {
    return !!this.props.readAt;
  }

  isEdited(): boolean {
    return !!this.props.editedAt;
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  hasAttachments(): boolean {
    return this.props.attachments.length > 0;
  }

  /**
   * Check if message is from a specific user
   */
  isFrom(userId: string): boolean {
    return this.props.fromUserId === userId;
  }

  /**
   * Check if message is to a specific user
   */
  isTo(userId: string): boolean {
    return this.props.toUserId === userId;
  }

  toJSON() {
    return {
      id: this.props.id,
      conversationId: this.props.conversationId,
      fromUserId: this.props.fromUserId,
      toUserId: this.props.toUserId,
      body: this.props.body.getValue(),
      attachments: this.props.attachments.map(a => a.toJSON()),
      sentAt: this.props.sentAt.toISOString(),
      readAt: this.props.readAt?.toISOString(),
      editedAt: this.props.editedAt?.toISOString(),
      deletedAt: this.props.deletedAt?.toISOString()
    };
  }
}