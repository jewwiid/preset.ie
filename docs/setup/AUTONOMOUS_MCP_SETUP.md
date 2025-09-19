# Autonomous Supabase MCP Setup

This guide helps you set up the Supabase MCP to work autonomously without manual intervention.

## Quick Setup

### 1. Run the Setup Script
```bash
node setup_autonomous_mcp.js
```

This script will:
- Analyze your current database state
- Identify any issues preventing autonomous operation
- Provide specific instructions for fixing problems

### 2. Apply Manual Fixes (if needed)
If the script identifies issues, follow the provided instructions to:
- Fix the `user_role` enum
- Apply database migrations
- Set up RLS policies

### 3. Verify and Create Test Users
```bash
node verify_and_create_users.js
```

This script will:
- Verify the database is properly configured
- Create test users automatically
- Confirm the MCP can work autonomously

## Available Scripts

### `setup_autonomous_mcp.js`
- **Purpose**: Analyzes database state and provides setup instructions
- **Use when**: First time setup or troubleshooting
- **Output**: Clear instructions for manual fixes if needed

### `verify_and_create_users.js`
- **Purpose**: Verifies setup and creates test users
- **Use when**: After applying manual fixes
- **Output**: Test users ready for development

### `create_users_autonomously.js`
- **Purpose**: Creates test users with fallback handling
- **Use when**: Database is already set up correctly
- **Output**: Test users with error handling

### `check_users.js`
- **Purpose**: Lists existing users in the database
- **Use when**: Checking current user state
- **Output**: User list with details

## Test Users Created

The setup creates these test users:

1. **contributor@test.com** (password: testpass123)
   - Role: Contributor
   - Name: Sarah Johnson
   - Handle: @sarah_photographer

2. **talent@test.com** (password: testpass123)
   - Role: Talent
   - Name: Marcus Chen
   - Handle: @marcus_model

3. **both@test.com** (password: testpass123)
   - Role: Both Contributor & Talent
   - Name: Alex Rivera
   - Handle: @alex_creative

## Troubleshooting

### Common Issues

**"invalid input value for enum user_role"**
- **Cause**: The `user_role` enum doesn't exist or has wrong values
- **Fix**: Run the SQL commands provided by the setup script

**"relation 'users_profile' does not exist"**
- **Cause**: Database migrations haven't been applied
- **Fix**: Apply the initial schema migration

**"Cannot create auth users"**
- **Cause**: Service role key issues or permissions
- **Fix**: Check your `.env` file and Supabase project settings

### Manual SQL Fixes

If you need to fix the enum manually:

```sql
-- Fix the user_role enum
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('CONTRIBUTOR', 'TALENT', 'ADMIN');
```

## After Setup

Once the autonomous setup is complete, you can:

1. **Use the Supabase MCP** to query your database schema
2. **Ask questions** about your data structure
3. **Create and manage users** programmatically
4. **Test your application** with the created test users

## Environment Variables

Make sure your `.env` file contains:

```bash
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-personal-access-token
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Next Steps

After successful setup:
1. Test login with the created users
2. Use the Supabase MCP to explore your database
3. Ask me questions about your schema and data
4. Continue developing your application


