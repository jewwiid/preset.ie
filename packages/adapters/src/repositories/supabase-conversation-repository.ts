import { ConversationRepository } from '@preset/domain/collaboration/ports/ConversationRepository';
import { Conversation } from '@preset/domain/collaboration/entities/Conversation';
import { ConversationStatus } from '@preset/domain/collaboration/value-objects/ConversationStatus';
import { Message } from '@preset/domain/collaboration/entities/Message';
import { MessageBody } from '@preset/domain/collaboration/value-objects/MessageBody';
import { Attachment, AttachmentType } from '@preset/domain/collaboration/value-objects/Attachment';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

type MessageRow = Database['public']['Tables']['messages']['Row'];

export class SupabaseConversationRepository implements ConversationRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Conversation | null> {
    // Since we're using the existing messages table, we need to reconstruct conversations
    // from messages grouped by gig_id
    const { data: messages, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error || !messages || messages.length === 0) {
      return null;
    }

    return this.reconstructConversation(id, messages);
  }

  async findByGigAndParticipants(
    gigId: string,
    participant1: string,
    participant2: string
  ): Promise<Conversation | null> {
    // Find messages between these participants for this gig
    const { data: messages, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('gig_id', gigId)
      .or(`and(from_user_id.eq.${participant1},to_user_id.eq.${participant2}),and(from_user_id.eq.${participant2},to_user_id.eq.${participant1})`)
      .order('created_at', { ascending: true });

    if (error || !messages || messages.length === 0) {
      return null;
    }

    // Use gig_id as conversation_id for existing system
    return this.reconstructConversation(gigId, messages);
  }

  async findByGigId(gigId: string): Promise<Conversation[]> {
    // Get all unique participant pairs for this gig
    const { data: messages, error } = await this.supabase
      .from('messages')
      .select('from_user_id, to_user_id')
      .eq('gig_id', gigId);

    if (error || !messages) {
      return [];
    }

    // Group by unique participant pairs
    const conversationMap = new Map<string, string[]>();
    messages.forEach(msg => {
      const key = [msg.from_user_id, msg.to_user_id].sort().join('-');
      if (!conversationMap.has(key)) {
        conversationMap.set(key, [msg.from_user_id, msg.to_user_id]);
      }
    });

    // Load conversations for each pair
    const conversations: Conversation[] = [];
    for (const [_, participants] of conversationMap) {
      const conv = await this.findByGigAndParticipants(gigId, participants[0], participants[1]);
      if (conv) {
        conversations.push(conv);
      }
    }

    return conversations;
  }

  async findByParticipant(
    participantId: string,
    filters?: { gigId?: string; status?: ConversationStatus; hasUnread?: boolean }
  ): Promise<Conversation[]> {
    let query = this.supabase
      .from('messages')
      .select('*')
      .or(`from_user_id.eq.${participantId},to_user_id.eq.${participantId}`);

    if (filters?.gigId) {
      query = query.eq('gig_id', filters.gigId);
    }

    const { data: messages, error } = await query.order('created_at', { ascending: false });

    if (error || !messages) {
      return [];
    }

    // Group messages by gig and participants
    const conversationGroups = this.groupMessagesIntoConversations(messages, participantId);
    
    return conversationGroups.map(group => 
      this.reconstructConversation(group.id, group.messages)
    );
  }

  async findUnreadForUser(userId: string): Promise<Conversation[]> {
    const { data: messages, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('to_user_id', userId)
      .is('read_at', null);

    if (error || !messages) {
      return [];
    }

    const conversationGroups = this.groupMessagesIntoConversations(messages, userId);
    return conversationGroups.map(group => 
      this.reconstructConversation(group.id, group.messages)
    );
  }

  async countForUser(userId: string, status?: ConversationStatus): Promise<number> {
    const conversations = await this.findByParticipant(userId);
    return conversations.length;
  }

  async countUnreadMessagesForUser(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', userId)
      .is('read_at', null);

    return count || 0;
  }

  async save(conversation: Conversation): Promise<void> {
    // Save messages to the messages table
    const messages = conversation.getMessages();
    
    for (const message of messages) {
      const messageData = {
        id: message.getId(),
        conversation_id: conversation.getId(),
        gig_id: conversation.getGigId(),
        from_user_id: message.getFromUserId(),
        to_user_id: message.getToUserId(),
        body: message.getBody().getValue(),
        attachments: message.getAttachments().map(a => a.toJSON()),
        created_at: message.getSentAt().toISOString(),
        read_at: message.getReadAt()?.toISOString() || null
      };

      const { error } = await this.supabase
        .from('messages')
        .upsert(messageData, {
          onConflict: 'id'
        });

      if (error) {
        throw new Error(`Failed to save message: ${error.message}`);
      }
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  async hasConversation(
    gigId: string,
    user1: string,
    user2: string
  ): Promise<boolean> {
    const conversation = await this.findByGigAndParticipants(gigId, user1, user2);
    return conversation !== null;
  }

  async findRecent(userId: string, limit?: number): Promise<Conversation[]> {
    const conversations = await this.findByParticipant(userId);
    return conversations.slice(0, limit || 10);
  }

  async markAllAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('to_user_id', userId)
      .is('read_at', null);

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  /**
   * Reconstruct a conversation from messages
   */
  private reconstructConversation(id: string, messageRows: MessageRow[]): Conversation {
    if (messageRows.length === 0) {
      throw new Error('Cannot reconstruct conversation without messages');
    }

    const firstMessage = messageRows[0];
    const participants = Array.from(new Set(
      messageRows.flatMap(m => [m.from_user_id, m.to_user_id])
    ));

    // Convert message rows to domain entities
    const messages = messageRows.map(row => new Message({
      id: row.id,
      conversationId: id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      body: new MessageBody(row.body),
      attachments: this.parseAttachments(row.attachments),
      sentAt: new Date(row.created_at),
      readAt: row.read_at ? new Date(row.read_at) : undefined,
      editedAt: row.updated_at ? new Date(row.updated_at) : undefined
    }));

    return new Conversation({
      id,
      gigId: firstMessage.gig_id,
      participants,
      messages,
      status: ConversationStatus.ACTIVE, // Default for existing system
      startedAt: new Date(firstMessage.created_at),
      lastMessageAt: new Date(messageRows[messageRows.length - 1].created_at)
    });
  }

  /**
   * Group messages into conversation groups
   */
  private groupMessagesIntoConversations(
    messages: MessageRow[],
    userId: string
  ): { id: string; messages: MessageRow[] }[] {
    const groups = new Map<string, MessageRow[]>();

    messages.forEach(msg => {
      // Use gig_id + participant pair as key
      const otherUser = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;
      const key = `${msg.gig_id}-${[userId, otherUser].sort().join('-')}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(msg);
    });

    return Array.from(groups.entries()).map(([key, msgs]) => ({
      id: msgs[0].gig_id, // Use gig_id as conversation id
      messages: msgs
    }));
  }

  /**
   * Parse attachments from JSON
   */
  private parseAttachments(attachments: any): Attachment[] {
    if (!attachments || !Array.isArray(attachments)) {
      return [];
    }

    return attachments.map(a => new Attachment(
      a.url,
      a.type as AttachmentType,
      a.size,
      a.filename,
      a.mimeType
    ));
  }
}