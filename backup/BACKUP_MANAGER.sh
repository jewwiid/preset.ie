#!/bin/bash

# Ultimate Supabase Backup Manager
# Combines pg_dump logical backups with Supabase API backups

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="${PROJECT_NAME:-preset}"
BASE_BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups/database}"
DATETIME_DIR=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$BASE_BACKUP_DIR/$DATETIME_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logo
echo -e "${CYAN}
 ____       _ _           _     _   _               _
/ ___|  ___| | | ___  ___| |_  | | | | __ _ _ __ __| |
| |  _ / _ \ | |/ _ \/ __| __| | |_| |/ _\` | '__/ _\` |
| |_| |  __/ | |  __/ (__| |_  |  _  | (_| | | | (_| |
\____|_|___|_|_|\___|\___|\__|  |_| |_|\__,_|_|  \__,_|

                BACKUP MANAGER v2.0
${NC}"

echo "Project: $PROJECT_NAME"
echo "Timestamp: $TIMESTAMP"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to display menu
show_menu() {
    echo -e "${BLUE}📋 Choose Backup Method:${NC}"
    echo ""
    echo "1. 🔧 Logical Backup (pg_dump) - Full schema + data"
    echo "2. 📄 Schema Backup (pg_dump) - Tables, triggers, functions"
    echo "3. 🗄️  Data Backup (pg_dump) - Data only"
    echo "4. ☁️  Supabase API Backup - Official backup"
    echo "5. 🔄 PITR Recovery - Point-in-Time Recovery"
    echo "6. 📊 Backup Status & Statistics"
    echo "7. ⚙️  Setup & Configuration"
    echo "8. 🧪 Connection Test"
    echo "9. 🚀 Comprehensive Backup (All methods)"
    echo "10. 💾 Restore Database"
    echo "0. ❌ Exit"
    echo ""
}

# Function to test connections
test_connections() {
    echo -e "${BLUE}🧪 Testing Connections...${NC}"
    echo ""

    # Test pg_dump connection
    if [ -n "$SUPABASE_DB_URL" ]; then
        echo -e "${BLUE}Testing pg_dump connection...${NC}"

        # Extract connection details
        PGHOST=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        PGPORT=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        PGUSER=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        PGPASSWORD=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
        PGDATABASE=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

        export PGPASSWORD

        if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ pg_dump connection successful${NC}"
            echo "   Host: $PGHOST:$PGPORT"
            echo "   User: $PGUSER"
            echo "   Database: $PGDATABASE"

            # Get database info
            local table_count=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog');")
            local size=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT pg_size_pretty(pg_database_size('$PGDATABASE'));")
            echo "   Tables: $table_count"
            echo "   Size: $size"
        else
            echo -e "${RED}❌ pg_dump connection failed${NC}"
            echo "   Check your SUPABASE_DB_URL in .env.backup"
        fi
    else
        echo -e "${YELLOW}⚠️  SUPABASE_DB_URL not set${NC}"
        echo "   Create .env.backup with your database connection string"
    fi

    echo ""

    # Test Supabase API connection
    if [ -n "$SUPABASE_ACCESS_TOKEN" ] && [ -n "$PROJECT_REF" ]; then
        echo -e "${BLUE}Testing Supabase API connection...${NC}"

        local response=$(curl -s -X GET \
            -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
            "https://api.supabase.com/v1/projects/$PROJECT_REF")

        if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Supabase API connection successful${NC}"
            local project_name=$(echo "$response" | jq -r '.name')
            echo "   Project: $project_name"
            echo "   Ref: $PROJECT_REF"
        else
            echo -e "${RED}❌ Supabase API connection failed${NC}"
            echo "   Check your SUPABASE_ACCESS_TOKEN and PROJECT_REF"
        fi
    else
        echo -e "${YELLOW}⚠️  Supabase API credentials not set${NC}"
        echo "   Set SUPABASE_ACCESS_TOKEN and PROJECT_REF in .env.backup"
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to run logical backup
run_logical_backup() {
    echo -e "${BLUE}🔧 Running Comprehensive Logical Backup...${NC}"

    if [ -f "$SCRIPT_DIR/BACKUP_SUPABASE.sh" ]; then
        source "$SCRIPT_DIR/.env.backup" 2>/dev/null || true
        "$SCRIPT_DIR/BACKUP_SUPABASE.sh"
    else
        echo -e "${RED}❌ Backup script not found: $SCRIPT_DIR/BACKUP_SUPABASE.sh${NC}"
    fi
}

# Function to run API backup
run_api_backup() {
    echo -e "${BLUE}☁️  Running Supabase API Backup...${NC}"

    if [ -f "$SCRIPT_DIR/SUPABASE_API_BACKUP.sh" ]; then
        source "$SCRIPT_DIR/.env.backup" 2>/dev/null || true
        "$SCRIPT_DIR/SUPABASE_API_BACKUP.sh" create
    else
        echo -e "${RED}❌ API backup script not found: $SCRIPT_DIR/SUPABASE_API_BACKUP.sh${NC}"
    fi
}

# Function to show backup statistics
show_statistics() {
    echo -e "${BLUE}📊 Backup Statistics${NC}"
    echo ""

    local backup_dir="$BACKUP_DIR"

    # Count different backup types
    local logical_backups=$(find "$backup_dir" -name "complete_backup_*.sql.gz" -type f 2>/dev/null | wc -l)
    local schema_backups=$(find "$backup_dir" -name "schema_only_*.sql.gz" -type f 2>/dev/null | wc -l)
    local api_backups=$(find "$backup_dir" -name "backup_list_*.json" -type f 2>/dev/null | wc -l)
    local pitr_restores=$(find "$backup_dir" -name "pitr_restore_*.json" -type f 2>/dev/null | wc -l)

    echo "Backup Summary:"
    echo "  Logical Backups: $logical_backups"
    echo "  Schema Backups: $schema_backups"
    echo "  API Backups: $api_backups"
    echo "  PITR Restores: $pitr_restores"
    echo ""

    # Show total size
    if [ -d "$backup_dir" ]; then
        local total_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "Unknown")
        echo "Total Size: $total_size"
    fi

    echo ""

    # Show latest backups
    echo "Latest Backups:"
    find "$backup_dir" -name "*_backup_*.gz" -o -name "*backup_list_*.json" 2>/dev/null \
        | sort -V | tail -5 | while read -r file; do
            local filename=$(basename "$file")
            local date=$(echo "$filename" | grep -o '[0-9]\{8\}_[0-9]\{6\}' | sed 's/_/ /')
            local type=$(echo "$filename" | sed 's/_.*$//' | sed 's/.*_//')
            local size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "Unknown")
            echo "  $type - $date ($size)"
        done

    echo ""
    read -p "Press Enter to continue..."
}

# Function to run comprehensive backup
run_comprehensive_backup() {
    echo -e "${PURPLE}🚀 Running Comprehensive Backup (All Methods)${NC}"
    echo ""

    # Create comprehensive backup report
    local report_file="$BACKUP_DIR/comprehensive_backup_report_${TIMESTAMP}.md"

    cat > "$report_file" << EOF
# Comprehensive Backup Report

**Project:** $PROJECT_NAME
**Timestamp:** $(date)
**Backup Directory:** $BACKUP_DIR

## Backup Methods Executed:

EOF

    # 1. Logical Backup
    echo "1️⃣  Running Logical Backup (pg_dump)..."
    echo "   This creates complete database dumps with schema and data"
    echo ""

    if [ -f "$SCRIPT_DIR/BACKUP_SUPABASE.sh" ]; then
        if source "$SCRIPT_DIR/.env.backup" 2>/dev/null && "$SCRIPT_DIR/BACKUP_SUPABASE.sh"; then
            echo -e "${GREEN}✅ Logical backup completed${NC}" | tee -a "$report_file"
        else
            echo -e "${RED}❌ Logical backup failed${NC}" | tee -a "$report_file"
        fi
    else
        echo -e "${RED}❌ Logical backup script not found${NC}" | tee -a "$report_file"
    fi

    echo ""

    # 2. Schema Documentation
    echo "2️⃣  Creating Schema Documentation..."
    echo "   This generates human-readable documentation"
    echo ""

    if [ -f "$SCRIPT_DIR/BACKUP_SUPABASE.sh" ]; then
        if source "$SCRIPT_DIR/.env.backup" 2>/dev/null && psql "${SUPABASE_DB_URL}" > "$BACKUP_DIR/schema_documentation_${TIMESTAMP}.sql" << 'EOF'; then
            echo -e "${GREEN}✅ Schema documentation created${NC}" | tee -a "$report_file"
        else
            echo -e "${RED}❌ Schema documentation failed${NC}" | tee -a "$report_file"
        fi
    fi

    echo ""

    # 3. API Backup
    echo "3️⃣  Creating Supabase API Backup..."
    echo "   This creates an official backup via Supabase API"
    echo ""

    if [ -f "$SCRIPT_DIR/SUPABASE_API_BACKUP.sh" ]; then
        if source "$SCRIPT_DIR/.env.backup" 2>/dev/null && "$SCRIPT_DIR/SUPABASE_API_BACKUP.sh" create; then
            echo -e "${GREEN}✅ API backup completed${NC}" | tee -a "$report_file"
        else
            echo -e "${RED}❌ API backup failed${NC}" | tee -a "$report_file"
        fi
    else
        echo -e "${RED}❌ API backup script not found${NC}" | tee -a "$report_file"
    fi

    echo ""

    # 4. Generate summary
    echo "4️⃣  Generating Backup Summary..."
    local total_files=$(find "$BACKUP_DIR" -name "*${TIMESTAMP}.*" -type f | wc -l)
    local total_size=$(find "$BACKUP_DIR" -name "*${TIMESTAMP}.*" -type f -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1)

    cat >> "$report_file" << EOF

## Summary:

- **Total Files Created:** $total_files
- **Total Size:** $total_size
- **Completion Time:** $(date)

## Files Created:

EOF

    find "$BACKUP_DIR" -name "*${TIMESTAMP}.*" -type f | sort | while read -r file; do
        local filename=$(basename "$file")
        local size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "Unknown")
        echo "- \`${filename}\` ($size)" >> "$report_file"
    done

    cat >> "$report_file" << EOF

## Next Steps:

1. **Review the backups:** Check that all files were created successfully
2. **Store securely:** Copy backups to offsite storage
3. **Test restore:** Test restoration on a development database
4. **Schedule automation:** Set up regular backup schedules

## Restore Commands:

### Logical Backup Restore:
\`\`\`bash
psql "\$SUPABASE_DB_URL" < complete_backup_${TIMESTAMP}.sql
\`\`\`

### API Restore:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Database → Backups
3. Select the backup created at $(date)
4. Click "Restore"

Generated by: Ultimate Supabase Backup Manager v2.0
EOF

    echo -e "${GREEN}✅ Comprehensive backup completed!${NC}"
    echo "Report saved to: $report_file"
    echo ""

    # Display summary
    echo "Backup Summary:"
    echo "  Total Files: $total_files"
    echo "  Total Size: $total_size"
    echo "  Report: $report_file"
    echo ""

    read -p "Press Enter to continue..."
}

# Function to handle PITR
handle_pitr() {
    echo -e "${PURPLE}🔄 Point-in-Time Recovery${NC}"
    echo ""

    if [ ! -f "$SCRIPT_DIR/SUPABASE_API_BACKUP.sh" ]; then
        echo -e "${RED}❌ PITR requires API backup script${NC}"
        echo "Please ensure SUPABASE_API_BACKUP.sh exists"
        read -p "Press Enter to continue..."
        return 1
    fi

    source "$SCRIPT_DIR/.env.backup" 2>/dev/null || true

    if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$PROJECT_REF" ]; then
        echo -e "${RED}❌ Supabase API credentials not configured${NC}"
        echo "Please set SUPABASE_ACCESS_TOKEN and PROJECT_REF"
        read -p "Press Enter to continue..."
        return 1
    fi

    # Show recent restore points
    echo -e "${BLUE}Recent Restore Points:${NC}"
    echo ""

    # Show options
    echo "1. Restore to 1 hour ago"
    echo "2. Restore to 6 hours ago"
    echo "3. Restore to 24 hours ago"
    echo "4. Restore to 3 days ago"
    echo "5. Custom timestamp"
    echo ""
    read -p "Choose restore option (1-5): " choice

    local timestamp
    local description

    case $choice in
        1)
            timestamp=$(date -d '1 hour ago' +%s 2>/dev/null || $(date -v-1H +%s))
            description="Restore to 1 hour ago"
            ;;
        2)
            timestamp=$(date -d '6 hours ago' +%s 2>/dev/null || $(date -v-6H +%s))
            description="Restore to 6 hours ago"
            ;;
        3)
            timestamp=$(date -d '24 hours ago' +%s 2>/dev/null || $(date -v-24H +%s))
            description="Restore to 24 hours ago"
            ;;
        4)
            timestamp=$(date -d '3 days ago' +%s 2>/dev/null || $(date -v-3d +%s))
            description="Restore to 3 days ago"
            ;;
        5)
            read -p "Enter Unix timestamp: " timestamp
            description="Custom restore to $(date -r $timestamp 2>/dev/null || 'Invalid timestamp')"
            ;;
        *)
            echo "Invalid option"
            read -p "Press Enter to continue..."
            return 1
            ;;
    esac

    echo ""
    echo -e "${YELLOW}⚠️  WARNING: This will overwrite your database!${NC}"
    echo "Restore point: $(date -r $timestamp 2>/dev/null || 'Invalid timestamp')"
    echo "Unix timestamp: $timestamp"
    echo "Description: $description"
    echo ""

    read -p "Are you sure you want to proceed? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        echo -e "${BLUE}🔄 Executing PITR...${NC}"

        if "$SCRIPT_DIR/SUPABASE_API_BACKUP.sh" pitr_restore "$timestamp" "$description"; then
            echo -e "${GREEN}✅ PITR initiated successfully${NC}"
        else
            echo -e "${RED}❌ PITR failed${NC}"
        fi
    else
        echo -e "${YELLOW}❌ PITR cancelled${NC}"
    fi

    echo ""
    read -p "Press Enter to continue..."
}

# Function to setup configuration
setup_configuration() {
    echo -e "${BLUE}⚙️  Setup & Configuration${NC}"
    echo ""

    # Check for .env.backup
    if [ ! -f "$SCRIPT_DIR/.env.backup" ]; then
        echo -e "${BLUE}Creating .env.backup configuration...${NC}"

        if [ -f "$SCRIPT_DIR/.env.backup.example" ]; then
            cp "$SCRIPT_DIR/.env.backup.example" "$SCRIPT_DIR/.env.backup"
            echo -e "${GREEN}✅ Created .env.backup from template${NC}"
        else
            cat > "$SCRIPT_DIR/.env.backup" << 'EOF'
# Supabase Database Backup Configuration
# Get your connection string from Supabase Dashboard > Settings > Database > Connection string > URI

# Complete Database Connection String
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres

# Supabase API Configuration
# Get access token from: https://supabase.com/dashboard/account/tokens
SUPABASE_ACCESS_TOKEN=your-access-token
PROJECT_REF=your-project-ref

# Project Configuration
PROJECT_NAME=preset
BACKUP_DIR=./backups/database
EOF
            echo -e "${GREEN}✅ Created .env.backup configuration${NC}"
        fi

        echo ""
        echo -e "${YELLOW}⚠️  Please edit .env.backup with your credentials${NC}"
        read -p "Press Enter to open editor (or Ctrl+C to skip): " edit_confirm

        if [ "$edit_confirm" != "" ]; then
            ${EDITOR:-nano} "$SCRIPT_DIR/.env.backup"
        fi
    else
        echo -e "${GREEN}✅ .env.backup already exists${NC}"
    fi

    echo ""

    # Test connections
    test_connections

    # Setup scheduled backups
    echo -e "${BLUE}Setting up scheduled backup configuration...${NC}"

    local cron_file="$BACKUP_DIR/cron_backup.txt"
    cat > "$cron_file" << EOF
# Supabase Backup Schedule
# Add these lines to your crontab with: crontab -e

# Comprehensive backup every day at 2 AM UTC
0 2 * * * cd $SCRIPT_DIR && ./BACKUP_MANAGER.sh comprehensive >> $BACKUP_DIR/backup.log 2>&1

# Weekly backup status check
0 9 * * 1 cd $SCRIPT_DIR && ./BACKUP_MANAGER.sh stats >> $BACKUP_DIR/backup.log 2>&1

# Clean up old files (keep last 30 days)
0 3 * * * find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.json" -mtime +30 -delete
find $BACKUP_DIR -name "*.txt" -mtime +30 -delete

# Daily health check
0 12 * * * cd $SCRIPT_DIR && ./BACKUP_MANAGER.sh stats >> $BACKUP_DIR/health.log 2>&1
EOF

    echo -e "${GREEN}✅ Cron configuration created: $cron_file${NC}"
    echo ""
    echo "To set up automated backups:"
    echo "1. Run: crontab -e"
    echo "2. Add the contents of: $cron_file"
    echo ""

    read -p "Press Enter to continue..."
}

# Main menu loop
main_menu() {
    while true; do
        clear
        show_menu
        echo -e "${CYAN}Enter your choice (0-10):${NC} " choice

        case $choice in
            1)
                if [ -f "$SCRIPT_DIR/BACKUP_SUPABASE.sh" ]; then
                    echo -e "${GREEN}🔧 Running Logical Backup...${NC}"
                    source "$SCRIPT_DIR/.env.backup" 2>/dev/null || true
                    "$SCRIPT_DIR/BACKUP_SUPABASE.sh"
                else
                    echo -e "${RED}❌ BACKUP_SUPABASE.sh not found${NC}"
                fi
                ;;
            2)
                echo -e "${GREEN}📄 Running Schema Backup...${NC}"
                source "$SCRIPT_DIR/.env.backup" 2>/dev/null || true
                pg_dump --schema-only "$SUPABASE_DB_URL" > "$BACKUP_DIR/schema_backup_${TIMESTAMP}.sql"
                gzip -c "$BACKUP_DIR/schema_backup_${TIMESTAMP}.sql" > "$BACKUP_DIR/schema_backup_${TIMESTAMP}.sql.gz"
                echo -e "${GREEN}✅ Schema backup completed${NC}"
                ;;
            3)
                echo -e "${GREEN}🗄️  Running Data Backup...${NC}"
                source "$SCRIPT_DIR/.env.backup" 2>/dev/null || true
                pg_dump --data-only "$SUPABASE_DB_URL" > "$BACKUP_DIR/data_backup_${TIMESTAMP}.sql"
                gzip -c "$BACKUP_DIR/data_backup_${TIMESTAMP}.sql" > "$BACKUP_DIR/data_backup_${TIMESTAMP}.sql.gz"
                echo -e "${GREEN}✅ Data backup completed${NC}"
                ;;
            4)
                run_api_backup
                ;;
            5)
                handle_pitr
                ;;
            6)
                show_statistics
                ;;
            7)
                setup_configuration
                ;;
            8)
                test_connections
                ;;
            9)
                run_comprehensive_backup
                ;;
            10)
                echo -e "${BLUE}💾 Database Restore${NC}"
                echo ""
                echo "Available restore options:"
                echo "1. Restore from logical backup"
                echo "2. Restore from Supabase API backup"
                echo "3. Return to menu"
                echo ""
                read -p "Choose restore option (1-3): " restore_choice

                case $restore_choice in
                    1)
                        echo -e "${YELLOW}Logical Backup Restore${NC}"
                        echo "Available backups:"
                        ls -la "$BACKUP_DIR"/complete_backup_*.sql.gz 2>/dev/null | tail -5
                        echo ""
                        read -p "Enter backup filename (without .gz): " backup_file
                        if [ -f "$BACKUP_DIR/${backup_file}.gz" ]; then
                            gunzip -c "$BACKUP_DIR/${backup_file}.gz" | psql "$SUPABASE_DB_URL"
                            echo -e "${GREEN}✅ Restore completed${NC}"
                        else
                            echo -e "${RED}❌ Backup file not found${NC}"
                        fi
                        ;;
                    2)
                        echo -e "${YELLOW}API Backup Restore${NC}"
                        echo "Please visit your Supabase Dashboard:"
                        echo "https://app.supabase.com/project/$PROJECT_REF/database/backups"
                        ;;
                    *)
                        ;;
                esac
                echo ""
                read -p "Press Enter to continue..."
                ;;
            0)
                echo -e "${GREEN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option: $choice${NC}"
                sleep 2
                ;;
        esac
    done
}

# Run main menu if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main_menu
fi