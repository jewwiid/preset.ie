#!/bin/bash

# Phase 2: Enhanced Matchmaking Migration Script
# Run this to apply all Phase 2 enhancements

DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "🚀 Starting Phase 2 Migration..."
echo ""

echo "📊 Step 1/3: Deploying Enhanced Compatibility Algorithm..."
psql "$DB_URL" -f supabase/migrations/20251015000008_enhanced_matchmaking_algorithm.sql

if [ $? -eq 0 ]; then
    echo "✅ Enhanced compatibility algorithm deployed"
else
    echo "❌ Failed to deploy compatibility algorithm"
    exit 1
fi

echo ""
echo "🔄 Step 2/3: Updating Recommendation Functions..."
psql "$DB_URL" -f supabase/migrations/20251015000009_update_recommendations_function.sql

if [ $? -eq 0 ]; then
    echo "✅ Recommendation functions updated"
else
    echo "❌ Failed to update recommendation functions"
    exit 1
fi

echo ""
echo "🧪 Step 3/3: Running Tests..."
psql "$DB_URL" -f supabase/migrations/TEST_ENHANCED_MATCHMAKING.sql

echo ""
echo "════════════════════════════════════════════"
echo "✅ Phase 2 Migration Complete!"
echo "════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Check test results above"
echo "2. Create a gig with preferences in UI"
echo "3. Test matchmaking scores"
echo ""
