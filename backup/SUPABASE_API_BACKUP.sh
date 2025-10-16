#!/bin/bash

# Supabase Native API Backup and Restore Script
# Uses Supabase Dashboard API for official backup operations

set -e

# Configuration
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
PROJECT_REF="${PROJECT_REF:-}"
PROJECT_NAME="${PROJECT_NAME:-preset}"
BACKUP_DIR="./backup/database"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
API_BASE="https://api.supabase.com/v1"
NOTIFICATION_SCRIPT="$SCRIPT_DIR/send-backup-notification.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🚀 Supabase API Backup & Restore Script"
echo "======================================="
echo "Project: $PROJECT_NAME"
echo "Project Ref: $PROJECT_REF"
echo "Timestamp: $TIMESTAMP"
echo ""

# Validate configuration
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ Error: SUPABASE_ACCESS_TOKEN is not set${NC}"
    echo "Get your access token from: https://supabase.com/dashboard/account/tokens"
    exit 1
fi

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Error: PROJECT_REF is not set${NC}"
    echo "Find your project ref in Supabase Dashboard → Settings → API"
    exit 1
fi

echo -e "${GREEN}✅ Configuration validated${NC}"
echo ""

# Function to send email notifications
send_notification() {
    local status="$1"
    local backup_id="$2"
    local error_message="$3"
    local duration="$4"

    if [[ -f "$NOTIFICATION_SCRIPT" ]]; then
        # Send notification in background, don't fail if it doesn't work
        "$NOTIFICATION_SCRIPT" "$status" "$PROJECT_NAME" "$PROJECT_REF" "api" "$backup_id" "" "$error_message" "$duration" >/dev/null 2>&1 &
    else
        echo -e "${YELLOW}⚠️  Notification script not found: $NOTIFICATION_SCRIPT${NC}"
    fi
}

# Function to make API calls
supabase_api() {
    local method="$1"
    local endpoint="$2"
    local data="$3"

    local url="${API_BASE}${endpoint}"

    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
            "$url"
    fi
}

# Function to list all backups
list_backups() {
    echo -e "${BLUE}📋 Listing available backups...${NC}"

    local response=$(supabase_api "GET" "/projects/$PROJECT_REF/database/backups")

    if [ $? -eq 0 ]; then
        echo "$response" | jq '.' 2>/dev/null || echo "$response"

        # Save to file
        echo "$response" > "$BACKUP_DIR/backup_list_${TIMESTAMP}.json"
        echo -e "${GREEN}✅ Backup list saved to: $BACKUP_DIR/backup_list_${TIMESTAMP}.json${NC}"
    else
        echo -e "${RED}❌ Failed to list backups${NC}"
        return 1
    fi
}

# Function to download backup
download_backup() {
    local backup_id="$1"
    local backup_name="$2"

    echo -e "${BLUE}⬇️  Downloading backup: $backup_name${NC}"

    # Check if backup exists
    local backup_info=$(supabase_api "GET" "/projects/$PROJECT_REF/database/backups/$backup_id")

    if echo "$backup_info" | jq -e '.status' > /dev/null 2>&1; then
        local status=$(echo "$backup_info" | jq -r '.status')
        if [ "$status" != "COMPLETED" ]; then
            echo -e "${YELLOW}⚠️  Backup status: $status (not ready for download)${NC}"
            return 1
        fi
    fi

    # Generate download URL (Supabase doesn't provide direct download via API)
    # This would typically be done through the dashboard
    echo -e "${YELLOW}⚠️  Direct download via API is not available${NC}"
    echo "Please download this backup from the Supabase Dashboard:"
    echo "https://app.supabase.com/project/$PROJECT_REF/database/backups"

    # Save backup info
    echo "$backup_info" > "$BACKUP_DIR/backup_info_${backup_name}_${TIMESTAMP}.json"
    echo -e "${GREEN}✅ Backup info saved to: $BACKUP_DIR/backup_info_${backup_name}_${TIMESTAMP}.json${NC}"
}

# Function to create on-demand backup
create_backup() {
    echo -e "${BLUE}📦 Creating on-demand backup...${NC}"

    # Send started notification
    send_notification "started" "" "" ""

    local response=$(supabase_api "POST" "/projects/$PROJECT_REF/database/backups" '{}')

    if [ $? -eq 0 ]; then
        local backup_id=$(echo "$response" | jq -r '.id' 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✅ Backup initiated successfully${NC}"
        echo "Backup ID: $backup_id"

        # Save backup info
        echo "$response" > "$BACKUP_DIR/new_backup_${TIMESTAMP}.json"
        echo -e "${GREEN}✅ Backup info saved to: $BACKUP_DIR/new_backup_${TIMESTAMP}.json${NC}"

        # Send completed notification
        send_notification "completed" "$backup_id" "" ""

        return 0
    else
        echo -e "${RED}❌ Failed to create backup${NC}"
        echo "Response: $response"

        # Send failed notification
        send_notification "failed" "" "$response" ""

        return 1
    fi
}

# Function to perform PITR restore
pitr_restore() {
    local timestamp="$1"
    local description="$2"

    if [ -z "$timestamp" ]; then
        echo -e "${RED}❌ Error: Unix timestamp is required for PITR restore${NC}"
        echo "Usage: $0 pitr_restore <unix_timestamp> [description]"
        return 1
    fi

    echo -e "${YELLOW}⚠️  Starting Point-in-Time Recovery${NC}"
    echo "Recovery time: $(date -r $timestamp)"
    echo "Description: ${description:-Manual PITR restore}"
    echo ""

    # Confirmation prompt
    read -p "Are you sure you want to restore to $(date -r $timestamp)? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}❌ PITR restore cancelled${NC}"
        return 0
    fi

    local restore_data="{
        \"recovery_time_target_unix\": \"$timestamp\"
    }"

    echo -e "${BLUE}🔄 Executing PITR restore...${NC}"

    local response=$(supabase_api "POST" "/projects/$PROJECT_REF/database/backups/restore-pitr" "$restore_data")

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PITR restore initiated successfully${NC}"
        echo "Response: $response"

        # Save restore info
        echo "$response" > "$BACKUP_DIR/pitr_restore_${TIMESTAMP}.json"
        echo -e "${GREEN}✅ Restore info saved to: $BACKUP_DIR/pitr_restore_${TIMESTAMP}.json${NC}"

        return 0
    else
        echo -e "${RED}❌ PITR restore failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to get backup status
get_backup_status() {
    local backup_id="$1"

    if [ -z "$backup_id" ]; then
        echo -e "${RED}❌ Error: Backup ID is required${NC}"
        return 1
    fi

    echo -e "${BLUE}📊 Getting backup status...${NC}"

    local response=$(supabase_api "GET" "/projects/$PROJECT_REF/database/backups/$backup_id")

    if [ $? -eq 0 ]; then
        echo "$response" | jq '.' 2>/dev/null || echo "$response"

        # Save status
        echo "$response" > "$BACKUP_DIR/backup_status_${backup_id}_${TIMESTAMP}.json"
        echo -e "${GREEN}✅ Status saved to: $BACKUP_DIR/backup_status_${backup_id}_${TIMESTAMP}.json${NC}"
    else
        echo -e "${RED}❌ Failed to get backup status${NC}"
        return 1
    fi
}

# Function to list recent restorable points
list_restorable_points() {
    echo -e "${BLUE}📅 Getting recent restorable points...${NC}"

    # Get current time and last 7 days
    local current_time=$(date +%s)
    local week_ago=$((current_time - 604800)) # 7 days in seconds

    echo "Available restore points (last 7 days):"
    echo ""

    # Show hourly points for the last 24 hours, then daily
    local hour_ago=$((current_time - 3600))

    echo "Last 24 hours (hourly):"
    for ((i=0; i<24; i++)); do
        local time_point=$((hour_ago + (i * 3600)))
        local formatted_time=$(date -r $time_point "+%Y-%m-%d %H:%M:%S")
        echo "  $formatted_time (Unix: $time_point)"
    done

    echo ""
    echo "Last 7 days (daily at midnight):"
    for ((i=1; i<=7; i++)); do
        local days_ago=$((current_time - (i * 86400)))
        local midnight=$(date -r $days_ago +"%Y-%m-%d 00:00:00")
        local midnight_unix=$(date -d "$midnight" +%s 2>/dev/null || date -j -f "%Y-%m-%d %H:%M:%S" "$midnight" +%s 2>/dev/null)
        echo "  $midnight (Unix: $midnight_unix)"
    done
}

# Function to create scheduled backup configuration
setup_scheduled_backups() {
    echo -e "${BLUE}⚙️  Setting up scheduled backup configuration...${NC}"

    local config_file="$BACKUP_DIR/scheduled_backup_config.json"

    cat > "$config_file" << EOF
{
  "project_ref": "$PROJECT_REF",
  "project_name": "$PROJECT_NAME",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_schedule": {
    "daily": "02:00 UTC",
    "weekly": "Sunday 02:00 UTC",
    "retention_days": 30
  },
  "api_endpoints": {
    "list_backups": "$API_BASE/projects/$PROJECT_REF/database/backups",
    "create_backup": "$API_BASE/projects/$PROJECT_REF/database/backups",
    "pitr_restore": "$API_BASE/projects/$PROJECT_REF/database/backups/restore-pitr"
  },
  "last_backup": null,
  "next_backup": "$(date -u -d '+1 day' +%Y-%m-%dT02:00:00Z)"
}
EOF

    echo -e "${GREEN}✅ Scheduled backup config created: $config_file${NC}"

    # Create cron example
    local cron_file="$BACKUP_DIR/scheduled_backup_cron.txt"

    cat > "$cron_file" << EOF
# Supabase Scheduled Backup Configuration
# Add these to your crontab with: crontab -e

# Daily backup at 2 AM UTC
0 2 * * * cd $(pwd) && ./SUPABASE_API_BACKUP.sh create_backup

# Weekly backup status check at 9 AM UTC
0 9 * * 1 cd $(pwd) && ./SUPABASE_API_BACKUP.sh list_backups

# Clean up old files (keep last 30 days)
0 3 * * * find $(pwd)/backups/database -name "*.json" -mtime +30 -delete

# Example PITR restore to 24 hours ago (uncomment and modify as needed)
# 0 4 * * * cd $(pwd) && ./SUPABASE_API_BACKUP.sh pitr_restore \$(date -d '24 hours ago' +%s) "Daily restore"
EOF

    echo -e "${GREEN}✅ Cron examples created: $cron_file${NC}"
    echo ""
    echo "To set up automated backups:"
    echo "1. Run: crontab -e"
    echo "2. Add the contents of: $cron_file"
}

# Function to display backup statistics
show_statistics() {
    echo -e "${BLUE}📊 Backup Statistics${NC}"
    echo ""

    local backup_files=$(find "$BACKUP_DIR" -name "*.json" -type f | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "Unknown")
    local latest_file=$(find "$BACKUP_DIR" -name "*.json" -type f -exec ls -la {} \; | sort -k6,7 | tail -1 | awk '{print $9}')

    echo "Total backup files: $backup_files"
    echo "Total size: $total_size"
    echo "Latest backup: $(basename "$latest_file")"
    echo ""

    if [ -f "$BACKUP_DIR/backup_list_${TIMESTAMP}.json" ]; then
        echo "Latest backup list contains:"
        jq -r '.[] | "  - \(.name) (\(.status)) - Created: \(.inserted_at)"' "$BACKUP_DIR/backup_list_${TIMESTAMP}.json" 2>/dev/null || echo "  Could not parse backup list"
    fi
}

# Function to monitor backup status
monitor_backup() {
    local backup_id="$1"
    local max_attempts="${2:-30}"  # Max 30 minutes
    local interval="${3:-60}"     # Check every 60 seconds

    if [ -z "$backup_id" ]; then
        echo -e "${RED}❌ Error: Backup ID is required for monitoring${NC}"
        return 1
    fi

    echo -e "${BLUE}👁️  Monitoring backup: $backup_id${NC}"
    echo "Maximum wait time: $max_attempts minutes"
    echo "Check interval: $interval seconds"
    echo ""

    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        ((attempt++))

        local status_response=$(supabase_api "GET" "/projects/$PROJECT_REF/database/backups/$backup_id")
        local status=$(echo "$status_response" | jq -r '.status' 2>/dev/null || echo "unknown")

        echo -e "Attempt $attempt/$max_attempts: ${BLUE}$status${NC}"

        case "$status" in
            "COMPLETED")
                echo -e "${GREEN}✅ Backup completed successfully!${NC}"

                # Get backup details
                local created_at=$(echo "$status_response" | jq -r '.inserted_at' 2>/dev/null || echo "unknown")
                local size=$(echo "$status_response" | jq -r '.size' 2>/dev/null || echo "unknown")

                echo "Created at: $created_at"
                echo "Size: $size"

                return 0
                ;;
            "FAILED")
                echo -e "${RED}❌ Backup failed!${NC}"
                echo "Check the Supabase Dashboard for details."
                return 1
                ;;
            "CANCELLED")
                echo -e "${YELLOW}⚠️  Backup was cancelled${NC}"
                return 1
                ;;
            *)
                if [ $attempt -eq $max_attempts ]; then
                    echo -e "${RED}❌ Backup monitoring timed out${NC}"
                    return 1
                else
                    echo "Waiting $interval seconds..."
                    sleep $interval
                fi
                ;;
        esac
    done
}

# Function to validate API access
validate_api_access() {
    echo -e "${BLUE}🔑 Validating API access...${NC}"

    local response=$(supabase_api "GET" "/projects/$PROJECT_REF" 2>/dev/null)

    if [ $? -eq 0 ]; then
        local project_name=$(echo "$response" | jq -r '.name' 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✅ API access validated${NC}"
        echo "Project name: $project_name"
        echo "Project ref: $PROJECT_REF"
        return 0
    else
        echo -e "${RED}❌ API access failed${NC}"
        echo "Please check:"
        echo "1. Your SUPABASE_ACCESS_TOKEN is correct"
        echo "2. Your PROJECT_REF is correct"
        echo "3. The token has the necessary permissions"
        return 1
    fi
}

# Main command processing
case "${1:-help}" in
    "list")
        list_backups
        ;;
    "create"|"create_backup")
        create_backup
        ;;
    "download")
        download_backup "$2" "$3"
        ;;
    "pitr"|"pitr_restore")
        pitr_restore "$2" "$3"
        ;;
    "status")
        get_backup_status "$2"
        ;;
    "restorable"|"restore_points")
        list_restorable_points
        ;;
    "monitor")
        monitor_backup "$2" "$3" "$4"
        ;;
    "schedule"|"setup")
        setup_scheduled_backups
        ;;
    "stats"|"statistics")
        show_statistics
        ;;
    "validate")
        validate_api_access
        ;;
    "help"|"-h"|"--help")
        echo "Supabase API Backup & Restore Script"
        echo "==================================="
        echo ""
        echo "Usage: $0 [COMMAND] [OPTIONS]"
        echo ""
        echo "Commands:"
        echo "  list                          List all available backups"
        echo "  create                        Create a new on-demand backup"
        echo "  download <backup_id> <name>     Download backup info (requires dashboard for actual download)"
        echo "  pitr <timestamp> [desc]       Perform Point-in-Time Recovery"
        echo "  status <backup_id>             Get status of a specific backup"
        echo "  restorable                    List recent restorable time points"
        echo "  monitor <backup_id> [min] [sec] Monitor backup completion"
        echo "  schedule                      Set up scheduled backup configuration"
        echo "  stats                         Show backup statistics"
        echo "  validate                      Validate API access"
        echo "  help                          Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 validate                   # Check API access"
        echo "  $0 list                       # List backups"
        echo "  $0 create                     # Create backup"
        echo "  $0 pitr 1735689600            # Restore to specific time"
        echo "  $0 monitor <backup_id>        # Monitor backup progress"
        echo ""
        echo "Environment Variables:"
        echo "  SUPABASE_ACCESS_TOKEN        Your Supabase access token"
        echo "  PROJECT_REF                   Your project reference"
        echo "  PROJECT_NAME                  Project name for file naming"
        echo ""
        echo "Get your access token from: https://supabase.com/dashboard/account/tokens"
        ;;
    *)
        echo -e "${RED}Unknown command: ${1}${NC}"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac