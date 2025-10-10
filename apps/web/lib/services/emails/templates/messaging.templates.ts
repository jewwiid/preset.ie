/**
 * Messaging Email Templates
 * New messages, replies, unread digests
 */

import { getEmailTemplate } from './shared.templates';

export function getNewMessageTemplate(
  recipientName: string,
  senderName: string,
  messagePreview: string,
  gigTitle: string,
  messageUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">New Message</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">You have a new message from ${senderName}</p>
    </div>

    <div style="background-color: #f9fafb; border-left: 4px solid #00876f; padding: 20px; margin: 30px 0; border-radius: 8px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Regarding Gig</p>
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">${gigTitle}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">From: ${senderName}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 10px 0 0 0; font-style: italic;">"${messagePreview}"</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${messageUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reply to Message
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💡 Tip:</strong> Respond quickly to build strong collaborations!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getUnreadMessagesDigestTemplate(
  recipientName: string,
  unreadCount: number,
  conversations: Array<{
    senderName: string;
    gigTitle: string;
    lastMessage: string;
    url: string;
  }>,
  userEmail?: string,
  userId?: string
): string {
  const conversationsList = conversations.slice(0, 5).map(conv => `
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div>
          <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 5px 0;">${conv.senderName}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">${conv.gigTitle}</p>
        </div>
      </div>
      <p style="color: #4b5563; font-size: 14px; margin: 10px 0; font-style: italic;">"${conv.lastMessage}"</p>
      <a href="${conv.url}" style="color: #00876f; text-decoration: none; font-weight: 600; font-size: 14px;">Reply →</a>
    </div>
  `).join('');

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Unread Messages</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">You have ${unreadCount} unread conversation${unreadCount > 1 ? 's' : ''}</p>
    </div>

    <div style="margin: 30px 0;">
      ${conversationsList}
    </div>

    ${conversations.length > 5 ? `
      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        And ${conversations.length - 5} more unread conversation${conversations.length - 5 > 1 ? 's' : ''}
      </p>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/messages" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View All Messages
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getMessageThreadUpdateTemplate(
  recipientName: string,
  senderName: string,
  gigTitle: string,
  updateType: 'new_message' | 'status_change',
  messageUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const updateMessages = {
    new_message: 'replied to your message',
    status_change: 'updated the conversation status'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Thread Update</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${senderName} ${updateMessages[updateType]}</p>
    </div>

    <div style="background-color: #f9fafb; border-left: 4px solid #00876f; padding: 20px; margin: 30px 0; border-radius: 8px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Regarding Gig</p>
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0;">${gigTitle}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${messageUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Conversation
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

