# Database Schema Documentation

**Generated:** Thu Oct 16 23:01:54 IST 2025
**Project:** preset
**Folder:** 2025-10-16_23-01-54

## Table Structure Queries

Use these SQL queries to inspect your database:

```sql
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
```

## Schema Information

- **Database:** PostgreSQL (Supabase)
- **Common Schemas:** public, auth, storage, extensions
- **Access:** Via Supabase Dashboard or direct connection

## Restore Methods

1. **Supabase Dashboard** (Recommended):
   - Go to Database → Backups
   - Select backup date and click "Restore"

2. **SQL Import**:
   - Use `psql` command line tool
   - Import via database GUI tools

## Notes

- Always test restores on development environment first
- Supabase maintains automatic backups
- Consider enabling Point-in-Time Recovery (PITR) for critical data

