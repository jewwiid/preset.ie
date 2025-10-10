/**
 * Marketplace Email Events
 * Preset sales, purchases, listings
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class MarketplaceEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * CRITICAL EMAIL - Purchase confirmation (always sent)
   * Legal/transactional requirement
   */
  async sendPresetPurchased(
    authUserId: string,
    buyerEmail: string,
    buyerName: string,
    presetName: string,
    downloadUrl: string
  ) {
    // ALWAYS SEND - This is a purchase receipt (legal requirement)
    await this.plunk.sendTransactionalEmail({
      to: buyerEmail,
      subject: `Preset ready to download: ${presetName}`,
      body: templates.getPresetPurchasedTemplate(
        buyerName,
        presetName,
        downloadUrl,
        buyerEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'preset.purchased',
      email: buyerEmail,
      data: { presetName, authUserId, critical: true }
    });
  }

  /**
   * IMPORTANT EMAIL - Sale notification (always sent)
   * Sellers need to know about their sales
   */
  async sendPresetSold(
    authUserId: string,
    sellerEmail: string,
    sellerName: string,
    presetName: string,
    buyerName: string,
    salePrice: number,
    salesUrl: string
  ) {
    // ALWAYS SEND - Sellers should always know about sales
    await this.plunk.sendTransactionalEmail({
      to: sellerEmail,
      subject: `You made a sale! ${presetName}`,
      body: templates.getPresetSoldTemplate(
        sellerName,
        presetName,
        buyerName,
        salePrice,
        salesUrl,
        sellerEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'preset.sold',
      email: sellerEmail,
      data: { presetName, buyerName, salePrice, authUserId, critical: true }
    });
  }

  /**
   * IMPORTANT EMAIL - Listing approved (always sent)
   * Sellers need to know when their listing goes live
   */
  async sendPresetListingApproved(
    authUserId: string,
    sellerEmail: string,
    sellerName: string,
    presetName: string,
    listingUrl: string
  ) {
    // ALWAYS SEND - Important status change
    await this.plunk.sendTransactionalEmail({
      to: sellerEmail,
      subject: `Your listing was approved: ${presetName}`,
      body: templates.getPresetListingApprovedTemplate(
        sellerName,
        presetName,
        listingUrl,
        sellerEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'preset.listing.approved',
      email: sellerEmail,
      data: { presetName, authUserId, critical: true }
    });
  }

  /**
   * IMPORTANT EMAIL - Listing rejected (always sent)
   * Sellers need to know why their listing was rejected
   */
  async sendPresetListingRejected(
    authUserId: string,
    sellerEmail: string,
    sellerName: string,
    presetName: string,
    reason: string,
    guidelinesUrl: string
  ) {
    // ALWAYS SEND - Important feedback for seller
    await this.plunk.sendTransactionalEmail({
      to: sellerEmail,
      subject: `Action needed: ${presetName} listing`,
      body: templates.getPresetListingRejectedTemplate(
        sellerName,
        presetName,
        reason,
        guidelinesUrl,
        sellerEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'preset.listing.rejected',
      email: sellerEmail,
      data: { presetName, reason, authUserId, critical: true }
    });
  }

  /**
   * OPTIONAL EMAIL - Sales milestone (respects system preferences)
   */
  async sendSalesMilestone(
    authUserId: string,
    sellerEmail: string,
    sellerName: string,
    milestone: number,
    totalEarnings: number
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'system');
    
    if (!shouldSend) {
      console.log(`Sales milestone notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: sellerEmail,
      subject: `Milestone achieved: ${milestone} sales! 🎉`,
      body: templates.getSalesMilestoneTemplate(
        sellerName,
        milestone,
        totalEarnings,
        sellerEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'preset.sales.milestone',
      email: sellerEmail,
      data: { milestone, totalEarnings, authUserId }
    });
  }
}

