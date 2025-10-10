# Missing Email Types Analysis

Based on `packages/types/src/notifications.ts`, here's what we have vs. what's missing:

## 📊 Notification Types vs Email Templates

### ✅ ALREADY IMPLEMENTED

#### **Gig Lifecycle**
- ✅ `gig_published` → `getGigPublishedTemplate()`
- ❌ `gig_expiring_soon` → **MISSING**
- ❌ `new_gig_match` → **MISSING**
- ❌ `gig_ending_soon` → **MISSING**

#### **Application Process**
- ✅ `application_received` → `getNewApplicationTemplate()`
- ❌ `application_withdrawn` → **MISSING**
- ❌ `application_viewed` → **MISSING**
- ✅ `shortlisted` → `getApplicationShortlistedTemplate()`
- ✅ `application_declined` → `getApplicationDeclinedTemplate()`

#### **Bookings & Talent**
- ✅ `talent_booked` → `getTalentBookingTemplate()`
- ✅ `booking_confirmed` → `getContributorBookingTemplate()`
- ✅ `shoot_reminder` → `getShootReminderTemplate()`

#### **Communication**
- ✅ `message_received` → `getNewMessageTemplate()`

#### **Post-Shoot & Growth**
- ❌ `showcase_submitted` → **MISSING** (we have approval request, but not submitted)
- ✅ `showcase_approved` → `getShowcasePublishedTemplate()`
- ✅ `review_received` → `getReviewReceivedTemplate()`
- ❌ `profile_viewed` → **MISSING**
- ❌ `new_follower` → **MISSING**

#### **System & Account**
- ✅ `credit_low` → `getCreditsLowTemplate()`
- ✅ `subscription_expiring` → `getSubscriptionExpiringTemplate()`
- ❌ `system_update` → **MISSING**
- ✅ `account_verification` → `getVerifyEmailTemplate()`

---

## 🆕 MISSING EMAIL TEMPLATES (9 types)

### Priority: HIGH 🔴

1. **Gig Expiring Soon** - Application deadline approaching for open gig
2. **New Gig Match** - AI-matched gig recommendation for talent
3. **Application Withdrawn** - Talent withdrew their application
4. **Application Viewed** - Contributor viewed talent's application

### Priority: MEDIUM 🟡

5. **Gig Ending Soon** - Gig start time approaching (final reminder)
6. **Showcase Submitted** - First user submits showcase for approval
7. **Profile Viewed** - Someone viewed your profile

### Priority: LOW 🟢

8. **New Follower** - Someone followed your profile
9. **System Update** - Platform updates and announcements

---

## 📋 Recommendations

### Implement Immediately:
1. Gig Expiring Soon
2. New Gig Match  
3. Application Withdrawn
4. Application Viewed

### Implement Soon:
5. Gig Ending Soon
6. Showcase Submitted
7. Profile Viewed

### Implement Later:
8. New Follower
9. System Update (can use Feature Announcement template)

---

_Analysis Date: October 10, 2025_

