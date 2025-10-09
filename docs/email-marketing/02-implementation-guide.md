# 🔧 Email Events Implementation Guide

Complete implementation guide for integrating Plunk email events throughout the Presetie.com platform.

---

## 📁 File Structure

```
apps/web/
├── lib/
│   └── services/
│       └── email-events.service.ts     # Central email events service
│
├── app/
│   └── api/
│       ├── auth/signup/route.ts        # User signup
│       ├── gigs/route.ts               # Gig creation
│       ├── applications/route.ts        # Applications
│       └── ...
```

---

## 1️⃣ Central Email Events Service

Create a centralized service to handle all email events:

```typescript
// apps/web/lib/services/email-events.service.ts

import { getEmailService } from './email-service';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

export class EmailEventsService {
  private emailService = getEmailService();
  private plunk = getPlunkService();

  // ============================================
  // 1. USER ONBOARDING
  // ============================================

  async trackUserSignup(
    email: string,
    name: string,
    role: 'CONTRIBUTOR' | 'TALENT' | 'BOTH',
    subscriptionTier: string
  ) {
    // Track event for automation
    await this.plunk.trackEvent({
      event: 'user.signup',
      email,
      data: {
        name,
        role,
        subscriptionTier,
        signupDate: new Date().toISOString(),
        source: 'web',
      },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(email, name);
  }

  async sendGettingStartedEmail(email: string, role: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your Preset Quick Start Guide 📸',
      body: this.getGettingStartedTemplate(role),
    });

    await this.plunk.trackEvent({
      event: 'email.getting.started.sent',
      email,
      data: { role },
    });
  }

  // ============================================
  // 2. GIG LIFECYCLE
  // ============================================

  async trackGigCreated(
    contributorEmail: string,
    gigId: string,
    gigTitle: string
  ) {
    await this.plunk.trackEvent({
      event: 'gig.created',
      email: contributorEmail,
      data: {
        gigId,
        gigTitle,
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: contributorEmail,
      subject: 'Your gig is saved as a draft',
      body: this.getGigDraftTemplate(gigTitle, gigId),
    });
  }

  async trackGigPublished(
    contributorEmail: string,
    gigId: string,
    gigTitle: string,
    gigDetails: any
  ) {
    await this.plunk.trackEvent({
      event: 'gig.published',
      email: contributorEmail,
      data: {
        gigId,
        gigTitle,
        compensationType: gigDetails.compType,
        location: gigDetails.location,
        publishedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: contributorEmail,
      subject: `Your gig "${gigTitle}" is now live! 🚀`,
      body: this.getGigPublishedTemplate(gigTitle, gigId, gigDetails),
    });
  }

  async notifyNewApplication(
    contributorEmail: string,
    gigTitle: string,
    applicantName: string,
    applicantId: string,
    applicationId: string
  ) {
    await this.plunk.trackEvent({
      event: 'gig.application.received',
      email: contributorEmail,
      data: {
        gigTitle,
        applicantName,
        applicantId,
        applicationId,
        receivedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: contributorEmail,
      subject: `New application for "${gigTitle}"`,
      body: this.getNewApplicationTemplate(gigTitle, applicantName, applicationId),
    });
  }

  async notifyGigDeadlineApproaching(
    contributorEmail: string,
    gigTitle: string,
    gigId: string,
    applicantCount: number
  ) {
    await this.plunk.trackEvent({
      event: 'gig.deadline.approaching',
      email: contributorEmail,
      data: {
        gigTitle,
        gigId,
        applicantCount,
        hoursRemaining: 24,
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: contributorEmail,
      subject: `Application deadline approaching for "${gigTitle}"`,
      body: this.getDeadlineApproachingTemplate(gigTitle, gigId, applicantCount),
    });
  }

  async notifyTalentBooked(
    talentEmail: string,
    contributorName: string,
    gigTitle: string,
    gigDetails: any
  ) {
    await this.plunk.trackEvent({
      event: 'gig.talent.booked',
      email: talentEmail,
      data: {
        contributorName,
        gigTitle,
        shootDate: gigDetails.startTime,
        location: gigDetails.location,
        bookedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: talentEmail,
      subject: `Congratulations! You're booked for "${gigTitle}"! 🎉`,
      body: this.getBookingConfirmationTemplate(contributorName, gigTitle, gigDetails),
    });
  }

  // ============================================
  // 3. APPLICATION LIFECYCLE
  // ============================================

  async trackApplicationSubmitted(
    talentEmail: string,
    gigTitle: string,
    contributorName: string,
    applicationId: string
  ) {
    await this.plunk.trackEvent({
      event: 'application.submitted',
      email: talentEmail,
      data: {
        gigTitle,
        contributorName,
        applicationId,
        submittedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: talentEmail,
      subject: `Application sent to ${contributorName}! 🎬`,
      body: this.getApplicationSubmittedTemplate(gigTitle, contributorName),
    });
  }

  async notifyApplicationShortlisted(
    talentEmail: string,
    gigTitle: string,
    contributorName: string
  ) {
    await this.plunk.trackEvent({
      event: 'application.shortlisted',
      email: talentEmail,
      data: {
        gigTitle,
        contributorName,
        shortlistedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: talentEmail,
      subject: `You've been shortlisted! 🌟`,
      body: this.getShortlistedTemplate(gigTitle, contributorName),
    });
  }

  async notifyApplicationAccepted(
    talentEmail: string,
    talentName: string,
    gigTitle: string,
    gigDetails: any
  ) {
    await this.plunk.trackEvent({
      event: 'application.accepted',
      email: talentEmail,
      data: {
        gigTitle,
        acceptedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: talentEmail,
      subject: `Congratulations! You're booked for "${gigTitle}"! 🎉`,
      body: this.getBookingConfirmationTemplate(talentName, gigTitle, gigDetails),
    });
  }

  async notifyApplicationDeclined(
    talentEmail: string,
    gigTitle: string,
    recommendedGigs: any[]
  ) {
    await this.plunk.trackEvent({
      event: 'application.declined',
      email: talentEmail,
      data: {
        gigTitle,
        declinedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: talentEmail,
      subject: 'Update on your application',
      body: this.getApplicationDeclinedTemplate(gigTitle, recommendedGigs),
    });
  }

  // ============================================
  // 4. SUBSCRIPTION & MONETIZATION
  // ============================================

  async trackSubscriptionUpgraded(
    email: string,
    oldTier: string,
    newTier: string
  ) {
    await this.plunk.trackEvent({
      event: 'subscription.upgraded',
      email,
      data: {
        oldTier,
        newTier,
        upgradedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Welcome to ${newTier}! 🚀`,
      body: this.getSubscriptionUpgradedTemplate(newTier),
    });
  }

  async notifySubscriptionExpiring(
    email: string,
    tier: string,
    daysRemaining: number
  ) {
    await this.plunk.trackEvent({
      event: 'subscription.expiring.soon',
      email,
      data: {
        tier,
        daysRemaining,
        expiryDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    const subject = daysRemaining === 1
      ? 'Your subscription renews tomorrow'
      : `Your subscription renews in ${daysRemaining} days`;

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject,
      body: this.getSubscriptionRenewalTemplate(tier, daysRemaining),
    });
  }

  async trackCreditsPurchased(
    email: string,
    credits: number,
    amount: number
  ) {
    await this.plunk.trackPurchase(email, {
      credits,
      amount,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    });

    await this.emailService.sendCreditPurchaseConfirmation(
      email,
      credits,
      amount
    );
  }

  // ============================================
  // 5. MESSAGING
  // ============================================

  async notifyNewMessage(
    recipientEmail: string,
    senderName: string,
    messagePreview: string,
    gigTitle: string,
    messageUrl: string
  ) {
    await this.plunk.trackEvent({
      event: 'message.received',
      email: recipientEmail,
      data: {
        senderName,
        gigTitle,
        receivedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `New message from ${senderName}`,
      body: this.getNewMessageTemplate(senderName, messagePreview, gigTitle, messageUrl),
    });
  }

  // ============================================
  // 6. REVIEWS & RATINGS
  // ============================================

  async requestReview(
    email: string,
    collaboratorName: string,
    gigTitle: string,
    reviewUrl: string
  ) {
    await this.plunk.trackEvent({
      event: 'review.requested',
      email,
      data: {
        collaboratorName,
        gigTitle,
        requestedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `How was your experience with ${collaboratorName}?`,
      body: this.getReviewRequestTemplate(collaboratorName, gigTitle, reviewUrl),
    });
  }

  async notifyReviewReceived(
    email: string,
    reviewerName: string,
    rating: number,
    reviewText: string
  ) {
    await this.plunk.trackEvent({
      event: 'review.received',
      email,
      data: {
        reviewerName,
        rating,
        receivedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `You received a new review! ⭐`,
      body: this.getReviewReceivedTemplate(reviewerName, rating, reviewText),
    });
  }

  // ============================================
  // 7. ENGAGEMENT & RETENTION
  // ============================================

  async sendInactiveUserEmail(
    email: string,
    name: string,
    daysInactive: number
  ) {
    const eventName = daysInactive <= 7 
      ? 'user.inactive.7days'
      : daysInactive <= 30
      ? 'user.inactive.30days'
      : 'user.inactive.90days';

    await this.plunk.trackEvent({
      event: eventName,
      email,
      data: {
        daysInactive,
        lastActive: new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: this.getInactiveUserSubject(daysInactive),
      body: this.getInactiveUserTemplate(name, daysInactive),
    });
  }

  async celebrateMilestone(
    email: string,
    name: string,
    milestone: string,
    count: number
  ) {
    await this.plunk.trackEvent({
      event: `milestone.${milestone}`,
      email,
      data: {
        milestone,
        count,
        achievedAt: new Date().toISOString(),
      },
    });

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: this.getMilestoneSubject(milestone, count),
      body: this.getMilestoneTemplate(name, milestone, count),
    });
  }

  // ============================================
  // TEMPLATE HELPERS (Implement these)
  // ============================================

  private getGettingStartedTemplate(role: string): string {
    // Return HTML template
    return `<!-- Getting started email template -->`;
  }

  private getGigDraftTemplate(gigTitle: string, gigId: string): string {
    return `<!-- Gig draft template -->`;
  }

  // ... Add more template methods

  private getInactiveUserSubject(days: number): string {
    if (days <= 7) return "We miss you! Come back to Preset 🎬";
    if (days <= 30) return "Your creative community is waiting";
    return "Last chance - Your account will be archived";
  }

  private getMilestoneSubject(milestone: string, count: number): string {
    const subjects = {
      'first.gig.created': 'Congratulations on your first gig! 🎉',
      'first.application.sent': 'Your first application is out there! 🌟',
      'first.booking': 'Your first booking! This is huge! 🎊',
      'completed.gigs': `You've completed ${count} gigs! 💪`,
    };
    return subjects[milestone] || 'Milestone achieved!';
  }
}

// Singleton instance
let emailEventsServiceInstance: EmailEventsService | null = null;

export function getEmailEventsService(): EmailEventsService {
  if (!emailEventsServiceInstance) {
    emailEventsServiceInstance = new EmailEventsService();
  }
  return emailEventsServiceInstance;
}
```

---

## 2️⃣ Integration Examples

### A. User Signup

```typescript
// apps/web/app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/email-events.service';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();
    
    const supabase = createClient();
    
    // Create user in Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (error) throw error;

    // Track signup and send welcome email
    const emailEvents = getEmailEventsService();
    await emailEvents.trackUserSignup(email, name, role, 'FREE');

    // Schedule getting started email (2 hours later via Plunk automation)
    // This will be handled by Plunk automation based on user.signup event

    return NextResponse.json({
      success: true,
      message: 'Account created! Check your email.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### B. Gig Creation & Publishing

```typescript
// apps/web/app/api/gigs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/email-events.service';

export async function POST(request: NextRequest) {
  try {
    const gigData = await request.json();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user email
    const { data: profile } = await supabase
      .from('users_profile')
      .select('email, display_name')
      .eq('user_id', user.id)
      .single();

    // Create gig
    const { data: gig, error } = await supabase
      .from('gigs')
      .insert({
        ...gigData,
        owner_user_id: user.id,
        status: gigData.publish ? 'PUBLISHED' : 'DRAFT',
      })
      .select()
      .single();

    if (error) throw error;

    const emailEvents = getEmailEventsService();

    if (gigData.publish) {
      // Gig published - send notification
      await emailEvents.trackGigPublished(
        user.email,
        gig.id,
        gig.title,
        gig
      );
    } else {
      // Gig saved as draft
      await emailEvents.trackGigCreated(
        user.email,
        gig.id,
        gig.title
      );
    }

    return NextResponse.json({ success: true, gig });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### C. Application Submission

```typescript
// apps/web/app/api/applications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/email-events.service';

export async function POST(request: NextRequest) {
  try {
    const { gigId, note } = await request.json();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get gig and contributor details
    const { data: gig } = await supabase
      .from('gigs')
      .select(`
        *,
        contributor:users_profile!owner_user_id(email, display_name)
      `)
      .eq('id', gigId)
      .single();

    // Get applicant details
    const { data: applicant } = await supabase
      .from('users_profile')
      .select('email, display_name')
      .eq('user_id', user.id)
      .single();

    // Create application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        gig_id: gigId,
        applicant_user_id: user.id,
        note,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;

    const emailEvents = getEmailEventsService();

    // Notify talent (applicant) - confirmation
    await emailEvents.trackApplicationSubmitted(
      applicant.email,
      gig.title,
      gig.contributor.display_name,
      application.id
    );

    // Notify contributor - new application
    await emailEvents.notifyNewApplication(
      gig.contributor.email,
      gig.title,
      applicant.display_name,
      user.id,
      application.id
    );

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### D. Booking Talent

```typescript
// apps/web/app/api/applications/[id]/accept/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/email-events.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get application with gig and talent details
    const { data: application } = await supabase
      .from('applications')
      .select(`
        *,
        gig:gigs(*),
        talent:users_profile!applicant_user_id(email, display_name),
        contributor:users_profile!gigs(owner_user_id)(email, display_name)
      `)
      .eq('id', params.id)
      .single();

    // Update application status
    await supabase
      .from('applications')
      .update({ status: 'ACCEPTED' })
      .eq('id', params.id);

    // Update gig status to BOOKED
    await supabase
      .from('gigs')
      .update({ status: 'BOOKED' })
      .eq('id', application.gig.id);

    const emailEvents = getEmailEventsService();

    // Notify accepted talent
    await emailEvents.notifyApplicationAccepted(
      application.talent.email,
      application.talent.display_name,
      application.gig.title,
      application.gig
    );

    // Notify contributor with booking confirmation
    await emailEvents.notifyTalentBooked(
      application.contributor.email,
      application.talent.display_name,
      application.gig.title,
      application.gig
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### E. Credit Purchase (Stripe Webhook)

```typescript
// apps/web/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getEmailEventsService } from '@/lib/services/email-events.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')!;
  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract customer details
      const email = session.customer_email || session.customer_details?.email;
      const credits = session.metadata?.credits;
      const amount = session.amount_total;

      if (email && credits && amount) {
        const emailEvents = getEmailEventsService();
        await emailEvents.trackCreditsPurchased(
          email,
          parseInt(credits),
          amount
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

---

## 3️⃣ Scheduled Jobs (Cron)

### A. Deadline Reminders

```typescript
// apps/web/app/api/cron/gig-deadline-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/email-events.service';

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient();
    
    // Find gigs with deadline in 24 hours
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { data: gigs } = await supabase
      .from('gigs')
      .select(`
        *,
        contributor:users_profile!owner_user_id(email, display_name),
        applications(count)
      `)
      .eq('status', 'PUBLISHED')
      .gte('application_deadline', new Date().toISOString())
      .lte('application_deadline', tomorrow.toISOString());

    const emailEvents = getEmailEventsService();

    for (const gig of gigs || []) {
      await emailEvents.notifyGigDeadlineApproaching(
        gig.contributor.email,
        gig.title,
        gig.id,
        gig.applications[0]?.count || 0
      );
    }

    return NextResponse.json({ 
      success: true, 
      count: gigs?.length || 0 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### B. Inactive User Re-engagement

```typescript
// apps/web/app/api/cron/inactive-users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmailEventsService } from '@/lib/services/email-events.service';

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient();
    const emailEvents = getEmailEventsService();

    // 7 days inactive
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: users7Days } = await supabase
      .from('users_profile')
      .select('email, display_name, last_active_at')
      .lt('last_active_at', sevenDaysAgo.toISOString())
      .is('inactive_email_7days_sent', null);

    for (const user of users7Days || []) {
      await emailEvents.sendInactiveUserEmail(
        user.email,
        user.display_name,
        7
      );
      
      // Mark as sent
      await supabase
        .from('users_profile')
        .update({ inactive_email_7days_sent: new Date().toISOString() })
        .eq('email', user.email);
    }

    // Similar for 30 days and 90 days...

    return NextResponse.json({ 
      success: true,
      sent7Days: users7Days?.length || 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 4️⃣ Vercel Cron Configuration

```json
// vercel.json

{
  "crons": [
    {
      "path": "/api/cron/gig-deadline-reminders",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/inactive-users",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/weekly-reports",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/subscription-expiry-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

---

## 5️⃣ Testing Email Events

```typescript
// apps/web/app/api/test/email-events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getEmailEventsService } from '@/lib/services/email-events.service';

export async function POST(request: NextRequest) {
  const { event, data } = await request.json();
  
  const emailEvents = getEmailEventsService();

  try {
    switch (event) {
      case 'user.signup':
        await emailEvents.trackUserSignup(
          data.email,
          data.name,
          data.role,
          data.tier
        );
        break;

      case 'gig.published':
        await emailEvents.trackGigPublished(
          data.email,
          data.gigId,
          data.gigTitle,
          data.gigDetails
        );
        break;

      case 'application.submitted':
        await emailEvents.trackApplicationSubmitted(
          data.talentEmail,
          data.gigTitle,
          data.contributorName,
          data.applicationId
        );
        break;

      // Add more test cases...

      default:
        return NextResponse.json(
          { error: 'Unknown event' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Test Request:**
```bash
curl -X POST http://localhost:3000/api/test/email-events \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.signup",
    "data": {
      "email": "test@example.com",
      "name": "Test User",
      "role": "TALENT",
      "tier": "FREE"
    }
  }'
```

---

## 6️⃣ Environment Variables

Add to `.env`:

```bash
# Plunk
PLUNK_API_KEY=sk_your_secret_key

# Cron Jobs
CRON_SECRET=your_secure_random_string

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🚀 Deployment Checklist

### Before Launch:
- [ ] All email events implemented
- [ ] Templates created in Plunk dashboard
- [ ] Automations configured
- [ ] Cron jobs set up in Vercel
- [ ] Test all email flows
- [ ] Monitor Plunk dashboard
- [ ] Set up error alerting

### Post Launch:
- [ ] Monitor email open rates
- [ ] Track conversion rates
- [ ] A/B test subject lines
- [ ] Optimize send times
- [ ] Gather user feedback

---

## 📊 Next Steps

1. **Implement email-events.service.ts**
2. **Integrate into existing API routes**
3. **Set up Plunk automations**
4. **Create email templates** (see EMAIL_TEMPLATES.md)
5. **Configure cron jobs**
6. **Test thoroughly**
7. **Launch & monitor**

---

**Ready to implement? Start with Phase 1 events and gradually add more!** 🚀

