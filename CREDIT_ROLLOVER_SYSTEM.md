# 💳 Credit Rollover System - How It Works

## 🎯 **The Rules**

### ✅ **Purchased Credits = Forever** (Roll Over)
- Credit packages ($25, $50, $100, etc.)
- Lootbox credits ($455, $1,138, etc.)
- **NEVER expire**
- **NEVER reset**
- Carry over month-to-month indefinitely

### 🔄 **Subscription Credits = Monthly Reset** (Don't Roll Over)
- FREE: 5 credits/month → resets to 5
- PLUS: 50 credits/month → resets to 50
- PRO: 200 credits/month → resets to 200
- Resets on 1st of each month
- Unused credits are lost

---

## 💡 **Why This Makes Sense**

### **User Perspective:**
- "I paid $455 for 2000 credits, they should last as long as I need"
- "My $10/month subscription gives me 50 monthly credits I need to use"
- Creates incentive to purchase credits (they're an investment)
- Subscription feels fair (monthly allowance you don't feel bad about)

### **Business Perspective:**
- Purchased credits = upfront revenue, user commitment
- Subscription credits = recurring revenue, predictable income
- Users more likely to buy credit packages if they don't expire
- Monthly reset prevents credit hoarding from subscription

---

## 🏗️ **Database Schema**

### **user_credits Table:**
```sql
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY,
  subscription_tier VARCHAR(20),           -- 'FREE', 'PLUS', 'PRO'
  monthly_allowance INTEGER,               -- Subscription tier allowance
  current_balance INTEGER,                 -- Total credits available
  purchased_credits_balance INTEGER,       -- Purchased credits (roll over)
  consumed_this_month INTEGER,             -- Subscription credits used this month
  lifetime_consumed INTEGER,               -- All-time usage
  last_reset_at TIMESTAMP,                 -- Last monthly reset
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Credit Balance Calculation:**
```
current_balance = subscription_credits + purchased_credits_balance

Example:
- PRO user (200/month subscription)
- Bought 2000 lootbox credits
- Used 50 credits this month
- current_balance = (200 - 50) + 2000 = 2,150 credits
```

---

## 🔄 **Monthly Reset Logic**

### **What Happens on the 1st of Each Month:**

```sql
-- For each user:
-- Old logic (BAD): current_balance = monthly_allowance  ❌ LOSES PURCHASED CREDITS!
-- New logic (GOOD): current_balance = monthly_allowance + purchased_credits_balance  ✅

UPDATE user_credits
SET 
  current_balance = monthly_allowance + purchased_credits_balance,
  consumed_this_month = 0,
  last_reset_at = NOW()
WHERE last_reset_at < date_trunc('month', NOW());
```

### **Example:**

**Before Reset (Jan 31st):**
```
PRO User:
- monthly_allowance: 200
- purchased_credits_balance: 2000
- consumed_this_month: 180
- current_balance: 2020 (20 subscription + 2000 purchased)
```

**After Reset (Feb 1st):**
```
PRO User:
- monthly_allowance: 200
- purchased_credits_balance: 2000  (UNCHANGED!)
- consumed_this_month: 0           (RESET!)
- current_balance: 2200            (200 new + 2000 carried over)
```

---

## 📊 **Credit Consumption Strategy**

### **Which Credits Are Used First?**

**Strategy: Consume Purchased Credits First**

**Why?**
- Purchased credits are already paid for
- Preserves subscription credits for the month
- If user cancels subscription, they keep purchased credits

```sql
-- If user has: 150 subscription + 2000 purchased = 2150 total
-- Uses 100 credits:
-- 
-- Consumed: 100 purchased, 0 subscription
-- Remaining: 150 subscription + 1900 purchased = 2050 total
```

**Alternative: Subscription First** (not recommended)
- Would encourage users to use subscription credits before buying
- Defeats purpose of selling credit packages

---

## 🛠️ **Helper Functions**

### **1. Add Purchased Credits**
```sql
SELECT add_purchased_credits('user_id_here', 2000);
```
- Adds to `current_balance`
- Adds to `purchased_credits_balance`
- Used by: Lootbox purchases, Credit package purchases

### **2. Consume Credits**
```sql
SELECT consume_user_credits('user_id_here', 5);
-- Returns:
{
  "total_consumed": 5,
  "purchased_consumed": 5,
  "subscription_consumed": 0,
  "remaining_balance": 2145,
  "remaining_purchased": 1995
}
```
- Deducts from purchased first, then subscription
- Updates `consumed_this_month` only for subscription credits
- Updates `lifetime_consumed` for all credits

### **3. Monthly Reset**
```sql
SELECT reset_monthly_subscription_benefits();
-- Returns: number of users reset
```
- Resets subscription portion
- Preserves purchased credits
- Run automatically via cron job

---

## 🎮 **User Experience**

### **Scenario 1: Pure Subscription User**
```
Month 1:
- Gets 200 PRO credits
- Uses 150 credits
- Remaining: 50

Month 2 (Reset):
- Back to 200 credits
- Lost 50 unused credits (expected behavior)
```

### **Scenario 2: Purchased + Subscription**
```
Month 1:
- Gets 200 PRO credits
- Buys 2000 lootbox credits
- Uses 300 credits (300 from purchased)
- Remaining: 200 subscription + 1700 purchased = 1900

Month 2 (Reset):
- Gets 200 fresh PRO credits
- Still has 1700 purchased credits
- Total: 200 + 1700 = 1900 credits
- Uses 150 (from purchased)
- Remaining: 200 + 1550 = 1750

Month 3 (Reset):
- Gets 200 fresh PRO credits
- Still has 1550 purchased credits
- Total: 200 + 1550 = 1750 credits
```

### **Scenario 3: Cancel Subscription**
```
Before Cancel:
- PRO: 200 subscription + 1500 purchased = 1700 total

After Cancel (reverts to FREE):
- FREE: 5 subscription + 1500 purchased = 1505 total
- Keeps all 1500 purchased credits! ✅
```

---

## 🔍 **Transparency in UI**

### **Credit Balance Display:**
```typescript
// Show breakdown:
"2,150 Credits"
  ├─ 200 Monthly Allowance (resets Feb 1st)
  └─ 1,950 Purchased (never expires)
```

### **Purchase Confirmation:**
```
"You're buying 2000 credits for $455"
✅ These credits NEVER expire
✅ Separate from your monthly allowance
✅ Can be used anytime
```

---

## 📈 **Business Metrics**

### **Key Metrics to Track:**

1. **Average Purchased Credits Per User**
   ```sql
   SELECT AVG(purchased_credits_balance) FROM user_credits;
   ```

2. **Revenue from Credit Purchases**
   ```sql
   SELECT SUM(amount_paid_usd) FROM user_credit_purchases 
   WHERE payment_method IN ('stripe', 'lootbox');
   ```

3. **Credit Utilization Rate**
   ```sql
   -- How many users use >80% of subscription credits?
   SELECT COUNT(*) FROM user_credits 
   WHERE consumed_this_month > (monthly_allowance * 0.8);
   ```

4. **Purchased Credit Lifespan**
   ```sql
   -- How long do purchased credits last on average?
   SELECT AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) as days_to_deplete
   FROM user_credit_purchases
   WHERE credits_remaining = 0;
   ```

---

## ✅ **Implementation Checklist**

- [x] Create migration `062_fix_purchased_credits_rollover.sql`
- [x] Add `purchased_credits_balance` column
- [x] Update `reset_monthly_subscription_benefits()` function
- [x] Create `add_purchased_credits()` helper
- [x] Create `consume_user_credits()` helper
- [x] Update Stripe webhook to use new functions
- [x] Update lootbox webhook to use new functions
- [ ] Update UI to show credit breakdown
- [ ] Update credit consumption logic in image enhancement
- [ ] Add analytics tracking
- [ ] Test monthly reset in staging

---

## 🎯 **Summary**

| Credit Type | Expires? | Resets? | Source | Behavior |
|-------------|----------|---------|--------|----------|
| **Purchased** | ❌ Never | ❌ Never | Lootbox, Packages | Roll over forever |
| **Subscription** | ✅ Monthly | ✅ Monthly | FREE/PLUS/PRO | Reset to allowance |

**Result:** Users get the best of both worlds:
- Predictable monthly allowance
- Flexible purchased credits that last as long as needed
- Clear value proposition for buying credit packages

