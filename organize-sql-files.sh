#!/bin/bash

# SQL Files Organization Script
# This requires manual review, so use with caution
# Generated: October 13, 2025

set -e

echo "🗄️  Organizing SQL files..."
echo ""
echo "⚠️  This will organize 216+ SQL files"
echo "    Review the plan first: ROOT_FOLDER_CLEANUP_PLAN.md"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Organization cancelled."
    exit 1
fi

# Create directories
mkdir -p migrations/manual
mkdir -p migrations/patches  
mkdir -p sql-backups/diagnostics
mkdir -p sql-backups/archive

# Function to move file if it exists
move_if_exists() {
    if [ -f "$1" ]; then
        mv "$1" "$2" && echo "  ✓ Moved: $(basename $1)"
    fi
}

# Count files
total_sql=$(find . -maxdepth 1 -name "*.sql" -type f | wc -l | tr -d ' ')
echo "Found $total_sql SQL files in root"
echo ""

# Migration scripts (add_*, create_*, setup_*, enable_*, insert_*, instant_*)
echo "Moving migration scripts (add_*, create_*, setup_*, enable_*)..."
migration_count=0
for file in add_*.sql create_*.sql setup_*.sql enable_*.sql insert_*.sql instant_*.sql set_*.sql rename_*.sql; do
    if [ -f "$file" ]; then
        move_if_exists "$file" "migrations/manual/"
        ((migration_count++))
    fi
done
echo "  Moved $migration_count migration files"
echo ""

# Fix/patch scripts (fix_*, cleanup_*, remove_*, recalculate_*, comprehensive_*, complete_*, prevent_*)
echo "Moving fix/patch scripts (fix_*, cleanup_*, etc.)..."
fix_count=0
for file in fix_*.sql cleanup_*.sql remove_*.sql recalculate_*.sql comprehensive_*.sql complete_*.sql prevent_*.sql emergency_*.sql surgical_*.sql oauth_*.sql; do
    if [ -f "$file" ]; then
        move_if_exists "$file" "migrations/patches/"
        ((fix_count++))
    fi
done
echo "  Moved $fix_count fix/patch files"
echo ""

# Diagnostic scripts (check_*, test_*, debug_*, diagnose_*, verify_*, analyze_*, simple_*, minimal_*)
echo "Moving diagnostic scripts (check_*, test_*, debug_*, etc.)..."
diag_count=0
for file in check_*.sql test_*.sql debug_*.sql diagnose_*.sql verify_*.sql analyze_*.sql simple_*.sql minimal_*.sql find_*.sql; do
    if [ -f "$file" ]; then
        move_if_exists "$file" "sql-backups/diagnostics/"
        ((diag_count++))
    fi
done
echo "  Moved $diag_count diagnostic files"
echo ""

# Temporary/working files (temp_*, quick_*, *_rows.sql, remote_*.sql, QUICK_*.sql)
echo "Moving temporary/archive files..."
archive_count=0
for file in temp_*.sql quick_*.sql *_rows.sql remote_*.sql QUICK_*.sql messages_rows.sql offers_rows.sql SIMPLIFIED_*.sql; do
    if [ -f "$file" ]; then
        move_if_exists "$file" "sql-backups/archive/"
        ((archive_count++))
    fi
done
echo "  Moved $archive_count temp/archive files"
echo ""

# List any remaining SQL files
remaining=$(find . -maxdepth 1 -name "*.sql" -type f | wc -l | tr -d ' ')

if [ "$remaining" -gt 0 ]; then
    echo ""
    echo "⚠️  $remaining SQL files remain in root:"
    echo ""
    find . -maxdepth 1 -name "*.sql" -type f | sort | sed 's|^\./|  - |'
    echo ""
    echo "Please review and categorize these manually."
    echo "They may need special handling or deletion."
else
    echo "✅ All SQL files organized!"
fi

echo ""
echo "📊 Summary:"
echo "  - Migration scripts:  $migration_count → migrations/manual/"
echo "  - Fix/patch scripts:  $fix_count → migrations/patches/"
echo "  - Diagnostic queries: $diag_count → sql-backups/diagnostics/"
echo "  - Archive/temp files: $archive_count → sql-backups/archive/"
echo "  - Remaining in root:  $remaining"
echo ""

# Create README files
echo "Creating README files..."

cat > migrations/README.md << 'EOF'
# Database Migrations

This directory contains SQL migration and patch scripts.

## Structure

- `/manual/` - Feature migrations (add_*, create_*, setup_*)
- `/patches/` - Bug fixes and patches (fix_*, cleanup_*)

## Usage

These are manual SQL scripts. The main migrations are in `/supabase/migrations/`.

Use these scripts when:
- You need to apply a specific fix
- You're debugging an issue
- You're manually setting up data

Always review scripts before running them in production.
EOF

cat > sql-backups/README.md << 'EOF'
# SQL Backups & Reference Queries

This directory contains reference SQL queries and archived scripts.

## Structure

- `/diagnostics/` - Diagnostic queries (check_*, test_*)
- `/archive/` - Old/temporary scripts

## Usage

These are reference files, not meant for production use.

- Diagnostic queries help debug issues
- Archive contains old scripts kept for reference
EOF

echo "✅ README files created"
echo ""
echo "🎉 SQL organization complete!"
echo ""
echo "Next steps:"
echo "  1. Review the organized files"
echo "  2. Handle any remaining SQL files in root"
echo "  3. Commit changes: git add . && git commit -m 'chore: organize SQL files'"

