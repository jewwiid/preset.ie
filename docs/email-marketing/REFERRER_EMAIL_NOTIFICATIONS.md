# Referrer Email Notifications - Complete Guide

## 📧 Yes! Referrers Get Emails at EVERY Step

I've implemented a **complete email notification system** that keeps referrers informed throughout the entire referral journey.

## 🎯 Email Timeline

### Step 1: Someone Signs Up ✅ **NEW!**
**Email:** "Someone just used your invite code! 🎊"
**When:** Immediately when user creates account
**Trigger:** Automatic (no code needed)

```
User signs up with invite code
     ↓
Referrer gets email INSTANTLY
     ↓
"John Doe just signed up using your code ABC123!"
```

**What the email includes:**
- ✅ Who signed up (name)
- ✅ Which invite code was used
- ✅ Reminder: "You'll earn 5 credits once they complete their profile"
- ✅ Shareable invite link to get more signups
- ✅ Link to dashboard

---

### Step 2: They Complete Profile ✅ **EXISTING**
**Email:** "You earned 5 credits! 🎉"
**When:** When invitee completes their profile
**Trigger:** Automatic (no code needed)

```
Invitee completes profile
     ↓
Referrer gets email
     ↓
"You earned 5 credits from Jane Smith completing their profile!"
```

**What the email includes:**
- ✅ Credits earned (+5)
- ✅ Who completed their profile
- ✅ New credit balance
- ✅ Link to dashboard

---

## 📂 Files Created/Modified

### New File:
- ✅ `/api/emails/new-signup-notification/route.ts` - Instant signup notification

### Modified File:
- ✅ `/api/auth/signup/route.ts` - Now triggers signup notification

### Existing Files:
- ✅ `/api/emails/referral-success/route.ts` - Profile completion notification
- ✅ `/api/emails/welcome-with-invite/route.ts` - New user welcome

---

## 🎨 Email Designs

### Email #1: New Signup Notification

```
Subject: Someone just used your invite code! 🎊

Great news, Sarah!
Someone just signed up to Preset using your invite code!

┌─────────────────────────────┐
│   YOUR INVITE CODE          │
│   ABC12345                  │
│   John Doe just joined!     │
└─────────────────────────────┘

⏳ Almost there!
You'll earn 5 credits once they complete their profile.

How to Earn More:
1. Keep sharing your invite code: ABC12345
2. More signups = more potential credits
3. Earn 5 credits for each user who completes their profile

Your Shareable Link:
https://presetie.com/auth/signup?invite=ABC12345

[View Dashboard]
```

### Email #2: Referral Success

```
Subject: You earned 5 credits! 🎉

Great news, Sarah!
Someone you invited just completed their profile on Preset!

┌─────────────────────────────┐
│  Your Referral Reward       │
│  +5 Credits                 │
└─────────────────────────────┘

John Doe is now an active member thanks to you!

Keep sharing your invite code to earn more credits.
Every completed referral gets you 5 credits!

[View Your Dashboard]
```

---

## 🔔 Notification Flow Examples

### Example 1: Single Referral
```
Day 1, 10:00 AM - User signs up
→ Referrer gets: "Someone just used your invite code!"

Day 1, 10:15 AM - User completes profile
→ Referrer gets: "You earned 5 credits!"

Result: 2 emails, 5 credits earned
```

### Example 2: Multiple Referrals
```
Monday - Alice signs up
→ Email: "Alice used your code!"

Tuesday - Bob signs up
→ Email: "Bob used your code!"

Wednesday - Alice completes profile
→ Email: "You earned 5 credits from Alice!"

Thursday - Bob completes profile
→ Email: "You earned 5 credits from Bob!"

Result: 4 emails, 10 credits earned
```

### Example 3: Signup Without Completion
```
Day 1 - User signs up
→ Email: "Someone used your code!"

Day 2-30 - User hasn't completed profile
→ No more emails (they might complete later)

Result: 1 email, 0 credits (pending)
```

---

## 🎯 What Triggers Each Email

### New Signup Notification (Instant)
**Triggered in:** `/api/auth/signup/route.ts` (lines 216-244)
```typescript
// Automatically called when:
1. User creates account
2. Invite code is provided
3. Code belongs to a user (not admin code)

// Email sent to: Referrer
// Email contains: New user's name, invite code, shareable link
```

### Referral Success (On Completion)
**Triggered in:** `/api/referrals/complete-profile/route.ts` (line ~130)
```typescript
// Automatically called when:
1. User completes their profile
2. User was invited (has invited_by_code)
3. Referrer found

// Email sent to: Referrer
// Email contains: Credits earned, new user's name
```

---

## 🚀 Setup Required

### None! 🎉

Both emails are **already integrated** and work automatically:

1. ✅ Signup notification - triggers on signup
2. ✅ Completion notification - triggers on profile completion

Just make sure you have:
```bash
# In .env
PLUNK_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=https://presetie.com
```

---

## 🧪 Testing

### Test Signup Notification:
```bash
# This happens automatically when someone signs up with a code
# To manually test the email endpoint:

curl -X POST http://localhost:3000/api/emails/new-signup-notification \
  -H "Content-Type: application/json" \
  -d '{
    "referrerUserId": "user-uuid-here",
    "referrerName": "Sarah Jones",
    "newUserName": "John Doe",
    "inviteCode": "ABC12345"
  }'
```

### Test Completion Notification:
```bash
curl -X POST http://localhost:3000/api/emails/referral-success \
  -H "Content-Type: application/json" \
  -d '{
    "referrerUserId": "user-uuid-here",
    "referrerName": "Sarah Jones",
    "creditsEarned": 5,
    "newUserName": "John Doe"
  }'
```

### End-to-End Test:
1. Sign up with invite code `ABC123`
2. Check referrer's email → Should get "Someone just used your invite code!"
3. Complete your profile
4. Check referrer's email → Should get "You earned 5 credits!"

---

## 📊 Email Statistics to Track

In your Plunk dashboard, monitor:

1. **Signup Notifications:**
   - Delivery rate (should be ~100%)
   - Open rate (target: 60%+)
   - Click-through rate on shareable link (target: 30%+)

2. **Referral Success:**
   - Delivery rate (should be ~100%)
   - Open rate (target: 70%+ - more exciting!)
   - Click-through rate on dashboard link (target: 50%+)

---

## 🎨 Customization Options

### Change Email Content:

Edit these files:
- `/api/emails/new-signup-notification/route.ts` - Signup email
- `/api/emails/referral-success/route.ts` - Credits earned email

### Add More Emails:

Consider adding:
1. **Reminder Email** - "Your invite code is waiting to be shared!"
2. **Milestone Email** - "You've referred 10 people!"
3. **Leaderboard Email** - "You're in the top 10 referrers!"

---

## 🔒 Privacy & Preferences

### Email Preferences (Optional Enhancement):

Allow users to control which emails they receive:

```typescript
// Add to user profile
email_preferences: {
  signup_notifications: true,    // Someone signs up
  referral_success: true,        // Credits earned
  weekly_summary: false,         // Weekly referral stats
  leaderboard_updates: false     // Ranking changes
}
```

### Who Can See What:

- ✅ Referrer sees: Name of person who signed up
- ✅ New user sees: Nothing about referrer (privacy)
- ✅ Admin sees: Full referral chain

---

## 🎁 Email Features

### Both emails include:

1. **Personalization**
   - Referrer's name
   - New user's name
   - Specific invite code used

2. **Clear CTAs**
   - Dashboard links
   - Shareable invite links
   - Copy-friendly code display

3. **Visual Appeal**
   - Gradient backgrounds
   - Large, readable codes
   - Mobile-responsive

4. **Actionable Info**
   - Exact steps to earn more
   - Current status (pending/completed)
   - Links to track progress

---

## 💡 Best Practices

### For Referrers:

1. **First Email (Signup):**
   - Creates excitement and urgency
   - Encourages sharing more while momentum is high
   - Sets expectation for future credit

2. **Second Email (Completion):**
   - Provides immediate gratification
   - Confirms credit awarded
   - Motivates continued sharing

### Email Timing:

- ✅ Signup notification: **Instant** (within seconds)
- ✅ Completion notification: **Instant** (when profile done)
- ❌ No delay or batching needed

---

## 🔔 Summary

**What happens when someone uses an invite code:**

1️⃣ **User signs up** → Referrer gets email: "Someone used your code!"
2️⃣ **User completes profile** → Referrer gets email: "You earned 5 credits!"
3️⃣ **New user** → Gets welcome email with their own invite code

**Total emails per successful referral:**
- Referrer: 2 emails (signup + completion)
- New user: 1 email (welcome)

**All automatic, no manual triggers needed!** ✅

---

## 📞 Support

If emails aren't sending:
1. Check PLUNK_API_KEY in `.env`
2. Check Plunk dashboard for delivery status
3. Check server logs for errors
4. Verify email addresses are valid
5. Check spam folder

Need help? See `PLUNK_EMAIL_SETUP.md` for full documentation.
