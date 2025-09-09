# 🛠️ Admin Dashboard Documentation

## Overview
The Preset Admin Dashboard provides comprehensive platform management capabilities including credit management, user administration, analytics, and content moderation.

## ✅ Features Implemented

### 1. **Admin Authentication**
- Secure admin-only access with role-based authentication
- Middleware protection for all admin routes
- Admin role flag in user profiles

### 2. **Platform Credit Management**
- **Real-time Balance Monitoring**: View current credit balances for all providers
- **Credit Refill**: Quick refill buttons (+1,000, +5,000, +10,000 credits)
- **Low Balance Alerts**: Visual warnings when credits drop below threshold
- **Provider Settings**: Configure credit ratios and thresholds
- **Health Status Indicators**: 
  - 🟢 Excellent (>5x threshold)
  - 🟡 Good (>2x threshold)
  - 🟠 Warning (>1x threshold)
  - 🔴 Critical (<threshold)

### 3. **Analytics Dashboard**
- **User Growth**: Daily signups, subscription tier distribution
- **Credit Usage**: Consumption by provider, operation type, daily trends
- **Revenue Analytics**: Package sales, daily revenue, average order value
- **Platform Health**: System status, error rates, active users
- **Time Period Filters**: 7 days, 30 days, 90 days, all time

### 4. **Credit Package Management**
- View all marketplace offerings
- Active/inactive status
- Pricing and credit amounts
- Package performance metrics

### 5. **Platform Statistics**
- Total users, gigs, applications, showcases
- Subscription distribution (Free/Plus/Pro)
- Real-time metrics updates

## 🚀 Getting Started

### Step 1: Create an Admin User

Run the admin creation script with any email:

```bash
node scripts/make-admin.js admin@preset.ie
```

Or use an existing user's email:

```bash
node scripts/make-admin.js your-email@example.com
```

This script will:
- Find or create the user
- Add ADMIN role to their profile
- Grant Pro subscription tier
- Add 1000 credits for testing

### Step 2: Sign In

1. Go to http://localhost:3000/auth/signin
2. Enter the admin email
3. Complete authentication

### Step 3: Access Admin Dashboard

Navigate to: http://localhost:3000/admin

## 📊 Admin Dashboard Sections

### Overview Tab
- **Platform Statistics**: Key metrics at a glance
- **Subscription Distribution**: Visual breakdown of user tiers
- **Quick Actions**: Links to user management, moderation, analytics

### Credits Tab (NOW WITH REAL CREDITS!)
- **Real-Time Credit Sync**: 
  - 🔄 **Sync Real Credits** button fetches actual balance from NanoBanana API
  - Shows both database credits and API credits
  - Last sync timestamp displayed
  - Auto-detects consumption between syncs
- **Platform Credit Balances**: 
  - **REAL** balance from provider API
  - Total purchased/consumed
  - Credit ratios (user credits : provider credits)
  - Low balance thresholds with alerts
- **Quick Refill Actions**: One-click credit purchasing (updates database)
- **Credit Packages**: Marketplace offerings configuration

### Users Tab (Coming Soon)
- User search and filtering
- Role management
- Subscription modifications
- Account actions (suspend, delete, verify)

### Content Tab (Coming Soon)
- Reported content queue
- Moderation actions
- Content policies
- Automated moderation settings

## 🔧 API Endpoints

### Platform Credits
```
GET /api/admin/platform-credits
  - Get all provider balances with health status

POST /api/admin/platform-credits
  - Refill credits for a provider
  - Body: { provider, amount, notes }

PATCH /api/admin/platform-credits
  - Update provider settings
  - Body: { provider, credit_ratio, low_balance_threshold, auto_refill_enabled }
```

### Analytics
```
GET /api/admin/analytics?period=7d
  - Get comprehensive analytics
  - Periods: 7d, 30d, 90d, all
  - Returns: userGrowth, creditUsage, revenue, platformHealth
```

## 🎯 Key Admin Functions

### 1. Managing Platform Credits
The platform operates as a credit marketplace:
- **NanoBanana**: 1 user credit = 4 provider credits
- **OpenAI**: 1 user credit = 0.1 provider credits  
- **Pexels**: 1 user credit = 1 API call

Admins must maintain adequate balances to ensure service availability.

### 2. Monitoring Health Status
Watch for:
- ⚠️ Low credit warnings (below threshold)
- 📉 High error rates (>5% degraded, >10% critical)
- 👥 Active user trends
- 💰 Revenue patterns

### 3. Credit Package Configuration
Manage marketplace offerings:
- **Starter Pack**: 10 credits @ €9.99
- **Creative Bundle**: 50 credits @ €39.99
- **Pro Pack**: 100 credits @ €69.99
- **Studio Pack**: 500 credits @ €299.99

## 🔐 Security

### Admin Role Requirements
Users must have 'ADMIN' in their role_flags array:
```javascript
role_flags: ['ADMIN', 'CONTRIBUTOR', 'TALENT']
```

### Protected Routes
All `/admin/*` routes require:
1. Valid authentication token
2. ADMIN role flag
3. Active user account

### Audit Trail
All admin actions are logged:
- Credit refills tracked in `platform_credit_purchases`
- User modifications logged
- Settings changes recorded

## 📈 Credit Economics

### Platform Margin Calculation
```
User Price: €0.70-1.00 per credit (depending on package)
NanoBanana Cost: €0.004 per credit (4 credits × €0.001)
Margin: ~€0.696-0.996 per user credit (99.4-99.6%)
```

### Break-even Analysis
- Starter Pack (10 credits): €9.99 revenue, €0.04 cost
- Pro Pack (100 credits): €69.99 revenue, €0.40 cost
- Studio Pack (500 credits): €299.99 revenue, €2.00 cost

## 🚨 Alerts & Monitoring

### Automatic Alerts (Planned)
- Credit balance < threshold
- Error rate > 5%
- Unusual spending patterns
- Suspicious user activity

### Manual Checks
Admins should regularly:
1. Review platform credit levels (daily)
2. Check analytics trends (weekly)
3. Audit user reports (daily)
4. Verify revenue reconciliation (monthly)

## 🛣️ Roadmap

### Phase 1 (Completed) ✅
- Basic admin dashboard
- Credit management
- Platform analytics
- Admin authentication

### Phase 2 (Next)
- User management interface
- Content moderation queue
- Automated alerts
- Bulk user actions

### Phase 3 (Future)
- Advanced analytics
- A/B testing tools
- Custom report builder
- API rate limiting controls

## 📝 Common Tasks

### Refill Platform Credits
1. Go to Credits tab
2. Find the provider (e.g., NanoBanana)
3. Click refill amount (+1,000, +5,000, +10,000)
4. Confirm the action

### Check Platform Health
1. Go to Overview tab
2. Review key metrics
3. Check Analytics for trends
4. Monitor error rates

### Investigate User Issues
1. Check user's credit balance
2. Review their enhancement history
3. Check for failed transactions
4. Verify subscription status

## 🆘 Troubleshooting

### "Unauthorized - Admin access required"
- Ensure user has ADMIN role: `node scripts/make-admin.js email@example.com`
- Check authentication token is valid
- Verify profile has correct role_flags

### Platform Credits Not Updating
- Check Supabase connection
- Verify service role key is correct
- Check RLS policies on platform_credits table

### Analytics Not Loading
- Ensure enhancement_tasks table has data
- Check date range parameters
- Verify database queries are optimized

---

## Quick Start Commands

```bash
# Make yourself an admin
node scripts/make-admin.js your-email@example.com

# Start development server
npm run dev

# Access admin dashboard
open http://localhost:3000/admin
```

The admin dashboard is now fully functional with credit management, analytics, and platform monitoring capabilities! 🎉