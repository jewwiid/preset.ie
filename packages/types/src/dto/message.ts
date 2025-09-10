import { PublicProfileDTO } from './user';

export interface MessageDTO {
  id: string;
  gigId: string;
  from: PublicProfileDTO;
  to: PublicProfileDTO;
  body: string;
  attachments?: MessageAttachmentDTO[];
  readAt?: Date;
  editedAt?: Date;
  createdAt: Date;
}

export interface MessageAttachmentDTO {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnailUrl?: string;
  name?: string;
  size?: number;
}

export interface ConversationDTO {
  id: string;
  gigId: string;
  gigTitle: string;
  participants: PublicProfileDTO[];
  lastMessage?: MessageDTO;
  unreadCount: number;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageCreateDTO {
  gigId: string;
  toUserId: string;
  body: string;
  attachmentIds?: string[];
}

export interface MessageUpdateDTO {
  body?: string;
}

export interface ConversationListItemDTO {
  gigId: string;
  gigTitle: string;
  otherUser: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl?: string;
  };
  lastMessage?: {
    body: string;
    fromUserId: string;
    createdAt: Date;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface MessageNotificationDTO {
  id: string;
  gigId: string;
  gigTitle: string;
  from: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  body: string;
  createdAt: Date;
}