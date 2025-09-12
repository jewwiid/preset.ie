# 🔧 Credit System Production Fix Guide

## Overview
The credit and account balance system has critical issues preventing production readiness. This guide provides step-by-step instructions to fix all issues and implement proper testing.

## 🔴 Current Issues

### 1. **Database Schema Mismatch**
- **Problem**: Dashboard expects `current_balance`, `monthly_allowance`, `consumed_this_month`
- **Reality**: Database has `balance`, `lifetime_earned`, `lifetime_consumed`
- **Impact**: TypeScript errors, data won't load, credits show as 0

### 2. **Inconsistent Column References**
- `CreditBalance.tsx` queries `balance`
- `dashboard/page.tsx` queries `current_balance`, `monthly_allowance`, `consumed_this_month`
- No standardization across components

### 3. **Account Balance Calculation**
- Hardcoded conversion: `€{(credits.current_balance * 0.025).toFixed(2)}`
- No real pricing model defined
- Doesn't match credit package prices

### 4. **Missing Credit Initialization**
- New users don't get credit records automatically
- No monthly reset logic for subscription credits
- No tier-based allowance assignment

---

## 📋 Step-by-Step Fix Process

### Step 1: Create Database Migration to Fix Schema
**File**: `supabase/migrations/057_fix_user_credits_schema.sql`

```sql
-- Fix user_credits table schema to match application expectations
-- This migration standardizes the credit system columns

-- First, add the missing columns if they don't exist
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS current_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_allowance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consumed_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing data from old columns to new ones
UPDATE user_credits 
SET current_balance = COALESCE(balance, 0)
WHERE current_balance IS NULL;

-- Drop the old balance column if it exists (after data migration)
ALTER TABLE user_credits 
DROP COLUMN IF EXISTS balance CASCADE;

-- Create function to initialize user credits
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (
        user_id,
        subscription_tier,
        monthly_allowance,
        current_balance,
        consumed_this_month,
        last_reset_at
    )
    SELECT 
        NEW.user_id,
        COALESCE(NEW.subscription_tier, 'free'),
        CASE 
            WHEN NEW.subscription_tier = 'pro' THEN 25
            WHEN NEW.subscription_tier = 'plus' THEN 10
            ELSE 0
        END,
        CASE 
            WHEN NEW.subscription_tier = 'pro' THEN 25
            WHEN NEW.subscription_tier = 'plus' THEN 10
            ELSE 0
        END,
        0,
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM user_credits WHERE user_id = NEW.user_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-initialize credits for new users
DROP TRIGGER IF EXISTS init_user_credits_on_profile_create ON users_profile;
CREATE TRIGGER init_user_credits_on_profile_create
AFTER INSERT ON users_profile
FOR EACH ROW
EXECUTE FUNCTION initialize_user_credits();

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
    UPDATE user_credits
    SET 
        current_balance = monthly_allowance,
        consumed_this_month = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE 
        last_reset_at < date_trunc('month', NOW())
        AND monthly_allowance > 0;
END;
$$ LANGUAGE plpgsql;

-- Initialize credits for existing users who don't have records
INSERT INTO user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at
)
SELECT 
    u.id,
    COALESCE(p.subscription_tier, 'free'),
    CASE 
        WHEN p.subscription_tier = 'pro' THEN 25
        WHEN p.subscription_tier = 'plus' THEN 10
        ELSE 0
    END,
    CASE 
        WHEN p.subscription_tier = 'pro' THEN 25
        WHEN p.subscription_tier = 'plus' THEN 10
        ELSE 0
    END,
    0,
    NOW()
FROM auth.users u
LEFT JOIN users_profile p ON p.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_credits uc WHERE uc.user_id = u.id
);
```

**Testing Step 1:**
```bash
# Apply the migration
npx supabase db push

# Test in SQL editor
SELECT * FROM user_credits LIMIT 5;
-- Should show columns: current_balance, monthly_allowance, consumed_this_month
```

---

### Step 2: Fix TypeScript Types
**File**: `packages/types/src/credits.ts`

```typescript
export interface UserCredits {
  id: string;
  user_id: string;
  subscription_tier: 'free' | 'plus' | 'pro';
  current_balance: number;
  monthly_allowance: number;
  consumed_this_month: number;
  lifetime_earned: number;
  lifetime_consumed: number;
  last_reset_at: string;
  last_purchase_at?: string;
  last_consumed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_eur: number;
  stripe_price_id: string;
  description: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'consume' | 'refund' | 'bonus' | 'adjustment';
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  reference_id?: string;
  metadata?: any;
  created_at: string;
}

// Credit pricing constants
export const CREDIT_PACKAGES = {
  starter: {
    credits: 10,
    price_eur: 9.99,
    price_per_credit: 0.999
  },
  creative: {
    credits: 50,
    price_eur: 39.99,
    price_per_credit: 0.7998
  },
  pro: {
    credits: 100,
    price_eur: 69.99,
    price_per_credit: 0.6999
  },
  studio: {
    credits: 500,
    price_eur: 299.99,
    price_per_credit: 0.5998
  }
} as const;

// Calculate EUR value of credits
export function calculateCreditValue(credits: number): number {
  // Use average price per credit for display
  const avgPricePerCredit = 0.75;
  return credits * avgPricePerCredit;
}
```

**Testing Step 2:**
```bash
# Build to check TypeScript compilation
npm run build

# Should compile without errors
```

---

### Step 3: Fix Dashboard Credit Display
**File**: `apps/web/app/dashboard/page.tsx`

Update the credits query section (around line 213):

```typescript
// Also fetch user credits with proper error handling
const creditsQuery = supabase
  .from('user_credits')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle(); // Use maybeSingle instead of single to handle missing records

// ... in the Promise.all section ...

const userCreditsResult = await creditsQuery;

// Set credits data with proper null checking
if (userCreditsResult.data) {
  setCredits({
    current_balance: userCreditsResult.data.current_balance || 0,
    monthly_allowance: userCreditsResult.data.monthly_allowance || 0,
    consumed_this_month: userCreditsResult.data.consumed_this_month || 0
  });
} else {
  // Initialize credits for new user
  const { data: profile } = await supabase
    .from('users_profile')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single();
  
  const tier = profile?.subscription_tier || 'free';
  const allowance = tier === 'pro' ? 25 : tier === 'plus' ? 10 : 0;
  
  // Create credit record
  await supabase
    .from('user_credits')
    .insert({
      user_id: user.id,
      subscription_tier: tier,
      monthly_allowance: allowance,
      current_balance: allowance,
      consumed_this_month: 0,
      last_reset_at: new Date().toISOString()
    });
  
  setCredits({
    current_balance: allowance,
    monthly_allowance: allowance,
    consumed_this_month: 0
  });
}
```

**Testing Step 3:**
```bash
# Start dev server
npm run dev

# Navigate to /dashboard
# Check console for errors
# Credits should display without TypeScript errors
```

---

### Step 4: Fix Account Balance Calculation
**File**: `apps/web/app/dashboard/page.tsx`

Update the account balance display (around line 414):

```typescript
import { calculateCreditValue } from '@/packages/types/src/credits';

// In the render section, update the Account Balance card:
<p className="text-gray-900 dark:text-white text-2xl font-bold">
  €{calculateCreditValue(credits.current_balance).toFixed(2)}
</p>
```

**Testing Step 4:**
```bash
# Refresh dashboard
# Account balance should show realistic EUR values
# 10 credits ≈ €7.50
# 25 credits ≈ €18.75
```

---

### Step 5: Fix CreditBalance Component
**File**: `apps/web/components/CreditBalance.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './ui/button';
import { Coins, Plus } from 'lucide-react';
import Link from 'next/link';
import type { UserCredits } from '@/packages/types/src/credits';

interface CreditBalanceProps {
  className?: string;
  showPurchaseButton?: boolean;
}

export default function CreditBalance({ className = '', showPurchaseButton = true }: CreditBalanceProps) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadBalance();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null);
        loadBalance();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCredits(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading credit balance:', error);
      }
      
      setCredits(data);
    } catch (error) {
      console.error('Error loading credit balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
        <div className="w-8 h-4 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  const balance = credits?.current_balance || 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
        <Coins className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          {balance}
        </span>
      </div>
      
      {showPurchaseButton && balance < 10 && (
        <Link href="/profile?tab=credits">
          <Button size="sm" variant="outline" className="h-8 px-2">
            <Plus className="w-3 h-3 mr-1" />
            Buy
          </Button>
        </Link>
      )}
    </div>
  );
}
```

**Testing Step 5:**
```bash
# Check the credit balance display in navigation
# Should show current_balance value
# Buy button should appear when balance < 10
```

---

### Step 6: Create Test Script
**File**: `scripts/test-credit-system.js`

```javascript
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreditSystem() {
  console.log('🧪 Testing Credit System...\n');
  
  // Test 1: Check table structure
  console.log('Test 1: Checking table structure...');
  const { data: columns } = await supabase
    .rpc('get_table_columns', { table_name: 'user_credits' });
  
  const requiredColumns = [
    'current_balance',
    'monthly_allowance', 
    'consumed_this_month',
    'subscription_tier',
    'last_reset_at'
  ];
  
  const missingColumns = requiredColumns.filter(
    col => !columns?.some(c => c.column_name === col)
  );
  
  if (missingColumns.length > 0) {
    console.error('❌ Missing columns:', missingColumns);
    return false;
  }
  console.log('✅ All required columns exist\n');
  
  // Test 2: Check if users have credit records
  console.log('Test 2: Checking user credit records...');
  const { data: users } = await supabase
    .from('auth.users')
    .select('id')
    .limit(5);
  
  for (const user of users || []) {
    const { data: credits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!credits) {
      console.warn(`⚠️ User ${user.id} has no credit record`);
    } else {
      console.log(`✅ User ${user.id}: ${credits.current_balance} credits`);
    }
  }
  
  // Test 3: Test credit consumption
  console.log('\nTest 3: Testing credit consumption...');
  const testUserId = users?.[0]?.id;
  if (testUserId) {
    const { data: before } = await supabase
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', testUserId)
      .single();
    
    const { error } = await supabase.rpc('update_user_credits', {
      p_user_id: testUserId,
      p_amount: -1,
      p_type: 'consume',
      p_description: 'Test consumption'
    });
    
    if (error) {
      console.error('❌ Credit consumption failed:', error.message);
    } else {
      const { data: after } = await supabase
        .from('user_credits')
        .select('current_balance')
        .eq('user_id', testUserId)
        .single();
      
      console.log(`✅ Credits consumed: ${before?.current_balance} → ${after?.current_balance}`);
    }
  }
  
  // Test 4: Test monthly reset
  console.log('\nTest 4: Testing monthly reset...');
  const { error: resetError } = await supabase
    .rpc('reset_monthly_credits');
  
  if (resetError) {
    console.error('❌ Monthly reset failed:', resetError.message);
  } else {
    console.log('✅ Monthly reset executed successfully');
  }
  
  console.log('\n🎉 Credit system tests complete!');
}

// SQL helper function (add to database)
const createHelperFunction = `
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text, 
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_name = $1
  AND c.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;
`;

if (require.main === module) {
  testCreditSystem()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
```

**Testing Step 6:**
```bash
# Run the test script
node scripts/test-credit-system.js

# All tests should pass
# If any fail, check the specific error messages
```

---

## 🚀 Production Deployment Checklist

### Pre-Deployment
- [ ] Run migration 057 in production
- [ ] Verify all columns exist with test script
- [ ] Test credit initialization for new users
- [ ] Test monthly reset function
- [ ] Verify TypeScript builds without errors

### Deployment
- [ ] Deploy database migrations
- [ ] Deploy updated TypeScript types
- [ ] Deploy fixed dashboard component
- [ ] Deploy fixed CreditBalance component
- [ ] Clear any cached data

### Post-Deployment
- [ ] Monitor error logs for credit-related issues
- [ ] Check that new users get credit records
- [ ] Verify credit display on dashboard
- [ ] Test credit consumption flow
- [ ] Set up monthly reset cron job

---

## 🔄 Monthly Reset Automation

Add this to your Supabase cron jobs or external scheduler:

```sql
-- Run on the 1st of each month at 00:00 UTC
SELECT cron.schedule(
  'reset-monthly-credits',
  '0 0 1 * *',
  'SELECT reset_monthly_credits();'
);
```

---

## 📊 Monitoring Queries

```sql
-- Check users without credits
SELECT u.id, p.display_name 
FROM auth.users u
JOIN users_profile p ON p.user_id = u.id
LEFT JOIN user_credits c ON c.user_id = u.id
WHERE c.id IS NULL;

-- Check credit distribution
SELECT 
  subscription_tier,
  COUNT(*) as users,
  AVG(current_balance) as avg_balance,
  SUM(current_balance) as total_credits
FROM user_credits
GROUP BY subscription_tier;

-- Recent credit transactions
SELECT 
  ct.*, 
  p.display_name 
FROM credit_transactions ct
JOIN users_profile p ON p.user_id = ct.user_id
ORDER BY ct.created_at DESC
LIMIT 20;
```

---

## 🆘 Troubleshooting

### Issue: Credits showing as 0 for all users
**Solution**: Run the initialization script to create credit records

### Issue: TypeScript compilation errors
**Solution**: Ensure types package is built and imported correctly

### Issue: Monthly credits not resetting
**Solution**: Check last_reset_at dates and run reset function manually

### Issue: New users don't get credits
**Solution**: Verify trigger is active on users_profile table

---

## 📝 Notes

- Credit system is designed for subscription-based allowances
- Purchase credits are separate from monthly allowances
- Account balance is calculated based on credit value, not actual purchases
- Consider implementing Stripe integration for real credit purchases