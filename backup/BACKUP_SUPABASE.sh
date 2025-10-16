#!/bin/bash

# Comprehensive Supabase Database Backup Script
# Backs up all tables, triggers, functions, and schema definitions

set -e

# Configuration - Update these with your actual Supabase details
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
SUPABASE_DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres}"
PROJECT_NAME="preset"
BASE_BACKUP_DIR="./backup/database"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATETIME_DIR=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$BASE_BACKUP_DIR/$DATETIME_DIR"

# Create dated backup directory
mkdir -p "$BACKUP_DIR"

echo "🚀 Starting comprehensive Supabase backup for $PROJECT_NAME"
echo "📁 Backup directory: $BACKUP_DIR"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

# Check if required tools are installed
if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump is not installed. Please install PostgreSQL client tools."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

echo "✅ PostgreSQL client tools detected"
echo ""

# Function to run backup with error handling
run_backup() {
    local backup_name=$1
    local options=$2
    local filename="$BACKUP_DIR/${backup_name}_${TIMESTAMP}.sql"

    echo "📦 Creating backup: $backup_name"
    echo "   File: $filename"

    if pg_dump $options "$SUPABASE_DB_URL" > "$filename"; then
        echo "   ✅ Backup completed successfully"

        # Create a compressed version
        gzip -c "$filename" > "${filename}.gz"
        echo "   📦 Compressed: ${filename}.gz"

        # Get file size
        local size=$(du -h "$filename" | cut -f1)
        echo "   📊 Size: $size"
    else
        echo "   ❌ Backup failed for $backup_name"
        return 1
    fi

    echo ""
    return 0
}

# 1. Complete database backup (schema + data)
run_backup "complete_backup" "" \
    || { echo "❌ Complete backup failed"; exit 1; }

# 2. Schema-only backup (tables, triggers, functions, no data)
run_backup "schema_only" "--schema-only" \
    || { echo "❌ Schema backup failed"; exit 1; }

# 3. Data-only backup
run_backup "data_only" "--data-only" \
    || { echo "❌ Data backup failed"; exit 1; }

# 4. Functions and triggers only
run_backup "functions_triggers" "--schema-only --function --trigger" \
    || { echo "❌ Functions/triggers backup failed"; exit 1; }

# 5. Specific important schemas (if they exist)
echo "🔍 Checking for additional schemas..."

# Check for auth schema
if psql "$SUPABASE_DB_URL" -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'" | grep -q 1; then
    run_backup "auth_schema" "--schema=auth" \
        || echo "⚠️  Auth schema backup failed (may not exist)"
fi

# Check for storage schema
if psql "$SUPABASE_DB_URL" -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'" | grep -q 1; then
    run_backup "storage_schema" "--schema=storage" \
        || echo "⚠️  Storage schema backup failed (may not exist)"
fi

# Check for extensions schema
if psql "$SUPABASE_DB_URL" -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'extensions'" | grep -q 1; then
    run_backup "extensions_schema" "--schema=extensions" \
        || echo "⚠️  Extensions schema backup failed (may not exist)"
fi

# 6. Generate database schema documentation
echo "📋 Generating schema documentation..."
SCHEMA_FILE="$BACKUP_DIR/schema_documentation_$TIMESTAMP.md"

cat > "$SCHEMA_FILE" << EOF
# Database Schema Documentation

Generated on: $(date)
Project: $PROJECT_NAME

## Tables

\`\`\`sql
SELECT
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name;
\`\`\`

## Columns

\`\`\`sql
SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY table_schema, table_name, ordinal_position;
\`\`\`

## Foreign Keys

\`\`\`sql
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog');
\`\`\`

## Functions

\`\`\`sql
SELECT
    routine_schema,
    routine_name,
    routine_type,
    data_type,
    external_language
FROM information_schema.routines
WHERE routine_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY routine_schema, routine_name;
\`\`\`

## Triggers

\`\`\`sql
SELECT
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog')
ORDER BY trigger_schema, trigger_name;
\`\`\`

## Indexes

\`\`\`sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schemaname, tablename, indexname;
\`\`\`

EOF

echo "✅ Schema documentation generated: $SCHEMA_FILE"
echo ""

# 7. Create a summary file
SUMMARY_FILE="$BACKUP_DIR/backup_summary_$TIMESTAMP.txt"

cat > "$SUMMARY_FILE" << EOF
Backup Summary
==============
Project: $PROJECT_NAME
Timestamp: $TIMESTAMP
Total Backups Created: $(ls -1 "$BACKUP_DIR"/*_${TIMESTAMP}.sql | wc -l)

Files Created:
-------------
$(ls -la "$BACKUP_DIR"/*_${TIMESTAMP}.* | awk '{print $9 " " $5 " " $6 " " $7 " " $8}')

Backup Types:
------------
- complete_backup: Full database (schema + data)
- schema_only: Schema definition only
- data_only: Data only (no schema)
- functions_triggers: Functions and triggers only
- auth_schema: Supabase auth schema (if exists)
- storage_schema: Supabase storage schema (if exists)
- extensions_schema: Extensions schema (if exists)

Restore Instructions:
-------------------
1. To restore complete database:
   psql "$SUPABASE_DB_URL" < complete_backup_${TIMESTAMP}.sql

2. To restore schema only:
   psql "$SUPABASE_DB_URL" < schema_only_${TIMESTAMP}.sql

3. To restore functions and triggers:
   psql "$SUPABASE_DB_URL" < functions_triggers_${TIMESTAMP}.sql

Note: Always test restores on a development database first!
EOF

echo "📄 Backup summary created: $SUMMARY_FILE"
echo ""

# 8. Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups (keeping last 7 days)..."
find "$BASE_BACKUP_DIR" -type d -name "*_*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true
find "$BASE_BACKUP_DIR" -name "*.sql" -mtime +7 -delete 2>/dev/null || true
find "$BASE_BACKUP_DIR" -name "*.gz" -mtime +7 -delete 2>/dev/null || true
find "$BASE_BACKUP_DIR" -name "backup_summary_*.txt" -mtime +7 -delete 2>/dev/null || true
find "$BASE_BACKUP_DIR" -name "schema_documentation_*.md" -mtime +7 -delete 2>/dev/null || true

echo "✅ Old backups cleaned up"
echo ""

# 9. Display final summary
echo "🎉 Backup process completed successfully!"
echo ""
echo "📂 Backup Location: $BACKUP_DIR"
echo "📋 Most Recent Files:"
ls -lt "$BACKUP_DIR"/*_${TIMESTAMP}.* | head -5
echo ""
echo "💡 Pro tip: Keep these files in your repository for reference"
echo "💡 Pro tip: Use the .gz files for storage, .sql files for viewing"
echo ""
echo "🚀 You can now reference these schema definitions in your codebase!"