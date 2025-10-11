# 📊 Daily Admin Summary Email System

## Overview

Automatically sends detailed daily reports to admins via Plunk, tracking:
- **API Usage & Costs** - NanoBanana, Seedream, Seedance usage and WaveSpeed costs
- **User Activity** - Top users, generations, success rates
- **System Health** - Alerts, refunds, provider performance
- **Financial Tracking** - Daily/monthly costs, cost per generation

## 🚀 Quick Setup

### 1. Environment Variables
Add these to your `.env.local` and production environment:

```bash
# Plunk Email Service
PLUNK_API_KEY=your_plunk_api_key

# Admin Email (who receives daily summaries)
ADMIN_EMAIL=admin@yourdomain.com

# Cron Job Security (random secure string)
CRON_SECRET=your_secure_random_string_here

# Site URL for cron jobs
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 2. Deploy to Vercel
The cron job is already configured in `vercel.json`:
```json
{
  "path": "/api/cron/daily-admin-summary",
  "schedule": "0 9 * * *"  // 9 AM UTC daily
}
```

### 3. Test the System
Visit: `https://yourdomain.com/api/admin/test-daily-summary`

## 📧 Email Content

### Daily Summary Includes:

**📊 Key Metrics:**
- Generations completed today
- Total WaveSpeed API costs
- Active users count
- Success rate percentage
- Credits refunded (if any)

**🤖 Provider Breakdown:**
- Usage by provider (NanoBanana, Seedream, etc.)
- Cost per provider
- Average cost per generation

**👥 Top Users:**
- Users with most generations today
- Credits consumed per user

**⚠️ System Alerts:**
- Failed refunds
- API errors
- System warnings

**😴 No Activity Mode:**
- Clean message when no usage
- Links to admin dashboard

## 🔧 Manual Testing

### Test Email Sending:
```bash
curl -X POST https://yourdomain.com/api/admin/test-daily-summary \
  -H "Content-Type: application/json" \
  -d '{"adminEmail": "admin@yourdomain.com"}'
```

### Preview Email HTML:
```bash
curl -X POST https://yourdomain.com/api/admin/test-daily-summary \
  -H "Content-Type: application/json" \
  -d '{"adminEmail": "admin@yourdomain.com", "preview": true}'
```

### Direct Summary Data:
```bash
curl https://yourdomain.com/api/admin/daily-summary
```

## 📅 Cron Schedule

**Current Schedule:** 9 AM UTC daily (`0 9 * * *`)

**Customize in `vercel.json`:**
```json
{
  "path": "/api/cron/daily-admin-summary",
  "schedule": "0 9 * * *"  // 9 AM UTC
  // "schedule": "0 */6 * * *"  // Every 6 hours
  // "schedule": "0 9 * * 1"    // Weekly on Mondays
}
```

## 🎯 What You'll Track

### **API Provider Usage:**
```
NanoBanana: 45 generations, $12.50 total, $0.28 avg
Seedream:   23 generations, $8.75 total, $0.38 avg  
Seedance:   12 generations, $4.20 total, $0.35 avg
```

### **Daily Trends:**
- Peak usage hours
- Cost patterns
- Success/failure rates
- User engagement

### **Financial Monitoring:**
- WaveSpeed API costs
- Cost per generation trends
- Monthly spending forecasts
- Provider cost efficiency

### **System Health:**
- Failed generation refunds
- API provider downtime
- Error rates by provider
- System alerts

## 🔍 Monitoring & Alerts

### **Email Triggers:**
- ✅ **Daily at 9 AM UTC** - Automatic summary
- ✅ **Manual trigger** - Test endpoint
- ✅ **Preview mode** - HTML preview

### **Alert Conditions:**
- High failure rates (>10%)
- Unusual cost spikes
- Provider downtime
- Failed refunds

## 🛠️ Customization

### **Add More Metrics:**
Edit `/api/admin/daily-summary/route.ts` to include:
- Monthly trends
- User growth
- Popular content types
- Geographic usage

### **Change Email Template:**
Modify the `generateEmailHTML()` function for:
- Different styling
- Additional sections
- Custom branding
- Mobile optimization

### **Multiple Admin Recipients:**
Update the cron job to send to multiple admins:
```typescript
const adminEmails = [
  'admin1@domain.com',
  'admin2@domain.com',
  'ceo@domain.com'
];

for (const email of adminEmails) {
  await plunk.sendTransactionalEmail({...});
}
```

## 📊 Sample Email Output

**Subject:** `📊 Daily Admin Summary - 2025-01-15`

**Content:**
```
📊 Daily Admin Summary
2025-01-15 • Preset Platform

┌─────────────────────────────────────────┐
│  Summary Stats                          │
├─────────────────────────────────────────┤
│  Generations Today: 127                 │
│  WaveSpeed Costs: $34.50               │
│  Active Users: 23                      │
│  Success Rate: 94%                     │
│  Credits Refunded: 3                   │
└─────────────────────────────────────────┘

🤖 Provider Usage:
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Provider    │ Generations │ Total Cost  │ Avg/Gen     │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ NanoBanana  │ 67          │ $18.76      │ $0.28       │
│ Seedream    │ 45          │ $17.10      │ $0.38       │
│ Seedance    │ 15          │ $5.25       │ $0.35       │
└─────────────┴─────────────┴─────────────┴─────────────┘

👥 Top Users Today:
┌─────────────────┬─────────────┬─────────────┐
│ User            │ Generations │ Credits Used│
├─────────────────┼─────────────┼─────────────┤
│ CreativeUser123 │ 12          │ 12          │
│ PhotoPro456     │ 8           │ 8           │
│ VideoMaker789   │ 6           │ 6           │
└─────────────────┴─────────────┴─────────────┘
```

## ✅ Ready to Use!

Once deployed, you'll automatically receive daily emails with:
- 📈 **Usage analytics** for all your AI providers
- 💰 **Cost tracking** for WaveSpeed API usage  
- 👥 **User insights** and engagement metrics
- ⚠️ **System health** and error monitoring
- 🔄 **Refund tracking** for failed generations

Perfect for monitoring your pay-per-generation model! 🚀
