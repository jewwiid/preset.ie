# 💳 Credit Marketplace & Dynamic Scaling System

## Overview
Preset operates as a **credit marketplace** where the platform purchases credits from various AI/API providers and resells them to users with transparent, simplified pricing. Users always see **1 credit = 1 enhancement**, regardless of the actual provider cost.

## How It Works

### Credit Scaling
- **User Perspective**: 1 credit = 1 enhancement (simple, predictable)
- **Backend Reality**: 1 user credit = 4 NanoBanana credits (handled transparently)
- **Platform Manages**: The 1:4 ratio conversion automatically

### Example Flow
1. User wants to enhance an image → sees cost: **1 credit**
2. Platform checks user has 1+ credits ✓
3. Platform checks it has 4+ NanoBanana credits ✓
4. User is charged **1 credit**
5. Platform consumes **4 NanoBanana credits**
6. User sees simple transaction: **"Enhancement: -1 credit"**

## Credit Packages (User Pricing)

| Package | User Credits | Price | Per Credit |
|---------|-------------|-------|------------|
| Starter | 10 | €9.99 | €1.00 |
| Creative | 50 | €39.99 | €0.80 |
| Pro | 100 | €69.99 | €0.70 |
| Studio | 500 | €299.99 | €0.60 |

## Platform Credit Management

### Real-Time Credit Tracking (NEW!)
- **Live API Integration**: Fetches actual credits from NanoBanana API
- **Sync Button**: Admin dashboard shows real credits with one click
- **Consumption Tracking**: Automatically calculates credits used between syncs
- **Low Balance Alerts**: Warnings when real credits drop below threshold

### Database Tables
- `platform_credits`: Tracks platform balance with each provider (NOW WITH REAL API DATA)
- `platform_credit_consumption`: Detailed usage logs
- `user_credit_purchases`: User marketplace transactions
- `credit_packages`: Available credit bundles
- `platform_alerts`: Low credit warnings and system alerts
- `credit_sync_logs`: History of all credit sync operations

### Provider Configuration
```typescript
{
  provider: 'nanobanana',
  ratio: 4.0,  // 1 user credit = 4 provider credits
  current_balance: 10000,
  low_balance_threshold: 100
}
```

### Automatic Safeguards
1. **Platform Balance Check**: Before any operation, verify platform has enough provider credits
2. **Low Balance Alerts**: Notify admins when credits drop below threshold
3. **Service Unavailable**: Gracefully handle when platform is out of credits
4. **Auto-refill**: Optional automatic credit purchases (configurable)

## Implementation Details

### Credit Consumption Flow
```typescript
// User sees simple 1 credit cost
const USER_CREDITS_PER_ENHANCEMENT = 1;

// Check user has credits
if (userCredits.current_balance < USER_CREDITS_PER_ENHANCEMENT) {
  return "Insufficient credits";
}

// Platform checks its provider balance (handles 1:4 ratio internally)
const hasPlatformCredits = await checkPlatformCredits('nanobanana', 1);
if (!hasPlatformCredits) {
  return "Service temporarily unavailable";
}

// Deduct 1 from user
await deductUserCredits(userId, 1);

// Platform consumes 4 NanoBanana credits (transparent to user)
await consumePlatformCredits('nanobanana', userId, 1);
```

### Credit Scaling Service
The `CreditScalingService` handles all conversions:
- `toProviderCredits(provider, userCredits)`: Convert user → provider
- `toUserCredits(provider, providerCredits)`: Convert provider → user
- `hasEnoughPlatformCredits()`: Check platform balance
- `calculateProviderCost()`: Get actual provider cost

## Admin Dashboard Features

### Platform Credit Monitoring
- Current balance per provider
- Consumption rate graphs
- Cost analysis (user revenue vs provider costs)
- Low balance alerts

### Credit Package Management
- Create/edit packages
- Set promotional pricing
- Track package popularity
- Revenue analytics

### User Credit Analytics
- Total credits sold
- Average credits per user
- Credit usage patterns
- Refund/dispute tracking

## Benefits of This System

### For Users
- **Simple Pricing**: Always 1 credit per enhancement
- **Predictable Costs**: No confusion about varying provider rates
- **Bulk Discounts**: Better rates for larger packages
- **Transparent**: Clear credit balance and usage

### For Platform
- **Margin Control**: Buy wholesale, sell retail
- **Provider Flexibility**: Switch providers without changing user pricing
- **Revenue Stream**: Credit packages as primary monetization
- **Cost Management**: Track actual provider costs vs revenue

### For Scalability
- **Multi-Provider Support**: Easy to add new AI services
- **Dynamic Ratios**: Adjust provider ratios without user impact
- **Bulk Purchasing**: Platform can buy credits in bulk for discounts
- **Usage Optimization**: Route to most cost-effective provider

## Future Enhancements

### Planned Features
1. **Credit Bundles**: Combine credits for different services
2. **Subscription Credits**: Monthly credit allowances with Plus/Pro tiers
3. **Credit Gifting**: Users can gift credits to others
4. **Loyalty Rewards**: Bonus credits for frequent users
5. **Provider Routing**: Automatically use cheapest provider for task

### Advanced Marketplace
1. **Dynamic Pricing**: Adjust package prices based on demand
2. **Flash Sales**: Limited-time credit discounts
3. **Referral Credits**: Earn credits by inviting users
4. **Credit Exchange**: Trade different types of credits
5. **Enterprise Accounts**: Custom pricing for high-volume users

## Configuration

### Environment Variables
```env
# Credit Ratios (provider credits per user credit)
NANOBANANA_CREDIT_RATIO=4
OPENAI_CREDIT_RATIO=0.1
PEXELS_CREDIT_RATIO=1

# Platform Balance Management
PLATFORM_LOW_BALANCE_THRESHOLD=100
PLATFORM_AUTO_REFILL_ENABLED=false
PLATFORM_AUTO_REFILL_AMOUNT=1000
```

### Database Functions
- `check_platform_credits(provider, user_credits)`: Verify availability
- `consume_platform_credits(provider, user_id, credits)`: Process usage
- `refill_platform_credits(provider, amount)`: Add credits
- `get_platform_balance(provider)`: Check current balance

## Real Credit System (IMPORTANT!)

### How Real Credits Work
1. **NanoBanana API Balance**: The ACTUAL credits available (fetched from API)
2. **Database Balance**: Our local tracking (may drift from reality)
3. **Sync Process**: Updates database to match API reality
4. **Consumption Tracking**: Calculates usage between syncs

### Critical Information
✅ **Current NanoBanana Balance: 938 credits**
- The platform has 938 NanoBanana credits available
- This equals 234 user enhancements (938 ÷ 4)
- Enhancements will work until credits are depleted
- Monitor usage and refill at: https://nanobananaapi.ai

### Sync Real Credits
```typescript
// Admin Dashboard - Credits Tab
Click "🔄 Sync Real Credits" button

// API Endpoint
GET /api/admin/sync-credits?provider=nanobanana

// Response shows:
{
  realCredits: 938,        // Actual API balance
  databaseCredits: 938,    // Now synced with reality
  consumed: 0,            // Tracks usage between syncs
  userCreditsAvailable: 234 // Can serve 234 enhancements!
}
```

## Monitoring & Alerts

### Key Metrics
- **REAL Platform Credit Balance**: Actual credits from API (not mock data!)
- **Burn Rate**: Credits consumed per hour/day
- **Revenue per Credit**: Average revenue generated
- **Cost per Credit**: Actual provider cost
- **Margin**: Profit per credit sold

### Alert Thresholds
- Platform balance < 100 credits
- Burn rate > expected
- Failed enhancement due to no credits
- Unusual consumption patterns

## Security Considerations

1. **Rate Limiting**: Prevent credit abuse
2. **Fraud Detection**: Monitor unusual purchase patterns
3. **Refund Policy**: Clear rules for credit refunds
4. **Audit Trail**: Complete logs of all transactions
5. **Access Control**: Only admins can manage platform credits

---

## Quick Start for Developers

### Check Platform Has Credits
```typescript
const canEnhance = await supabase.rpc('check_platform_credits', {
  p_provider: 'nanobanana',
  p_user_credits: 1
});
```

### Consume Credits (User + Platform)
```typescript
// Deduct from user (1 credit)
await deductUserCredits(userId, 1);

// Consume from platform (handles ratio)
await supabase.rpc('consume_platform_credits', {
  p_provider: 'nanobanana',
  p_user_id: userId,
  p_user_credits: 1,
  p_operation_type: 'enhancement'
});
```

### Add Platform Credits (Admin)
```sql
UPDATE platform_credits 
SET current_balance = current_balance + 10000
WHERE provider = 'nanobanana';
```

---

This credit marketplace system ensures sustainable economics while keeping the user experience simple and predictable.