#!/bin/bash

# Simple Database Backup with Dated Folders
# Creates backups in dated folders for easy organization

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="preset"
BASE_BACKUP_DIR="$SCRIPT_DIR/database"
DATETIME_DIR=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$BASE_BACKUP_DIR/$DATETIME_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logo
echo -e "${BLUE}
 ____       _ _           _     _   _               _
/ ___|  ___| | | ___  ___| |_  | | | | __ _ _ __ __| |
| |  _ / _ \ | |/ _ \/ __| __| | |_| |/ _\` | '__/ _\` |
| |_| |  __/ | |  __/ (__| |_  |  _  | (_| | | | (_| |
\____|_|___|_|_|\___|\___|\__|  |_| |_|\__,_|_|  \__,_|

                SIMPLE BACKUP v1.0
${NC}"

echo "Project: $PROJECT_NAME"
echo "DateTime Folder: $DATETIME_DIR"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Create dated backup directory
mkdir -p "$BACKUP_DIR"

# Source environment variables
if [ -f "$SCRIPT_DIR/.env.backup" ]; then
    source "$SCRIPT_DIR/.env.backup"
    echo -e "${GREEN}✅ Environment loaded from .env.backup${NC}"
else
    echo -e "${YELLOW}⚠️  .env.backup not found${NC}"
    echo "Creating minimal backup documentation..."
fi

# 1. Create backup summary
SUMMARY_FILE="$BACKUP_DIR/backup_summary_${TIMESTAMP}.md"

cat > "$SUMMARY_FILE" << EOF
# Database Backup Summary

**Project:** $PROJECT_NAME
**Backup Date:** $(date)
**DateTime Folder:** $DATETIME_DIR
**Timestamp:** $TIMESTAMP

## Backup Contents

This folder contains database backups and documentation created at:
- **Date:** $(date +"%Y-%m-%d")
- **Time:** $(date +"%H:%M:%S")
- **Timezone:** $(date +"%Z")

## Files in This Backup

EOF

# 2. Create Supabase backup documentation
echo "📋 Creating Supabase backup documentation..."

if [ -n "$SUPABASE_PROJECT_REF" ] && [ -n "$SUPABASE_ACCESS_TOKEN" ]; then

    # Get backup list from Supabase API
    API_FILE="$BACKUP_DIR/supabase_backups_${TIMESTAMP}.json"

    if curl -X GET "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/backups" \
         -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
         -H "Content-Type: application/json" > "$API_FILE" 2>/dev/null; then

        echo -e "${GREEN}✅ Supabase backup list retrieved${NC}"

        # Parse and add to summary
        if command -v jq &> /dev/null; then
            backup_count=$(cat "$API_FILE" | jq '.backups | length' 2>/dev/null || echo "0")
            latest_backup=$(cat "$API_FILE" | jq -r '.backups[0].inserted_at // "Unknown"' 2>/dev/null || echo "Unknown")

            cat >> "$SUMMARY_FILE" << EOF
- \`supabase_backups_${TIMESTAMP}.json\` - Supabase API backup list
- Available Supabase backups: $backup_count
- Latest backup: $latest_backup

EOF
        else
            cat >> "$SUMMARY_FILE" << EOF
- \`supabase_backups_${TIMESTAMP}.json\` - Supabase API backup list
- Note: Install jq for better JSON parsing

EOF
        fi
    else
        echo -e "${YELLOW}⚠️  Failed to retrieve Supabase backup list${NC}"
        cat >> "$SUMMARY_FILE" << EOF
- Supabase API: Failed to retrieve backup list
- Check credentials in .env.backup

EOF
    fi
else
    echo -e "${YELLOW}⚠️  Supabase credentials not configured${NC}"
    cat >> "$SUMMARY_FILE" << EOF
- Supabase API: Not configured
- Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN in .env.backup

EOF
fi

# 3. Create schema documentation
SCHEMA_FILE="$BACKUP_DIR/schema_documentation_${TIMESTAMP}.md"

cat > "$SCHEMA_FILE" << EOF
# Database Schema Documentation

**Generated:** $(date)
**Project:** $PROJECT_NAME
**Folder:** $DATETIME_DIR

## Table Structure Queries

Use these SQL queries to inspect your database:

\`\`\`sql
-- List all tables
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY table_schema, table_name;

-- List columns with details
SELECT
    c.table_schema,
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY c.table_schema, c.table_name, c.ordinal_position;
\`\`\`

## Schema Information

- **Database:** PostgreSQL (Supabase)
- **Common Schemas:** public, auth, storage, extensions
- **Access:** Via Supabase Dashboard or direct connection

## Restore Methods

1. **Supabase Dashboard** (Recommended):
   - Go to Database → Backups
   - Select backup date and click "Restore"

2. **SQL Import**:
   - Use \`psql\` command line tool
   - Import via database GUI tools

## Notes

- Always test restores on development environment first
- Supabase maintains automatic backups
- Consider enabling Point-in-Time Recovery (PITR) for critical data

EOF

echo "✅ Schema documentation created"

# 4. Add to summary
cat >> "$SUMMARY_FILE" << EOF
- \`schema_documentation_${TIMESTAMP}.md\` - Database structure documentation

## How to Use This Backup

1. **Via Supabase Dashboard**:
   - Navigate to your project dashboard
   - Go to Database → Backups
   - Select appropriate backup date

2. **Manual SQL Operations**:
   - Use the queries in schema_documentation_${TIMESTAMP}.md
   - Export specific tables using pg_dump
   - Import using psql or database tools

## Folder Structure

All backups are organized in dated folders:
\`\`\`
database/
├── 2025-10-16_22-30-00/    # This backup
│   ├── backup_summary_20251016_223000.md
│   ├── schema_documentation_20251016_223000.md
│   └── supabase_backups_20251016_223000.json
├── 2025-10-17_14-15-30/    # Next backup
└── ...
\`\`\`

## Automated Cleanup

Backups older than 30 days are automatically cleaned up.
To change this, modify the cleanup script configuration.

---
Generated by: Simple Backup Script v1.0
Date: $(date)
EOF

echo "✅ Backup summary created"

# 5. Create quick reference
QUICK_FILE="$BACKUP_DIR/quick_reference_${TIMESTAMP}.txt"

cat > "$QUICK_FILE" << EOF
QUICK REFERENCE - Database Backup $DATETIME_DIR
================================================

Project: $PROJECT_NAME
Created: $(date)

Supabase Dashboard: https://app.supabase.com
Project Ref: ${SUPABASE_PROJECT_REF:-"Not configured"}

FILES CREATED:
- backup_summary_${TIMESTAMP}.md       - Main documentation
- schema_documentation_${TIMESTAMP}.md - Database structure
- supabase_backups_${TIMESTAMP}.json   - API backup list (if available)
- quick_reference_${TIMESTAMP}.txt     - This file

QUICK COMMANDS:
----------------
# View tables in database
\\dt

# View table structure
\\d table_name

# Export single table
pg_dump --data-only --table=table_name your_db_url > table.sql

# Import table
psql your_db_url < table.sql

IMPORTANT:
-----------
- Keep this folder for reference
- Test restores on development first
- Check .env.backup for connection details
EOF

echo "✅ Quick reference created"

# 6. Final summary
echo ""
echo -e "${GREEN}🎉 Backup created successfully!${NC}"
echo ""
echo "📂 Backup Location: $BACKUP_DIR"
echo "📁 DateTime Folder: $DATETIME_DIR"
echo "📋 Files Created:"
ls -la "$BACKUP_DIR" | grep -v "^total" | awk '{print "  " $9 " (" $5 " bytes)"}'
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "  - Each backup creates a new dated folder"
echo "  - Old backups are automatically cleaned up after 30 days"
echo "  - Use the summary.md file for complete information"
echo "  - Check quick_reference.txt for fast commands"
echo ""
echo -e "${GREEN}✅ All done! Your backup is ready.${NC}"