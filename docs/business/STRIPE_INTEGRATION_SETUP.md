# Stripe Integration Setup Guide

## Overview
This guide will walk you through setting up Stripe payments for your Preset application. The integration includes credit purchases, subscription management, and webhook handling.

## ✅ Implementation Status

### Completed Components
- [x] Stripe SDK configuration (`apps/web/lib/stripe.ts`)
- [x] Webhook endpoint (`/api/stripe/webhook`)
- [x] Checkout session creation (`/api/stripe/create-checkout-session`)
- [x] Customer management (`/api/stripe/customer`)
- [x] Database schema (migration `051_stripe_integration_tables.sql`)
- [x] Credit purchase flow integration
- [x] Environment variable configuration
- [x] Test script for validation

### Database Tables Created
- `checkout_sessions` - Tracks Stripe checkout sessions
- `payment_logs` - Logs payment events
- `invoice_logs` - Tracks subscription invoices
- `credit_packages` - Configurable credit packages
- `subscription_plans` - Subscription plan configuration
- `platform_credit_purchases` - Admin credit purchases
- `platform_alerts` - Payment/credit alerts

## 🔧 Setup Instructions

### Step 1: Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create account or log in
3. Complete business verification if needed

### Step 2: Get API Keys
1. In Stripe Dashboard, go to **Developers > API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Reveal and copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Configure Environment Variables
Add these to your `.env.local` (development) and production environment:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 4: Apply Database Migration
```bash
npx supabase db push
```

### Step 5: Configure Webhook Endpoint
1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** to `STRIPE_WEBHOOK_SECRET`

### Step 6: Create Products and Prices in Stripe
1. Go to **Products** in Stripe Dashboard
2. Create products for each credit package:
   - **Starter Pack** - $5.00 (10 credits)
   - **Creative Pack** - $20.00 (50 credits)
   - **Pro Pack** - $35.00 (100 credits)
   - **Studio Pack** - $150.00 (500 credits)
3. Copy the Price IDs and update `apps/web/lib/stripe.ts`:

```typescript
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    priceUsd: 5.00,
    stripePriceId: 'price_1234567890abcdef', // Replace with actual Price ID
    description: '10 credits for image enhancements',
  },
  // ... update other packages
];
```

### Step 7: Test Integration
Run the test script:
```bash
node scripts/test-stripe-integration.js
```

### Step 8: Test with Stripe CLI (Development)
1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward events to local webhook:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Use the webhook secret from CLI output

## 🔄 Credit Purchase Flow

### Frontend Integration
Users will interact with credit packages through a checkout flow:

1. **Package Selection**: Users select a credit package
2. **Checkout Session**: Frontend calls `/api/stripe/create-checkout-session`
3. **Stripe Checkout**: User is redirected to Stripe-hosted checkout
4. **Payment Processing**: Stripe handles payment securely
5. **Webhook Processing**: Success/failure is handled via webhook
6. **Credit Allocation**: Credits are automatically added to user account

### API Endpoints

#### Create Checkout Session
```
POST /api/stripe/create-checkout-session
Authorization: Bearer <token>
Body: {
  "packageId": "creative",
  "successUrl": "https://your-app.com/credits/success",
  "cancelUrl": "https://your-app.com/credits/cancelled"
}
```

#### Get Available Packages
```
GET /api/credits/purchase
```
Returns packages with availability based on platform capacity.

#### Customer Management
```
GET /api/stripe/customer
POST /api/stripe/customer
DELETE /api/stripe/customer
Authorization: Bearer <token>
```

## 🚨 Security Features

### Webhook Verification
- All webhooks are verified using Stripe signature
- Invalid signatures are rejected
- Events are processed idempotently

### Platform Capacity Checks
- System prevents overselling credits
- Platform balance is checked before checkout
- Alerts are generated for low capacity

### User Authentication
- All endpoints require valid JWT token
- Users can only access their own data
- Admin endpoints have role-based access

## 📊 Monitoring & Alerts

### Platform Alerts
The system generates alerts for:
- Low platform credit balance
- Insufficient credits for purchase
- Payment failures
- High usage patterns

### Payment Logging
All payment events are logged in:
- `payment_logs` - Payment intents
- `invoice_logs` - Subscription billing
- `checkout_sessions` - Purchase sessions

## 🔧 Admin Features

### Credit Management
Admins can:
- View platform credit balance
- Purchase additional platform credits
- Monitor usage patterns
- Resolve payment issues

### Package Configuration
- Credit packages are configurable via database
- Pricing can be updated without code changes
- Packages can be enabled/disabled

## 🧪 Testing

### Test Cards (Development)
Use these test cards in development:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Webhook Testing
```bash
# Test specific events
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

## 🚀 Production Deployment

### Checklist
- [ ] Update environment variables with live keys
- [ ] Configure production webhook endpoint
- [ ] Create live products and prices
- [ ] Test live payments with small amounts
- [ ] Monitor error logs and alerts
- [ ] Set up Stripe webhooks monitoring

### Environment Variables (Production)
```bash
STRIPE_SECRET_KEY=sk_live_your_actual_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

## 📈 Analytics & Reporting

### Available Data
- Purchase volume by package
- Revenue tracking
- Failed payment analysis
- Platform capacity utilization
- User credit usage patterns

### Stripe Dashboard
Access detailed analytics in Stripe Dashboard:
- Payment volume
- Customer analytics
- Revenue reports
- Dispute management

## 🆘 Troubleshooting

### Common Issues

**"Invalid signature" errors**
- Check webhook secret matches Stripe Dashboard
- Ensure raw body is passed to verification

**"Insufficient credits" errors**
- Check platform capacity in admin panel
- Verify credit ratio configuration

**Checkout session creation fails**
- Verify Stripe API keys are correct
- Check product/price IDs exist in Stripe
- Ensure customer creation succeeds

**Webhook events not processing**
- Check webhook endpoint is publicly accessible
- Verify event types are subscribed
- Check application logs for errors

### Support Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)
- [Webhook Testing Guide](https://stripe.com/docs/webhooks/test)

## 🎯 Next Steps

1. **Frontend Integration**: Build UI components for credit purchase
2. **Subscription Management**: Add subscription upgrade/downgrade flows
3. **Usage Analytics**: Implement detailed usage tracking
4. **Payment Methods**: Add support for multiple payment methods
5. **Internationalization**: Add multi-currency support

---

**Status**: ✅ Ready for testing and production deployment
**Last Updated**: $(date)
**Integration Version**: 1.0.0