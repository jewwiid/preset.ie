#!/bin/bash

# Check current environment
echo "🔍 Checking current Supabase environment..."
echo ""

if [ -f ".env.local" ]; then
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d'=' -f2)
    
    if [[ "$SUPABASE_URL" == *"127.0.0.1"* ]] || [[ "$SUPABASE_URL" == *"localhost"* ]]; then
        echo "📍 Current: LOCAL Supabase"
        echo "   URL: $SUPABASE_URL"
        echo "   Status: 🏠 Local development"
    elif [[ "$SUPABASE_URL" == *"supabase.co"* ]]; then
        echo "📍 Current: SERVER Supabase"
        echo "   URL: $SUPABASE_URL"
        echo "   Status: ☁️  Production/Remote"
    else
        echo "📍 Current: UNKNOWN environment"
        echo "   URL: $SUPABASE_URL"
    fi
else
    echo "❌ No .env.local file found"
fi

echo ""
echo "🔄 To switch environments:"
echo "   ./switch-to-server.sh  (use server data)"
echo "   ./switch-to-local.sh   (use local testing)"
