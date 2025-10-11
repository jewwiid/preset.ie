# Stripe Integration Setup for Boost System

## Required Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Your webhook endpoint secret

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or your production URL
```

## Stripe Dashboard Setup

### 1. Create Webhook Endpoint

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/marketplace/enhancements/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret to your environment variables

### 2. Test the Integration

You can test with Stripe's test cards:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## How It Works

1. **User clicks "Boost Listing"** → Opens boost modal
2. **User selects boost type** → Calls `/api/marketplace/enhancements/create-checkout-session`
3. **Stripe Checkout session created** → User redirected to Stripe
4. **User completes payment** → Stripe sends webhook to `/api/marketplace/enhancements/webhook`
5. **Webhook processes payment** → Creates enhancement record in database
6. **User redirected back** → Sees success message

## Boost Types & Pricing

- **Basic Boost**: €1 for 1 day
- **Priority Boost**: €5 for 3 days  
- **Premium Boost**: €7 for 7 days

## Subscription Benefits

- **Plus Tier**: 1 free Priority Boost per month
- **Pro Tier**: 3 free Premium Boosts per month

## Testing

1. Make sure your environment variables are set
2. Start your development server
3. Go to `/gear/boost` (Boost tab)
4. Try boosting a listing with test card `4242 4242 4242 4242`
5. Check your Stripe dashboard for the payment
6. Verify the enhancement appears in your database
