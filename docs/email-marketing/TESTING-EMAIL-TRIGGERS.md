# 🧪 Testing Email Triggers - Complete Guide

## 🎯 Pre-Test Checklist

### 1. ✅ Database Setup

**Check if functions exist:**
```sql
-- Check call_email_api function
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'call_email_api';

-- Check email_logs table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'email_logs';

-- Check triggers
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%';
```

**Set base URL:**
```sql
-- For development
ALTER DATABASE postgres SET app.base_url = 'http://localhost:3000';

-- For production
ALTER DATABASE postgres SET app.base_url = 'https://presetie.com';

-- Verify
SELECT current_setting('app.base_url', true);
```

---

### 2. ✅ API Routes (CRITICAL)

**These routes MUST exist for triggers to work:**

```
/api/emails/welcome
/api/emails/gig-published
/api/emails/new-application
/api/emails/application-status
/api/emails/application-withdrawn
/api/emails/applications-closed
/api/emails/gig-completed
/api/emails/gig-cancelled
/api/emails/subscription-changed
/api/emails/marketplace/preset-sold
/api/emails/marketplace/preset-purchased
/api/emails/messaging/new-message
```

**Quick test - check if route exists:**
```bash
curl http://localhost:3000/api/emails/welcome -X POST \
  -H "Content-Type: application/json" \
  -d '{"authUserId":"test","name":"Test","role":"TALENT"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

---

### 3. ✅ Email Service Running

**Check environment variables:**
```bash
# .env file should have:
PLUNK_API_KEY=sk_xxxxx
NEXT_PUBLIC_PLUNK_PUBLIC_KEY=pk_xxxxx
```

**Test email service directly:**
```bash
curl http://localhost:3000/api/test-all-emails -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"support@presetie.com","testType":"onboarding"}'
```

---

## 🧪 TEST SCENARIOS

### Test 1: User Signup → Welcome Email

**What triggers:**
- `users_profile` INSERT
- → `trigger_welcome_email()`
- → POST `/api/emails/welcome`
- → `sendWelcomeEmail()`
- → Email sent via Plunk

**How to test:**

1. **Create a new user:**
```bash
# Via your signup API
curl http://localhost:3000/api/auth/signup -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "TALENT"
  }'
```

2. **Check email_logs table:**
```sql
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected result:**
```
endpoint: /api/emails/welcome
payload: {"authUserId":"...", "name":"Test User", "role":"TALENT"}
status: pending (or completed)
```

3. **Check Plunk dashboard:**
- Login to https://app.useplunk.com
- Check "Events" or "Emails" tab
- Should see "user.signup" event or welcome email

**Troubleshooting:**
```sql
-- If no log entry
-- 1. Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'welcome_email_trigger';

-- 2. Check function
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'trigger_welcome_email';

-- 3. Test trigger manually
SELECT call_email_api(
  '/api/emails/welcome',
  jsonb_build_object(
    'authUserId', 'test-user-id',
    'name', 'Manual Test',
    'role', 'TALENT'
  )
);
```

---

### Test 2: Gig Published

**What triggers:**
- `gigs` UPDATE → status = 'PUBLISHED'
- → `trigger_gig_published_email()`
- → POST `/api/emails/gig-published`

**How to test:**

1. **Create a gig (as draft):**
```sql
INSERT INTO gigs (
  owner_user_id,
  title,
  description,
  comp_type,
  location_text,
  start_time,
  end_time,
  application_deadline,
  max_applicants,
  usage_rights,
  status
) VALUES (
  (SELECT id FROM users_profile LIMIT 1),
  'Test Gig',
  'Testing email triggers',
  'TFP',
  'Dublin',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '2 hours',
  NOW() + INTERVAL '5 days',
  20,
  'Social media only',
  'DRAFT'
);
```

2. **Publish the gig:**
```sql
UPDATE gigs 
SET status = 'PUBLISHED' 
WHERE title = 'Test Gig';
```

3. **Check email_logs:**
```sql
SELECT * FROM email_logs 
WHERE endpoint = '/api/emails/gig-published'
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:** New log entry with gig details

---

### Test 3: New Application

**What triggers:**
- `applications` INSERT
- → `trigger_new_application_email()`
- → 2 emails: owner + applicant

**How to test:**

1. **Create application:**
```sql
INSERT INTO applications (
  gig_id,
  applicant_user_id,
  note,
  status
) VALUES (
  (SELECT id FROM gigs WHERE status = 'PUBLISHED' LIMIT 1),
  (SELECT id FROM users_profile WHERE id != (SELECT owner_user_id FROM gigs WHERE status = 'PUBLISHED' LIMIT 1) LIMIT 1),
  'I would love to work on this project!',
  'PENDING'
);
```

2. **Check email_logs:**
```sql
SELECT * FROM email_logs 
WHERE endpoint = '/api/emails/new-application'
ORDER BY created_at DESC;
```

**Expected:** 1 log entry (triggers 2 emails internally)

---

### Test 4: Application Status Change

**What triggers:**
- `applications` UPDATE → status changed
- → Different email per status

**How to test:**

1. **Shortlist application:**
```sql
UPDATE applications 
SET status = 'SHORTLISTED' 
WHERE status = 'PENDING' 
LIMIT 1;
```

2. **Accept application:**
```sql
UPDATE applications 
SET status = 'ACCEPTED' 
WHERE status = 'SHORTLISTED' 
LIMIT 1;
```

3. **Check logs:**
```sql
SELECT * FROM email_logs 
WHERE endpoint = '/api/emails/application-status'
ORDER BY created_at DESC;
```

---

### Test 5: Messaging

**What triggers:**
- `messages` INSERT
- → `trigger_message_received_email()`

**How to test:**

1. **Send a message:**
```sql
INSERT INTO messages (
  gig_id,
  from_user_id,
  to_user_id,
  body
) VALUES (
  (SELECT id FROM gigs LIMIT 1),
  (SELECT id FROM users_profile LIMIT 1),
  (SELECT id FROM users_profile OFFSET 1 LIMIT 1),
  'Hi! I am interested in collaborating on this gig.'
);
```

2. **Check logs:**
```sql
SELECT * FROM email_logs 
WHERE endpoint = '/api/emails/messaging/new-message'
ORDER BY created_at DESC;
```

---

### Test 6: Preset Marketplace

**What triggers:**
- `preset_purchases` INSERT (payment_status = 'completed')
- → 2 emails: seller + buyer

**How to test:**

1. **Simulate a purchase:**
```sql
INSERT INTO preset_purchases (
  preset_id,
  listing_id,
  buyer_user_id,
  seller_user_id,
  purchase_price,
  platform_fee,
  seller_payout,
  payment_status
) VALUES (
  (SELECT id FROM presets WHERE is_for_sale = true LIMIT 1),
  (SELECT id FROM preset_marketplace_listings LIMIT 1),
  (SELECT user_id FROM users_profile LIMIT 1),
  (SELECT seller_user_id FROM preset_marketplace_listings LIMIT 1),
  50,
  5,
  45,
  'completed'
);
```

2. **Check logs:**
```sql
SELECT * FROM email_logs 
WHERE endpoint LIKE '/api/emails/marketplace%'
ORDER BY created_at DESC;
```

---

## 🔍 Monitoring & Debugging

### View All Recent Email Logs
```sql
SELECT 
  endpoint,
  payload->>'authUserId' as user_id,
  created_at,
  status
FROM email_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Check Email Success Rate
```sql
SELECT 
  endpoint,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM email_logs
GROUP BY endpoint
ORDER BY total_emails DESC;
```

### Find Failed Emails
```sql
SELECT 
  endpoint,
  payload,
  error,
  created_at
FROM email_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

---

## 🚨 Common Issues & Fixes

### Issue 1: No email_logs entries

**Problem:** Trigger not firing

**Fix:**
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers;

-- Re-create trigger if missing
-- (Re-run the migration file)
```

---

### Issue 2: email_logs entry but no email sent

**Problem:** API route doesn't exist or failing

**Fix:**
1. Check if dev server is running: `npm run dev`
2. Check if route exists: `curl http://localhost:3000/api/emails/welcome`
3. Check server logs for errors

---

### Issue 3: "call_email_api function does not exist"

**Problem:** Core email trigger migration not run

**Fix:**
```sql
-- Run the core migration first
\i supabase/migrations/20251009120000_email_triggers.sql
```

---

### Issue 4: Email sent but not received

**Problem:** Email preferences or Plunk configuration

**Check:**
1. User's email preferences:
```sql
SELECT * FROM notification_preferences 
WHERE user_id = 'your-user-id';
```

2. Plunk dashboard for delivery status

3. Email going to spam?

---

## ✅ Success Criteria

### For a Complete Test:

1. **✅ Signup Test**
   - [ ] User created in database
   - [ ] Log entry in email_logs
   - [ ] API route called successfully
   - [ ] Email visible in Plunk dashboard
   - [ ] Email received in inbox

2. **✅ Gig Test**
   - [ ] Gig published
   - [ ] Log entry created
   - [ ] Owner receives email

3. **✅ Application Test**
   - [ ] Application created
   - [ ] 2 log entries (owner + applicant)
   - [ ] Both emails sent

4. **✅ Status Change Test**
   - [ ] Status updated
   - [ ] Appropriate email sent
   - [ ] Correct email template used

---

## 🎯 Quick Test Script

```bash
#!/bin/bash

echo "🧪 Testing Email Triggers..."

# Test 1: Check if functions exist
echo "1. Checking database functions..."
psql $DATABASE_URL -c "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'call_email_api';"

# Test 2: Check triggers
echo "2. Checking triggers..."
psql $DATABASE_URL -c "SELECT count(*) as trigger_count FROM information_schema.triggers WHERE trigger_name LIKE '%email%';"

# Test 3: Check email_logs table
echo "3. Checking email_logs table..."
psql $DATABASE_URL -c "SELECT count(*) FROM email_logs;"

# Test 4: Test API route
echo "4. Testing API route..."
curl -s http://localhost:3000/api/emails/welcome \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"authUserId":"test","name":"Test","role":"TALENT"}' \
  | jq .

echo "✅ Tests complete!"
```

---

## 📊 Expected Flow Diagram

```
User Signs Up
    ↓
users_profile INSERT
    ↓
trigger_welcome_email() fires
    ↓
call_email_api('/api/emails/welcome', {...})
    ↓
Log to email_logs table
    ↓
HTTP POST to API route
    ↓
getEmailEventsService()
    ↓
Check user preferences
    ↓
Send via Plunk
    ↓
Email delivered! ✅
```

---

**Ready to test? Start with the signup test!** 🚀

Let me know what happens and I'll help troubleshoot any issues!

