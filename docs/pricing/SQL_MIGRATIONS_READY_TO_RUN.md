# 🚀 SQL Migrations - Ready to Run

**Date:** 2025-01-14
**Status:** Ready to execute manually in Supabase Dashboard

---

## ✅ What's Fixed

Your `subscription_tiers` table had **lowercase** names (`free`, `plus`, `pro`) but the enum and code use **UPPERCASE** (`FREE`, `PLUS`, `PRO`).

**Migration 2 now:**
1. Converts lowercase → UPPERCASE
2. Adds CREATOR tier
3. Updates tier limits to better values

---

## 📝 Run These Migrations in Order

### Migration 1: Add CREATOR to Enum
**File:** `supabase/migrations/20250114000001_add_creator_tier.sql`

**What it does:**
- Adds `CREATOR` to the `subscription_tier` enum
- Verifies the enum now has: FREE, PLUS, PRO, CREATOR

**Expected Output:**
```
NOTICE: Current subscription_tier values: {FREE,PLUS,PRO,CREATOR}
ALTER TYPE
COMMENT
```

---

### Migration 2: Fix Lowercase & Add CREATOR Config
**File:** `supabase/migrations/20250114000002_update_subscription_tiers_table.sql`

**What it does:**
- Fixes `free` → `FREE`, `plus` → `PLUS`, `pro` → `PRO`
- Adds CREATOR tier config
- Updates tier limits

**Expected Output:**
```
UPDATE 1  (for FREE update)
UPDATE 1  (for PLUS update)
UPDATE 1  (for PRO update)
INSERT 1
UPDATE 1  (for FREE limits)
UPDATE 1  (for PLUS limits)
UPDATE 1  (for PRO limits)

 name    | display_name | max_moodboards_per_day | max_user_uploads | max_ai_enhancements
---------+--------------+------------------------+------------------+--------------------
 FREE    | Free         | 5                      | 10               | 5
 PLUS    | Plus         | 15                     | 50               | 20
 PRO     | Pro          | 30                     | 200              | 50
 CREATOR | Creator      | 50                     | 1000             | 500
```

---

### Migration 3: Update Credit Package Pricing
**File:** `supabase/migrations/20250114000003_update_credit_packages.sql`

**What it does:**
- Lowers prices by 30-50%:
  - Starter: $2.99 → $1.99
  - Basic: $6.99 → $4.99
  - Popular: $12.99 → $8.99
  - Pro: $24.99 → $14.99
  - Enterprise: $59.99 → $29.99
- Adds new Creator Pack: 500 credits for $49.99

**Expected Output:**
```
UPDATE 5
INSERT 1

 id         | name          | credits | price_usd | is_popular | sort_order
------------+---------------+---------+-----------+------------+-----------
 starter    | Starter Pack  | 10      | 1.99      | f          | 1
 basic      | Basic Pack    | 25      | 4.99      | f          | 2
 popular    | Popular Pack  | 50      | 8.99      | t          | 3
 pro        | Pro Pack      | 100     | 14.99     | f          | 4
 enterprise | Enterprise    | 250     | 29.99     | f          | 5
 creator    | Creator Pack  | 500     | 49.99     | f          | 6
```

---

### Migration 4: Add CREATOR Rate Limits
**File:** `supabase/migrations/20250114000004_creator_rate_limits.sql`

**What it does:**
- Adds rate limits for CREATOR tier:
  - 500 messages/day
  - 100 messages/hour
  - 50 showcases/day
  - 100 presets/day
  - 50 moodboards/day

**Expected Output:**
```
INSERT 5

 resource_type    | subscription_tier | max_actions | time_window_minutes
------------------+-------------------+-------------+--------------------
 messages_daily   | CREATOR           | 500         | 1440
 messages_hourly  | CREATOR           | 100         | 60
 moodboards_daily | CREATOR           | 50          | 1440
 presets_daily    | CREATOR           | 100         | 1440
 showcases_daily  | CREATOR           | 50          | 1440
```

---

### Migration 5: Update Credit Allowances
**File:** `supabase/migrations/20250114000005_update_credit_allowances.sql`

**What it does:**
- Creates helper function `get_tier_credit_allowance()`
- Returns:
  - FREE: 15 credits/month (was 5)
  - PLUS: 150 credits/month (was 50)
  - PRO: 500 credits/month (was 200)
  - CREATOR: 1,500 credits/month (new)

**Expected Output:**
```
CREATE FUNCTION
COMMENT

 tier    | allowance
---------+-----------
 FREE    | 15
 PLUS    | 150
 PRO     | 500
 CREATOR | 1500
```

---

### Migration 6: Update Signup Trigger
**File:** `supabase/migrations/20250114000006_update_signup_trigger.sql`

**What it does:**
- Updates `handle_new_user()` function to use new credit allowances
- New users get correct credits based on tier

**Expected Output:**
```
NOTICE: handle_new_user function exists - will be updated
CREATE FUNCTION

 trigger_name        | event_object_table | action_timing | event_manipulation
---------------------+--------------------+---------------+-------------------
 on_auth_user_created| users              | AFTER         | INSERT
```

---

## 🎯 How to Run (Supabase Dashboard)

1. **Go to:** Supabase Dashboard → SQL Editor
2. **For each migration (1-6):**
   - Open the migration file
   - Copy all the SQL
   - Paste into SQL Editor
   - Click "Run"
   - ✅ Verify the output matches expected results

3. **If any errors occur:**
   - Stop immediately
   - Take a screenshot
   - Don't run subsequent migrations

---

## 🧪 After Running - Verification Queries

Run these to verify everything worked:

```sql
-- 1. Check enum has CREATOR
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'subscription_tier'
ORDER BY e.enumsortorder;
-- Expected: FREE, PLUS, PRO, CREATOR

-- 2. Check subscription_tiers table (all UPPERCASE)
SELECT name, display_name FROM subscription_tiers ORDER BY name;
-- Expected: CREATOR, FREE, PLUS, PRO (all caps)

-- 3. Check credit packages
SELECT id, name, price_usd FROM credit_packages WHERE is_active = true ORDER BY sort_order;
-- Expected: 6 packages with new prices

-- 4. Check rate limits for CREATOR
SELECT resource_type, max_actions FROM rate_limits WHERE subscription_tier = 'CREATOR';
-- Expected: 5 rows

-- 5. Test credit allowance function
SELECT get_tier_credit_allowance('CREATOR');
-- Expected: 1500
```

---

## ⚠️ Important Notes

1. **Run in ORDER** - Dependencies exist between migrations
2. **One at a time** - Don't batch paste all migrations
3. **Check output** - Verify each one succeeds before continuing
4. **Save output** - Keep the SQL Editor results for reference
5. **No rollback yet** - Once run, these are applied (rollback plan exists if needed)

---

## 🔄 What Happens Next

After migrations are complete:
1. ✅ Database is ready
2. ⏭️ Update TypeScript code (I'll do this)
3. ⏭️ Update UI components (I'll do this)
4. ⏭️ Test everything works

---

## 📞 If Something Goes Wrong

**Don't panic!** These migrations are designed to be safe. If you hit an error:

1. **Take a screenshot** of the error
2. **Stop** running migrations
3. **Share the error** - I'll help debug
4. **We have a rollback plan** in the main doc

Most common issues:
- ❌ **"enum value already exists"** → Migration 1 already ran, skip it
- ❌ **"duplicate key value"** → Row already exists, safe to continue
- ❌ **"relation does not exist"** → Table/column name typo, let me know

---

**Ready?** Let me know when you've run these, and I'll update all the code! 🚀
