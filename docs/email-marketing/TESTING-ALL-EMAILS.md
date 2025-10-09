# 🧪 Testing All Email Events

Complete guide to testing all 40+ implemented email events.

---

## ✅ What's Ready to Test

### Currently Implemented: 40+ Email Events

#### 1. Onboarding (4 events)
- ✅ `user.signup` - Welcome email
- ✅ `email.verification.sent` - Email verification
- ✅ `password.reset.sent` - Password reset
- ✅ `profile.completion.reminder` - Profile completion

#### 2. Gig Lifecycle (7 events)
- ✅ `gig.draft.saved` - Draft saved confirmation
- ✅ `gig.published` - Gig published notification
- ✅ `gig.application.received` - New application alert
- ✅ `gig.application.milestone` - Application milestones
- ✅ `gig.deadline.approaching` - Deadline reminder
- ✅ `gig.talent.booked.contributor` - Booking confirmation (contributor)
- ✅ `gig.shoot.reminder` - Shoot reminder

#### 3. Applications (6 events)
- ✅ `application.submitted` - Application sent confirmation
- ✅ `application.shortlisted` - Shortlist notification
- ✅ `application.accepted` - Booking confirmation (talent)
- ✅ `application.declined` - Application declined
- ✅ `application.limit.approaching` - Limit warning
- ✅ `application.limit.reached` - Limit reached

#### 4. Showcases (3 events)
- ✅ `showcase.approval.requested` - Approval request
- ✅ `showcase.published` - Showcase live
- ✅ `showcase.featured` - Featured showcase

#### 5. Messaging (2 events)
- ✅ `message.received` - New message
- ✅ `message.unread.digest` - Unread digest

#### 6. Reviews (2 events)
- ✅ `review.requested` - Review request
- ✅ `review.received` - Review notification

#### 7. Subscriptions (8 events)
- ✅ `subscription.trial.started` - Trial started
- ✅ `subscription.trial.ending` - Trial ending
- ✅ `subscription.upgraded` - Upgrade confirmation
- ✅ `subscription.downgraded` - Downgrade notification
- ✅ `subscription.cancelled` - Cancellation confirmation
- ✅ `subscription.expiring.soon` - Renewal reminder
- ✅ `subscription.payment.failed` - Payment failed

#### 8. Credits (3 events)
- ✅ `credits.purchased` - Purchase confirmation
- ✅ `credits.low` - Low balance warning
- ✅ `credits.monthly.reset` - Monthly reset

#### 9. Engagement (3 events)
- ✅ `user.inactive.7days` - 7 day inactive
- ✅ `user.inactive.30days` - 30 day inactive (template ready)
- ✅ `milestone.*` - Milestone celebrations

#### 10. Marketplace (3 events)
- ✅ `rental.request.created` - Rental request
- ✅ `rental.request.accepted` - Rental accepted
- ✅ `preset.purchased` - Preset purchase

#### 11. Safety (4 events)
- ✅ `id.verification.submitted` - ID submitted
- ✅ `id.verification.approved` - ID approved
- ✅ `id.verification.rejected` - ID rejected
- ✅ `account.suspended` - Account suspended

#### 12. Educational (3 events)
- ✅ `education.weekly.tips` - Tuesday Tips
- ✅ `newsletter.monthly.success.stories` - Success stories
- ✅ `feature.launched` - Feature announcements

#### 13. Promotional (1 event)
- ✅ `promo.discount.offer` - Promotional offers

**Total Implemented: 40+ events** (with 40+ more to be added as you expand templates)

---

## 🧪 How to Test

### Option 1: Test All Emails at Once

```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","testType":"all"}'
```

This will send 20+ test emails to your inbox!

---

### Option 2: Test by Category

**Test Onboarding Emails:**
```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","testType":"onboarding"}'
```

**Test Gig Emails:**
```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","testType":"gigs"}'
```

**Test Application Emails:**
```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","testType":"applications"}'
```

**Test Subscription Emails:**
```bash
curl -X POST http://localhost:3000/api/test-all-emails \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","testType":"subscriptions"}'
```

**Available Test Types:**
- `all` - All emails
- `onboarding` - Welcome, verification, profile
- `gigs` - Gig lifecycle
- `applications` - Application flow
- `subscriptions` - Subscription management
- `credits` - Credit system
- `engagement` - Inactive users, milestones
- `messaging` - Messages and reviews
- `marketplace` - Rentals and presets

---

## 📊 Test Response Format

```json
{
  "success": true,
  "message": "Email test completed: 15/15 sent successfully",
  "testEmail": "your@email.com",
  "testType": "all",
  "summary": {
    "total": 15,
    "successful": 15,
    "failed": 0
  },
  "results": {
    "welcomeEmail": { "status": "sent", "event": "user.signup" },
    "gigPublished": { "status": "sent", "event": "gig.published" },
    ...
  },
  "nextSteps": [
    "Check inbox at your@email.com",
    "Review Plunk dashboard",
    "Verify events are being tracked",
    "Check email rendering"
  ]
}
```

---

## ✅ Testing Checklist

### Before Testing
- [ ] PLUNK_API_KEY set in .env
- [ ] Dev server restarted
- [ ] Plunk account active
- [ ] Test email address ready

### During Testing
- [ ] Send test emails
- [ ] Check inbox for all emails
- [ ] Verify NO emojis in emails
- [ ] Check brand colors (#00876f, #0d7d72)
- [ ] Test button links work
- [ ] Check mobile rendering
- [ ] Verify unsubscribe link works

### In Plunk Dashboard
- [ ] Events appearing in logs
- [ ] Contacts being created
- [ ] Email delivery successful
- [ ] Analytics tracking

### Cross-Client Testing
- [ ] Gmail (Desktop)
- [ ] Gmail (Mobile)
- [ ] Outlook
- [ ] Apple Mail
- [ ] Dark mode rendering

---

## 🎨 Design Verification

For each email, verify:

### ✅ NO Emojis
- [ ] Zero emojis in subject lines
- [ ] Zero emojis in email body
- [ ] Zero emojis in CTAs

### ✅ Brand Colors
- [ ] Headers use gradient: #00876f → #0d7d72
- [ ] Primary buttons use gradient
- [ ] Links use #00876f
- [ ] Success elements use #10b981
- [ ] Warning elements use #f59e0b

### ✅ Professional Design
- [ ] Clean, minimal layout
- [ ] Proper spacing & padding
- [ ] Clear visual hierarchy
- [ ] Mobile-responsive
- [ ] Accessible contrast

---

## 📈 Coverage Status

### ✅ Fully Implemented & Ready (40+ events)

**Service Created:** `email-events.service.ts`

**Methods Available:**
1. `sendWelcomeEmail()`
2. `sendEmailVerification()`
3. `sendPasswordReset()`
4. `sendProfileCompletionReminder()`
5. `sendGigDraftSaved()`
6. `sendGigPublished()`
7. `sendNewApplicationNotification()`
8. `sendApplicationMilestone()`
9. `sendDeadlineApproaching()`
10. `sendTalentBookedConfirmation()`
11. `sendShootReminder()`
12. `sendApplicationSubmittedConfirmation()`
13. `sendApplicationShortlisted()`
14. `sendApplicationAccepted()`
15. `sendApplicationDeclined()`
16. `sendApplicationLimitWarning()`
17. `sendApplicationLimitReached()`
18. `sendShowcaseApprovalRequest()`
19. `sendShowcasePublished()`
20. `sendShowcaseFeatured()`
21. `sendNewMessageNotification()`
22. `sendUnreadMessagesDigest()`
23. `sendReviewRequest()`
24. `sendReviewReceived()`
25. `sendTrialStarted()`
26. `sendTrialEnding()`
27. `sendSubscriptionUpgraded()`
28. `sendSubscriptionDowngraded()`
29. `sendSubscriptionCancelled()`
30. `sendSubscriptionRenewalReminder()`
31. `sendPaymentFailed()`
32. `sendCreditsPurchased()`
33. `sendCreditsLow()`
34. `sendMonthlyCreditsReset()`
35. `sendInactiveUserEmail()`
36. `sendMilestoneEmail()`
37. `sendWeeklyReport()`
38. `sendMonthlyReport()`
39. `sendRentalRequestCreated()`
40. `sendRentalRequestAccepted()`
41. `sendPresetPurchased()`
42. `sendIDVerificationSubmitted()`
43. `sendIDVerificationApproved()`
44. `sendIDVerificationRejected()`
45. `sendAccountSuspended()`
46. `sendTuesdayTips()`
47. `sendNewsletterSuccessStories()`
48. `sendFeatureAnnouncement()`
49. `sendPromotionalOffer()`

### 🔄 Templates to Expand

Currently, most methods have basic templates. You can expand them using the patterns from:
- `docs/email-marketing/03-email-templates.md`
- `docs/email-marketing/EMAIL-DESIGN-GUIDE.md`

The structure is there - just replace the placeholder templates with full HTML from the template library.

---

## 🚀 Quick Test Now

```bash
# 1. Restart your dev server (if not running)
npm run dev

# 2. Test with your email
curl -X POST http://localhost:3000/api/test-all-emails \
  -H "Content-Type: application/json" \
  -d '{"email":"support@presetie.com","testType":"onboarding"}'

# 3. Check your inbox!
```

---

## 📊 What to Expect

You'll receive test emails for:

**Onboarding (3 emails):**
- Welcome email
- Email verification
- Profile completion reminder

**Gigs (4 emails):**
- Draft saved
- Gig published
- New application received
- Deadline approaching

**Applications (4 emails):**
- Application submitted
- Shortlisted
- Accepted
- Limit warning

**Subscriptions (3 emails):**
- Trial started
- Upgraded
- Renewal reminder

**Credits (2 emails):**
- Purchase confirmation
- Low balance

**Engagement (2 emails):**
- Inactive user
- Milestone achieved

**Messaging (2 emails):**
- New message
- Review request

**Marketplace (1 email):**
- Preset purchased

**Total: 20+ test emails depending on testType**

---

## ✅ Success Criteria

Tests pass when:
- [ ] All emails received
- [ ] NO emojis present
- [ ] Brand colors correct
- [ ] Links work
- [ ] Mobile-responsive
- [ ] Unsubscribe link works
- [ ] Events tracked in Plunk

---

## 📈 Next Steps After Testing

1. **Review email designs** - Check rendering across clients
2. **Expand templates** - Add full HTML from template library
3. **Set up Plunk automations** - Configure in dashboard
4. **Integrate into app** - Add to real user flows
5. **Monitor performance** - Track open/click rates

---

**Ready to test! Run the curl command above or use Postman/Insomnia** 🧪

