#!/bin/bash

# Switch to Server/Production Supabase
echo "🔄 Switching to SERVER Supabase..."

# Copy server config to .env.local
cp envbak.txt .env.local

# Update the environment variables for server
sed -i '' 's/SUPABASE_URL=/NEXT_PUBLIC_SUPABASE_URL=/' .env.local
sed -i '' 's/SUPABASE_ANON_KEY=/NEXT_PUBLIC_SUPABASE_ANON_KEY=/' .env.local

echo "✅ Switched to SERVER Supabase"
echo "📍 Using: https://zbsmgymyfhnwjdnmlelr.supabase.co"
echo ""
echo "🚀 Restart your dev server to apply changes:"
echo "   npm run dev"
