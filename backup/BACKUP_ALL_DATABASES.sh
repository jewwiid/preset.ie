#!/bin/bash

# Complete Database Backup using pg_dumpall
# Backs up ALL databases, roles, tablespaces, and global objects

set -e

# Configuration
SUPABASE_DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres}"
PROJECT_NAME="preset"
BASE_BACKUP_DIR="./backup/database"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATETIME_DIR=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$BASE_BACKUP_DIR/$DATETIME_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🚀 Starting complete database backup using pg_dumpall"
echo "📁 Backup directory: $BACKUP_DIR"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

# Extract connection details for pg_dumpall
# pg_dumpall uses different connection format
PGHOST=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
PGPORT=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
PGUSER=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
PGPASSWORD=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
PGDATABASE=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

export PGPASSWORD
export PGHOST
export PGPORT
export PGUSER

echo "🔗 Connection Details:"
echo "   Host: $PGHOST"
echo "   Port: $PGPORT"
echo "   User: $PGUSER"
echo "   Database: $PGDATABASE"
echo ""

# Check connection
echo "🔍 Testing database connection..."
if ! psql -d "$PGDATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Failed to connect to database"
    echo "Please check your SUPABASE_DB_URL environment variable"
    exit 1
fi
echo "✅ Database connection successful"
echo ""

# Backup 1: Complete cluster backup (all databases)
echo "📦 Creating complete cluster backup (all databases, roles, tablespaces)..."
CLUSTER_BACKUP="$BACKUP_DIR/complete_cluster_${TIMESTAMP}.sql"

if pg_dumpall > "$CLUSTER_BACKUP"; then
    echo "✅ Complete cluster backup created: $CLUSTER_BACKUP"
    gzip -c "$CLUSTER_BACKUP" > "${CLUSTER_BACKUP}.gz"
    echo "📦 Compressed: ${CLUSTER_BACKUP}.gz"
    size=$(du -h "$CLUSTER_BACKUP" | cut -f1)
    echo "📊 Size: $size"
else
    echo "❌ Complete cluster backup failed"
    exit 1
fi
echo ""

# Backup 2: Schema-only cluster backup
echo "📦 Creating schema-only cluster backup..."
SCHEMA_BACKUP="$BACKUP_DIR/cluster_schema_only_${TIMESTAMP}.sql"

if pg_dumpall --schema-only > "$SCHEMA_BACKUP"; then
    echo "✅ Schema-only cluster backup created: $SCHEMA_BACKUP"
    gzip -c "$SCHEMA_BACKUP" > "${SCHEMA_BACKUP}.gz"
    echo "📦 Compressed: ${SCHEMA_BACKUP}.gz"
    size=$(du -h "$SCHEMA_BACKUP" | cut -f1)
    echo "📊 Size: $size"
else
    echo "❌ Schema-only cluster backup failed"
    exit 1
fi
echo ""

# Backup 3: Roles only
echo "📦 Creating roles backup..."
ROLES_BACKUP="$BACKUP_DIR/roles_only_${TIMESTAMP}.sql"

if pg_dumpall --roles-only > "$ROLES_BACKUP"; then
    echo "✅ Roles backup created: $ROLES_BACKUP"
    gzip -c "$ROLES_BACKUP" > "${ROLES_BACKUP}.gz"
    echo "📦 Compressed: ${ROLES_BACKUP}.gz"
    size=$(du -h "$ROLES_BACKUP" | cut -f1)
    echo "📊 Size: $size"
else
    echo "❌ Roles backup failed"
    exit 1
fi
echo ""

# Backup 4: Tablespaces only
echo "📦 Creating tablespaces backup..."
TABLESPACES_BACKUP="$BACKUP_DIR/tablespaces_only_${TIMESTAMP}.sql"

if pg_dumpall --tablespaces-only > "$TABLESPACES_BACKUP"; then
    echo "✅ Tablespaces backup created: $TABLESPACES_BACKUP"
    gzip -c "$TABLESPACES_BACKUP" > "${TABLESPACES_BACKUP}.gz"
    echo "📦 Compressed: ${TABLESPACES_BACKUP}.gz"
    size=$(du -h "$TABLESPACES_BACKUP" | cut -f1)
    echo "📊 Size: $size"
else
    echo "⚠️  Tablespaces backup failed (may not exist or no permissions)"
fi
echo ""

# Generate database information
echo "📋 Generating database information..."
INFO_FILE="$BACKUP_DIR/database_info_${TIMESTAMP}.txt"

cat > "$INFO_FILE" << EOF
Database Information Report
=========================
Generated: $(date)
Project: $PROJECT_NAME

Server Information:
------------------
Host: $PGHOST
Port: $PGPORT
Connected User: $PGUSER
Connected Database: $PGDATABASE

All Databases:
--------------
$(psql -tAc "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;")

All Roles:
---------
$(psql -tAc "SELECT rolname FROM pg_roles ORDER BY rolname;")

All Tablespaces:
----------------
$(psql -tAc "SELECT spcname FROM pg_tablespace ORDER BY spcname;" || echo "No tablespaces found or no permissions")

Extensions in $PGDATABASE:
---------------------------
$(psql -tAc "SELECT extname, extversion FROM pg_extension ORDER BY extname;" || echo "No extensions found")

Schemas in $PGDATABASE:
------------------------
$(psql -tAc "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast') ORDER BY schema_name;" || echo "No additional schemas found")

Tables in $PGDATABASE:
-----------------------
$(psql -tAc "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast') ORDER BY schemaname, tablename;" || echo "No tables found")

Functions in $PGDATABASE:
------------------------
$(psql -tAc "SELECT routine_schema, routine_name FROM information_schema.routines WHERE routine_schema NOT IN ('information_schema', 'pg_catalog') ORDER BY routine_schema, routine_name;" || echo "No functions found")

Triggers in $PGDATABASE:
-----------------------
$(psql -tAc "SELECT trigger_schema, trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog') ORDER BY trigger_schema, trigger_name;" || echo "No triggers found")

EOF

echo "✅ Database information generated: $INFO_FILE"
echo ""

# Create restore instructions
RESTORE_FILE="$BACKUP_DIR/restore_instructions_${TIMESTAMP}.md"

cat > "$RESTORE_FILE" << EOF
# Database Restore Instructions

Generated: $(date)
Project: $PROJECT_NAME

## Prerequisites
1. Install PostgreSQL client tools
2. Ensure you have superuser permissions
3. Test on development environment first!

## Connection Details
\`\`\`bash
export PGHOST="$PGHOST"
export PGPORT="$PGPORT"
export PGUSER="$PGUSER"
export PGPASSWORD="[PASSWORD]"
\`\`\`

## Restore Options

### 1. Complete Cluster Restore (ALL databases)
\`\`\`bash
psql -d postgres < complete_cluster_${TIMESTAMP}.sql
\`\`\`
⚠️ **WARNING**: This will restore ALL databases and overwrite everything!

### 2. Schema Only Restore
\`\`\`bash
psql -d postgres < cluster_schema_only_${TIMESTAMP}.sql
\`\`\`

### 3. Roles Only Restore
\`\`\`bash
psql -d postgres < roles_only_${TIMESTAMP}.sql
\`\`\`

### 4. Tablespaces Only Restore
\`\`\`bash
psql -d postgres < tablespaces_only_${TIMESTAMP}.sql
\`\`\`

### 5. Single Database Restore
If you need to restore just one database:
\`\`\`bash
psql -d [database_name] < [backup_file].sql
\`\`\`

## Verification
After restore, verify with:
\`\`\`sql
-- Check databases
SELECT datname FROM pg_database;

-- Check tables
\\dt

-- Check functions
\\df

-- Check triggers
SELECT * FROM information_schema.triggers;
\`\`\`

## Important Notes
- Always backup current state before restoring
- Test restores on development environment
- pg_dumpall backs up ALL databases on the server
- Some operations require superuser privileges
- Extensions might need to be installed separately

## File Locations
- Complete cluster: \`complete_cluster_${TIMESTAMP}.sql\`
- Schema only: \`cluster_schema_only_${TIMESTAMP}.sql\`
- Roles only: \`roles_only_${TIMESTAMP}.sql\`
- Tablespaces: \`tablespaces_only_${TIMESTAMP}.sql\`
- Database info: \`database_info_${TIMESTAMP}.txt\`
EOF

echo "📄 Restore instructions created: $RESTORE_FILE"
echo ""

# Create summary
echo "📊 Creating backup summary..."
SUMMARY_FILE="$BACKUP_DIR/backup_summary_all_${TIMESTAMP}.txt"

cat > "$SUMMARY_FILE" << EOF
Complete Database Backup Summary (pg_dumpall)
==============================================
Project: $PROJECT_NAME
Timestamp: $TIMESTAMP

Connection:
- Host: $PGHOST
- Port: $PGPORT
- User: $PGUSER

Backup Files Created:
--------------------
$(ls -la "$BACKUP_DIR"/*_${TIMESTAMP}.* | awk '{print $9 " " $5 " " $6 " " $7 " " $8}')

Total Size:
-----------
$(du -sh "$BACKUP_DIR"/*_${TIMESTAMP}.* | cut -f1 | paste -sd+ | bc) bytes

Quick Commands:
--------------
# View all databases
psql -tAc "SELECT datname FROM pg_database WHERE datistemplate = false;"

# View all roles
psql -tAc "SELECT rolname FROM pg_roles;"

# Connect to specific database
psql -d [database_name]

Next Steps:
----------
1. Store these files securely
2. Add .sql files to your repository for codebase reference
3. Use .gz files for long-term storage
4. Test restore procedures regularly
5. Keep the database_info_${TIMESTAMP}.txt for reference

Remember: This backup includes ALL databases on the server!
EOF

echo "✅ Backup summary created: $SUMMARY_FILE"
echo ""

# Clean up old backups (keep last 3 days)
echo "🧹 Cleaning up old pg_dumpall backups (keeping last 3 days)..."
find "$BACKUP_DIR" -name "complete_cluster_*.sql" -mtime +3 -delete
find "$BACKUP_DIR" -name "cluster_schema_only_*.sql" -mtime +3 -delete
find "$BACKUP_DIR" -name "roles_only_*.sql" -mtime +3 -delete
find "$BACKUP_DIR" -name "tablespaces_only_*.sql" -mtime +3 -delete
find "$BACKUP_DIR" -name "database_info_*.txt" -mtime +3 -delete
find "$BACKUP_DIR" -name "restore_instructions_*.md" -mtime +3 -delete
find "$BACKUP_DIR" -name "backup_summary_all_*.txt" -mtime +3 -delete
find "$BACKUP_DIR" -name "*.gz" -mtime +3 -delete

echo "✅ Old backups cleaned up"
echo ""

echo "🎉 Complete database backup finished!"
echo ""
echo "📂 Location: $BACKUP_DIR"
echo "📋 Files created:"
ls -lt "$BACKUP_DIR"/*_${TIMESTAMP}.* | head -10
echo ""
echo "💡 Important: These backups include ALL databases on the server!"
echo "💡 The .sql files can be added to your codebase for reference"
echo "💡 Use the .gz files for storage and sharing"
echo ""
echo "🚀 Your codebase can now reference the complete database structure!"