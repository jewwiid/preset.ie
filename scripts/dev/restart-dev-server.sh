#!/bin/bash

echo "🔄 Restarting development server to apply error logging fixes..."

# Kill any existing Next.js processes
echo "📝 Stopping existing processes..."
pkill -f "next dev" || true
pkill -f "turbo dev" || true

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next
rm -rf apps/web/.next
rm -rf node_modules/.cache

# Clear any other caches
echo "🧹 Clearing other caches..."
rm -rf apps/web/.next/cache || true

# Reinstall dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Start development server
echo "🚀 Starting development server..."
npm run dev

echo "✅ Development server restarted with error logging fixes!"
echo "📝 The dashboard should now show detailed error information instead of empty objects {}"
