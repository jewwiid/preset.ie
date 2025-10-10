/**
 * Messaging Email Events
 * New messages, unread digests, thread updates
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class MessagingEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * OPTIONAL EMAIL - Respects message notification preferences
   */
  async sendNewMessageNotification(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
    gigTitle: string,
    messageUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'message');
    
    if (!shouldSend) {
      console.log(`New message notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `New message from ${senderName}`,
      body: templates.getNewMessageTemplate(
        recipientName,
        senderName,
        messagePreview,
        gigTitle,
        messageUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'message.new',
      email: recipientEmail,
      data: { senderName, gigTitle, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects message notification preferences
   * Sent as a digest of unread messages
   */
  async sendUnreadMessagesDigest(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    unreadCount: number,
    conversations: Array<{
      senderName: string;
      gigTitle: string;
      lastMessage: string;
      url: string;
    }>
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'message');
    
    if (!shouldSend) {
      console.log(`Unread digest skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
      body: templates.getUnreadMessagesDigestTemplate(
        recipientName,
        unreadCount,
        conversations,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'message.digest',
      email: recipientEmail,
      data: { unreadCount, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects message notification preferences
   */
  async sendMessageThreadUpdate(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    gigTitle: string,
    updateType: 'new_message' | 'status_change',
    messageUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'message');
    
    if (!shouldSend) {
      console.log(`Thread update notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Thread update: ${gigTitle}`,
      body: templates.getMessageThreadUpdateTemplate(
        recipientName,
        senderName,
        gigTitle,
        updateType,
        messageUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'message.thread.update',
      email: recipientEmail,
      data: { senderName, gigTitle, updateType, authUserId }
    });
  }
}

