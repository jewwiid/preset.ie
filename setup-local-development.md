# Local Development Setup for NanoBanana Integration

## Issue: Callback URL Problem

NanoBanana API uses callbacks to deliver generated images, but it cannot reach `localhost:3000` from the internet. This means callbacks will fail during local development.

## Solutions

### Option 1: Use ngrok (Recommended)

1. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

2. **Copy the HTTPS URL** from ngrok output (e.g., `https://abc123.ngrok-free.app`)

3. **Set environment variable**:
   ```bash
   export NGROK_URL="https://your-ngrok-url.ngrok-free.app"
   ```

4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option 2: Use Seedream Provider (No Callbacks)

In the playground, select "Seedream" as the provider instead of "NanoBanana". Seedream doesn't use callbacks and works fine with localhost.

### Option 3: Set Base URL

Create a `.env.local` file:
```bash
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

## Quick Test Commands

```bash
# Terminal 1: Start ngrok
ngrok http 3000

# Terminal 2: Set environment and start dev server
export NGROK_URL="https://your-ngrok-url.ngrok-free.app"
npm run dev
```

## Verification

Check the server logs for:
```
🔗 Callback URL: https://your-ngrok-url.ngrok-free.app/api/nanobanana/callback
```

If you see a localhost URL, the callback won't work and you'll need to use one of the solutions above.
