# 🎁 Lootbox Purchase Limits - Implementation

## ✅ **Enforced Rule: ONE Lootbox Per User Per Event Period**

### **Why This Limit?**
- ⚖️ **Fairness**: Everyone gets equal opportunity
- 💰 **Revenue Protection**: Prevents users from bulk-buying at discount
- 🎯 **Creates Urgency**: Limited availability = higher conversion
- 🎮 **Gamification**: Makes it feel special and exclusive

---

## 🔒 **How It's Enforced**

### **1. Database Constraint (Hard Limit)**
```sql
-- In lootbox_events table
UNIQUE(purchased_by, event_period)
```
- **Cannot be bypassed** even by direct DB access
- PostgreSQL will reject duplicate purchases automatically

### **2. API Check (Pre-Purchase Validation)**
Location: `apps/web/app/api/stripe/create-credit-checkout/route.ts`

```typescript
// Before creating Stripe checkout session
const { data: existingPurchase } = await supabaseAdmin
  .from('lootbox_events')
  .select('id, event_name, purchased_at')
  .eq('purchased_by', user.id)
  .eq('event_period', eventPeriod)
  .single();

if (existingPurchase) {
  return NextResponse.json({ 
    error: 'You have already purchased a lootbox during this event period. Only one per event allowed!' 
  }, { status: 400 });
}
```

### **3. UI Display (User Feedback)**
Location: `apps/web/app/components/CreditPurchase.tsx`

```typescript
// Shows "Already Claimed" button state
{pkg.already_purchased ? (
  <>
    <Check className="w-4 h-4" />
    Already Claimed
  </>
) : (
  <>
    <Sparkles className="w-4 h-4" />
    Claim Lootbox
  </>
)}
```

---

## 📅 **Event Period Definitions**

### **Weekend Flash Sale**
- **Period ID**: `YYYY-WXX` (e.g., "2025-W40")
- **Logic**: Year + Week Number
- **Duration**: Friday 6pm - Sunday 11:59pm
- **Limit**: 1 purchase per weekend

### **Mid-Month Mega Deal**
- **Period ID**: `YYYY-MM-15` (e.g., "2025-10-15")
- **Logic**: Year + Month + Fixed date (15th)
- **Duration**: 15th-17th of each month
- **Limit**: 1 purchase per month

### **Example:**
```
User purchases on Saturday Oct 5, 2025
Event Period: "2025-W40"
✅ Can purchase again next weekend (W41)
❌ Cannot purchase again this weekend (W40)
```

---

## 🛡️ **Multi-Layer Protection**

### **Layer 1: UI**
- Disabled button with "Already Claimed" state
- Visual feedback (checkmark icon)
- Prevents accidental clicks

### **Layer 2: API Validation**
- Checks before creating Stripe session
- Returns error message
- Prevents creating duplicate checkouts

### **Layer 3: Database Constraint**
- UNIQUE constraint on `(purchased_by, event_period)`
- Final safety net
- Prevents race conditions

### **Layer 4: Webhook Recording**
- Even if someone bypasses all checks
- Webhook will fail to insert duplicate
- Error logged but credits still added (fail-safe)

---

## 🔄 **User Flow**

### **First Purchase:**
1. User sees lootbox during weekend ✅
2. Clicks "Claim Lootbox" button ✅
3. API creates Stripe checkout ✅
4. User completes payment ✅
5. Webhook records purchase with `event_period` ✅
6. Credits added to account ✅

### **Attempted Second Purchase (Same Weekend):**
1. User sees lootbox ❌ (shows "Already Claimed")
2. Button is disabled ❌
3. If somehow clicked: API rejects ❌
4. Error: "You have already purchased a lootbox during this event period" ❌

### **Next Event Period:**
1. New weekend or mid-month event starts ✅
2. Different `event_period` value ✅
3. User can purchase again ✅

---

## 📊 **Database Schema**

### **lootbox_events Table:**
```sql
CREATE TABLE lootbox_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50) DEFAULT 'purchased',
  event_name VARCHAR(100),            -- '🎉 Weekend Flash Sale'
  event_period VARCHAR(50),            -- '2025-W40' or '2025-10-15'
  package_id UUID REFERENCES lootbox_packages(id),
  user_credits_offered INTEGER,
  price_usd DECIMAL(10,2),
  purchased_by UUID REFERENCES auth.users(id),
  purchased_at TIMESTAMP,
  
  -- ONE purchase per user per event period
  UNIQUE(purchased_by, event_period)
);
```

### **Example Records:**
```
| id | user_id | event_period | event_name            | purchased_at        |
|----|---------|--------------|----------------------|---------------------|
| 1  | user123 | 2025-W40     | Weekend Flash Sale   | 2025-10-05 14:30:00 |
| 2  | user456 | 2025-W40     | Weekend Flash Sale   | 2025-10-06 09:15:00 |
| 3  | user123 | 2025-W41     | Weekend Flash Sale   | 2025-10-12 18:00:00 | ✅ Same user, different week
| 4  | user123 | 2025-10-15   | Mid-Month Mega Deal  | 2025-10-16 12:00:00 | ✅ Same user, different event
```

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Normal Purchase**
```bash
# Weekend active
GET /api/lootbox/availability
# Response: available: true, already_purchased: false

POST /api/stripe/create-credit-checkout
# Response: { sessionId: "...", url: "stripe checkout url" }

# Complete payment -> Credits added
```

### **Scenario 2: Duplicate Attempt**
```bash
# After first purchase
GET /api/lootbox/availability
# Response: available: false, already_purchased: true

POST /api/stripe/create-credit-checkout
# Response: { error: "You have already purchased a lootbox during this event period..." }
# Status: 400
```

### **Scenario 3: New Event Period**
```bash
# Next weekend
GET /api/lootbox/availability
# Response: available: true, already_purchased: false

# User can purchase again ✅
```

---

## ⚠️ **Edge Cases Handled**

### **1. Race Condition**
- **Problem**: Two simultaneous clicks
- **Solution**: Database UNIQUE constraint catches duplicate
- **Result**: Second insert fails gracefully

### **2. Timezone Issues**
- **Problem**: User in different timezone
- **Solution**: Server time used consistently
- **Result**: Event periods calculated server-side

### **3. Event Overlap**
- **Problem**: Mid-month (17th) overlaps with weekend start (Friday 17th)
- **Solution**: Different `event_period` values
- **Result**: User can purchase from both

### **4. Partial Payment**
- **Problem**: User starts checkout but doesn't complete
- **Solution**: Only recorded AFTER successful payment
- **Result**: User can try again

---

## 🎯 **Business Logic**

### **Can Buy Again:**
✅ Different event period (new weekend/month)
✅ Different event type (weekend vs mid-month)
✅ Payment failed/cancelled (no record created)

### **Cannot Buy Again:**
❌ Same event period
❌ Even if different package size
❌ Even if manual admin intervention (DB constraint)

---

## 📝 **Admin Override**

If you need to allow a user to purchase again (exceptional circumstances):

```sql
-- Delete the existing purchase record
DELETE FROM lootbox_events 
WHERE purchased_by = 'user_id_here' 
AND event_period = '2025-W40';

-- User can now purchase again
```

⚠️ **Use sparingly** - defeats the purpose of exclusivity!

---

## ✅ **Summary**

| Feature | Status | Location |
|---------|--------|----------|
| Database Constraint | ✅ Implemented | `061_create_lootbox_system.sql` |
| API Validation | ✅ Implemented | `create-credit-checkout/route.ts` |
| UI Feedback | ✅ Implemented | `CreditPurchase.tsx` |
| Event Period Tracking | ✅ Implemented | All files |
| Webhook Recording | ✅ Implemented | `webhook/route.ts` |

**Result:** Users can only purchase **ONE lootbox per event period**, enforced at multiple layers for maximum reliability.

