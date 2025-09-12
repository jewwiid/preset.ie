# NanoBanana Integration Deployment Guide

## Current Status ✅
The NanoBanana image enhancement integration is **fully implemented** and ready for production deployment. The code is complete and tested - it just needs the proper environment variables set in your deployment platform.

## Quick Setup for Vercel

### 1. Deploy to Vercel
If you haven't already deployed:
```bash
npm install -g vercel
vercel --prod
```

### 2. Set Environment Variables in Vercel Dashboard
Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Required for NanoBanana
NANOBANANA_API_KEY=e0847916744535b2241e366dbca9a465
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NANOBANANA_CALLBACK_URL=https://your-vercel-app.vercel.app/api/nanobanana/callback

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zbsmgymyfhnwjdnmlelr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMDg4NTMsImV4cCI6MjA3MjY4NDg1M30.02U7mfQVPhw-zw9oTHnPWF7pRRgz-a_DhQ8dwBDUi2c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U

# Optional APIs
PEXELS_API_KEY=7cp1HqLTITG09HHLsMGCYtE7ONIn86x5BL0IISNPvqw3J7URiGHcFeGv
OPENAI_API_KEY=your-openai-api-key
```

**Important:** Replace `your-vercel-app` with your actual Vercel deployment URL.

### 3. Redeploy
After setting environment variables, redeploy:
```bash
vercel --prod
```

## Development Setup (Local Testing)

### Option 1: Using ngrok (Recommended)
1. Install ngrok: https://ngrok.com/download
2. Start your dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL and update `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://your-ngrok-id.ngrok.io
NANOBANANA_CALLBACK_URL=https://your-ngrok-id.ngrok.io/api/nanobanana/callback
```

### Option 2: Using Webhook.site (For Testing)
1. Go to https://webhook.site
2. Copy your unique URL
3. Update `.env.local`:
```bash
NANOBANANA_CALLBACK_URL=https://webhook.site/your-unique-id
```
Note: This won't save images but will show you the callback payloads.

## How It Works

### Enhancement Flow
1. User clicks "Enhance" on an image in the moodboard
2. Frontend sends request to `/api/enhance-image`
3. API optimizes the image and submits to NanoBanana
4. NanoBanana processes asynchronously (10-30 seconds)
5. NanoBanana sends callback to your callback URL
6. Callback handler downloads the enhanced image
7. Enhanced image is saved to Supabase Storage
8. Database is updated with the permanent URL
9. Frontend shows the enhanced image

### Key Components
- **Frontend**: `/apps/web/app/components/MoodboardBuilder.tsx`
- **Enhancement API**: `/apps/web/app/api/enhance-image/route.ts`
- **Callback Handler**: `/apps/web/app/api/nanobanana/callback/route.ts`
- **Image Optimizer**: `/apps/web/lib/image-optimizer.ts`
- **Batch Enhancer**: `/apps/web/lib/batch-enhancer.ts`

## Features Implemented

✅ **Single Image Enhancement**: Click enhance on any moodboard image
✅ **Batch Enhancement**: Enhance all images at once
✅ **Before/After Toggle**: Compare original vs enhanced
✅ **Redo Enhancement**: Try different enhancement options
✅ **Credit Management**: Proper credit deduction and refunds
✅ **Error Handling**: Graceful handling of failures
✅ **Image Optimization**: Automatic compression for faster processing
✅ **Permanent Storage**: Enhanced images saved to Supabase
✅ **Progress Tracking**: Visual feedback during enhancement

## Troubleshooting

### Issue: Enhanced images not saving
**Solution**: Check that your callback URL is accessible:
```bash
curl -X POST https://your-app-url/api/nanobanana/callback \
  -H "Content-Type: application/json" \
  -d '{"code":200,"data":{"taskId":"test"},"msg":"test"}'
```

### Issue: "Insufficient credits" error
**Solution**: User needs to add credits through the credits page

### Issue: SSL Certificate errors
**Solution**: Use a proper HTTPS URL (Vercel provides this automatically)

### Issue: Tasks stuck in "processing"
**Solution**: This means callbacks aren't being received. Check your callback URL configuration.

## Testing

### Test the full flow:
```bash
node test-nanobanana-full-flow.js
```

### Test storage upload:
```bash
node test-storage-upload.js
```

### Test callback manually:
```bash
node test-callback-manually.js test-task-id https://example.com/test.jpg
```

## Production Checklist

- [ ] Deploy to Vercel
- [ ] Set all environment variables in Vercel dashboard
- [ ] Verify callback URL is accessible (no SSL errors)
- [ ] Test enhancement on a sample moodboard
- [ ] Monitor error logs in Vercel Functions tab
- [ ] Set up credit packages for users
- [ ] Configure rate limits if needed

## Support

For issues with:
- **NanoBanana API**: Check https://docs.nanobananaapi.ai/
- **Deployment**: Check Vercel logs and function errors
- **Storage**: Check Supabase dashboard for bucket configuration

The integration is production-ready. Just deploy and set your environment variables!