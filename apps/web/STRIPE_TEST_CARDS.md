# Stripe Test Cards Documentation

This document provides comprehensive information about test cards for Stripe payment testing on your Vercel domain: `https://web-brown-three-40.vercel.app`

## 🎯 Quick Reference

| Card Number | Result | Description |
|-------------|--------|-------------|
| `4242 4242 4242 4242` | ✅ Success | Visa - Most common test card |
| `4000 0000 0000 0002` | ❌ Decline | Generic decline |
| `4000 0000 0000 9995` | ❌ Insufficient Funds | Not enough money |
| `4000 0000 0000 0069` | ❌ Expired Card | Card has expired |

## 💳 Detailed Test Cards

### Success Cards

#### Visa
- **Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **Result**: ✅ Payment succeeds

#### Visa (Debit)
- **Number**: `4000 0566 5566 5556`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: ✅ Payment succeeds

#### Mastercard
- **Number**: `5555 5555 5555 4444`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: ✅ Payment succeeds

#### American Express
- **Number**: `3782 822463 10005`
- **Expiry**: Any future date
- **CVC**: Any 4 digits
- **Result**: ✅ Payment succeeds

### Decline Cards

#### Generic Decline
- **Number**: `4000 0000 0000 0002`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: ❌ Generic decline

#### Insufficient Funds
- **Number**: `4000 0000 0000 9995`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: ❌ Insufficient funds

#### Expired Card
- **Number**: `4000 0000 0000 0069`
- **Expiry**: Any past date (e.g., `01/20`)
- **CVC**: Any 3 digits
- **Result**: ❌ Expired card

#### Lost Card
- **Number**: `4000 0000 0000 9987`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: ❌ Lost card

#### Stolen Card
- **Number**: `4000 0000 0000 9979`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: ❌ Stolen card

### Processing Error Cards

#### Processing Error
- **Number**: `4000 0000 0000 0119`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **Result**: ❌ Processing error

#### Incorrect CVC
- **Number**: `4000 0000 0000 0127`
- **Expiry**: Any future date
- **CVC**: Any incorrect CVC
- **Result**: ❌ Incorrect CVC

## 🧪 Testing Scenarios

### 1. Successful Subscription Upgrade
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
Email: test@example.com
Expected: ✅ Redirect to success page
```

### 2. Payment Decline
```
Card: 4000 0000 0000 0002
Expiry: 12/25
CVC: 123
Email: test@example.com
Expected: ❌ Show decline message
```

### 3. Insufficient Funds
```
Card: 4000 0000 0000 9995
Expiry: 12/25
CVC: 123
Email: test@example.com
Expected: ❌ Show insufficient funds message
```

### 4. Expired Card
```
Card: 4000 0000 0000 0069
Expiry: 01/20 (past date)
CVC: 123
Email: test@example.com
Expected: ❌ Show expired card message
```

## 🔧 Test Configuration

### Required Information
- **Email**: Any valid email format (e.g., `test@example.com`)
- **Name**: Any name (e.g., `Test User`)
- **Address**: Any address (optional for testing)

### Test Environment
- **Domain**: `https://web-brown-three-40.vercel.app`
- **Subscription Page**: `https://web-brown-three-40.vercel.app/subscription`
- **Credits Page**: `https://web-brown-three-40.vercel.app/credits/purchase`

## 📋 Testing Checklist

### Pre-Test Setup
- [ ] Deploy latest code to Vercel
- [ ] Configure Stripe webhooks
- [ ] Verify environment variables are set
- [ ] Test API endpoints are accessible

### Payment Flow Testing
- [ ] Visit subscription page
- [ ] Click "Upgrade to Plus" or "Upgrade to Pro"
- [ ] Use test card numbers
- [ ] Complete payment form
- [ ] Verify redirect behavior
- [ ] Check database updates
- [ ] Test webhook events

### Error Handling Testing
- [ ] Test decline scenarios
- [ ] Test insufficient funds
- [ ] Test expired cards
- [ ] Test processing errors
- [ ] Verify error messages display correctly

## 🚨 Important Notes

### Security
- **Never use real card numbers** in test mode
- **Test cards only work** in Stripe test mode
- **Real payments will fail** with test cards in live mode

### Webhook Testing
- Webhooks must be configured in Stripe Dashboard
- Test webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Webhook URL: `https://web-brown-three-40.vercel.app/api/stripe/webhook`

### Environment Variables
Ensure these are set in your Vercel deployment:
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

## 🔍 Troubleshooting

### Common Issues

#### Payment Not Processing
- Check if Stripe keys are correct
- Verify webhook configuration
- Check browser console for errors

#### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check webhook secret matches environment variable
- Ensure webhook events are selected in Stripe Dashboard

#### Redirect Issues
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check success/cancel URLs in checkout session

## 📞 Support

If you encounter issues:
1. Check Stripe Dashboard for payment logs
2. Review webhook event logs
3. Check Vercel function logs
4. Verify environment variables

## 🔗 Useful Links

- [Stripe Test Cards Documentation](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Your Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)

---

**Last Updated**: September 18, 2025  
**Domain**: `https://web-brown-three-40.vercel.app`  
**Environment**: Test Mode
