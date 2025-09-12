# 🚀 Quick Local Testing Guide (Without ngrok)

## Option 1: Use Mock Mode (Immediate Testing)

The app has a **mock enhancement mode** that simulates the enhancement without calling NanoBanana. This is perfect for testing the UI flow immediately.

### Steps:
1. Make sure dev server is running: `npm run dev` (already running)
2. Open http://localhost:3000
3. Sign in and create a gig with moodboard
4. Edit `.env.local` and add: `USE_MOCK_ENHANCEMENT=true`
5. Restart the dev server
6. Now enhancements will use the mock endpoint!

## Option 2: Manual ngrok Setup

### Get Your Own Free ngrok Account:
1. Sign up at: https://dashboard.ngrok.com/signup
2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Run: `ngrok config add-authtoken YOUR_TOKEN`
4. Start tunnel: `ngrok http 3000`
5. Copy the HTTPS URL (like `https://abc123.ngrok.io`)

### Update Environment:
Edit `apps/web/.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://YOUR-NGROK-URL.ngrok.io
NANOBANANA_CALLBACK_URL=https://YOUR-NGROK-URL.ngrok.io/api/nanobanana/callback
```

### Restart and Test:
1. Restart dev server: `npm run dev`
2. Go to http://localhost:3000
3. Create a gig with moodboard
4. Click "Enhance" on any image
5. Watch the enhancement happen!

## Option 3: Deploy Your Own Vercel Instance

### Quick Deploy:
1. Fork the repo to your GitHub
2. Go to https://vercel.com/new
3. Import your forked repo
4. Add these environment variables in Vercel:
   - All variables from `.env.local`
   - Use your Vercel URL for callbacks
5. Deploy!

## Testing the Enhancement Flow

### 1. Create Test User & Credits:
```bash
node apps/web/add_test_credits.js
```

### 2. Test Moodboard Creation:
- Go to Gigs → Create Gig
- Add title and description
- Click "Add Moodboard"
- Upload or search for images
- Save the moodboard

### 3. Test Enhancement:
- Click "Enhance" on any image
- Choose enhancement type
- Watch the progress bar
- See the enhanced image replace the original

### 4. Test Before/After Toggle:
- After enhancement, click the toggle icon
- Compare original vs enhanced

### 5. Test Redo:
- Click "Redo" to try a different enhancement

## Troubleshooting

### Dev Server Not Running?
```bash
cd apps/web
npm run dev
```

### Database Connection Issues?
Check Supabase is accessible:
```bash
node test-storage-upload.js
```

### Credits Not Working?
Add test credits:
```bash
node apps/web/add_test_credits.js
```

### Enhanced Images Not Saving?
This only happens with real NanoBanana (not mock mode). You need:
- A public callback URL (ngrok or Vercel)
- Proper environment variables set

## Current Status

✅ **App is running locally** at http://localhost:3000
✅ **Build successful** - No errors
✅ **Mock mode available** - Test immediately
✅ **Database connected** - Supabase is working
✅ **Storage configured** - Images can be uploaded

## Quick Commands

```bash
# Check if everything is running
ps aux | grep "npm run dev"

# View logs
tail -f .next/server/logs/*

# Test database connection
node test-storage-upload.js

# Add test credits
node apps/web/add_test_credits.js
```

That's it! You can test the enhancement flow immediately using mock mode, or set up ngrok for real enhancements.