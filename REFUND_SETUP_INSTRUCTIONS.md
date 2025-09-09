# 🔧 Credit Refund System - Setup Instructions

## Current Status ✅
- ✅ Edge function deployed: `nanobanana-callback`
- ✅ Callback endpoint working: `https://zbsmgymyfhnwjdnmlelr.supabase.co/functions/v1/nanobanana-callback`
- ✅ Refund logic implemented
- ✅ Admin dashboard has Refunds tab
- ⏳ Database tables need to be created

## 📋 Steps to Complete Setup

### 1. Create Database Tables (REQUIRED)
The refund tables haven't been created yet. You need to:

1. Go to Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/sql/new
   ```

2. Copy the SQL from: `execute_refund_migration.sql`

3. Click "Run" to execute the migration

This will create:
- `refund_policies` table with default policies
- `refund_audit_log` table for tracking refunds
- Additional columns on `enhancement_tasks` table

### 2. Verify Tables Created
Run this command to check:
```bash
node scripts/deploy-refund-tables.js
```

You should see:
- ✅ Refund policies table exists
- ✅ Refund audit log table exists
- ✅ Enhancement tasks table has refund tracking columns

### 3. Configure NanoBanana Webhook
In your NanoBanana dashboard, set the webhook URL to:
```
https://zbsmgymyfhnwjdnmlelr.supabase.co/functions/v1/nanobanana-callback
```

This is where NanoBanana will send success/failure callbacks.

### 4. Test the Complete Flow
Once tables are created, run:
```bash
node scripts/test-complete-refund-flow.js
```

This will:
- Create a test enhancement task
- Simulate a failure
- Verify the user gets refunded
- Check the audit log

### 5. Monitor in Admin Dashboard
1. Sign in as admin:
   - Email: `admin@preset.ie`
   - Password: `AdminPreset2025!`

2. Go to: http://localhost:3000/admin

3. Click the "Refunds" tab to see:
   - Total refunds processed
   - Credits refunded
   - Platform losses
   - Refund rate
   - Recent refunds list

## 🔍 How It Works

### Success Flow:
1. User requests enhancement (1 credit deducted)
2. NanoBanana processes (uses 4 credits)
3. Success callback (code 200) received
4. Image saved to storage
5. User sees enhanced image

### Failure Flow:
1. User requests enhancement (1 credit deducted)
2. NanoBanana fails (still uses 4 credits)
3. Failure callback (code 400/500/501) received
4. User automatically refunded 1 credit
5. Platform loses 4 NanoBanana credits (tracked for accounting)

## 📊 Refund Policies

| Error Code | Error Type | Refund? | Amount |
|------------|------------|---------|--------|
| 400 | content_policy_violation | ✅ Yes | 100% |
| 500 | internal_error | ✅ Yes | 100% |
| 501 | generation_failed | ✅ Yes | 100% |
| - | storage_error | ✅ Yes | 100% |
| - | timeout | ✅ Yes | 100% |
| - | user_cancelled | ❌ No | 0% |
| - | invalid_input | ❌ No | 0% |

## 🚨 Monitoring

### Healthy Refund Rates:
- **< 1%**: Excellent
- **1-3%**: Normal
- **3-5%**: Concerning (investigate)
- **> 5%**: Critical (urgent action needed)

### Platform Loss Calculation:
```
Per failed enhancement:
- User impact: 0 (refunded)
- Platform loss: 4 NanoBanana credits
- Business cost: ~€0.004
```

## 📝 Testing Commands

### Test Callback Endpoint:
```bash
curl -X POST https://zbsmgymyfhnwjdnmlelr.supabase.co/functions/v1/nanobanana-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -d '{
    "code": 500,
    "msg": "Test failure",
    "data": {
      "taskId": "YOUR_TASK_ID",
      "info": {"resultImageUrl": ""}
    }
  }'
```

### Check Refund Policies:
```sql
SELECT * FROM refund_policies;
```

### View Recent Refunds:
```sql
SELECT * FROM refund_audit_log 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Platform Losses:
```sql
SELECT 
  COUNT(*) as total_refunds,
  SUM(credits_refunded) as user_credits_returned,
  SUM(platform_loss) as nanobanana_credits_lost
FROM refund_audit_log;
```

## ✅ Checklist
- [ ] Run SQL migration in Supabase Dashboard
- [ ] Verify tables created with `deploy-refund-tables.js`
- [ ] Configure NanoBanana webhook URL
- [ ] Test with `test-complete-refund-flow.js`
- [ ] Check admin dashboard Refunds tab
- [ ] Monitor refund rate daily

## 🆘 Troubleshooting

### "Table not found" errors:
→ Run the SQL migration first

### Callback returns 401:
→ Check the Authorization header has correct service key

### Users not getting refunded:
→ Check refund_policies table has correct settings
→ Verify callback endpoint is receiving webhooks
→ Check enhancement_tasks table has refund columns

### High refund rate:
→ Check for content policy issues in prompts
→ Monitor NanoBanana service status
→ Review error types in refund_audit_log

---

**Support**: If you encounter issues, check the logs in:
- Supabase Dashboard > Functions > Logs
- Admin Dashboard > Refunds tab
- `refund_audit_log` table in database