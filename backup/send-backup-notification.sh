#!/bin/bash

# Backup Email Notification Service using Plunk API
# Sends email notifications for backup status to support@presetie.com

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.plunk.config"
SUPPORT_EMAIL="support@presetie.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load Plunk configuration
load_plunk_config() {
    # Try to get PLUNK_API_KEY from environment first
    if [[ -n "${PLUNK_API_KEY:-}" ]]; then
        PLUNK_KEY="$PLUNK_API_KEY"
    else
        # Try to load from .env.local file
        if [[ -f "../.env.local" ]]; then
            PLUNK_KEY=$(grep "PLUNK_API_KEY" "../.env.local" | cut -d'=' -f2)
        fi
    fi

    if [[ -z "$PLUNK_KEY" ]]; then
        echo -e "${RED}❌ PLUNK_API_KEY not found${NC}" >&2
        echo "Please set PLUNK_API_KEY environment variable or add to .env.local" >&2
        return 1
    fi
}

# Create email payload
create_email_payload() {
    local status="$1"
    local project_name="${2:-preset}"
    local project_ref="${3:-unknown}"
    local backup_type="${4:-api}"
    local backup_id="${5:-}"
    local backup_size="${6:-}"
    local error_message="${7:-}"
    local duration="${8:-}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')

    local subject
    case "$status" in
        "started")
            subject="🚀 [STARTED] $project_name Backup - $backup_type"
            ;;
        "completed")
            subject="✅ [COMPLETED] $project_name Backup - $backup_type"
            ;;
        "failed")
            subject="❌ [FAILED] $project_name Backup - $backup_type"
            ;;
        *)
            subject="📋 [$status] $project_name Backup - $backup_type"
            ;;
    esac

    # Create HTML email body
    local email_body=$(cat << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backup Notification</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 14px; margin-bottom: 20px; }
        .started { background-color: #EBF5FF; color: #1E40AF; }
        .completed { background-color: #ECFDF5; color: #065F46; }
        .failed { background-color: #FEF2F2; color: #991B1B; }
        .info-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #6B7280; }
        .info-value { color: #374151; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px; }
        .error-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .error-message { color: #7F1D1D; font-family: monospace; background: #FFFFFF; padding: 10px; border-radius: 4px; border: 1px solid #FCA5A5; }
        .actions { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 0 10px; }
        .btn-primary { background: #3B82F6; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗄️ Backup System Notification</h1>
            <div class="status-badge $status">$status</div>
        </div>

        <div class="info-box">
            <h3>📊 Backup Details</h3>
            <div class="info-row">
                <span class="info-label">Project:</span>
                <span class="info-value">$project_name</span>
            </div>
            <div class="info-row">
                <span class="info-label">Project Ref:</span>
                <span class="info-value">$project_ref</span>
            </div>
            <div class="info-row">
                <span class="info-label">Backup Type:</span>
                <span class="info-value">${backup_type^^}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Timestamp:</span>
                <span class="info-value">$timestamp</span>
            </div>
            ${backup_id:+<div class="info-row">
                <span class="info-label">Backup ID:</span>
                <span class="info-value">$backup_id</span>
            </div>}
            ${backup_size:+<div class="info-row">
                <span class="info-label">Backup Size:</span>
                <span class="info-value">$backup_size</span>
            </div>}
            ${duration:+<div class="info-row">
                <span class="info-label">Duration:</span>
                <span class="info-value">$duration</span>
            </div>}
        </div>

        ${error_message:+<div class="error-box">
            <div class="error-title">❌ Error Details</div>
            <div class="error-message">$error_message</div>
        </div>}

        ${status:+<div class="info-box" style="background: ${status == "completed" ? "#ECFDF5" : (status == "started" ? "#EBF5FF" : "#FEF2F2")}; border-color: ${status == "completed" ? "#10B981" : (status == "started" ? "#3B82F6" : "#EF4444")};">
            <h3>${status == "completed" ? "✅" : (status == "started" ? "🚀" : "❌")} Backup ${status^}</h3>
            <p>${status == "completed" ? "Your database backup has been completed and is available for restore if needed." : (status == "started" ? "Your database backup has been initiated. You will receive another notification when it completes." : "Your database backup has failed. Please check the error details above.")}</p>
        </div>}

        <div class="actions">
            <a href="https://supabase.com/dashboard/project/$project_ref" class="btn btn-primary">
                View in Supabase Dashboard
            </a>
        </div>

        <div class="footer">
            <p>This is an automated message from the Preset.ie Backup System</p>
            <p>If you have questions, please contact <a href="mailto:support@presetie.com">support@presetie.com</a></p>
            <p style="font-size: 12px; margin-top: 20px;">
                Notification ID: $(date +%s) |
                System: v2.0 |
                Environment: Production
            </p>
        </div>
    </div>
</body>
</html>
EOF
)

    # Create JSON payload for Plunk API
    # Use a simple text email instead of HTML to avoid JSON escaping issues
    local text_body=$(cat << TEXT_BODY
🗄️ Backup System Notification

Status: $status
Project: $project_name
Project Ref: $project_ref
Backup Type: ${backup_type^^}
Timestamp: $timestamp
${backup_id:+Backup ID: $backup_id}
${backup_size:+Backup Size: $backup_size}
${duration:+Duration: $duration}
${error_message:+Error: $error_message}

View in Supabase Dashboard: https://supabase.com/dashboard/project/$project_ref

---
This is an automated message from the Preset.ie Backup System
If you have questions, please contact support@presetie.com
Notification ID: $(date +%s) | System: v2.0 | Environment: Production
TEXT_BODY
)

    cat << EOF
{
    "to": "$SUPPORT_EMAIL",
    "subject": "$subject",
    "body": "$text_body",
    "from": "backups@presetie.com",
    "replyTo": "support@presetie.com"
}
EOF
}

# Send notification using Plunk API
send_notification() {
    local status="$1"
    local project_name="${2:-preset}"
    local project_ref="${3:-unknown}"
    local backup_type="${4:-api}"
    local backup_id="${5:-}"
    local backup_size="${6:-}"
    local error_message="${7:-}"
    local duration="${8:-}"

    echo -e "${BLUE}📧 Sending backup notification...${NC}"

    # Load configuration
    load_plunk_config

    # Create email payload
    local payload
    payload=$(create_email_payload "$status" "$project_name" "$project_ref" "$backup_type" "$backup_id" "$backup_size" "$error_message" "$duration")

    # Send to Plunk API
    local response
    response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $PLUNK_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "https://api.useplunk.com/v1/send")

    local http_code="${response: -3}"
    local response_body="${response%???}"

    if [[ "$http_code" -eq 200 ]]; then
        echo -e "${GREEN}✅ Email notification sent successfully${NC}"
        echo "Response: $response_body"
        return 0
    else
        echo -e "${RED}❌ Failed to send email notification${NC}"
        echo "HTTP Status: $http_code"
        echo "Response: $response_body"
        return 1
    fi
}

# Convenience functions
notify_backup_started() {
    local project_name="${1:-preset}"
    local project_ref="${2:-unknown}"
    local backup_type="${3:-api}"

    send_notification "started" "$project_name" "$project_ref" "$backup_type"
}

notify_backup_completed() {
    local project_name="${1:-preset}"
    local project_ref="${2:-unknown}"
    local backup_type="${3:-api}"
    local backup_id="${4:-}"
    local backup_size="${5:-}"
    local duration="${6:-}"

    send_notification "completed" "$project_name" "$project_ref" "$backup_type" "$backup_id" "$backup_size" "" "$duration"
}

notify_backup_failed() {
    local project_name="${1:-preset}"
    local project_ref="${2:-unknown}"
    local backup_type="${3:-api}"
    local error_message="${4:-Unknown error}"
    local duration="${5:-}"

    send_notification "failed" "$project_name" "$project_ref" "$backup_type" "" "" "$error_message" "$duration"
}

# Show help
show_help() {
    cat << EOF
Backup Email Notification Service
================================

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    started [project_name] [project_ref] [backup_type]     Notify backup started
    completed [project_name] [project_ref] [backup_type] [backup_id] [backup_size] [duration]  Notify backup completed
    failed [project_name] [project_ref] [backup_type] [error_message] [duration]  Notify backup failed
    test                                                    Send test notification
    help                                                    Show this help

Examples:
    $0 started preset.ie zbsmgymyfhnwjdnmlelr api
    $0 completed preset.ie zbsmgymyfhnwjdnmlelr api backup_123 45MB 2m30s
    $0 failed preset.ie zbsmgymyfhnwjdnmlelr api "Connection timeout"
    $0 test

Environment Variables:
    PLUNK_API_KEY    Your Plunk API key (required)

EOF
}

# Test notification
send_test_notification() {
    echo -e "${BLUE}🧪 Sending test notification...${NC}"

    local project_name="preset.ie"
    local project_ref="zbsmgymyfhnwjdnmlelr"
    local backup_type="test"
    local backup_id="test_$(date +%s)"
    local backup_size="1.2MB"
    local duration="15s"

    send_notification "completed" "$project_name" "$project_ref" "$backup_type" "$backup_id" "$backup_size" "" "$duration"
}

# Main script logic
main() {
    case "${1:-help}" in
        "started")
            notify_backup_started "$2" "$3" "$4"
            ;;
        "completed")
            notify_backup_completed "$2" "$3" "$4" "$5" "$6" "$7"
            ;;
        "failed")
            notify_backup_failed "$2" "$3" "$4" "$5" "$6"
            ;;
        "test")
            send_test_notification
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function
main "$@"