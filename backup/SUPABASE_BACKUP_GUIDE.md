# Supabase Database Backup Guide

This guide provides comprehensive backup solutions for your Supabase database, including all tables, triggers, functions, and schema definitions that your codebase needs to reference.

## 🚀 Quick Start - Choose Your Method

### Method 1: Interactive Backup Manager (Recommended)
```bash
# Run the interactive backup manager with menu interface
./BACKUP_MANAGER.sh
```

### Method 2: Supabase API Backup (Official Method)
```bash
# 1. Setup environment
cp .env.backup.example .env.backup
nano .env.backup  # Add your access token and project ref

# 2. Run API backup
chmod +x SUPABASE_API_BACKUP.sh
source .env.backup && ./SUPABASE_API_BACKUP.sh create
```

### Method 3: pg_dump Logical Backup
```bash
# 1. Setup environment for pg_dump
cp .env.backup.example .env.backup
nano .env.backup  # Add your database connection string

# 2. Run logical backup
chmod +x BACKUP_SUPABASE.sh
source .env.backup && ./BACKUP_SUPABASE.sh
```

### Option 2: Complete Cluster Backup (Advanced)

```bash
# For backing up ALL databases on the server
chmod +x BACKUP_ALL_DATABASES.sh
source .env.backup && ./BACKUP_ALL_DATABASES.sh
```

## Getting Your Supabase Credentials

### For API Backups:
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project Reference** (e.g., `abc123-def456`)
5. Go to your [Account](https://supabase.com/dashboard/account/tokens)
6. Create a new access token with full permissions

### For pg_dump Backups:
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **Connection string**
5. Copy the **URI** connection string
6. Your connection string will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abc123.supabase.co:5432/postgres
   ```

## 🌐 Supabase API Backup Methods (Official)

### SUPABASE_API_BACKUP.sh (Native API Method)

**Purpose**: Uses Supabase's official API for backup operations

**Advantages**:
- ✅ Official Supabase method
- ✅ Automatic PITR (Point-in-Time Recovery)
- ✅ Managed by Supabase
- ✅ Fast and reliable
- ✅ Includes all database objects

**Commands Available**:
```bash
# List all backups
./SUPABASE_API_BACKUP.sh list

# Create on-demand backup
./SUPABASE_API_BACKUP.sh create

# Get backup status
./SUPABASE_API_BACKUP.sh status <backup_id>

# Point-in-Time Recovery
./SUPABASE_API_BACKUP.sh pitr <unix_timestamp>

# List recent restorable points
./SUPABASE_API_BACKUP.sh restorable

# Monitor backup progress
./SUPABASE_API_BACKUP.sh monitor <backup_id>

# Setup scheduled backups
./SUPABASE_API_BACKUP.sh schedule

# Show statistics
./SUPABASE_API_BACKUP.sh stats

# Validate API access
./SUPABASE_API_BACKUP.sh validate
```

### BACKUP_MANAGER.sh (Interactive Dashboard)

**Purpose**: Interactive menu-driven backup management

**Features**:
- 🎯 Menu-driven interface
- 🔧 Multiple backup methods
- 📊 Backup statistics
- 🔄 PITR recovery
- ⚙️ Configuration setup
- 🧪 Connection testing
- 🚀 Comprehensive backup (all methods)

**Usage**:
```bash
# Run interactive menu
./BACKUP_MANAGER.sh

# Direct commands
./BACKUP_MANAGER.sh comprehensive  # Run all backup methods
./BACKUP_MANAGER.sh stats          # Show statistics
./BACKUP_MANAGER.sh pitr           # Point-in-Time Recovery
./BACKUP_MANAGER.sh setup          # Setup configuration
```

### Configuration for API Backups

Create `.env.backup`:
```bash
# Supabase API Configuration
SUPABASE_ACCESS_TOKEN=your-access-token-here
PROJECT_REF=your-project-ref-here

# Database Connection (for pg_dump)
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Project Configuration
PROJECT_NAME=preset
BACKUP_DIR=./backups/database
```

## Backup Scripts Overview

### BACKUP_SUPABASE.sh (Recommended)

**Purpose**: Backs up your specific Supabase database comprehensively

**Backups Created**:
- `complete_backup_TIMESTAMP.sql` - Full database (schema + data)
- `schema_only_TIMESTAMP.sql` - Schema definition only
- `data_only_TIMESTAMP.sql` - Data only (no schema)
- `functions_triggers_TIMESTAMP.sql` - Functions and triggers only
- `auth_schema_TIMESTAMP.sql` - Supabase auth schema (if exists)
- `storage_schema_TIMESTAMP.sql` - Supabase storage schema (if exists)
- `schema_documentation_TIMESTAMP.md` - Human-readable schema documentation
- `backup_summary_TIMESTAMP.txt` - Backup summary and restore instructions

### BACKUP_ALL_DATABASES.sh (Advanced)

**Purpose**: Uses `pg_dumpall` to back up ALL databases on the server

**Backups Created**:
- `complete_cluster_TIMESTAMP.sql` - All databases, roles, tablespaces
- `cluster_schema_only_TIMESTAMP.sql` - Schema for all databases
- `roles_only_TIMESTAMP.sql` - Database roles and permissions
- `tablespaces_only_TIMESTAMP.sql` - Tablespaces definition
- `database_info_TIMESTAMP.txt` - Complete server information
- `restore_instructions_TIMESTAMP.md` - Detailed restore guide

## 📊 Backup Method Comparison

| Feature | Supabase API | pg_dump Logical | pg_dumpall Cluster |
|---------|--------------|-----------------|-------------------|
| **Official** | ✅ Yes | ❌ No | ❌ No |
| **PITR Support** | ✅ Built-in | ❌ No | ❌ No |
| **Speed** | 🚀 Fast | 📊 Medium | 🐌 Slow |
| **Portability** | ✅ Cloud only | ✅ Anywhere | ✅ Anywhere |
| **Schema Details** | ✅ Complete | ✅ Complete | ✅ Complete |
| **Data Included** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Automation** | ✅ API-based | ⚙️ Script-based | ⚙️ Script-based |
| **Cost** | Included | Free | Free |
| **Management** | Dashboard | Manual | Manual |

### Recommended Strategy

1. **Primary**: Use Supabase API for regular automated backups
2. **Secondary**: Use pg_dump for schema documentation and development
3. **Comprehensive**: Use BACKUP_MANAGER.sh for complete coverage

## 🔄 Point-in-Time Recovery (PITR)

### Using Supabase API (Recommended)
```bash
# List restorable points
./SUPABASE_API_BACKUP.sh restorable

# Restore to 24 hours ago
./SUPABASE_API_BACKUP.sh pitr $(date -d '24 hours ago' +%s) "24-hour rollback"

# Restore to specific timestamp
./SUPABASE_API_BACKUP.sh pitr 1735689600 "Emergency restore"

# Monitor restore progress
./SUPABASE_API_BACKUP.sh monitor <backup_id>
```

### Using Interactive Manager
```bash
./BACKUP_MANAGER.sh
# Choose option 5 for PITR Recovery
```

### Important Notes for PITR:
- ⚠️ **WARNING**: PITR overwrites your current database
- 🕒 **Time Range**: Up to 30 days back (Supabase default)
- 💾 **Impact**: All data is restored to the specified time
- 🔒 **Permissions**: Requires API access with database permissions

## Using the Backups in Your Codebase

### 1. Add SQL Files to Your Repository

```bash
# Add the schema files to your repository (not the data)
git add backups/database/schema_only_YYYYMMDD_HHMMSS.sql
git add backups/database/functions_triggers_YYYYMMDD_HHMMSS.sql
git add backups/database/schema_documentation_YYYYMMDD_HHMMSS.md
git commit -m "Add database schema documentation"
```

### 2. Reference in Code

```typescript
// Example: Referencing table structure in your TypeScript types
import schemaDocumentation from '../../backups/database/schema_documentation_latest.md'

// Or use the SQL files for migrations
import tableSchema from '../../backups/database/schema_only_latest.sql'
```

### 3. Create Type Definitions

Based on your schema documentation, create TypeScript interfaces:

```typescript
// Example types based on your actual schema
export interface UserProfile {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  account_type: string[]
  created_at: string
  updated_at: string
}

export interface Gig {
  id: string
  title: string
  description: string
  budget_range?: string
  creator_id: string
  created_at: string
  status: 'active' | 'completed' | 'cancelled'
}
```

## Restoration

### Test Restore (Development)

```bash
# Create a test database first
createdb preset_test

# Restore schema only (recommended for testing)
psql -d preset_test < backups/database/schema_only_YYYYMMDD_HHMMSS.sql

# Verify the restore
psql -d preset_test -c "\dt"  # List tables
psql -d preset_test -c "\df"  # List functions
```

### Full Restore (Production)

```bash
# ⚠️ WARNING: This will overwrite existing data!
# Always backup current state first!

psql -d [YOUR_DATABASE] < backups/database/complete_backup_YYYYMMDD_HHMMSS.sql
```

## Automated Backups

### Using Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && source .env.backup && ./BACKUP_SUPABASE.sh

# Add weekly complete backup
0 3 * * 0 cd /path/to/project && source .env.backup && ./BACKUP_ALL_DATABASES.sh
```

### Using GitHub Actions

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PostgreSQL
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Run Backup
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          chmod +x BACKUP_SUPABASE.sh
          ./BACKUP_SUPABASE.sh

      - name: Store Backup Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backups/database/
          retention-days: 30
```

## Troubleshooting

### Common Issues

#### 1. Connection Failed
```
Error: connection to server failed
```
**Solution**: Check your connection string and ensure your IP is whitelisted in Supabase.

#### 2. Permission Denied
```
Error: permission denied for relation
```
**Solution**: Ensure you're using the correct database user with sufficient privileges.

#### 3. pg_dump not found
```
Error: command not found: pg_dump
```
**Solution**: Install PostgreSQL client tools:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

#### 4. Password Authentication Failed
```
Error: password authentication failed
```
**Solution**: Verify your password and ensure it doesn't contain special characters that need escaping.

### Debug Mode

Enable debug output by adding `-v` to pg_dump commands:

```bash
pg_dump -v "$SUPABASE_DB_URL" > backup.sql
```

## Best Practices

1. **Regular Backups**: Schedule automated backups daily
2. **Offsite Storage**: Store backups in multiple locations
3. **Test Restores**: Regularly test your backup restoration process
4. **Documentation**: Keep your backup procedures documented
5. **Version Control**: Add schema files (not data) to version control
6. **Security**: Secure your backup files with appropriate permissions
7. **Monitoring**: Monitor backup success/failure and set up alerts

## File Structure

```
backups/database/
├── complete_backup_20231215_143022.sql.gz
├── schema_only_20231215_143022.sql.gz
├── functions_triggers_20231215_143022.sql.gz
├── schema_documentation_20231215_143022.md
├── backup_summary_20231215_143022.txt
└── archive/
    ├── 2023-12-14/
    └── 2023-12-13/
```

## Integration with Development Workflow

### 1. Schema-Driven Development

Use your schema documentation to drive development:

```bash
# Generate TypeScript types from schema
npm run generate-types

# Validate data against schema
npm run validate-schema
```

### 2. Migration Management

Keep your schema files as the source of truth:

```bash
# Compare current schema with backup
diff current_schema.sql backups/database/schema_only_latest.sql

# Generate migration from differences
npm run generate-migration
```

### 3. Testing Data

Create test data based on your schema:

```bash
# Generate test fixtures from schema
npm run generate-fixtures

# Load test data for testing
npm run load-test-data
```

## Support

If you encounter issues:

1. Check the [PostgreSQL Documentation](https://www.postgresql.org/docs/current/app-pg-dump.html)
2. Review [Supabase Backup Guide](https://supabase.com/docs/guides/database/backups)
3. Check the generated log files in your backup directory
4. Ensure you have the latest versions of PostgreSQL client tools

---

**Remember**: Your database backups are critical! Test your backup and restore procedures regularly and store backups securely.