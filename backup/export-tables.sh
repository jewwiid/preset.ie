#!/bin/bash

# Export Supabase Tables to SQL
# Creates SQL exports of all tables in your Supabase database

set -euo pipefail

# Configuration
SUPABASE_URL="${SUPABASE_URL:-https://zbsmgymyfhnwjdnmlelr.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMDg4NTMsImV4cCI6MjA3MjY4NDg1M30.02U7mfQVPhw-zw9oTHnPWF7pRRgz-a_DhQ8dwBDUi2c}"
PROJECT_REF="${PROJECT_REF:-zbsmgymyfhnwjdnmlelr}"
BACKUP_DIR="./backup/tables-export"
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

echo "🗄️  Supabase Table Export Script"
echo "================================="
echo "Project: $PROJECT_REF"
echo "URL: $SUPABASE_URL"
echo "Timestamp: $TIMESTAMP"
echo "Output Directory: $BACKUP_DIR"
echo ""

# Function to send notification
send_notification() {
    local status="$1"
    local message="$2"

    if [[ -f "$NOTIFICATION_SCRIPT" ]]; then
        "$NOTIFICATION_SCRIPT" "$status" "preset.ie" "$PROJECT_REF" "table-export" "" "" "$message" >/dev/null 2>&1 &
    fi
}

# Function to make Supabase API calls
supabase_query() {
    local query="$1"
    local output_file="$2"

    curl -s -G "$SUPABASE_URL/rest/v1/rpc/sql" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        --data-urlencode "query=$query" \
        -o "$output_file"
}

# Function to get all table names
get_tables() {
    # Query to get all user tables in the public schema
    local query="
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
    "

    curl -s -G "$SUPABASE_URL/rest/v1/" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        --data-urlencode "select=table_name" \
        --data-urlencode "from=information_schema.tables" \
        --data-urlencode "and=table_schema.eq.public" \
        --data-urlencode "and=table_type.eq.BASE TABLE" \
        --data-urlencode "order=table_name" | \
        jq -r '.[] | .table_name' 2>/dev/null || echo ""
}

# Function to export table structure
export_table_schema() {
    local table="$1"
    local output_file="$2"

    echo "-- Table structure for $table" > "$output_file"
    echo "-- Generated on $(date)" >> "$output_file"
    echo "" >> "$output_file"

    # Get CREATE TABLE statement
    echo "-- Schema for table: $table" >> "$output_file"

    # Use a simpler approach - just get column information
    local columns_query="
    SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
    FROM information_schema.columns
    WHERE table_name = '$table'
    AND table_schema = 'public'
    ORDER BY ordinal_position;
    "

    echo "-- Columns for table: $table" >> "$output_file"
    echo "CREATE TABLE $table (" >> "$output_file"

    local first=true
    while IFS= read -r column; do
        if [[ -n "$column" && "$column" != "null" ]]; then
            if [[ "$first" == "true" ]]; then
                first=false
            else
                echo "," >> "$output_file"
            fi
            echo "    $column" >> "$output_file"
        fi
    done < <(curl -s -G "$SUPABASE_URL/rest/v1/" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        --data-urlencode "select=column_name,data_type,is_nullable,column_default,character_maximum_length" \
        --data-urlencode "from=information_schema.columns" \
        --data-urlencode "and=table_name.eq.$table" \
        --data-urlencode "and=table_schema.eq.public" \
        --data-urlencode "order=ordinal_position" | \
        jq -r '.[] | "\(.column_name) \(.data_type)\(if .is_nullable == "NO" then " NOT NULL" else "" end)\(if .column_default then " DEFAULT \(.column_default)" else "" end)"' 2>/dev/null)

    echo "" >> "$output_file"
    echo ");" >> "$output_file"
    echo "" >> "$output_file"
}

# Function to export table data
export_table_data() {
    local table="$1"
    local output_file="$2"

    echo "-- Data for table: $table" >> "$output_file"

    # Get table data (limit to 1000 rows to avoid huge files)
    local row_count=$(curl -s -G "$SUPABASE_URL/rest/v1/$table" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        --data-urlencode "select=count(*)" | \
        jq -r '.[0].count' 2>/dev/null || echo "0")

    if [[ "$row_count" -gt 0 ]]; then
        echo "-- Table has $row_count rows (exporting first 1000)" >> "$output_file"

        # Get first 1000 rows
        curl -s -G "$SUPABASE_URL/rest/v1/$table" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            --data-urlencode "select=*" \
            --data-urlencode "limit=1000" | \
            jq -r '.[] | . | @tsv' 2>/dev/null | \
        while IFS=$'\t' read -r row; do
            if [[ -n "$row" ]]; then
                # Escape single quotes in the data
                local escaped_row=$(echo "$row" | sed "s/'/''/g")
                echo "INSERT INTO $table VALUES ('$escaped_row');" >> "$output_file"
            fi
        done
    else
        echo "-- Table is empty" >> "$output_file"
    fi

    echo "" >> "$output_file"
}

# Main export process
main() {
    echo -e "${BLUE}📊 Starting table export...${NC}"

    # Send started notification
    send_notification "started" "Starting table export"

    local export_file="$BACKUP_DIR/tables_export_${TIMESTAMP}.sql"
    local tables_log="$BACKUP_DIR/export_log_${TIMESTAMP}.txt"

    echo "# Supabase Tables Export" > "$export_file"
    echo "# Project: $PROJECT_REF" >> "$export_file"
    echo "# Generated: $(date)" >> "$export_file"
    echo "# URL: $SUPABASE_URL" >> "$export_file"
    echo "" >> "$export_file"

    echo "Export started at $(date)" > "$tables_log"

    # Get all tables
    echo -e "${BLUE}📋 Getting table list...${NC}"
    local tables=$(get_tables)

    if [[ -z "$tables" ]]; then
        echo -e "${YELLOW}⚠️  No tables found or unable to access tables${NC}"
        echo "This might be due to permissions or the database being empty"
        send_notification "failed" "No tables found or permission denied"
        exit 1
    fi

    echo -e "${GREEN}✅ Found $(echo "$tables" | wc -l) tables${NC}"
    echo "Tables found:" | tee -a "$tables_log"
    echo "$tables" | tee -a "$tables_log"
    echo "" | tee -a "$tables_log"

    local table_count=0
    local success_count=0

    # Export each table
    while IFS= read -r table; do
        if [[ -n "$table" ]]; then
            table_count=$((table_count + 1))
            echo -e "${BLUE}📤 Exporting table: $table${NC}"

            # Create temporary file for this table
            local temp_file="$BACKUP_DIR/temp_${table}_${TIMESTAMP}.sql"

            # Export schema and data
            if export_table_schema "$table" "$temp_file" && \
               export_table_data "$table" "$temp_file"; then
                # Append to main export file
                cat "$temp_file" >> "$export_file"
                echo "" >> "$export_file"

                success_count=$((success_count + 1))
                echo -e "${GREEN}✅ Exported: $table${NC}"
                echo "✅ Exported: $table" >> "$tables_log"
            else
                echo -e "${RED}❌ Failed to export: $table${NC}"
                echo "❌ Failed to export: $table" >> "$tables_log"
            fi

            # Clean up temp file
            rm -f "$temp_file"
        fi
    done <<< "$tables"

    # Create summary
    echo "" >> "$export_file"
    echo "-- Export Summary" >> "$export_file"
    echo "-- Total tables found: $table_count" >> "$export_file"
    echo "-- Successfully exported: $success_count" >> "$export_file"
    echo "-- Export completed: $(date)" >> "$export_file"

    # Get file size
    local file_size=$(du -h "$export_file" | cut -f1)

    echo "" | tee -a "$tables_log"
    echo "Export completed at $(date)" | tee -a "$tables_log"
    echo "Total tables: $table_count" | tee -a "$tables_log"
    echo "Successfully exported: $success_count" | tee -a "$tables_log"
    echo "Export file size: $file_size" | tee -a "$tables_log"
    echo "Export file: $export_file" | tee -a "$tables_log"

    # Show preview of export file
    echo ""
    echo -e "${GREEN}📄 Export file preview:${NC}"
    head -20 "$export_file"
    echo ""
    echo "..."
    tail -10 "$export_file"

    # Send completion notification
    if [[ $success_count -gt 0 ]]; then
        send_notification "completed" "Successfully exported $success_count/$table_count tables ($file_size)"
        echo -e "${GREEN}✅ Export completed successfully!${NC}"
        echo -e "${GREEN}📁 Export file: $export_file${NC}"
        echo -e "${GREEN}📊 Size: $file_size${NC}"
        echo -e "${GREEN}📋 Log file: $tables_log${NC}"
    else
        send_notification "failed" "No tables were successfully exported"
        echo -e "${RED}❌ Export failed - no tables were exported${NC}"
        exit 1
    fi
}

# Show help
show_help() {
    cat << EOF
Supabase Table Export Script
===========================

Usage: $0 [OPTIONS]

This script exports all tables from your Supabase database to SQL format.

Features:
- Exports table schemas (CREATE TABLE statements)
- Exports table data (INSERT statements, first 1000 rows per table)
- Creates comprehensive SQL export file
- Includes export logging and summary
- Sends email notifications for start/completion

Output:
- SQL file with all table structures and data
- Log file with export details and any errors
- Email notifications to support@presetie.com

Environment Variables:
    SUPABASE_URL        Your Supabase project URL
    SUPABASE_ANON_KEY   Your Supabase anon key
    PROJECT_REF         Your project reference

Examples:
    $0                              # Export with default settings
    $0 | head -50                   # Preview first 50 lines of export

Files are saved to: ./backup/tables-export/

EOF
}

# Parse arguments
case "${1:-export}" in
    "export"|"")
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