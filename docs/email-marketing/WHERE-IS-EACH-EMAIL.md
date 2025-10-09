# 📍 Where is Each Email? Quick Finder

**Instant lookup: Find ANY email in seconds**

---

## 🎯 Quick Answer

**YES! Each email type has its own file!**

---

## 📂 File Finder

### �� Onboarding & Authentication
**File:** `emails/templates/onboarding.templates.ts`

- Welcome email → `getWelcomeEmailTemplate()`
- Email verification → `getEmailVerificationTemplate()`
- Password reset → `getPasswordResetTemplate()`
- Profile completion → `getProfileCompletionTemplate()`

---

### 🟢 Gig Lifecycle
**File:** `emails/templates/gigs.templates.ts`

- Draft saved → `getGigDraftTemplate()`
- Gig published → `getGigPublishedTemplate()`
- New application received → `getNewApplicationTemplate()`
- Application milestone → `getApplicationMilestoneTemplate()`
- Deadline approaching → `getDeadlineApproachingTemplate()`
- Talent booked → `getContributorBookingTemplate()`
- Shoot reminder → `getShootReminderTemplate()`

---

### 🟢 Applications
**File:** `emails/templates/applications.templates.ts`

- Application sent → `getApplicationSubmittedTemplate()`
- Shortlisted → `getApplicationShortlistedTemplate()`
- Accepted/Booked → `getTalentBookingTemplate()`
- Declined → `getApplicationDeclinedTemplate()`
- Limit warning → `getApplicationLimitWarningTemplate()`
- Limit reached → `getApplicationLimitReachedTemplate()`

---

### 🟢 Subscriptions
**File:** `emails/templates/subscriptions.templates.ts`

- Trial started → `getTrialStartedTemplate()`
- Trial ending → `getTrialEndingTemplate()`
- Upgraded → `getSubscriptionUpgradedTemplate()`
- Downgraded → `getSubscriptionDowngradedTemplate()`
- Cancelled → `getSubscriptionCancelledTemplate()`
- Renewal reminder → `getSubscriptionRenewalTemplate()`
- Payment failed → `getPaymentFailedTemplate()`

---

### 🟢 Shared Components
**File:** `emails/templates/shared.templates.ts`

- Base email wrapper → `getEmailTemplate()`
- Buttons → `getButton(type)`
- Info box → `getInfoBox()`
- Warning box → `getWarningBox()`
- Success box → `getSuccessBox()`
- Highlight card → `getHighlightCard()`

**Modify these to change ALL emails!**

---

### 🟢 All Other Emails
**File:** `emails/templates/index.ts`

- Showcases (3)
- Messaging (2)
- Reviews (2)
- Credits (3)
- Engagement (4)
- Marketplace (3)
- Safety (4)
- Educational (4)

**Note:** These have basic templates - expand them later!

---

## 🔍 Search by Feature

| Feature | File | Function |
|---------|------|----------|
| User signs up | `onboarding.templates.ts` | `getWelcomeEmailTemplate()` |
| Email needs verification | `onboarding.templates.ts` | `getEmailVerificationTemplate()` |
| Forgot password | `onboarding.templates.ts` | `getPasswordResetTemplate()` |
| Profile incomplete | `onboarding.templates.ts` | `getProfileCompletionTemplate()` |
| Gig created (draft) | `gigs.templates.ts` | `getGigDraftTemplate()` |
| Gig published | `gigs.templates.ts` | `getGigPublishedTemplate()` |
| Someone applied | `gigs.templates.ts` | `getNewApplicationTemplate()` |
| Deadline soon | `gigs.templates.ts` | `getDeadlineApproachingTemplate()` |
| Applied to gig | `applications.templates.ts` | `getApplicationSubmittedTemplate()` |
| Got shortlisted | `applications.templates.ts` | `getApplicationShortlistedTemplate()` |
| Got booked | `applications.templates.ts` | `getTalentBookingTemplate()` |
| Application rejected | `applications.templates.ts` | `getApplicationDeclinedTemplate()` |
| Trial started | `subscriptions.templates.ts` | `getTrialStartedTemplate()` |
| Plan upgraded | `subscriptions.templates.ts` | `getSubscriptionUpgradedTemplate()` |
| Payment issue | `subscriptions.templates.ts` | `getPaymentFailedTemplate()` |

---

## 📊 File Size Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| `shared.templates.ts` | ~140 | Base template, reusable components |
| `onboarding.templates.ts` | ~120 | 4 onboarding email templates |
| `gigs.templates.ts` | ~150 | 6 gig lifecycle templates |
| `applications.templates.ts` | ~160 | 6 application templates |
| `subscriptions.templates.ts` | ~120 | 7 subscription templates |
| `templates/index.ts` | ~200 | All other templates (placeholders) |
| `events/onboarding.events.ts` | ~80 | 4 onboarding methods |
| `events/gigs.events.ts` | ~140 | 7 gig methods |
| `events/applications.events.ts` | ~120 | 6 application methods |
| `index.ts` | ~250 | Main service (delegates to all) |

**Total:** ~1,480 lines across 10 files  
**Average:** ~148 lines per file  
**Much easier to navigate!** ✅

---

## 💡 Pro Tips

### Modify One Email
1. Find file from table above
2. Open file
3. Find function
4. Change HTML
5. Test with specific category

### Modify All Emails (Global Change)
1. Open `shared.templates.ts`
2. Change `getButton()` or `getEmailTemplate()`
3. Affects ALL emails

### Add New Email
1. Identify category (onboarding, gigs, etc.)
2. Add template to category file
3. Add method to events file
4. Add to main service index

---

## 🧪 Test Specific Categories

```bash
# Onboarding emails only
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"onboarding"}'

# Gig emails only  
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"gigs"}'

# Application emails only
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"test@example.com","testType":"applications"}'
```

---

## ✅ Answer to Your Question

**"Do we have different files for different email events?"**

## **YES!** ✅

- ✅ Onboarding emails → `onboarding.templates.ts`
- ✅ Gig emails → `gigs.templates.ts`
- ✅ Application emails → `applications.templates.ts`
- ✅ Subscription emails → `subscriptions.templates.ts`
- ✅ Shared components → `shared.templates.ts`

**Easy to pinpoint, easy to modify!** 🎯

**Total:** 10 well-organized files  
**All tested and ready to use!**

---

**Start testing now:**
```bash
npm run dev
curl -X POST http://localhost:3000/api/test-all-emails \
  -d '{"email":"support@presetie.com","testType":"all"}'
```

🎉 **Your inbox will get 20+ professional emails!** ✨
