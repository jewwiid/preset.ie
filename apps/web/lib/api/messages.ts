/**
 * API client for messaging functionality
 */

// Types for API responses
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
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
  startedAt: string;
  lastMessageAt?: string;
}

export interface GetConversationsResponse {
  conversations: ConversationDTO[];
  total: number;
  totalUnread: number;
}

export interface MessageDTO {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  attachments: AttachmentDTO[];
  sentAt: string;
  readAt?: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface AttachmentDTO {
  url: string;
  type: string;
  size: number;
  filename: string;
  mimeType: string;
}

export interface ConversationDetailsDTO {
  id: string;
  gigId: string;
  participants: string[];
  messages: MessageDTO[];
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
  startedAt: string;
  lastMessageAt?: string;
  blockedBy?: string[];
  blockedAt?: string;
}

export interface SendMessageRequest {
  gigId: string;
  toUserId: string;
  body: string;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    conversationId: string;
    messageId: string;
    sentAt: string;
  };
}

// API client class
export class MessagesApi {
  private baseUrl: string;
  private getAuthToken: () => Promise<string>;

  constructor(baseUrl: string = '', getAuthToken: () => Promise<string>) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's conversations with optional filtering
   */
  async getConversations(params?: {
    gigId?: string;
    status?: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
    hasUnread?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<GetConversationsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.gigId) searchParams.set('gigId', params.gigId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.hasUnread !== undefined) searchParams.set('hasUnread', params.hasUnread.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/api/messages/conversations${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<GetConversationsResponse>(endpoint);
  }

  /**
   * Get detailed conversation with all messages
   */
  async getConversation(conversationId: string): Promise<{ success: boolean; data: ConversationDetailsDTO }> {
    return this.makeRequest<{ success: boolean; data: ConversationDetailsDTO }>(
      `/api/messages/${conversationId}`
    );
  }

  /**
   * Send a new message
   */
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    return this.makeRequest<SendMessageResponse>('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<{
    success: boolean;
    message: string;
    conversationId: string;
    markedAt: string;
  }> {
    return this.makeRequest<{
      success: boolean;
      message: string;
      conversationId: string;
      markedAt: string;
    }>(`/api/messages/${conversationId}/read`, {
      method: 'PATCH',
    });
  }

  /**
   * Update conversation status (archive, block, unblock)
   */
  async updateConversation(
    conversationId: string, 
    action: 'archive' | 'block' | 'unblock'
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(
      `/api/messages/${conversationId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }
    );
  }
}

/**
 * Hook for using the messages API with Supabase auth
 */
export function useMessagesApi() {
  const getAuthToken = async (): Promise<string> => {
    // Import the existing Supabase client to ensure session consistency
    const { supabase } = await import('../supabase');
    
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    return session.access_token;
  };

  return new MessagesApi('', getAuthToken);
}

/**
 * Factory function to create messages API with custom auth
 */
export function createMessagesApi(
  baseUrl: string = '',
  getAuthToken: () => Promise<string>
): MessagesApi {
  return new MessagesApi(baseUrl, getAuthToken);
}