#!/bin/bash

# SimpleBackups Integration for Supabase
# Based on https://simplebackups.com/blog/how-to-backup-supabase
# Provides cloud storage integration for automated backups

set -euo pipefail

# Configuration
SIMPLEBACKUPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SIMPLEBACKUPS_DIR/simplebackups.config"
LOG_FILE="$SIMPLEBACKUPS_DIR/logs/simplebackups.log"
NOTIFICATION_SCRIPT="$SIMPLEBACKUPS_DIR/send-backup-notification.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ ERROR: $1${NC}" >&2
    log "ERROR: $1"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

# Create directories
mkdir -p "$SIMPLEBACKUPS_DIR/logs"
mkdir -p "$SIMPLEBACKUPS_DIR/configs"

# Default configuration
create_default_config() {
    cat > "$CONFIG_FILE" << 'EOF'
# SimpleBackups Configuration
# ---------------------------

# Supabase Connection
SUPABASE_URL=""           # Your Supabase project URL
SUPABASE_DB_REF=""        # Your Supabase database reference
SUPABASE_ACCESS_TOKEN=""  # Your Supabase access token

# Backup Storage Options
# Choose one: local, s3, gcs, azure, or custom
BACKUP_STORAGE="local"

# AWS S3 Configuration (if using S3)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_DEFAULT_REGION="us-east-1"
S3_BUCKET_NAME="your-backup-bucket"
S3_PREFIX="supabase-backups/"

# Google Cloud Storage Configuration (if using GCS)
GCS_SERVICE_ACCOUNT_KEY=""
GCS_BUCKET_NAME="your-gcs-backup-bucket"
GCS_PREFIX="supabase-backups/"

# Azure Blob Storage Configuration (if using Azure)
AZURE_STORAGE_ACCOUNT=""
AZURE_STORAGE_KEY=""
AZURE_CONTAINER_NAME="backups"
AZURE_PREFIX="supabase-backups/"

# Backup Schedule (cron format)
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM

# Retention Policy
RETENTION_DAYS=30           # Keep backups for 30 days
RETENTION_COUNT=50          # Keep maximum 50 backups

# Backup Options
INCLUDE_SCHEMA=true
INCLUDE_DATA=true
INCLUDE_FUNCTIONS=true
INCLUDE_TRIGGERS=true
INCLUDE_RLS_POLICIES=true

# Compression
COMPRESS_BACKUPS=true
COMPRESSION_METHOD="gzip"   # gzip, bzip2, or xz

# Encryption
ENCRYPT_BACKUPS=false
ENCRYPTION_KEY=""

# Notifications
NOTIFICATION_EMAIL=""
SLACK_WEBHOOK_URL=""
DISCORD_WEBHOOK_URL=""

# Backup Validation
VALIDATE_BACKUPS=true
VERIFY_INTEGRITY=true
EOF

    chmod 600 "$CONFIG_FILE"
    info "Created default configuration file: $CONFIG_FILE"
}

# Load configuration
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        warning "Configuration file not found. Creating default..."
        create_default_config
        warning "Please edit $CONFIG_FILE with your settings"
        exit 1
    fi

    # Source configuration
    set -a
    # shellcheck source=/dev/null
    source "$CONFIG_FILE"
    set +a

    # Validate required fields
    [[ -z "$SUPABASE_URL" ]] && error "SUPABASE_URL is required"
    [[ -z "$SUPABASE_DB_REF" ]] && error "SUPABASE_DB_REF is required"
    [[ -z "$SUPABASE_ACCESS_TOKEN" ]] && error "SUPABASE_ACCESS_TOKEN is required"
}

# Send email notifications
send_backup_notification() {
    local status="$1"
    local backup_file="$2"
    local error_message="$3"
    local duration="$4"

    # Extract backup size if file exists
    local backup_size=""
    if [[ -n "$backup_file" && -f "$backup_file" ]]; then
        backup_size=$(du -h "$backup_file" | cut -f1)
    fi

    # Extract project info from config
    local project_name="${PROJECT_NAME:-preset}"
    local project_ref="${SUPABASE_DB_REF:-unknown}"

    if [[ -f "$NOTIFICATION_SCRIPT" ]]; then
        # Send notification in background
        "$NOTIFICATION_SCRIPT" "$status" "$project_name" "$project_ref" "simplebackups" "" "$backup_size" "$error_message" "$duration" >/dev/null 2>&1 &
    else
        warning "Notification script not found: $NOTIFICATION_SCRIPT"
    fi
}

# Check dependencies
check_dependencies() {
    local missing_deps=()

    # Check for required tools
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")

    # Check for storage-specific tools
    case "$BACKUP_STORAGE" in
        "s3")
            command -v aws >/dev/null 2>&1 || missing_deps+=("aws-cli")
            ;;
        "gcs")
            command -v gsutil >/dev/null 2>&1 || missing_deps+=("gcloud")
            ;;
        "azure")
            command -v az >/dev/null 2>&1 || missing_deps+=("azure-cli")
            ;;
    esac

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        error "Missing dependencies: ${missing_deps[*]}"
    fi
}

# Create backup using local method
create_local_backup() {
    local backup_name="supabase_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_dir="$SIMPLEBACKUPS_DIR/backups"
    mkdir -p "$backup_dir"

    info "Creating local backup: $backup_name"

    # Use existing backup scripts
    "$SIMPLEBACKUPS_DIR/BACKUP_SUPABASE.sh" > "$backup_dir/${backup_name}.log" 2>&1

    if [[ $? -eq 0 ]]; then
        success "Local backup created: $backup_dir"
        return 0
    else
        error "Local backup failed. Check logs: $backup_dir/${backup_name}.log"
        return 1
    fi
}

# Upload to AWS S3
upload_to_s3() {
    local backup_file="$1"
    local s3_key="s3://$S3_BUCKET_NAME/$S3_PREFIX$(basename "$backup_file")"

    info "Uploading to S3: $s3_key"

    aws s3 cp "$backup_file" "$s3_key" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256

    if [[ $? -eq 0 ]]; then
        success "Uploaded to S3: $s3_key"
        return 0
    else
        error "S3 upload failed: $backup_file"
        return 1
    fi
}

# Upload to Google Cloud Storage
upload_to_gcs() {
    local backup_file="$1"
    local gcs_path="gs://$GCS_BUCKET_NAME/$GCS_PREFIX$(basename "$backup_file")"

    info "Uploading to GCS: $gcs_path"

    gsutil cp "$backup_file" "$gcs_path"

    if [[ $? -eq 0 ]]; then
        success "Uploaded to GCS: $gcs_path"
        return 0
    else
        error "GCS upload failed: $backup_file"
        return 1
    fi
}

# Upload to Azure Blob Storage
upload_to_azure() {
    local backup_file="$1"
    local blob_path="$AZURE_PREFIX$(basename "$backup_file")"

    info "Uploading to Azure: $blob_path"

    az storage blob upload \
        --file "$backup_file" \
        --container-name "$AZURE_CONTAINER_NAME" \
        --name "$blob_path"

    if [[ $? -eq 0 ]]; then
        success "Uploaded to Azure: $blob_path"
        return 0
    else
        error "Azure upload failed: $backup_file"
        return 1
    fi
}

# Compress backup
compress_backup() {
    local backup_file="$1"

    if [[ "$COMPRESS_BACKUPS" == "true" ]]; then
        info "Compressing backup: $(basename "$backup_file")"

        case "$COMPRESSION_METHOD" in
            "gzip")
                gzip "$backup_file"
                backup_file="${backup_file}.gz"
                ;;
            "bzip2")
                bzip2 "$backup_file"
                backup_file="${backup_file}.bz2"
                ;;
            "xz")
                xz "$backup_file"
                backup_file="${backup_file}.xz"
                ;;
        esac

        success "Compressed: $(basename "$backup_file")"
    fi

    echo "$backup_file"
}

# Encrypt backup
encrypt_backup() {
    local backup_file="$1"

    if [[ "$ENCRYPT_BACKUPS" == "true" ]]; then
        info "Encrypting backup: $(basename "$backup_file")"

        openssl enc -aes-256-cbc -salt -in "$backup_file" -out "${backup_file}.enc" -k "$ENCRYPTION_KEY"

        if [[ $? -eq 0 ]]; then
            shred -u "$backup_file"  # Securely delete original
            backup_file="${backup_file}.enc"
            success "Encrypted: $(basename "$backup_file")"
        else
            error "Encryption failed: $backup_file"
            return 1
        fi
    fi

    echo "$backup_file"
}

# Send notifications
send_notification() {
    local status="$1"
    local message="$2"

    # Email notification
    if [[ -n "$NOTIFICATION_EMAIL" ]]; then
        echo "$message" | mail -s "Supabase Backup $status" "$NOTIFICATION_EMAIL"
    fi

    # Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Supabase Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi

    # Discord notification
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"Supabase Backup $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    local backup_dir="$1"

    info "Cleaning up backups older than $RETENTION_DAYS days..."

    # Find and remove old backups
    find "$backup_dir" -name "*.sql*" -type f -mtime +$RETENTION_DAYS -delete

    # Keep only the latest RETENTION_COUNT files
    ls -1t "$backup_dir"/*.sql* 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | xargs rm -f

    success "Cleanup completed"
}

# Main backup function
run_backup() {
    local start_time=$(date +%s)
    info "Starting SimpleBackups backup process..."

    # Send started notification
    send_backup_notification "started" "" "" ""

    # Create backup
    create_local_backup
    local backup_result=$?

    if [[ $backup_result -eq 0 ]]; then
        # Find the latest backup file
        local latest_backup=$(find "$SIMPLEBACKUPS_DIR/backups" -name "*.sql" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

        if [[ -n "$latest_backup" ]]; then
            # Compress backup
            latest_backup=$(compress_backup "$latest_backup")

            # Encrypt backup
            latest_backup=$(encrypt_backup "$latest_backup")

            # Upload to cloud storage
            case "$BACKUP_STORAGE" in
                "s3")
                    upload_to_s3 "$latest_backup"
                    ;;
                "gcs")
                    upload_to_gcs "$latest_backup"
                    ;;
                "azure")
                    upload_to_azure "$latest_backup"
                    ;;
                "local")
                    info "Keeping backup locally"
                    ;;
            esac

            # Cleanup old backups
            cleanup_old_backups "$SIMPLEBACKUPS_DIR/backups"

            # Calculate duration
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            local duration_str="${duration}s"
            if [[ $duration -gt 60 ]]; then
                duration_str="$((duration / 60))m $((duration % 60))s"
            fi

            # Send completed notification
            send_backup_notification "completed" "$latest_backup" "" "$duration_str"

            send_notification "SUCCESS" "Backup completed successfully: $(basename "$latest_backup")"
            success "Backup process completed successfully"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            local duration_str="${duration}s"
            if [[ $duration -gt 60 ]]; then
                duration_str="$((duration / 60))m $((duration % 60))s"
            fi

            # Send failed notification
            send_backup_notification "failed" "" "No backup file found" "$duration_str"

            error "No backup file found"
        fi
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local duration_str="${duration}s"
        if [[ $duration -gt 60 ]]; then
            duration_str="$((duration / 60))m $((duration % 60))s"
        fi

        # Send failed notification
        send_backup_notification "failed" "" "Local backup creation failed" "$duration_str"

        send_notification "FAILED" "Backup process failed"
        error "Backup process failed"
    fi
}

# Setup cron job
setup_cron() {
    local cron_entry="$BACKUP_SCHEDULE $SIMPLEBACKUPS_DIR/SIMPLEBACKUPS_INTEGRATION.sh run"

    info "Setting up cron job: $cron_entry"

    # Add to crontab
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -

    success "Cron job setup completed"
    info "To view cron jobs: crontab -l"
    info "To remove cron job: crontab -e (then delete the line)"
}

# Show status
show_status() {
    info "SimpleBackups Status"
    echo "=================="
    echo "Storage Type: $BACKUP_STORAGE"
    echo "Retention Days: $RETENTION_DAYS"
    echo "Retention Count: $RETENTION_COUNT"
    echo "Compression: $COMPRESS_BACKUPS ($COMPRESSION_METHOD)"
    echo "Encryption: $ENCRYPT_BACKUPS"
    echo ""

    # Show recent backups
    if [[ -d "$SIMPLEBACKUPS_DIR/backups" ]]; then
        echo "Recent Backups:"
        ls -lah "$SIMPLEBACKUPS_DIR/backups"/*.sql* 2>/dev/null | tail -10
    fi

    # Show cron jobs
    echo ""
    echo "Cron Jobs:"
    crontab -l 2>/dev/null | grep -i simplebackups || echo "No cron jobs found"
}

# Test backup
test_backup() {
    info "Running test backup..."

    # Create a small test backup
    local test_backup="$SIMPLEBACKUPS_DIR/backups/test_backup_$(date +%s).sql"
    mkdir -p "$SIMPLEBACKUPS_DIR/backups"

    # Test Supabase connection
    curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
         -H "apikey: $SUPABASE_ACCESS_TOKEN" \
         "$SUPABASE_URL/rest/v1/" \
         -o /dev/null -w "%{http_code}" | grep -q "200"

    if [[ $? -eq 0 ]]; then
        success "Supabase connection test passed"

        # Test backup creation (small)
        echo "-- Test Backup $(date)" > "$test_backup"
        success "Test backup created: $test_backup"

        # Cleanup test backup
        rm -f "$test_backup"

        success "Test backup completed successfully"
    else
        error "Supabase connection test failed"
    fi
}

# Show help
show_help() {
    cat << EOF
SimpleBackups Integration for Supabase
=====================================

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    run              Run a backup immediately
    setup            Setup configuration and cron job
    status           Show backup status and recent backups
    test             Test backup functionality
    config           Show/edit configuration
    help             Show this help message

Examples:
    $0 run                           # Run backup now
    $0 setup                         # Setup everything
    $0 status                        # Show status
    $0 test                          # Test backup

Configuration:
    Edit: $CONFIG_FILE

For more information, see:
    https://simplebackups.com/blog/how-to-backup-supabase

EOF
}

# Main script logic
main() {
    case "${1:-help}" in
        "run")
            load_config
            check_dependencies
            run_backup
            ;;
        "setup")
            create_default_config
            load_config
            check_dependencies
            setup_cron
            ;;
        "status")
            load_config
            show_status
            ;;
        "test")
            load_config
            check_dependencies
            test_backup
            ;;
        "config")
            echo "Configuration file: $CONFIG_FILE"
            "${EDITOR:-nano}" "$CONFIG_FILE"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function
main "$@"