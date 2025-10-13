#!/bin/bash

# Switch to Local Supabase
echo "🔄 Switching to LOCAL Supabase..."

# Create .env.local with local Supabase config
cat > .env.local << 'EOF'
# Local Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM6RAZsxM8c-0LkibnAkGnY2vQYJRlAPQ5pU7N7iY

# Keep other important configs from server
PEXELS_API_KEY=7cp1HqLTITG09HHLsMGCYtE7ONIn86x5BL0IISNPvqw3J7URiGHcFeGv
NANOBANANA_API_KEY=e0847916744535b2241e366dbca9a465
NANOBANANA_CALLBACK_URL=https://preset-pgc17ubpc-jewwiids-projects.vercel.app/api/imagegen/callback
NANOBANAN_CREDITS_PER_ENHANCEMENT=1
OPENAI_API_KEY=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
WAVESPEED_API_KEY=a65e58dbbba5c24d2ad6462ed784ad524dfc1d752e0331b1ef46ba2e9d85fb0d
NEXT_PUBLIC_APP_URL=https://preset-pgc17ubpc-jewwiids-projects.vercel.app
EOF

echo "✅ Switched to LOCAL Supabase"
echo "📍 Using: http://127.0.0.1:54321"
echo ""
echo "🚀 Restart your dev server to apply changes:"
echo "   npm run dev"
echo ""
echo "⚠️  Note: Local database has limited data. Use for testing only!"
