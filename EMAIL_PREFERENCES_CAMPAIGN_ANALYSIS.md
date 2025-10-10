# 📧 Email Preferences & Campaign Analysis

**Date:** October 10, 2025  
**Status:** ⚠️ **CRITICAL ISSUES FOUND**

---

## ✅ What You Have (Email Preferences System)

### **Database: `notification_preferences` Table**

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- Master Controls
  email_enabled BOOLEAN DEFAULT true,
  
  -- Category Controls
  gig_notifications BOOLEAN DEFAULT true,
  application_notifications BOOLEAN DEFAULT true,
  message_notifications BOOLEAN DEFAULT true,
  booking_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  marketing_notifications BOOLEAN DEFAULT true,  ⚠️ DEFAULT TRUE!
  
  -- Other settings...
  digest_frequency VARCHAR(20) DEFAULT 'real-time',
  timezone VARCHAR(50) DEFAULT 'UTC'
);
```

### **Frontend Pages:**

✅ `/unsubscribe` - User-friendly unsubscribe page with granular controls  
✅ `/settings/email-preferences` - Full preferences management  

### **Backend Services:**

✅ `EmailPreferenceChecker` - Service to check preferences before sending  
✅ API endpoints for updating preferences  
✅ Plunk integration for contact sync

### **Email Categories:**

| Category | What It Includes | Default | Can Disable? |
|----------|------------------|---------|--------------|
| `gig` | Gig published, deadlines, updates | ON | ✅ Yes |
| `application` | Application status, bookings | ON | ⚠️ Critical ones always sent |
| `message` | New messages, unread digests | ON | ✅ Yes |
| `booking` | Shoot reminders, showcases, reviews | ON | ⚠️ Important |
| `system` | Subscriptions, credits, security | ON | ❌ Critical always sent |
| **`marketing`** | **Tips, features, promotions** | **ON** | ✅ **Yes** |

---

## ⚠️ CRITICAL ISSUES FOUND

### **Issue #1: Marketing Emails Default to ON**

**Problem:**
```sql
marketing_notifications BOOLEAN DEFAULT true  ❌ WRONG!
```

**GDPR/Legal Requirement:**
- Marketing emails should **DEFAULT to OFF**
- Users must **OPT-IN** to marketing emails
- Current setup has them **OPT-OUT** (backwards!)

**Impact:**
- All 36 campaigns we created are **MARKETING** campaigns
- They'll be sent to users who haven't explicitly opted in
- Potential GDPR violation ⚠️

**Fix Required:**
```sql
-- Change default to FALSE
ALTER TABLE notification_preferences 
ALTER COLUMN marketing_notifications SET DEFAULT false;

-- Update existing users to opt-out by default
UPDATE notification_preferences 
SET marketing_notifications = false 
WHERE created_at < NOW();
```

---

### **Issue #2: Campaigns Not Using Preference Checker**

**Problem:**
- `PlunkCampaignsService` sends campaigns **WITHOUT checking preferences**
- No integration with `EmailPreferenceChecker`

**Current Code:**
```typescript
// plunk-campaigns.service.ts line 199
const response = await fetch(`${this.plunkApiUrl}/campaigns`, {
  method: 'POST',
  headers: {...},
  body: JSON.stringify({
    subject: options.content.subject,
    body: options.content.body,
    recipients: recipientEmails,  ❌ Sends to ALL matched users
    style: options.content.style || 'HTML'
  })
});
```

**Missing:**
```typescript
// Should filter recipients by marketing preferences FIRST
const recipientEmails = await this.getTargetedUsers(options.targeting);

// ❌ MISSING: Filter by marketing preferences
const filteredRecipients = await this.filterByEmailPreferences(
  recipientEmails, 
  'marketing'
);
```

---

### **Issue #3: Campaign URLs Missing User Parameters**

**Problem:**
Campaign emails have:
```html
<a href="https://presetie.com/unsubscribe">Unsubscribe</a>  ❌ Missing params!
```

**Should be:**
```html
<a href="https://presetie.com/unsubscribe?email={{email}}&userId={{userId}}">
  Unsubscribe
</a>
```

**Impact:**
- Users can't easily unsubscribe from campaigns
- Unsubscribe page won't work without parameters

---

## ✅ What Works Correctly

✅ **Transactional Emails** - Can use `EmailPreferenceChecker`  
✅ **Unsubscribe Page** - Works if URL parameters provided  
✅ **Preferences Page** - UI works correctly  
✅ **Database Schema** - Table exists with all needed columns  
✅ **API Endpoints** - Work correctly for updating preferences

---

## 🔧 Required Fixes

### **Fix #1: Change Marketing Default to OPT-IN**

**Priority:** 🔥 **CRITICAL** (Legal/GDPR)

```sql
-- Migration: change_marketing_default_to_opt_in.sql

-- Change default for future users
ALTER TABLE notification_preferences 
ALTER COLUMN marketing_notifications SET DEFAULT false;

-- Update existing users (set to opt-out)
UPDATE notification_preferences 
SET marketing_notifications = false,
    updated_at = NOW()
WHERE marketing_notifications = true;

-- Add comment for clarity
COMMENT ON COLUMN notification_preferences.marketing_notifications IS 
'Marketing emails require OPT-IN. Default FALSE for GDPR compliance.';
```

---

### **Fix #2: Add Preference Filtering to PlunkCampaignsService**

**Priority:** 🔥 **CRITICAL**

Update `apps/web/lib/services/plunk-campaigns.service.ts`:

```typescript
import { getEmailPreferenceChecker } from './email-preference-checker.service';

export class PlunkCampaignsService {
  
  /**
   * Filter recipient emails by marketing preferences
   */
  private async filterByMarketingPreferences(
    emails: string[]
  ): Promise<string[]> {
    const checker = getEmailPreferenceChecker();
    const supabase = this.getSupabaseAdmin();
    
    // Get all users
    const { data: { users } } = await supabase.auth.admin.listUsers();
    
    const filteredEmails: string[] = [];
    
    for (const email of emails) {
      const user = users.find(u => u.email === email);
      if (!user) continue;
      
      // Check if user opted into marketing
      const { shouldSend } = await checker.shouldSendEmail(user.id, 'marketing');
      
      if (shouldSend) {
        filteredEmails.push(email);
      }
    }
    
    console.log(`📧 Filtered: ${emails.length} → ${filteredEmails.length} (${filteredEmails.length} opted into marketing)`);
    
    return filteredEmails;
  }
  
  /**
   * Create a campaign in Plunk
   */
  async createCampaign(options: CampaignOptions): Promise<{ id: string; recipientCount: number }> {
    console.log(`🎯 Creating campaign: ${options.name}`);
    
    // Get targeted user emails
    let recipientEmails = await this.getTargetedUsers(options.targeting);
    
    // ✅ NEW: Filter by marketing preferences
    recipientEmails = await this.filterByMarketingPreferences(recipientEmails);
    
    if (recipientEmails.length === 0) {
      throw new Error('No recipients match the targeting criteria (or none opted into marketing)');
    }
    
    console.log(`📧 Found ${recipientEmails.length} recipients who opted into marketing`);
    
    // Rest of the code...
  }
}
```

---

### **Fix #3: Update Campaign Templates with Unsubscribe Parameters**

**Priority:** 🟡 **HIGH**

All campaign HTML templates need dynamic unsubscribe links:

**Current (all 36 campaigns):**
```html
<a href="https://presetie.com/unsubscribe">Unsubscribe</a>
```

**Should be:**
```html
<a href="https://presetie.com/unsubscribe?email={{email}}&userId={{userId}}">
  Unsubscribe
</a>
```

**Problem:** Plunk campaigns don't support template variables like `{{email}}`

**Solution:** Use Plunk's built-in unsubscribe:
```html
<a href="{{unsubscribeUrl}}">Unsubscribe</a>
```

OR update campaigns to use transactional API with variables:
```typescript
// Instead of campaigns API, use send API with loop
for (const recipient of recipients) {
  await plunk.sendTransactionalEmail({
    to: recipient.email,
    subject: subject,
    body: body.replace('{{email}}', recipient.email)
                .replace('{{userId}}', recipient.userId)
  });
}
```

---

### **Fix #4: Add Marketing Category Indicator**

**Priority:** 🟢 **MEDIUM**

Add clear opt-in messaging to campaigns:

```html
<div style="background-color: #f9fafb; padding: 20px; text-align: center; margin-top: 30px;">
  <p style="color: #6b7280; font-size: 13px; margin: 0;">
    You're receiving this because you opted into marketing emails.
    <a href="https://presetie.com/settings/email-preferences" style="color: #00876f;">
      Update preferences
    </a>
  </p>
</div>
```

---

## 🎯 Recommended Action Plan

### **Immediate (Before Sending Any Campaigns):**

1. ✅ **Fix marketing default** - Run SQL migration
2. ✅ **Add preference filtering** - Update PlunkCampaignsService
3. ✅ **Test with small group** - Send to 5-10 opted-in users
4. ✅ **Verify unsubscribe works** - Click link and test

### **Short Term (This Week):**

1. ✅ **Update campaign templates** - Fix unsubscribe links
2. ✅ **Add opt-in messaging** - Make it clear
3. ✅ **Create re-engagement campaign** - For users who opted out
4. ✅ **Monitor unsubscribe rates** - Should be <0.5%

### **Long Term (This Month):**

1. ✅ **A/B test campaigns** - Find best performing
2. ✅ **Track conversions** - Gigs created, projects made, equipment listed
3. ✅ **Refine targeting** - Based on engagement data
4. ✅ **Create automation** - Trigger campaigns based on user actions

---

## 📊 Current Campaign Risk Assessment

| Campaign Batch | Count | Category | Risk Level | Action Needed |
|----------------|-------|----------|------------|---------------|
| Feature Campaigns | 5 | Marketing | 🔴 HIGH | Add preference filter |
| Original Talent | 10 | Marketing | 🔴 HIGH | Add preference filter |
| Contributor | 5 | Marketing | 🔴 HIGH | Add preference filter |
| Equipment | 2 | Marketing | 🔴 HIGH | Add preference filter |
| Collaborative | 4 | Marketing | 🔴 HIGH | Add preference filter |
| Two-Way Updated | 10 | Marketing | 🔴 HIGH | Add preference filter |
| **TOTAL** | **36** | **Marketing** | **🔴 HIGH** | **Fix before sending** |

---

## ✅ Proper Email Category Classification

### **Transactional (Always Send - No Opt-Out):**
- Welcome emails
- Email verification
- Password resets
- Booking confirmations
- Payment receipts
- Security alerts

### **Operational (Can Disable):**
- Gig published (if you created it)
- New application (on your gig)
- Message received
- Shoot reminders

### **Marketing (OPT-IN REQUIRED):**
- **All 36 campaigns we created** ← These!
- Weekly tips
- Feature announcements
- Success stories
- Promotions

---

## 🚨 Action Required Before Sending

### **Step 1: Fix Database Default**
```bash
# Run this SQL in Supabase dashboard
ALTER TABLE notification_preferences 
ALTER COLUMN marketing_notifications SET DEFAULT false;

UPDATE notification_preferences 
SET marketing_notifications = false;
```

### **Step 2: Update PlunkCampaignsService**
Add preference filtering (see Fix #2 above)

### **Step 3: Test End-to-End**
1. Create test user
2. Verify marketing_notifications = false by default
3. Try sending campaign → Should skip user
4. Opt-in to marketing
5. Try sending campaign → Should receive
6. Click unsubscribe → Should work

### **Step 4: Send Campaigns Safely**
Only send to users where `marketing_notifications = true`

---

## 📋 Implementation Checklist

### Database ✅
- [x] notification_preferences table exists
- [ ] ❌ **marketing_notifications defaults to FALSE** (currently TRUE)
- [x] RLS policies in place
- [x] API routes work

### Backend ⚠️
- [x] EmailPreferenceChecker service exists
- [ ] ❌ **PlunkCampaignsService doesn't use it**
- [x] Unsubscribe endpoints work
- [ ] ⚠️ **Need to filter campaign recipients**

### Campaigns ⚠️
- [x] 36 campaigns created in Plunk
- [ ] ❌ **Unsubscribe links missing user params**
- [ ] ⚠️ **No opt-in messaging in campaigns**
- [ ] ❌ **Campaigns will send to everyone (ignoring preferences)**

### Legal/Compliance ⚠️
- [ ] ❌ **Marketing opt-in required** (currently opt-out)
- [x] Unsubscribe link in all templates
- [ ] ⚠️ **Unsubscribe links won't work** (missing params)
- [ ] ❌ **Not GDPR compliant** (marketing defaults to ON)

---

## 💡 Quick Summary

### **✅ The Good News:**
- You have a **complete email preferences system** built!
- Unsubscribe page works great
- Database schema is solid
- All the infrastructure exists

### **❌ The Bad News:**
- Marketing emails default to **OPT-OUT instead of OPT-IN** 🚨
- The 36 campaigns won't respect preferences (no filtering)
- Unsubscribe links in campaigns won't work (missing params)

### **🎯 What This Means:**
**DO NOT SEND** the 36 campaigns until fixes are applied!

**Risk:** GDPR violations, high unsubscribe rates, spam complaints

---

## 🛠️ Solution: Three-Step Fix

### **Fix #1: Database Migration (5 minutes)**
```sql
-- Change marketing to OPT-IN
ALTER TABLE notification_preferences 
ALTER COLUMN marketing_notifications SET DEFAULT false;

UPDATE notification_preferences 
SET marketing_notifications = false;
```

### **Fix #2: Update Service (15 minutes)**
Add preference filtering to `PlunkCampaignsService.createCampaign()`

### **Fix #3: Campaign Templates (30 minutes)**
Either:
- **Option A:** Use Plunk's `{{unsubscribeUrl}}`
- **Option B:** Send campaigns via transactional API with variables

---

## 📊 Proper Campaign Sending Flow

### **Current (Wrong):**
```
Get 1000 users → Send campaign to all 1000 ❌
```

### **Correct (Fixed):**
```
Get 1000 users → Filter by role/location (500 users)
               → Filter by marketing opt-in (150 users)  ✅
               → Send campaign to 150 opted-in users ✓
```

---

## 🎯 Recommendation

**BEFORE sending any of the 36 campaigns:**

1. ✅ Run database migration (fix marketing default)
2. ✅ Update PlunkCampaignsService (add filtering)
3. ✅ Fix campaign templates (unsubscribe links)
4. ✅ Test with 5 users
5. ✅ Then send to larger audience

**OR:**

Create an **opt-in campaign first:**
- Subject: "Want to Receive Tips & Feature Updates?"
- Body: Explain benefits, ask users to opt-in
- CTA: "Yes, Send Me Tips" → Sets marketing_notifications = true
- Then send the 36 campaigns only to opted-in users

---

**Status:** ⚠️ **FIXES REQUIRED**  
**Priority:** 🔥 **HIGH** (Legal/Compliance)  
**Time to Fix:** ~1 hour  
**Impact:** Prevents GDPR issues, improves deliverability

---

*Last Updated: October 10, 2025*

