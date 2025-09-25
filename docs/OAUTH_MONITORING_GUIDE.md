# 🔐 Google OAuth Monitoring & Debugging Guide

This guide provides comprehensive monitoring and debugging tools for your Google OAuth implementation. Use these tools to track OAuth flows, identify issues, and ensure smooth user sign-up experiences.

## 🎯 Quick Start

### 1. Set Up Monitoring Tables

First, run the database migration to create monitoring tables:

```bash
# Apply the OAuth monitoring migration
supabase db push

# Or manually run the SQL file
# supabase/migrations/20250925100000_create_oauth_monitoring.sql
```

### 2. Initialize Monitoring System

```bash
# Run the setup script
node scripts/setup-oauth-monitoring.js
```

### 3. Start Real-Time Monitoring

```bash
# Start the real-time monitor
node scripts/monitor-oauth-realtime.js
```

## 📊 Monitoring Tools Overview

### 1. OAuth Monitor Dashboard (`/admin/oauth-monitor`)

**Access:** `http://localhost:3000/admin/oauth-monitor` (or your production URL)

**Features:**
- Real-time OAuth metrics
- Recent user registrations
- Success/failure rates
- User profile creation status
- Live OAuth attempt tracking

**Key Metrics:**
- Total users vs Google users
- OAuth attempts in the last hour
- Success rate percentage
- Users with/without profiles

### 2. Real-Time Monitor Script

**File:** `scripts/monitor-oauth-realtime.js`

**Features:**
- Console-based real-time monitoring
- Automatic error detection
- Alert system for high error rates
- Stuck session detection
- Color-coded event logging

**Usage:**
```bash
node scripts/monitor-oauth-realtime.js
```

**Console Output:**
```
🔵 OAuth started: google (session: oauth_1234567890_abc123)
✅ OAuth success: google (user: f47ac10b-58cc-4372-a567-0e02b2c3d479)
❌ OAuth error: google at callback - Invalid state parameter
👤 Profile created: google (user: f47ac10b-58cc-4372-a567-0e02b2c3d479)
```

### 3. SQL Diagnostic Queries

**File:** `scripts/oauth-diagnostics.sql`

**Usage:** Copy and paste sections into Supabase SQL Editor

**Key Queries:**
- System health overview
- Recent OAuth activity
- Error analysis by type
- User creation success rates
- Orphaned users (users without profiles)
- Performance metrics

**Quick Health Check:**
```sql
-- Copy this to Supabase SQL Editor for instant health check
SELECT 'OAuth System Health Check' as status;

-- Recent activity
SELECT 
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE event_type = 'oauth_start') as starts,
  COUNT(*) FILTER (WHERE event_type = 'oauth_success') as successes,
  COUNT(*) FILTER (WHERE event_type = 'oauth_error') as errors
FROM oauth_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours';
```

## 🚨 Common Issues & Solutions

### Issue 1: Users Created But No Profiles

**Symptoms:**
- Users appear in `auth.users` table
- No corresponding entries in `users_profile` table
- Users get stuck on profile creation page

**Diagnosis:**
```sql
-- Find users without profiles
SELECT 
  au.email,
  au.created_at,
  au.raw_app_meta_data->>'provider' as provider
FROM auth.users au 
LEFT JOIN users_profile up ON au.id = up.user_id
WHERE up.user_id IS NULL;
```

**Solutions:**
1. Check if profile creation triggers are working
2. Verify RLS policies allow profile creation
3. Check for database constraint violations
4. Review callback page profile creation logic

### Issue 2: High OAuth Error Rate

**Symptoms:**
- Many `oauth_error` events in logs
- Users report sign-in failures
- Low success rate in metrics

**Diagnosis:**
```sql
-- Analyze error patterns
SELECT 
  error_code,
  step,
  COUNT(*) as error_count,
  error_message
FROM oauth_logs
WHERE event_type = 'oauth_error'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY error_code, step, error_message
ORDER BY error_count DESC;
```

**Common Causes:**
- Incorrect Google OAuth configuration
- Missing or wrong environment variables
- Redirect URI mismatches
- Invalid client ID/secret

### Issue 3: Stuck OAuth Sessions

**Symptoms:**
- Sessions start but never complete
- Users redirected but auth fails
- Incomplete flows in monitoring

**Diagnosis:**
```sql
-- Find incomplete sessions
SELECT 
  session_id,
  provider,
  MIN(timestamp) as started_at,
  array_agg(DISTINCT event_type) as events
FROM oauth_logs
WHERE timestamp > NOW() - INTERVAL '2 hours'
  AND session_id IS NOT NULL
GROUP BY session_id, provider
HAVING NOT ('oauth_success' = ANY(array_agg(event_type)) OR 'oauth_error' = ANY(array_agg(event_type)))
ORDER BY started_at DESC;
```

**Solutions:**
1. Check callback URL configuration
2. Verify network connectivity
3. Review callback page error handling
4. Check for JavaScript errors in browser

## 🔧 Configuration Checklist

### Google Cloud Console

Verify your Google OAuth settings:

1. **Client ID & Secret:** Set in environment variables
   ```env
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_client_id
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_client_secret
   ```

2. **Authorized Redirect URIs:**
   - Development: `http://127.0.0.1:54321/auth/v1/callback`
   - Production: `https://your-project.supabase.co/auth/v1/callback`

3. **Authorized JavaScript Origins:**
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

### Supabase Configuration

Check `supabase/config.toml`:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
skip_nonce_check = true
```

### Environment Variables

Required variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth (set these in Supabase environment)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

## 📈 Monitoring Best Practices

### 1. Regular Health Checks

Run daily health checks:
```bash
# Quick health check
node scripts/setup-oauth-monitoring.js

# Detailed analysis
# Copy oauth-diagnostics.sql to Supabase SQL Editor
```

### 2. Set Up Alerts

Configure the real-time monitor with alerts:

```javascript
// In scripts/monitor-oauth-realtime.js
// Uncomment and configure Slack webhooks for alerts
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
```

### 3. Monitor Key Metrics

Track these metrics daily:
- OAuth success rate (should be >90%)
- Users without profiles (should be <5%)
- Average OAuth completion time
- Error patterns and frequencies

### 4. Weekly Reviews

Review weekly:
- Top error types and causes
- User journey completeness
- System performance trends
- Profile creation success rates

## 🛠️ Debugging Workflow

When OAuth issues occur:

1. **Check Real-Time Monitor**
   ```bash
   node scripts/monitor-oauth-realtime.js
   ```

2. **Run Quick Diagnostics**
   ```sql
   SELECT * FROM get_oauth_metrics(24); -- Last 24 hours
   SELECT * FROM get_recent_oauth_errors(10); -- Last 10 errors
   ```

3. **Analyze User Journey**
   ```sql
   SELECT * FROM get_user_oauth_journey('user-id-here');
   ```

4. **Check System Health**
   ```sql
   SELECT * FROM diagnose_oauth_system();
   ```

5. **Review Application Logs**
   - Check browser console for JavaScript errors
   - Review Supabase Auth logs
   - Check callback page console outputs

## 🚀 Advanced Features

### Custom Event Logging

Add custom OAuth logging to your components:

```typescript
import { oauthLogger } from '@/lib/services/oauth-logger.service'

// Log custom events
await oauthLogger.logOAuthStart('google', sessionId, metadata)
await oauthLogger.logOAuthError('google', sessionId, 'Custom error', 'step')
```

### Performance Monitoring

Track OAuth flow performance:

```sql
-- Average OAuth completion times
SELECT 
  provider,
  COUNT(*) as completed_flows,
  AVG(duration_ms) as avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration
FROM oauth_logs
WHERE duration_ms IS NOT NULL
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY provider;
```

### User Journey Analysis

Analyze complete user journeys:

```sql
-- Complete user registration flows
SELECT 
  session_id,
  provider,
  MIN(timestamp) as started,
  MAX(timestamp) as completed,
  EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration_seconds,
  array_agg(event_type ORDER BY timestamp) as journey
FROM oauth_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY session_id, provider
HAVING 'oauth_success' = ANY(array_agg(event_type))
ORDER BY duration_seconds DESC;
```

## 📞 Support & Troubleshooting

If you continue to experience OAuth issues:

1. **Check Environment:** Ensure all environment variables are set correctly
2. **Review Logs:** Use the monitoring tools to identify specific error patterns
3. **Test Flow:** Manually test the OAuth flow and watch real-time monitor
4. **Database State:** Verify database triggers and RLS policies are working
5. **Network Issues:** Check for connectivity issues between Supabase and Google

**Common Environment Issues:**
- Missing `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`
- Incorrect redirect URIs in Google Console
- Wrong Supabase project URL
- Expired or invalid Google OAuth credentials

**Database Issues:**
- Missing oauth_logs table (run migration)
- RLS policies blocking inserts
- Trigger functions not enabled
- Foreign key constraint violations

With these monitoring tools, you should be able to quickly identify and resolve any Google OAuth issues in your application.
