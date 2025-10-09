# 📧 Complete Email Marketing Strategy - Presetie.com

## 🎯 Overview

This document outlines the **complete email marketing strategy** for Presetie.com, covering all user journeys, touchpoints, and automated email sequences.

---

## 📊 Platform Features Summary

**Presetie.com** is a creative collaboration platform connecting:
- **Contributors** (photographers/videographers) who post gigs
- **Talent** (models/creative partners) who apply to gigs

### Core Features:
1. **Gigs** - Creative opportunities (Draft → Published → Booked → Completed)
2. **Applications** - Talent applying to gigs
3. **Showcases** - Collaborative portfolios from completed work
4. **Moodboards** - Visual references for gigs
5. **Messaging** - Per-gig communication
6. **Reviews** - Mutual ratings after completion
7. **Subscriptions** - Tiered plans (Free/Plus/Pro)
8. **Credits** - For image enhancements
9. **Marketplace** - Equipment rental & preset sales

---

## 🗺️ Email Event Mapping

### 1. USER ONBOARDING & AUTHENTICATION

#### 1.1 New User Signup

**Event:** `user.signup`

**Trigger:** User creates account  
**Data:**
```typescript
{
  email: string,
  name: string,
  role: 'CONTRIBUTOR' | 'TALENT' | 'BOTH',
  subscriptionTier: 'FREE' | 'PLUS' | 'PRO',
  signupMethod: 'email' | 'google',
  referralSource?: string
}
```

**Email Sequence:**
1. **Welcome Email** (Immediate)
   - Subject: "Welcome to Preset! 🎬 Let's get you started"
   - Content: Platform overview, role-specific tips, next steps
   - CTA: Complete profile / Browse gigs

2. **Getting Started Guide** (2 hours later)
   - Subject: "Your Preset Quick Start Guide 📸"
   - Content: How-to videos, feature highlights
   - Role-specific content based on user type

3. **First Milestone Encouragement** (24 hours if no activity)
   - Subject: "Ready to create your first [gig/application]?"
   - Content: Step-by-step guide, success stories
   - CTA: Role-specific action

---

#### 1.2 Email Verification

**Event:** `email.verification.sent`

**Email:**
- Subject: "Verify your Preset account"
- Content: Verification link, security info
- Urgency: 24-hour expiration notice

---

#### 1.3 Profile Completion

**Event:** `profile.incomplete` (Triggered daily if <80% complete)

**Email:**
- Subject: "Complete your profile to get discovered 🌟"
- Content: Missing fields checklist, profile completion benefits
- Progress bar showing completion percentage

---

### 2. GIG LIFECYCLE (CONTRIBUTOR SIDE)

#### 2.1 Gig Creation & Publishing

**Event:** `gig.created`

**Email:** "Your gig is saved as a draft"
- Tips for writing compelling gig descriptions
- Moodboard creation guide
- CTA: Publish when ready

---

**Event:** `gig.published`

**Email:** "Your gig is now live! 🚀"
- Confirmation with gig details
- Expected applicant timeline
- Tips for reviewing applications
- Link to gig dashboard

---

#### 2.2 Application Activity

**Event:** `gig.application.received`

**Email:** "New application for [Gig Title]"
- Applicant preview with key details
- Quick shortlist/decline actions
- Link to full profile

---

**Event:** `gig.application.milestone` (At 25%, 50%, 75%, 100% capacity)

**Emails:**
- 25%: "Your gig is getting interest! 🎯"
- 50%: "Halfway to your application goal!"
- 75%: "Your gig is almost full! ⚡"
- 100%: "Your gig is at capacity"

---

**Event:** `gig.deadline.approaching` (24 hours before)

**Email:** "Application deadline approaching for [Gig Title]"
- Current applicant count
- Summary of top candidates
- Reminder to shortlist

---

#### 2.3 Booking & Completion

**Event:** `gig.talent.booked`

**Email:** "You've booked [Talent Name] for [Gig Title]!"
- Booking confirmation details
- Shoot preparation checklist
- Safety reminders
- Link to per-gig chat

---

**Event:** `gig.shoot.reminder` (24 hours before shoot)

**Email:** "Your shoot with [Talent Name] is tomorrow! 📅"
- Shoot details & location
- Weather forecast (if outdoor)
- Golden hour times
- Final checklist

---

**Event:** `gig.completed.pending.showcase`

**Email:** "Time to create your showcase! ✨"
- Instructions for uploading 3-6 selects
- Showcase benefits
- Deadline for mutual approval

---

### 3. APPLICATION LIFECYCLE (TALENT SIDE)

#### 3.1 Application Submission

**Event:** `application.submitted`

**Email:** "Application sent to [Contributor Name]! 🎬"
- Application confirmation
- What happens next
- Estimated response timeline
- Tips while waiting

---

#### 3.2 Application Status Updates

**Event:** `application.shortlisted`

**Email:** "You've been shortlisted! 🌟"
- Next steps in selection process
- Contributor might message you
- What to prepare

---

**Event:** `application.accepted`

**Email:** "Congratulations! You're booked for [Gig Title]! 🎉"
- Booking confirmation
- Shoot details
- What to bring/prepare
- Link to per-gig chat
- Contributor contact

---

**Event:** `application.declined`

**Email:** "Update on your application"
- Gentle rejection message
- Encourage to apply to other gigs
- Recommended gigs based on profile
- Profile improvement tips

---

#### 3.3 Application Limits

**Event:** `application.limit.approaching` (At 2/3 applications for Free tier)

**Email:** "You're running low on applications this month"
- Current usage: X/3 applications
- Upgrade to Plus for unlimited
- Renews on [date]

---

**Event:** `application.limit.reached`

**Email:** "You've reached your monthly application limit"
- Upgrade options highlighted
- When limit resets
- Other ways to engage (build profile, browse showcases)

---

### 4. SHOWCASE & PORTFOLIO

#### 4.1 Showcase Creation

**Event:** `showcase.upload.complete` (Both parties uploaded)

**Email:** "Approve showcase with [Collaborator Name]"
- Preview of uploaded images
- Approve/request changes buttons
- Benefits of published showcases

---

**Event:** `showcase.approved.mutual`

**Email:** "Your showcase is now live! 🎨"
- Link to published showcase
- Share on social media options
- Analytics preview

---

**Event:** `showcase.featured`

**Email:** "Your showcase has been featured! 🏆"
- Featured showcase recognition
- Increased visibility notification
- Share achievement

---

### 5. MESSAGING & COMMUNICATION

#### 5.1 New Messages

**Event:** `message.received`

**Email:** "New message from [Sender Name]"
- Message preview (first 100 characters)
- Context (which gig)
- Reply directly link

---

**Event:** `message.unread.digest` (Daily at 9 AM if unread messages)

**Email:** "You have [X] unread messages"
- Summary of conversations
- Quick reply links
- Priority messages highlighted

---

### 6. REVIEWS & RATINGS

#### 6.1 Review Requests

**Event:** `gig.completed` (24 hours after)

**Email:** "How was your experience with [Collaborator Name]?"
- Easy rating interface
- Review prompts
- Importance of reviews

---

**Event:** `review.received`

**Email:** "You received a new review! ⭐"
- Review content
- Updated rating average
- Thank reviewer option

---

### 7. SUBSCRIPTION & MONETIZATION

#### 7.1 Subscription Events

**Event:** `subscription.trial.started`

**Email:** "Your Plus trial has started! 🎁"
- Trial benefits overview
- Tips to maximize trial
- Expires in [X] days

---

**Event:** `subscription.trial.ending` (3 days before)

**Email:** "Your trial ends in 3 days"
- Usage summary
- Value you've received
- One-click upgrade option

---

**Event:** `subscription.upgraded`

**Email:** "Welcome to [Plus/Pro]! 🚀"
- New features unlocked
- Getting the most from upgrade
- Exclusive perks

---

**Event:** `subscription.downgraded`

**Email:** "Your plan has changed"
- New limits and features
- What you'll lose
- Win-back offer

---

**Event:** `subscription.cancelled`

**Email:** "Sorry to see you go 😢"
- Cancellation confirmation
- Access until end of billing period
- Feedback request
- Reactivation offer

---

**Event:** `subscription.expiring.soon` (7, 3, 1 day before)

**Emails:**
- 7 days: "Your subscription renews soon"
- 3 days: "Payment reminder"
- 1 day: "Your subscription renews tomorrow"

---

**Event:** `subscription.payment.failed`

**Email:** "Payment issue with your subscription"
- Update payment method
- Grace period notification
- Alternative payment options

---

#### 7.2 Credit System

**Event:** `credits.purchased`

**Email:** "Credit purchase confirmation 💳"
- Credits added to account
- Receipt/invoice
- Current balance
- What you can do with credits

---

**Event:** `credits.low` (When < 20% remaining)

**Email:** "You're running low on credits"
- Current balance
- Usage recommendations
- Top-up options

---

**Event:** `credits.monthly.reset`

**Email:** "Your monthly credits have been refreshed! ✨"
- New credit balance
- Monthly allowance reminder
- Upgrade for more credits

---

### 8. MARKETPLACE

#### 8.1 Equipment Rental

**Event:** `rental.request.created`

**Email:** "Rental request sent"
- Request details
- Expected response time
- What happens next

---

**Event:** `rental.request.accepted`

**Email:** "Your rental request was accepted! 🎥"
- Pickup details
- Rental period
- Insurance info
- Contact details

---

**Event:** `rental.reminder` (24 hours before pickup/return)

**Emails:**
- Pickup: "Pick up your rental tomorrow"
- Return: "Return reminder - due tomorrow"

---

#### 8.2 Preset Marketplace

**Event:** `preset.purchased`

**Email:** "Your preset is ready to download! 🎨"
- Download link
- Installation instructions
- Creator's tips
- Support contact

---

### 9. ENGAGEMENT & RETENTION

#### 9.1 Inactive User Re-engagement

**Event:** `user.inactive.7days`

**Email:** "We miss you! Come back to Preset 🎬"
- What's new on platform
- Recommended gigs
- Community highlights

---

**Event:** `user.inactive.30days`

**Email:** "Your creative community is waiting"
- Major updates/features
- Success stories
- Special comeback offer

---

**Event:** `user.inactive.90days`

**Email:** "Last chance - Your account will be archived"
- Final engagement attempt
- Archive notification
- Reactivation is easy

---

#### 9.2 Activity Milestones

**Event:** `milestone.first.gig.created`

**Email:** "Congratulations on your first gig! 🎉"
- Achievement celebration
- Tips for success
- Community introduction

---

**Event:** `milestone.first.application.sent`

**Email:** "Your first application is out there! 🌟"
- What to expect
- Profile optimization tips
- Increase your chances

---

**Event:** `milestone.first.booking`

**Email:** "Your first booking! This is huge! 🎊"
- Celebration & preparation guide
- Shoot day checklist
- Best practices

---

**Event:** `milestone.first.showcase.published`

**Email:** "Your first showcase is live! 🏆"
- Achievement unlocked
- Share on social
- Portfolio building tips

---

**Event:** `milestone.5.completed.gigs`

**Email:** "You've completed 5 gigs! 💪"
- Stats & achievements
- Community recognition badge
- Next milestone preview

---

### 10. SAFETY & TRUST

#### 10.1 Verification

**Event:** `id.verification.submitted`

**Email:** "ID verification submitted"
- Review timeline (24-48 hours)
- What happens next
- Benefits of verification

---

**Event:** `id.verification.approved`

**Email:** "You're now verified! ✅"
- Verified badge activated
- Increased trust benefits
- Profile visibility boost

---

**Event:** `id.verification.rejected`

**Email:** "ID verification needs attention"
- Reason for rejection
- Resubmission instructions
- Support contact

---

#### 10.2 Safety & Reports

**Event:** `report.received`

**Email (to reported user):** "Account review notification"
- Report received (no details)
- Community guidelines
- Response timeline

---

**Event:** `report.resolved` 

**Email (to reporter):** "Your report has been reviewed"
- Action taken (if appropriate)
- Thank you for keeping community safe

---

**Event:** `account.suspended`

**Email:** "Account suspended"
- Reason for suspension
- Duration
- Appeal process
- Community guidelines

---

### 11. ADMIN & SYSTEM

#### 11.1 Admin Notifications

**Event:** `admin.new.user`

**Email (to admin):** "New user signup"
- User details
- Signup source
- Quick moderation actions

---

**Event:** `admin.gig.flagged`

**Email (to admin):** "Gig flagged for review"
- Flagging reason
- Gig details
- Moderation actions

---

**Event:** `admin.credits.low`

**Email (to admin):** "Platform credits running low"
- Current pool balance
- Usage rate
- Refill recommendation

---

### 12. ANALYTICS & INSIGHTS

#### 12.1 Weekly/Monthly Reports

**Event:** `report.weekly.contributor`

**Email:** "Your weekly Preset report 📊"
- Gig views
- Applications received
- Profile views
- Engagement metrics
- Actionable insights

---

**Event:** `report.weekly.talent`

**Email:** "Your weekly Preset report 📊"
- Applications sent
- Response rate
- Profile views
- Recommended gigs

---

**Event:** `report.monthly.all.users`

**Email:** "Your month in review 🗓️"
- Monthly highlights
- Achievements
- Community stats
- Next month preview

---

### 13. EDUCATIONAL & NURTURE

#### 13.1 Tips & Best Practices

**Event:** `education.weekly.tips` (Every Tuesday)

**Email:** "Tuesday Tips: [Topic]"
- Rotating topics:
  - Writing better gig descriptions
  - Creating standout applications
  - Building your portfolio
  - Networking on Preset
  - Safety best practices

---

#### 13.2 Success Stories

**Event:** `newsletter.monthly.success.stories`

**Email:** "Community Spotlight: Success Stories 🌟"
- Featured creators
- Collaboration highlights
- Platform updates
- Upcoming features

---

#### 13.3 Feature Announcements

**Event:** `feature.launched`

**Email:** "New Feature: [Feature Name] 🎉"
- What's new
- How to use it
- Benefits
- Video tutorial

---

### 14. SEASONAL & PROMOTIONAL

#### 14.1 Seasonal Campaigns

**Event:** `campaign.seasonal` (Scheduled)

**Emails:**
- "Summer Shoot Season is Here! ☀️"
- "Holiday Photography Tips 🎄"
- "Spring Collaboration Opportunities 🌸"
- "Back to Creating: Fall Edition 🍂"

---

#### 14.2 Special Promotions

**Event:** `promo.discount.offer`

**Email:** "Limited Time: [X]% off Plus/Pro"
- Discount details
- Expiration urgency
- Value proposition
- One-click upgrade

---

**Event:** `promo.referral.program`

**Email:** "Invite friends, earn rewards 🎁"
- Referral link
- Rewards breakdown
- How it works
- Share templates

---

### 15. TRANSACTIONAL EMAILS

#### 15.1 Receipts & Confirmations

**Event:** `payment.successful`

**Email:** "Payment receipt from Preset"
- Transaction details
- Invoice/receipt
- Billing information

---

**Event:** `refund.processed`

**Email:** "Refund confirmation"
- Refund amount
- Timeline to see in account
- Reason (if applicable)

---

#### 15.2 Password & Security

**Event:** `password.reset.requested`

**Email:** "Reset your Preset password"
- Reset link (1-hour expiration)
- Security reminder
- Didn't request? Alert

---

**Event:** `password.changed`

**Email:** "Your password was changed"
- Confirmation
- Security tips
- Report if not you

---

**Event:** `login.new.device`

**Email:** "New login detected"
- Device & location details
- Security review
- Secure account actions

---

## 📋 Priority Implementation Roadmap

### Phase 1: Essential (Week 1-2)
1. ✅ Welcome email (user.signup)
2. ✅ Email verification
3. ✅ Gig published notification
4. ✅ Application received/sent
5. ✅ Booking confirmation
6. ✅ Password reset

### Phase 2: Engagement (Week 3-4)
1. Application status updates
2. Milestone emails
3. Review requests
4. Weekly reports
5. Inactive user re-engagement

### Phase 3: Monetization (Week 5-6)
1. Subscription trial emails
2. Upgrade prompts
3. Credit notifications
4. Payment reminders
5. Limit notifications

### Phase 4: Retention (Week 7-8)
1. Educational content
2. Success stories
3. Tips & best practices
4. Seasonal campaigns
5. Referral program

---

## 🎨 Email Design System

### Brand Voice
- **Friendly & Supportive** - Like a creative collaborator
- **Professional yet Casual** - Approachable but trustworthy
- **Action-Oriented** - Clear CTAs and next steps
- **Visual** - Photography/videography focused

### Template Structure
```
1. Header with Preset logo
2. Personalized greeting
3. Main content (concise, scannable)
4. Clear CTA button
5. Secondary information
6. Footer (links, preferences, unsubscribe)
```

### Color Palette
- Primary: Indigo (#00876f)
- Secondary: Purple (#0d7d72)
- Success: Green (#10b981)
- Warning: Orange (#f59e0b)
- Error: Red (#ef4444)

---

## 🔧 Technical Implementation

### Event Naming Convention
```
[domain].[entity].[action]
```

Examples:
- `user.signup.completed`
- `gig.published`
- `application.submitted`
- `showcase.approved`

### Plunk Integration Points

1. **Track in application flow:**
   ```typescript
   await plunk.trackEvent({
     event: 'gig.published',
     email: user.email,
     data: {
       gigId: gig.id,
       gigTitle: gig.title,
       compensationType: gig.compType
     }
   });
   ```

2. **Send transactional:**
   ```typescript
   await emailService.sendGigPublishedEmail(
     user.email,
     gig.title,
     gig.id
   );
   ```

3. **Automation in Plunk Dashboard:**
   - Create automation for each event
   - Design email templates
   - Set timing/delays
   - A/B test subject lines

---

## 📊 Success Metrics

### Email Performance KPIs
- **Open Rate:** Target 25-35%
- **Click Rate:** Target 3-8%
- **Conversion Rate:** Target 1-5%
- **Unsubscribe Rate:** Keep < 0.5%

### Business Impact
- User activation rate
- Feature adoption
- Subscription upgrades
- Retention improvements
- Re-engagement success

---

## 🚀 Next Steps

See implementation files:
- **[EMAIL_EVENTS_IMPLEMENTATION.md](./EMAIL_EVENTS_IMPLEMENTATION.md)** - Code examples
- **[EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md)** - Email templates
- **[PLUNK_AUTOMATION_SETUP.md](./PLUNK_AUTOMATION_SETUP.md)** - Dashboard setup

---

**Total Email Events Mapped: 80+**  
**Automation Workflows: 15+**  
**User Journeys Covered: Complete platform**

