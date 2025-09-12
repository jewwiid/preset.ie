# Supabase MCP Setup Guide

## Prerequisites
1. Supabase project created at [supabase.com](https://supabase.com)
2. Personal Access Token from Supabase Dashboard

## Setup Steps

### 1. Get Your Supabase Project Reference
- Go to your Supabase project dashboard
- The project reference is in your project URL: `https://app.supabase.com/project/YOUR-PROJECT-REF`
- Or find it in Settings → General → Reference ID

### 2. Generate Personal Access Token
1. Go to [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
2. Click "Generate new token"
3. Give it a name like "Preset MCP Access"
4. Copy the token (save it securely)

### 3. Configure Environment Variables
```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
SUPABASE_PROJECT_REF=your-actual-project-ref
SUPABASE_ACCESS_TOKEN=your-actual-personal-access-token
```

### 4. Test MCP Connection
The Supabase MCP server will now be available in Claude Code with:
- Read-only access to your database schema
- Ability to query table structures
- Access to RLS policies
- View migration history

### 5. Available MCP Features
Once configured, you can:
- Ask about database schema
- Query table relationships
- Understand RLS policy configurations  
- Get insights about data structure
- Plan database changes

## Security Notes
- The MCP server is configured as **read-only**
- Personal Access Tokens should be kept secure
- Never commit `.env` files to version control
- Use different tokens for development vs production

## Troubleshooting

### Token Issues
```bash
# Verify token works
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.supabase.com/v1/projects
```

### Connection Issues
- Ensure project reference is correct
- Check if token has necessary permissions
- Verify network connectivity to Supabase

### MCP Not Working
- Restart Claude Code after configuration changes
- Check `.clauderc` file syntax is valid JSON
- Ensure environment variables are set correctly