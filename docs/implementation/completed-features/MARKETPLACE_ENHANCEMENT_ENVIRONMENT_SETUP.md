# Marketplace Enhancement Environment Setup

## Required Environment Variables

### Stripe Configuration
```bash
# Stripe API Keys (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_... # Get from Stripe webhook endpoint

# Optional: Stripe webhook endpoint URL
STRIPE_WEBHOOK_URL=https://your-domain.com/api/marketplace/enhancements/webhook
```

### Cron Job Security
```bash
# Secret for securing cron job endpoints
CRON_SECRET=your-secure-random-string-here
```

### Supabase Configuration
```bash
# Already configured in your existing setup
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Stripe Setup Instructions

### 1. Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create account or sign in
3. Get your API keys from the Developers section

### 2. Create Webhook Endpoint
1. In Stripe Dashboard, go to Webhooks
2. Click "Add endpoint"
3. Set URL to: `https://your-domain.com/api/marketplace/enhancements/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret

### 3. Test Webhook
1. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/marketplace/enhancements/webhook`
2. Or test in Stripe Dashboard webhook section

## Vercel Cron Jobs Setup

### 1. Add to vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-enhancements",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/reset-monthly-benefits", 
      "schedule": "0 0 1 * *"
    }
  ]
}
```

### 2. Environment Variables in Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all the environment variables listed above
3. Make sure to add them for Production, Preview, and Development environments

## Testing the Setup

### 1. Test Enhancement Creation
```bash
curl -X POST http://localhost:3000/api/marketplace/enhancements/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "test-listing-id",
    "enhancementType": "basic_bump",
    "userId": "test-user-id"
  }'
```

### 2. Test Cron Jobs (Manual)
```bash
# Test enhancement expiration
curl -X GET http://localhost:3000/api/cron/expire-enhancements \
  -H "Authorization: Bearer your-cron-secret"

# Test monthly benefits reset
curl -X GET http://localhost:3000/api/cron/reset-monthly-benefits \
  -H "Authorization: Bearer your-cron-secret"
```

### 3. Test Stripe Webhook
1. Use Stripe CLI: `stripe trigger payment_intent.succeeded`
2. Check your application logs for webhook processing

## Production Deployment Checklist

- [ ] Stripe keys configured for production
- [ ] Webhook endpoint URL updated to production domain
- [ ] Cron secret set to secure random string
- [ ] Vercel cron jobs configured
- [ ] Environment variables added to Vercel
- [ ] Test payment flow end-to-end
- [ ] Test subscription benefits
- [ ] Test automatic expiration
- [ ] Monitor webhook delivery in Stripe Dashboard

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct
   - Verify webhook secret matches
   - Check Stripe Dashboard for delivery attempts

2. **Cron jobs not running**
   - Verify CRON_SECRET environment variable
   - Check Vercel cron configuration
   - Test endpoints manually first

3. **Payment failures**
   - Check Stripe API keys are correct
   - Verify webhook events are being processed
   - Check database permissions for enhancement creation

### Monitoring

- Monitor Stripe Dashboard for failed payments
- Check Vercel function logs for cron job execution
- Monitor database for enhancement expiration
- Track subscription benefit usage
