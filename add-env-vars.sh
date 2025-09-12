#!/bin/bash

# Add all environment variables to Vercel
echo "Adding environment variables to Vercel..."

# Core Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force
vercel env add SUPABASE_SERVICE_ROLE_KEY production --force

# NanoBanana
vercel env add NANOBANANA_API_KEY production --force
vercel env add NANOBANANA_CALLBACK_URL production --force
vercel env add NANOBANAN_CREDITS_PER_ENHANCEMENT production --force

# Stripe
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --force
vercel env add STRIPE_WEBHOOK_SECRET production --force

# OpenAI
vercel env add OPENAI_API_KEY production --force

# Pexels
vercel env add PEXELS_API_KEY production --force

# Wavespeed
vercel env add WAVESPEED_API_KEY production --force

# App URL
vercel env add NEXT_PUBLIC_APP_URL production --force

# Additional
vercel env add IMAGE_PROVIDER production --force
vercel env add NEXT_PUBLIC_ENVIRONMENT production --force
vercel env add USE_MOCK_ENHANCEMENT production --force

echo "All environment variables added successfully!"
