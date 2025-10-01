# Lootbox Strategy V2 - Pay-Per-Use Model

## 🎯 Problem with Original Model
- Original lootbox was tied to NanoBanana credit surplus
- With Wavespeed pay-per-use, we don't have "excess capacity"
- Need a new trigger mechanism that benefits the platform

## 💡 New Lootbox Triggers (Revenue-Focused)

### Option 1: **Time-Based Flash Sales** (Recommended)
**Trigger:** Specific times/days when you want to boost revenue
- **Weekend Boost**: Friday 6pm - Sunday 11pm
- **Mid-Month Push**: 15th-17th of each month
- **Holiday Sales**: Special events, Black Friday, etc.

**Benefits:**
- Predictable revenue spikes
- Creates urgency and FOMO
- You control when to offer it
- Can stack with low-activity periods

**Example:**
```typescript
const isLootboxActive = () => {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
  const hour = now.getHours()
  const dayOfMonth = now.getDate()
  
  // Weekend flash sale (Fri 6pm - Sun 11pm)
  const isWeekend = (dayOfWeek === 5 && hour >= 18) || 
                     (dayOfWeek === 6) || 
                     (dayOfWeek === 0 && hour <= 23)
  
  // Mid-month push (15th-17th)
  const isMidMonth = dayOfMonth >= 15 && dayOfMonth <= 17
  
  return isWeekend || isMidMonth
}
```

### Option 2: **User Engagement Incentives**
**Trigger:** Reward specific user behaviors
- New user's first 48 hours (welcome bonus)
- Users who haven't purchased in 30+ days (re-engagement)
- Users who just used 80%+ of their credits (upsell at perfect time)
- Users who completed X presets (reward activity)

**Benefits:**
- Increases user retention
- Converts dormant users
- Catches users at peak interest

### Option 3: **Revenue Milestone Unlocks** 
**Trigger:** When platform hits daily/weekly revenue targets
- After $X in daily subscription revenue
- When 5+ users upgrade in a day
- Celebrate platform milestones with community

**Benefits:**
- Gamifies platform growth
- Creates community excitement
- Only triggers when business is already doing well

### Option 4: **Dynamic Pricing Based on Demand**
**Trigger:** Real-time adjustment based on usage
- More users online = lootbox appears
- High API usage = better deals to pre-sell capacity
- Low usage periods = premium pricing

**Benefits:**
- Optimizes for peak conversion times
- Creates artificial scarcity
- Market-driven pricing

### Option 5: **Inventory Pre-Purchase** (Hybrid)
**Trigger:** When YOU buy bulk Wavespeed credits at discount
- You buy 100k credits at 20% bulk discount
- Pass 10% savings to users via lootbox
- Keep 10% as margin

**Benefits:**
- Locks in your costs
- Shares savings with users
- Improves cash flow

## 🎖️ Recommended Strategy

### **Hybrid Approach:**

1. **Base Trigger: Time-Based**
   - Weekend flash sales (guaranteed)
   - Mid-month specials (predictable)

2. **Bonus Trigger: User Behavior**
   - Show lootbox to users at 80%+ credit usage
   - Re-engagement for dormant users

3. **Special Events**
   - Manual activation for holidays
   - Platform milestone celebrations

### **Pricing Structure:**

```typescript
const calculateLootboxPrice = (baseCredits: number) => {
  const regularPricePerCredit = 0.35 // Pro tier pricing
  const regularPrice = baseCredits * regularPricePerCredit
  
  // Lootbox offers 30-40% discount
  const lootboxDiscount = 0.35 // 35% off
  const lootboxPrice = regularPrice * (1 - lootboxDiscount)
  
  return {
    credits: baseCredits,
    regularPrice: regularPrice,
    lootboxPrice: lootboxPrice,
    savings: regularPrice - lootboxPrice,
    savingsPercent: Math.round(lootboxDiscount * 100)
  }
}

// Example: 2000 credits
// Regular: 2000 * $0.35 = $700
// Lootbox: $700 * 0.65 = $455
// User saves: $245 (35%)
// Your margin: Still positive since Wavespeed costs ~$0.05-0.10/credit
```

## 📊 Financial Model

### Cost Analysis (Wavespeed Pay-Per-Use):
- **Your cost per enhancement:** ~$0.05 - $0.10
- **Regular pricing:** $0.30 - $0.50 per credit
- **Your margin:** 500-800%

### Lootbox Pricing:
- **Lootbox price:** $0.20 per credit (35% off regular)
- **Your cost:** $0.08 per credit (Wavespeed)
- **Your margin:** Still 150% (vs 500%+ on regular)

### Why This Works:
1. **User perspective:** 35% discount is HUGE
2. **Platform perspective:** Still 150% margin
3. **Psychology:** Creates urgency and FOMO
4. **Volume:** Lower margin but higher volume = more total revenue

## 🚀 Implementation Priority

1. **Phase 1 (Immediate):**
   - Time-based triggers (weekends)
   - Manual activation capability
   - 35% discount on bulk packages

2. **Phase 2 (Week 2):**
   - User behavior triggers
   - Re-engagement campaigns
   - Analytics on conversion rates

3. **Phase 3 (Month 2):**
   - Dynamic pricing based on demand
   - A/B testing different discount levels
   - Seasonal campaigns

## 💰 Example Lootbox Packages

### Weekend Warrior
- **Credits:** 2000
- **Regular Price:** $700 (at $0.35/credit)
- **Lootbox Price:** $455 (35% off)
- **Your Cost:** ~$160 (Wavespeed at $0.08/credit)
- **Your Profit:** $295 per sale
- **Available:** Friday 6pm - Sunday 11pm

### Mid-Month Mega Deal
- **Credits:** 5000
- **Regular Price:** $1,750
- **Lootbox Price:** $1,138 (35% off)
- **Your Cost:** ~$400
- **Your Profit:** $738 per sale
- **Available:** 15th-17th of each month

### Flash Hour (Ultra Rare)
- **Credits:** 10,000
- **Regular Price:** $3,500
- **Lootbox Price:** $2,100 (40% off)
- **Your Cost:** ~$800
- **Your Profit:** $1,300 per sale
- **Available:** Random 1-hour windows, 2x per month

