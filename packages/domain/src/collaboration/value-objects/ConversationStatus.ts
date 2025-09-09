/**
 * Status of a conversation
 */
export enum ConversationStatus {
  ACTIVE = 'active',       // Normal conversation
  BLOCKED = 'blocked',     // One party has blocked the other
  ARCHIVED = 'archived',   // Conversation is archived
  CLOSED = 'closed'        // Gig completed, conversation closed
}

/**
 * Check if messages can be sent in this conversation
 */
export function canSendMessage(status: ConversationStatus): boolean {
  return status === ConversationStatus.ACTIVE;
}

/**
 * Check if conversation is visible to participants
 */
export function isVisible(status: ConversationStatus): boolean {
  return status !== ConversationStatus.ARCHIVED;
}