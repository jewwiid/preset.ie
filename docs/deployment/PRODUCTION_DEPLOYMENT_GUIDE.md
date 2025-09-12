# Production Deployment Guide - Multi-Provider Support

## 🌐 Production URL Configuration

### Current Development URLs
- **Local Development**: `http://localhost:3000`
- **API Endpoint**: `http://localhost:3000/api/enhance-image-v2`
- **Webhook Callback**: `http://localhost:3000/api/imagegen/callback`

### Production URLs (Update These)
- **Production Domain**: `https://preset.ie` (or your actual domain)
- **API Endpoint**: `https://preset.ie/api/enhance-image-v2`
- **Webhook Callback**: `https://preset.ie/api/imagegen/callback`

---

## 🔧 Environment Variables for Production

### 1. Vercel Environment Variables
Add these to your Vercel project settings:

```bash
# Image Generation Provider Configuration
IMAGE_PROVIDER=nanobanana  # or seedream

# NanoBanana API Configuration
NANOBANANA_API_KEY=e0847916744535b2241e366dbca9a465
NANOBANANA_BASE_URL=https://api.nanobanana.ai
NANOBANANA_CALLBACK_URL=https://preset.ie/api/imagegen/callback

# WaveSpeed API Configuration (for Seedream V4)
WAVESPEED_API_KEY=your_wavespeed_api_key_here
WAVESPEED_BASE_URL=https://api.wavespeed.ai
WAVESPEED_WEBHOOK_SECRET=your_webhook_secret_here

# Public callback URL for webhooks
NEXT_PUBLIC_APP_URL=https://preset.ie

# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://zbsmgymyfhnwjdnmlelr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Other existing variables...
```

### 2. Update WaveSpeed Webhook Configuration
1. Go to [WaveSpeed AI Dashboard](https://wavespeed.ai/dashboard)
2. Navigate to Webhooks section
3. Update webhook URL to: `https://preset.ie/api/imagegen/callback`
4. Copy the new webhook secret
5. Update `WAVESPEED_WEBHOOK_SECRET` in Vercel

### 3. Update NanoBanana Callback URL
1. Go to [NanoBanana Dashboard](https://nanobanana.ai/dashboard)
2. Update callback URL to: `https://preset.ie/api/imagegen/callback`
3. Verify the change is saved

---

## 🚀 Deployment Steps

### Step 1: Update Local Environment
```bash
# Update .env.local for testing
NEXT_PUBLIC_APP_URL=https://preset.ie
NANOBANANA_CALLBACK_URL=https://preset.ie/api/imagegen/callback
```

### Step 2: Test Webhook URLs
```bash
# Test if webhook endpoint is accessible
curl -X POST https://preset.ie/api/imagegen/callback \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Step 3: Deploy to Vercel
```bash
# Deploy to production
git add .
git commit -m "feat: multi-provider image enhancement with production URLs"
git push origin main

# Vercel will automatically deploy
```

### Step 4: Verify Production Deployment
```bash
# Test production API
curl -X POST https://preset.ie/api/enhance-image-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "inputImageUrl": "https://images.unsplash.com/photo-1506905925346-14bda2d134df?w=500&h=500&fit=crop",
    "enhancementType": "lighting",
    "prompt": "golden hour lighting",
    "provider": "nanobanana"
  }'
```

---

## 🔄 Webhook URL Updates Required

### 1. WaveSpeed AI (Seedream V4)
- **Current**: `http://localhost:3000/api/imagegen/callback`
- **Production**: `https://preset.ie/api/imagegen/callback`
- **Action**: Update in WaveSpeed dashboard

### 2. NanoBanana
- **Current**: `http://localhost:3000/api/nanobanana/callback`
- **Production**: `https://preset.ie/api/imagegen/callback`
- **Action**: Update in NanoBanana dashboard

### 3. Webhook Endpoint Verification
The webhook endpoint `/api/imagegen/callback` handles both providers:
- **NanoBanana**: Uses `x-nanobanana-signature` header
- **Seedream V4**: Uses `x-wavespeed-signature` header

---

## 🧪 Production Testing Checklist

### Pre-Deployment Testing
- [ ] Local environment works with production URLs
- [ ] Webhook endpoints are accessible
- [ ] API keys are valid
- [ ] Database migrations applied

### Post-Deployment Testing
- [ ] Production API responds correctly
- [ ] Webhook callbacks work
- [ ] Provider switching works
- [ ] Credit system works
- [ ] UI components load correctly

### Monitoring
- [ ] Check Vercel function logs
- [ ] Monitor webhook success rates
- [ ] Track API response times
- [ ] Verify credit transactions

---

## 🔒 Security Considerations

### 1. Webhook Security
- **WaveSpeed**: Verify webhook signatures
- **NanoBanana**: Verify webhook signatures
- **Rate Limiting**: Implement webhook rate limiting

### 2. API Key Security
- **Environment Variables**: Never commit API keys
- **Vercel Secrets**: Use Vercel environment variables
- **Rotation**: Regularly rotate API keys

### 3. CORS Configuration
```javascript
// In your API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://preset.ie',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## 📊 Production Monitoring

### 1. Vercel Analytics
- Monitor function execution times
- Track error rates
- Monitor webhook success rates

### 2. Database Monitoring
- Track enhancement task completion rates
- Monitor credit usage patterns
- Alert on failed webhooks

### 3. Provider Performance
- Track response times per provider
- Monitor success/failure rates
- Alert on provider downtime

---

## 🚨 Rollback Plan

### If Issues Occur:
1. **Revert to single provider**: Set `IMAGE_PROVIDER=nanobanana`
2. **Disable new features**: Comment out provider selection UI
3. **Rollback deployment**: Use Vercel rollback feature
4. **Database rollback**: Revert to previous migration

### Emergency Contacts:
- **Vercel Support**: [Vercel Support](https://vercel.com/support)
- **Supabase Support**: [Supabase Support](https://supabase.com/support)
- **WaveSpeed Support**: [WaveSpeed Support](https://wavespeed.ai/support)

---

## 📋 Final Checklist

### Before Deployment:
- [ ] All environment variables configured
- [ ] Webhook URLs updated in provider dashboards
- [ ] Local testing completed
- [ ] Database migrations applied
- [ ] Security review completed

### After Deployment:
- [ ] Production API tested
- [ ] Webhook callbacks verified
- [ ] UI components working
- [ ] Monitoring set up
- [ ] Documentation updated

---

## 🎯 Quick Start Commands

```bash
# 1. Update environment variables
export NEXT_PUBLIC_APP_URL=https://preset.ie
export NANOBANANA_CALLBACK_URL=https://preset.ie/api/imagegen/callback

# 2. Deploy to production
git add .
git commit -m "feat: production deployment with multi-provider support"
git push origin main

# 3. Test production deployment
curl -X POST https://preset.ie/api/enhance-image-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"inputImageUrl": "https://example.com/image.jpg", "enhancementType": "lighting", "prompt": "test", "provider": "nanobanana"}'
```

**Ready for production deployment!** 🚀
