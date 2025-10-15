#!/bin/bash

# Phase 2: Enhanced Matchmaking Migration Script - PRODUCTION
# Run this to apply all Phase 2 enhancements to PRODUCTION database

# Get password from .env.local
PASSWORD=$(grep SUPABASE_DB_PASSWORD .env.local | cut -d '=' -f2)
DB_URL="postgresql://postgres:${PASSWORD}@db.zbsmgymyfhnwjdnmlelr.supabase.co:5432/postgres"

echo "🚀 Starting Phase 2 Migration on PRODUCTION..."
echo "⚠️  WARNING: This will modify the production database!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled"
    exit 0
fi

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
echo "🧪 Step 3/3: Testing with Production Data..."
psql "$DB_URL" <<'SQL'
-- Quick production test
DO $$
DECLARE
    v_user_id UUID;
    v_gig_id UUID;
    v_result RECORD;
BEGIN
    RAISE NOTICE '=== Testing Enhanced Matchmaking on Production ===';

    -- Get a real user
    SELECT user_id INTO v_user_id
    FROM users_profile
    WHERE account_status = 'active'
    LIMIT 1;

    -- Get a real gig
    SELECT id INTO v_gig_id
    FROM gigs
    WHERE status = 'PUBLISHED'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️  No active users found';
        RETURN;
    END IF;

    IF v_gig_id IS NULL THEN
        RAISE NOTICE '⚠️  No published gigs found';
        RETURN;
    END IF;

    -- Test the function
    SELECT * FROM calculate_gig_compatibility(v_user_id, v_gig_id)
    INTO v_result;

    RAISE NOTICE '✅ Function working! Score: %, Breakdown keys: %',
        v_result.score,
        jsonb_object_keys(v_result.breakdown);
END $$;
SQL

echo ""
echo "════════════════════════════════════════════"
echo "✅ Phase 2 Production Migration Complete!"
echo "════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Test matchmaking in UI"
echo "2. Create a gig with detailed preferences"
echo "3. Check compatibility scores"
echo ""
