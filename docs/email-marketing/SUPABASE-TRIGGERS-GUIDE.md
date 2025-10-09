# 📨 Supabase Email Triggers - Complete Guide

## 🎯 Overview

Automated email system that sends emails when database events occur.

---

## ✅ What's Been Set Up

### Database Triggers:
1. ✅ Welcome email (on user profile created)
2. ✅ Gig published (on gig status → PUBLISHED)
3. ✅ New application (on application created)
4. ✅ Application status changes (shortlisted, accepted, declined)
5. ✅ Application milestones (50%, 80% full)
6. ✅ Credits low warning (< 5 credits)

### Scheduled Jobs (run via cron):
7. ✅ Shoot reminders (24h before gig)
8. ✅ Deadline approaching (24h before deadline)
9. ✅ Profile completion reminders (3-7 days after signup)

### API Endpoints:
- ✅ `/api/emails/welcome` - Welcome email
- ✅ `/api/emails/gig-published` - Gig published
- ✅ `/api/emails/new-application` - New application
- ✅ `/api/emails/application-status` - Status changes

---

## 📊 Trigger Flow

```
Database Event
    ↓
Trigger Function
    ↓
call_email_api()
    ↓
HTTP POST to /api/emails/*
    ↓
getEmailEventsService()
    ↓
Check Preferences
    ↓
Send Email via Plunk
```

---

## 🚀 How to Deploy

### 1. Run Migration

```bash
# Apply the migration
supabase migration up

# Or apply specific migration
psql $DATABASE_URL -f supabase/migrations/20251009120000_email_triggers.sql
```

### 2. Configure Base URL

```sql
-- Set your app URL for production
ALTER DATABASE postgres SET app.base_url = 'https://presetie.com';

-- For development
ALTER DATABASE postgres SET app.base_url = 'http://localhost:3000';
```

### 3. Enable pg_cron (Optional - for scheduled jobs)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule shoot reminders (hourly)
SELECT cron.schedule(
  'shoot-reminders',
  '0 * * * *',
  'SELECT send_shoot_reminders()'
);

-- Schedule deadline reminders (hourly)
SELECT cron.schedule(
  'deadline-reminders',
  '0 * * * *',
  'SELECT send_deadline_reminders()'
);

-- Schedule profile completion reminders (daily at 10am)
SELECT cron.schedule(
  'profile-completion-reminders',
  '0 10 * * *',
  'SELECT send_profile_completion_reminders()'
);
```

---

## 📋 Trigger Details

### 1. Welcome Email

**Trigger:** `AFTER INSERT ON users_profile`

**Fires when:** New user creates account

**Sends to:** New user

**Email:** Welcome email with role-specific content

```sql
-- Example
INSERT INTO users_profile (user_id, display_name, role_flags)
VALUES ('user-id', 'John Doe', ARRAY['TALENT']::user_role[]);

-- ✅ Triggers welcome email automatically
```

---

### 2. Gig Published

**Trigger:** `AFTER INSERT OR UPDATE ON gigs`

**Fires when:** Gig status changes to PUBLISHED

**Sends to:** Gig owner

**Email:** Gig published confirmation with details

```sql
-- Example
UPDATE gigs 
SET status = 'PUBLISHED' 
WHERE id = 'gig-id';

-- ✅ Triggers gig published email
```

---

### 3. New Application

**Trigger:** `AFTER INSERT ON applications`

**Fires when:** Talent applies to gig

**Sends to:** 
- Gig owner (new application notification)
- Applicant (application confirmation)

```sql
-- Example
INSERT INTO applications (gig_id, applicant_user_id, note)
VALUES ('gig-id', 'applicant-id', 'I would love to work on this!');

-- ✅ Triggers 2 emails:
--   1. To gig owner: "New application received"
--   2. To applicant: "Application sent successfully"
```

---

### 4. Application Status Changes

**Trigger:** `AFTER UPDATE ON applications`

**Fires when:** Application status changes

**Sends to:** Applicant

**Emails:**
- SHORTLISTED → "You have been shortlisted"
- ACCEPTED → "Congratulations! You are booked"
- DECLINED → "Application update" with recommended gigs

```sql
-- Example
UPDATE applications 
SET status = 'ACCEPTED' 
WHERE id = 'application-id';

-- ✅ Triggers booking confirmation email
```

---

### 5. Application Milestones

**Trigger:** `AFTER INSERT ON applications`

**Fires when:** Application count reaches 50% or 80% of max

**Sends to:** Gig owner

**Email:** "Application milestone reached"

```sql
-- Example: Gig with max_applicants = 20
-- When 10th application comes in (50%):
-- ✅ Triggers milestone email

-- When 16th application comes in (80%):
-- ✅ Triggers milestone email
```

---

### 6. Scheduled: Shoot Reminders

**Function:** `send_shoot_reminders()`

**Runs:** Hourly via pg_cron

**Finds:** Gigs starting in 24 hours

**Sends to:** Gig owner and booked talent

```sql
-- Manually trigger
SELECT send_shoot_reminders();
```

---

### 7. Scheduled: Deadline Approaching

**Function:** `send_deadline_reminders()`

**Runs:** Hourly via pg_cron

**Finds:** Gigs with deadlines in 24 hours

**Sends to:** Gig owner

```sql
-- Manually trigger
SELECT send_deadline_reminders();
```

---

### 8. Scheduled: Profile Completion

**Function:** `send_profile_completion_reminders()`

**Runs:** Daily at 10 AM

**Finds:** Incomplete profiles (3-7 days old, < 75% complete)

**Sends to:** User

```sql
-- Manually trigger
SELECT send_profile_completion_reminders();
```

---

## 🔍 Monitoring & Debugging

### View Email Logs

```sql
-- All recent email attempts
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 50;

-- Failed emails
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- Emails by endpoint
SELECT 
  endpoint,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM email_logs
GROUP BY endpoint;
```

---

### Test Triggers Manually

```sql
-- Test welcome email
SELECT call_email_api(
  '/api/emails/welcome',
  jsonb_build_object(
    'authUserId', 'user-auth-id',
    'name', 'Test User',
    'role', 'TALENT'
  )
);

-- Test gig published
SELECT call_email_api(
  '/api/emails/gig-published',
  jsonb_build_object(
    'gigId', 'gig-id',
    'ownerId', 'owner-profile-id'
  )
);
```

---

## 🛠️ Customization

### Disable Specific Trigger

```sql
-- Disable welcome email trigger
ALTER TABLE users_profile DISABLE TRIGGER welcome_email_trigger;

-- Re-enable
ALTER TABLE users_profile ENABLE TRIGGER welcome_email_trigger;
```

---

### Add New Trigger

```sql
-- Example: Email on gig completion
CREATE OR REPLACE FUNCTION trigger_gig_completed_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    PERFORM call_email_api(
      '/api/emails/gig-completed',
      jsonb_build_object(
        'gigId', NEW.id,
        'ownerId', NEW.owner_user_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS gig_completed_trigger ON gigs;
CREATE TRIGGER gig_completed_trigger
  AFTER UPDATE ON gigs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gig_completed_email();
```

---

## ⚠️ Important Notes

### 1. Async Processing
- Triggers use `pg_net.http_post()` for async requests
- Emails don't block database transactions
- Failed emails are logged but don't fail transactions

### 2. Idempotency
- Triggers check status changes to avoid duplicates
- Application milestone checks ranges (50-55%, 80-85%)

### 3. Error Handling
- Errors are logged to `email_logs`
- Database operations continue even if email fails
- Warnings logged but transactions succeed

### 4. Performance
- Triggers are lightweight (just HTTP calls)
- Email processing happens in API routes
- No blocking of user actions

---

## 🧪 Testing

### Test Complete Flow

```bash
# 1. Create test user (triggers welcome email)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","role":"TALENT"}'

# 2. Check email logs
psql $DATABASE_URL -c "SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;"

# 3. Verify email was sent (check Plunk dashboard)
```

---

## 📚 Summary

### Automated Emails:
- ✅ 9 trigger functions
- ✅ 4 real-time triggers
- ✅ 3 scheduled jobs
- ✅ 4 API endpoints
- ✅ Email logging system

### Benefits:
- ✅ Zero manual email sending
- ✅ Consistent user experience
- ✅ Preference checking built-in
- ✅ Easy to monitor and debug
- ✅ Scalable and maintainable

---

**Supabase triggers are ready to automate your email system!** 🚀

