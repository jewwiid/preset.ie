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
