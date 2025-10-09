/**
 * Test All Email Events
 * 
 * Comprehensive test endpoint for all email types
 * 
 * Usage:
 *   POST /api/test-all-emails
 *   Body: { "email": "your@email.com", "testType": "all" | "event-name" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEmailEventsService } from '@/lib/services/emails';

export async function POST(request: NextRequest) {
  try {
    const { email, testType = 'all' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailEvents = getEmailEventsService();
    const results: Record<string, any> = {};

    // ============================================
    // 1. ONBOARDING
    // ============================================

    if (testType === 'all' || testType === 'onboarding') {
      try {
        await emailEvents.sendWelcomeEmail('test-user-id', email, 'Test User', 'CONTRIBUTOR');
        results.welcomeEmail = { status: 'sent', event: 'user.signup' };
      } catch (error) {
        results.welcomeEmail = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendEmailVerification('test-user-id', email, `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=test`);
        results.emailVerification = { status: 'sent', event: 'email.verification.sent' };
      } catch (error) {
        results.emailVerification = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendProfileCompletionReminder('test-user-id', email, 'Test User', 65);
        results.profileCompletion = { status: 'sent', event: 'profile.completion.reminder' };
      } catch (error) {
        results.profileCompletion = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    // ============================================
    // 2. GIG LIFECYCLE
    // ============================================

    if (testType === 'all' || testType === 'gigs') {
      const testGig = {
        id: 'test-gig-123',
        title: 'Fashion Editorial Shoot',
        location: 'Dublin City Centre',
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        compType: 'TFP (Time for Print)',
      };

      try {
        await emailEvents.sendGigDraftSaved('test-user-id', email, testGig.title, testGig.id);
        results.gigDraft = { status: 'sent', event: 'gig.draft.saved' };
      } catch (error) {
        results.gigDraft = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendGigPublished('test-user-id', email, testGig);
        results.gigPublished = { status: 'sent', event: 'gig.published' };
      } catch (error) {
        results.gigPublished = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendNewApplicationNotification(
          'test-user-id',
          email,
          testGig.title,
          'Jane Doe',
          'test-applicant-123',
          `${process.env.NEXT_PUBLIC_APP_URL}/gigs/${testGig.id}/applications`
        );
        results.newApplication = { status: 'sent', event: 'gig.application.received' };
      } catch (error) {
        results.newApplication = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendDeadlineApproaching('test-user-id', email, testGig.title, testGig.id, 5, 24);
        results.deadlineApproaching = { status: 'sent', event: 'gig.deadline.approaching' };
      } catch (error) {
        results.deadlineApproaching = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    // ============================================
    // 3. APPLICATIONS
    // ============================================

    if (testType === 'all' || testType === 'applications') {
      try {
        await emailEvents.sendApplicationSubmittedConfirmation(
          'test-user-id',
          email,
          'Urban Street Photography',
          'John Smith',
          `${process.env.NEXT_PUBLIC_APP_URL}/gigs/test-123`
        );
        results.applicationSubmitted = { status: 'sent', event: 'application.submitted' };
      } catch (error) {
        results.applicationSubmitted = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendApplicationShortlisted('test-user-id', email, 'Urban Street Photography', 'John Smith');
        results.applicationShortlisted = { status: 'sent', event: 'application.shortlisted' };
      } catch (error) {
        results.applicationShortlisted = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendApplicationAccepted(
          'test-user-id',
          email,
          'Test User',
          {
            id: 'test-123',
            title: 'Urban Street Photography',
            location: 'Dublin City Centre',
            startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
            compType: 'TFP'
          },
          'John Smith'
        );
        results.applicationAccepted = { status: 'sent', event: 'application.accepted' };
      } catch (error) {
        results.applicationAccepted = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendApplicationLimitWarning('test-user-id', email, 2, 3, 'FREE');
        results.applicationLimitWarning = { status: 'sent', event: 'application.limit.approaching' };
      } catch (error) {
        results.applicationLimitWarning = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    // ============================================
    // 4. SUBSCRIPTIONS
    // ============================================

    if (testType === 'all' || testType === 'subscriptions') {
      try {
        await emailEvents.sendSubscriptionUpgraded(email, 'FREE', 'PLUS');
        results.subscriptionUpgraded = { status: 'sent', event: 'subscription.upgraded' };
      } catch (error) {
        results.subscriptionUpgraded = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendTrialStarted(email, 'PLUS', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString());
        results.trialStarted = { status: 'sent', event: 'subscription.trial.started' };
      } catch (error) {
        results.trialStarted = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendSubscriptionRenewalReminder(email, 'PLUS', 3, '€12');
        results.renewalReminder = { status: 'sent', event: 'subscription.expiring.soon' };
      } catch (error) {
        results.renewalReminder = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    // ============================================
    // 5. CREDITS
    // ============================================

    if (testType === 'all' || testType === 'credits') {
      try {
        await emailEvents.sendCreditsPurchased(email, 100, 1999, 'txn_test_123');
        results.creditsPurchased = { status: 'sent', event: 'credits.purchased' };
      } catch (error) {
        results.creditsPurchased = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendCreditsLow(email, 15, 'PLUS');
        results.creditsLow = { status: 'sent', event: 'credits.low' };
      } catch (error) {
        results.creditsLow = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    // ============================================
    // 6. ENGAGEMENT
    // ============================================

    if (testType === 'all' || testType === 'engagement') {
      try {
        await emailEvents.sendInactiveUserEmail(email, 'Test User', 7);
        results.inactive7days = { status: 'sent', event: 'user.inactive.7days' };
      } catch (error) {
        results.inactive7days = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendMilestoneEmail(email, 'Test User', 'first.gig.created', 1);
        results.milestoneFirstGig = { status: 'sent', event: 'milestone.first.gig.created' };
      } catch (error) {
        results.milestoneFirstGig = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    // ============================================
    // 7. MESSAGING & REVIEWS
    // ============================================

    if (testType === 'all' || testType === 'messaging') {
      try {
        await emailEvents.sendNewMessageNotification(
          email,
          'John Smith',
          'Hey, are you available for...', 
          'Urban Street Photography',
          `${process.env.NEXT_PUBLIC_APP_URL}/messages/test-123`
        );
        results.newMessage = { status: 'sent', event: 'message.received' };
      } catch (error) {
        results.newMessage = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }

      try {
        await emailEvents.sendReviewRequest(
          email,
          'John Smith',
          'Urban Street Photography',
          `${process.env.NEXT_PUBLIC_APP_URL}/reviews/test-123`
        );
        results.reviewRequest = { status: 'sent', event: 'review.requested' };
      } catch (error) {
        results.reviewRequest = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    // ============================================
    // 8. MARKETPLACE
    // ============================================

    if (testType === 'all' || testType === 'marketplace') {
      try {
        await emailEvents.sendPresetPurchased(
          email,
          'Vintage Film Preset',
          `${process.env.NEXT_PUBLIC_APP_URL}/downloads/test-123`
        );
        results.presetPurchased = { status: 'sent', event: 'preset.purchased' };
      } catch (error) {
        results.presetPurchased = { status: 'failed', error: error instanceof Error ? error.message : 'Unknown' };
      }
    }

    // Count successes
    const total = Object.keys(results).length;
    const successful = Object.values(results).filter((r: any) => r.status === 'sent').length;
    const failed = total - successful;

    return NextResponse.json({
      success: true,
      message: `Email test completed: ${successful}/${total} sent successfully`,
      testEmail: email,
      testType,
      summary: {
        total,
        successful,
        failed,
      },
      results,
      nextSteps: [
        `Check inbox at ${email}`,
        'Review Plunk dashboard at https://app.useplunk.com',
        'Verify events are being tracked',
        'Check email rendering in different clients',
      ],
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email Events Test Endpoint',
    availableTests: [
      'all - Test all email types',
      'onboarding - Welcome, verification, profile',
      'gigs - Gig lifecycle emails',
      'applications - Application status emails',
      'subscriptions - Subscription management',
      'credits - Credit system emails',
      'engagement - Inactive users, milestones',
      'messaging - Messages and reviews',
      'marketplace - Rentals and presets',
    ],
    usage: {
      testAll: `curl -X POST http://localhost:3000/api/test-all-emails -H "Content-Type: application/json" -d '{"email":"test@example.com","testType":"all"}'`,
      testOnboarding: `curl -X POST http://localhost:3000/api/test-all-emails -H "Content-Type: application/json" -d '{"email":"test@example.com","testType":"onboarding"}'`,
    },
  });
}

