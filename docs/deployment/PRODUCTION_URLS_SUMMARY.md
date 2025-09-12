# Production URL Updates Summary

## 🔄 URLs That Need to be Updated

### 1. WaveSpeed AI Dashboard
- **Current**: `http://localhost:3000/api/imagegen/callback`
- **Production**: `https://preset.ie/api/imagegen/callback`
- **Action**: Update webhook URL in WaveSpeed dashboard

### 2. NanoBanana Dashboard  
- **Current**: `http://localhost:3000/api/nanobanana/callback`
- **Production**: `https://preset.ie/api/imagegen/callback`
- **Action**: Update callback URL in NanoBanana dashboard

### 3. Environment Variables
- **NEXT_PUBLIC_APP_URL**: `https://preset.ie`
- **NANOBANANA_CALLBACK_URL**: `https://preset.ie/api/imagegen/callback`

## 🚀 Quick Deployment Steps

### Step 1: Update Provider Dashboards
1. **WaveSpeed AI**: Go to webhooks section, update URL to `https://preset.ie/api/imagegen/callback`
2. **NanoBanana**: Go to settings, update callback URL to `https://preset.ie/api/imagegen/callback`

### Step 2: Add Vercel Environment Variables
Copy these to your Vercel project settings:

```bash
IMAGE_PROVIDER=nanobanana
NEXT_PUBLIC_APP_URL=https://preset.ie
NANOBANANA_BASE_URL=https://api.nanobanana.ai
NANOBANANA_CALLBACK_URL=https://preset.ie/api/imagegen/callback
WAVESPEED_API_KEY=your_wavespeed_api_key_here
WAVESPEED_BASE_URL=https://api.wavespeed.ai
WAVESPEED_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 3: Deploy
```bash
git add .
git commit -m "feat: production deployment with multi-provider support"
git push origin main
```

### Step 4: Test Production
```bash
curl -X POST https://preset.ie/api/enhance-image-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"inputImageUrl": "https://example.com/image.jpg", "enhancementType": "lighting", "prompt": "test", "provider": "nanobanana"}'
```

## ✅ Ready for Production!

Your multi-provider image enhancement system is ready for production deployment. The main changes needed are:

1. **Update webhook URLs** in both provider dashboards
2. **Add environment variables** to Vercel
3. **Deploy to production**
4. **Test the endpoints**

The system will work seamlessly with both providers once deployed! 🎉
