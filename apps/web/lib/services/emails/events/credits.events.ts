/**
 * Credits & Billing Email Events
 * Purchases, low balance, resets
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class CreditsEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * CRITICAL EMAIL - Purchase confirmation (always sent)
   * Legal/transactional requirement
   */
  async sendCreditsPurchased(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    creditsAdded: number,
    amountPaid: number,
    newBalance: number,
    transactionId: string
  ) {
    // ALWAYS SEND - This is a purchase receipt (legal requirement)
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Credits purchased - ${creditsAdded} credits added`,
      body: templates.getCreditsPurchasedTemplate(
        recipientName,
        creditsAdded,
        amountPaid,
        newBalance,
        transactionId,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'credits.purchased',
      email: recipientEmail,
      data: { creditsAdded, amountPaid, transactionId, authUserId, critical: true }
    });
  }

  /**
   * IMPORTANT EMAIL - Low balance warning (always sent)
   * Users need to know when running low
   */
  async sendCreditsLowWarning(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    currentBalance: number,
    tier: string,
    topUpUrl: string
  ) {
    // Check system preferences (but this is important, so only skip if explicitly disabled)
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'system');
    
    if (!shouldSend) {
      console.log(`Credits low warning skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: 'Your credits are running low',
      body: templates.getCreditsLowTemplate(
        recipientName,
        currentBalance,
        tier,
        topUpUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'credits.low',
      email: recipientEmail,
      data: { currentBalance, tier, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Monthly reset notification
   * Respects system notification preferences
   */
  async sendCreditsReset(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    creditsAdded: number,
    newBalance: number,
    tier: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'system');
    
    if (!shouldSend) {
      console.log(`Credits reset notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: 'Your monthly credits have been refreshed!',
      body: templates.getCreditsResetTemplate(
        recipientName,
        creditsAdded,
        newBalance,
        tier,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'credits.reset',
      email: recipientEmail,
      data: { creditsAdded, newBalance, tier, authUserId }
    });
  }
}

