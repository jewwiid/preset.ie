#!/bin/bash

# Quick Setup Script for Supabase Database Backup
# This script helps you get started with database backups quickly

set -e

echo "🚀 Supabase Database Backup Setup"
echo "=================================="
echo ""

# Check if .env.backup exists
if [ ! -f ".env.backup" ]; then
    echo "📝 Creating .env.backup file..."
    cp .env.backup.example .env.backup
    echo "✅ Created .env.backup file"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.backup with your Supabase credentials before running backups!"
    echo ""
    echo "📖 To get your credentials:"
    echo "   1. Go to https://app.supabase.com"
    echo "   2. Select your project"
    echo "   3. Go to Settings → Database"
    echo "   4. Scroll to 'Connection string' → 'URI'"
    echo "   5. Copy the connection string to SUPABASE_DB_URL in .env.backup"
    echo ""
    read -p "Press Enter to open the file for editing (or Ctrl+C to cancel)..."
    ${EDITOR:-nano} .env.backup
else
    echo "✅ .env.backup file already exists"
fi

echo ""
echo "📁 Creating backup directory..."
mkdir -p backups/database
echo "✅ Created backups/database directory"
echo ""

echo "🔧 Making backup scripts executable..."
chmod +x BACKUP_SUPABASE.sh
chmod +x BACKUP_ALL_DATABASES.sh
echo "✅ Scripts are now executable"
echo ""

echo "🧪 Testing database connection..."
if [ -f ".env.backup" ]; then
    source .env.backup

    if [ -n "$SUPABASE_DB_URL" ]; then
        # Extract connection details
        PGHOST=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        PGPORT=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        PGUSER=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        PGPASSWORD=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
        PGDATABASE=$(echo "$SUPABASE_DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

        export PGPASSWORD

        echo "🔗 Testing connection to: $PGHOST:$PGPORT as $PGUSER"

        if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
            echo "✅ Database connection successful!"
            echo ""
            echo "📊 Quick database info:"
            psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog');" | xargs echo "   Tables found:"
            psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) as functions FROM information_schema.routines WHERE routine_schema NOT IN ('information_schema', 'pg_catalog');" | xargs echo "   Functions found:"
            psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT COUNT(*) as triggers FROM information_schema.triggers WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog');" | xargs echo "   Triggers found:"
            echo ""
        else
            echo "❌ Database connection failed!"
            echo ""
            echo "Troubleshooting:"
            echo "1. Check your SUPABASE_DB_URL in .env.backup"
            echo "2. Ensure your IP is whitelisted in Supabase settings"
            echo "3. Verify your password is correct"
            echo "4. Check if the database is running"
            echo ""
            echo "Current SUPABASE_DB_URL: ${SUPABASE_DB_URL:0:50}..."
            exit 1
        fi
    else
        echo "⚠️  SUPABASE_DB_URL not found in .env.backup"
        echo "Please edit the file and add your database connection string."
    fi
else
    echo "⚠️  .env.backup file not found. Please run setup again."
fi

echo ""
echo "🎉 Setup complete! You can now run backups:"
echo ""
echo "For comprehensive database backup (recommended):"
echo "   ./BACKUP_SUPABASE.sh"
echo ""
echo "For complete cluster backup (all databases):"
echo "   ./BACKUP_ALL_DATABASES.sh"
echo ""
echo "📚 For detailed instructions, see: docs/SUPABASE_BACKUP_GUIDE.md"
echo ""
echo "💡 Pro tip: Add the generated .sql files to your repository for codebase reference!"