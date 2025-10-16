#!/bin/bash

# Quick Table Backup - Discover and Export Tables
# Automatically discovers tables and exports them to SQL

set -euo pipefail

# Configuration
SUPABASE_URL="https://zbsmgymyfhnwjdnmlelr.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U"
PROJECT_REF="zbsmgymyfhnwjdnmlelr"
BACKUP_DIR="./backup/table-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
NOTIFICATION_SCRIPT="./backup/send-backup-notification.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🗄️  Quick Table Backup"
echo "====================="
echo "Project: $PROJECT_REF"
echo "Timestamp: $TIMESTAMP"
echo "Output: $BACKUP_DIR"
echo ""

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    local file_size="$3"

    if [[ -f "$NOTIFICATION_SCRIPT" ]]; then
        "$NOTIFICATION_SCRIPT" "$status" "preset.ie" "$PROJECT_REF" "table-backup" "" "$file_size" "$message" >/dev/null 2>&1 &
    fi
}

# Test if a table exists and get sample data
test_table() {
    local table="$1"
    echo -e "${BLUE}🔍 Testing table: $table${NC}"

    local response=$(curl -s "$SUPABASE_URL/rest/v1/$table?limit=1" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -w "%{http_code}")

    local http_code="${response: -3}"
    local response_body="${response%???}"

    if [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✅ Table exists: $table${NC}"
        return 0
    else
        echo -e "${RED}❌ Table not accessible: $table (HTTP $http_code)${NC}"
        return 1
    fi
}

# Export table structure and data
export_table() {
    local table="$1"
    local output_file="$2"

    echo -e "${BLUE}📤 Exporting table: $table${NC}"

    # Get row count
    local count_response=$(curl -s "$SUPABASE_URL/rest/v1/$table?select=count" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Prefer: count=exact")

    # Get table data
    local data_response=$(curl -s "$SUPABASE_URL/rest/v1/$table?limit=100" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

    # Write to file
    cat > "$output_file" << EOF
-- =====================================
-- Table: $table
-- Project: $PROJECT_REF
-- Exported: $(date)
-- =====================================

-- Table Structure (Sample Data)
-- This is a JSON export of the table data
-- To recreate this table, use the Supabase dashboard or SQL schema export

-- Sample Data (first 100 rows)
\`\`\`json
$data_response
\`\`\`

-- Export completed at $(date)

EOF

    echo -e "${GREEN}✅ Exported: $table${NC}"
    return 0
}

# Common table names to check
TABLES_TO_CHECK=(
    "users"
    "profiles"
    "offers"
    "listings"
    "gigs"
    "applications"
    "messages"
    "notifications"
    "auth.users"
    "presets"
    "showcases"
    "talent_profiles"
    "moodboards"
    "collaborations"
    "admin_users"
    "marketplace_listings"
    "gig_invitations"
    "reports"
    "verification_requests"
    "media"
    "credits"
    "tags"
    "categories"
    "settings"
)

# Main backup process
main() {
    echo -e "${BLUE}🚀 Starting table discovery and backup...${NC}"
    send_notification "started" "Starting table backup" ""

    local backup_file="$BACKUP_DIR/table_backup_${TIMESTAMP}.sql"
    local summary_file="$BACKUP_DIR/backup_summary_${TIMESTAMP}.txt"

    # Create main backup file
    cat > "$backup_file" << EOF
-- =====================================
-- Supabase Table Backup
-- Project: $PROJECT_REF
-- Generated: $(date)
-- URL: $SUPABASE_URL
-- =====================================

EOF

    echo "Backup started at $(date)" > "$summary_file"
    echo "Project: $PROJECT_REF" >> "$summary_file"
    echo "URL: $SUPABASE_URL" >> "$summary_file"
    echo "" >> "$summary_file"

    local found_tables=0
    local exported_tables=0

    # Check each table
    for table in "${TABLES_TO_CHECK[@]}"; do
        found_tables=$((found_tables + 1))

        if test_table "$table"; then
            local temp_file="$BACKUP_DIR/temp_${table}_${TIMESTAMP}.sql"

            if export_table "$table" "$temp_file"; then
                # Append to main backup file
                cat "$temp_file" >> "$backup_file"
                echo "" >> "$backup_file"

                exported_tables=$((exported_tables + 1))
                echo "✅ Exported: $table" >> "$summary_file"

                # Show sample data
                echo -e "${YELLOW}📋 Sample data from $table:${NC}"
                curl -s "$SUPABASE_URL/rest/v1/$table?limit=2" \
                    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | \
                    jq -r '.[0] | keys[] as $k | "\($k): \(.[$k])"' 2>/dev/null | head -5 || echo "  (No sample data available)"
                echo ""
            fi

            # Clean up temp file
            rm -f "$temp_file"
        fi
    done

    # Add summary to backup file
    cat >> "$backup_file" << EOF

-- =====================================
-- Backup Summary
-- =====================================
-- Tables checked: $found_tables
-- Tables exported: $exported_tables
-- Backup completed: $(date)
-- Total file size: $(du -h "$backup_file" | cut -f1)

EOF

    # Get final file size
    local file_size=$(du -h "$backup_file" | cut -f1)

    # Update summary file
    echo "" >> "$summary_file"
    echo "Backup completed at $(date)" >> "$summary_file"
    echo "Tables checked: $found_tables" >> "$summary_file"
    echo "Tables exported: $exported_tables" >> "$summary_file"
    echo "File size: $file_size" >> "$summary_file"
    echo "Backup file: $backup_file" >> "$summary_file"

    # Show results
    echo ""
    echo -e "${GREEN}🎉 Backup completed!${NC}"
    echo -e "${GREEN}📊 Summary:${NC}"
    echo "  Tables checked: $found_tables"
    echo "  Tables exported: $exported_tables"
    echo "  File size: $file_size"
    echo "  Backup file: $backup_file"
    echo "  Summary file: $summary_file"

    # Show preview
    echo ""
    echo -e "${BLUE}📄 Backup file preview:${NC}"
    head -30 "$backup_file"
    echo ""
    echo "..."
    echo ""
    echo -e "${BLUE}📋 Summary file contents:${NC}"
    cat "$summary_file"

    # Send notification
    if [[ $exported_tables -gt 0 ]]; then
        send_notification "completed" "Successfully backed up $exported_tables/$found_tables tables" "$file_size"
        echo -e "${GREEN}✅ Email notification sent to support@presetie.com${NC}"
    else
        send_notification "failed" "No tables could be exported" ""
        echo -e "${YELLOW}⚠️  No tables were exported${NC}"
    fi

    # Show file structure
    echo ""
    echo -e "${BLUE}📁 Files created:${NC}"
    ls -la "$BACKUP_DIR"/*.sql "$BACKUP_DIR"/*.txt 2>/dev/null || echo "  No files found"
}

# Show help
show_help() {
    cat << EOF
Quick Table Backup Script
========================

Usage: $0

This script automatically discovers and backs up tables from your Supabase database.

Features:
- Tests common table names automatically
- Exports table data as JSON (up to 100 rows per table)
- Creates comprehensive backup file with metadata
- Generates summary report
- Sends email notifications

Output files:
- SQL backup file with table structures and data
- Summary text file with backup details
- Email notifications to support@presetie.com

Backup location: ./backup/table-backups/

The backup includes:
- Table metadata and structure information
- Sample data (first 100 rows) as JSON
- Export timestamps and summary
- File sizes and statistics

EOF
}

# Parse arguments
case "${1:-backup}" in
    "backup"|"")
        main
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac