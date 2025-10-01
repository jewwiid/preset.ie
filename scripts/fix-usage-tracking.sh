#!/bin/bash

# Script to fix preset usage tracking
# This applies the usage tracking migration to both local and remote databases

echo "🔧 Fixing Preset Usage Tracking..."
echo ""

# Check if SUPABASE_DB_URL or DATABASE_URL is set
if [ -z "$SUPABASE_DB_URL" ] && [ -z "$DATABASE_URL" ]; then
    echo "⚠️  No remote database URL found."
    echo "💡 To apply to remote database, set SUPABASE_DB_URL or DATABASE_URL environment variable"
    echo ""
fi

# Apply to local Supabase
echo "📦 Applying to LOCAL database..."
LOCAL_DB="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

psql "$LOCAL_DB" -f supabase/migrations/20250930000001_fix_usage_tracking.sql

if [ $? -eq 0 ]; then
    echo "✅ Local database migration applied successfully"
else
    echo "❌ Failed to apply migration to local database"
fi

echo ""

# Apply to remote if URL is set
if [ ! -z "$SUPABASE_DB_URL" ]; then
    echo "📦 Applying to REMOTE database (SUPABASE_DB_URL)..."
    psql "$SUPABASE_DB_URL" -f supabase/migrations/20250930000001_fix_usage_tracking.sql

    if [ $? -eq 0 ]; then
        echo "✅ Remote database migration applied successfully"
    else
        echo "❌ Failed to apply migration to remote database"
    fi
elif [ ! -z "$DATABASE_URL" ]; then
    echo "📦 Applying to REMOTE database (DATABASE_URL)..."
    psql "$DATABASE_URL" -f supabase/migrations/20250930000001_fix_usage_tracking.sql

    if [ $? -eq 0 ]; then
        echo "✅ Remote database migration applied successfully"
    else
        echo "❌ Failed to apply migration to remote database"
    fi
fi

echo ""
echo "🎉 Usage tracking fix complete!"
echo ""
echo "📊 What was fixed:"
echo "  • Synced usage_count with actual preset_usage records"
echo "  • Added trigger to auto-increment usage_count on new usage"
echo "  • Removed daily unique constraint (allows multiple uses per day)"
echo "  • Updated track_preset_usage function"
echo ""
