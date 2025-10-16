#!/bin/bash

# Comprehensive Table Discovery Script
# Finds all accessible tables in the Supabase database

set -euo pipefail

# Configuration
SUPABASE_URL="https://zbsmgymyfhnwjdnmlelr.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U"
PROJECT_REF="zbsmgymyfhnwjdnmlelr"
OUTPUT_FILE="./backup/discovered_tables_$(date +%Y%m%d_%H%M%S).txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 Comprehensive Table Discovery"
echo "================================"
echo "Project: $PROJECT_REF"
echo "Output: $OUTPUT_FILE"
echo ""

# Test if a table exists and get basic info
test_table() {
    local table="$1"
    local description="$2"

    echo -e "${BLUE}Testing: $table${NC} ($description)" >&2

    local response=$(curl -s -w "%{http_code}" "$SUPABASE_URL/rest/v1/$table?limit=1" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

    local http_code="${response: -3}"
    local response_body="${response%???}"

    if [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✅ FOUND: $table${NC}" >&2

        # Get row count
        local count_response=$(curl -s "$SUPABASE_URL/rest/v1/$table?select=count" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Prefer: count=exact")

        local row_count="unknown"
        if [[ "$count_response" =~ [0-9]+ ]]; then
            row_count="$count_response"
        fi

        # Get column info
        local sample_response=$(curl -s "$SUPABASE_URL/rest/v1/$table?limit=1" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

        local column_count="0"
        if echo "$sample_response" | jq -e '.[0]' >/dev/null 2>&1; then
            column_count=$(echo "$sample_response" | jq -r '.[0] | keys | length' 2>/dev/null || echo "0")
        fi

        echo "✅ $table | Rows: $row_count | Columns: $column_count | $description"
        return 0
    else
        echo -e "${RED}❌ Not found: $table (HTTP $http_code)${NC}" >&2
        return 1
    fi
}

# Initialize output file
cat > "$OUTPUT_FILE" << EOF
# Comprehensive Table Discovery Report
# Project: $PROJECT_REF
# Generated: $(date)
# URL: $SUPABASE_URL
#

## Discovered Tables

EOF

echo "Testing common table patterns..." >&2

# Comprehensive list of possible table names
declare -A TABLES=(
    # Core user tables
    ["users"]="Core user accounts table"
    ["profiles"]="User profile information"
    ["accounts"]="User account management"
    ["user_profiles"]="Extended user profiles"
    ["talent_profiles"]="Talent-specific profiles"
    ["auth.users"]="Supabase auth users"
    ["auth.users_audit"]="Auth user audit log"

    # Marketplace tables
    ["listings"]="Equipment/item listings"
    ["offers"]="Offers on listings"
    ["marketplace_listings"]="Alternative marketplace table"
    ["marketplace_offers"]="Alternative offers table"

    # Gigs and work
    ["gigs"]="Creative job postings"
    ["applications"]="Job applications"
    ["gig_invitations"]="Invitations to collaborate"
    ["gig_applications"]="Alternative applications table"
    ["work_orders"]="Work order management"

    # Communication
    ["messages"]="User messages"
    ["conversations"]="Message conversations"
    ["notifications"]="System notifications"
    ["chat_messages"]="Alternative chat table"
    ["email_logs"]="Email communication logs"

    # Content and media
    ["presets"]="Creative presets"
    ["showcases"]="User showcases"
    ["moodboards"]="Creative moodboards"
    ["media"]="Media file metadata"
    ["images"]="Image metadata"
    ["files"]="File management"
    ["uploads"]="Upload management"
    ["media_gallery"]="Media gallery tables"

    # Social and engagement
    ["likes"]="Like/interest system"
    ["comments"]="Comment system"
    ["reviews"]="Review system"
    ["ratings"]="Rating system"
    ["followers"]="Follower system"
    ["bookmarks"]="Bookmark/favorites"

    # Admin and moderation
    ["reports"]="User reports"
    ["admin_users"]="Admin user accounts"
    ["moderation_logs"]="Moderation activity"
    ["verification_requests"]="Identity verification"
    ["banned_users"]="Banned user list"
    ["suspended_users"]="Suspended users"
    ["warnings"]="User warnings"
    ["sanctions"]="User sanctions"

    # Financial and credits
    ["credits"]="User credits system"
    ["transactions"]="Financial transactions"
    ["payments"]="Payment records"
    ["invoices"]="Invoice management"
    ["subscription"]="User subscriptions"
    ["billing"]="Billing information"

    # System and settings
    ["settings"]="System settings"
    ["config"]="Configuration data"
    ["system_config"]="System configuration"
    ["app_settings"]="Application settings"
    ["user_settings"]="User preferences"
    ["feature_flags"]="Feature flags"

    # Categories and taxonomy
    ["categories"]="Content categories"
    ["tags"]="Content tags"
    ["skills"]="User skills"
    ["specializations"]="Professional specializations"
    ["equipment_types"]="Equipment type taxonomy"
    ["brands"]="Brand information"
    ["locations"]="Location data"

    # Analytics and tracking
    ["analytics"]="Analytics data"
    ["page_views"]="Page view tracking"
    ["user_activity"]="User activity logs"
    ["search_history"]="Search history"
    ["audit_log"]="Audit trail"

    # Collaboration
    ["collaborations"]="Collaboration projects"
    ["teams"]="Team management"
    ["team_members"]="Team member relationships"
    ["projects"]="Project management"
    ["invitations"]="Various invitation types"

    # Storage and CDN
    ["storage_objects"]="Supabase storage objects"
    ["storage_buckets"]="Supabase storage buckets"
    ["cdn_usage"]="CDN usage tracking"

    # Common variations
    ["user_profiles_extended"]="Extended profiles"
    ["marketplace"]="General marketplace table"
    ["gigs_marketplace"]="Gigs marketplace"
    ["creative_profiles"]="Creative profile data"
    ["portfolio_items"]="Portfolio item management"
)

echo "Searching for $(echo ${TABLES[@]} | wc -w) potential tables..." >&2

local found_count=0
local total_count=${#TABLES[@]}

# Test each table
for table in "${!TABLES[@]}"; do
    if test_table "$table" "${TABLES[$table]}"; then
        found_count=$((found_count + 1))
    fi
done

# Add summary to output file
cat >> "$OUTPUT_FILE" << EOF

## Summary

- Total tables tested: $total_count
- Tables found: $found_count
- Discovery completed: $(date)

## Notes

- Tables marked as ✅ are accessible and contain data
- Row counts and column information are provided where available
- Some tables may be empty or have restricted access
- This discovery uses the service role key for maximum access

EOF

echo "" >&2
echo -e "${GREEN}🎉 Discovery completed!${NC}" >&2
echo "Results: $found_count/$total_count tables found" >&2
echo "Report saved to: $OUTPUT_FILE" >&2

# Show top results
echo "" >&2
echo -e "${BLUE}📊 Top discovered tables:${NC}" >&2
echo "✅ $table | Rows: $row_count | Columns: $column_count | $description" | head -10 >&2

echo ""
echo "Full report available at: $OUTPUT_FILE"
echo ""
echo "To export all discovered tables, run:"
echo "./backup/export-discovered-tables.sh $OUTPUT_FILE"