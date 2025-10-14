# Supabase Database Setup Instructions

## Current Status ✅

- **Connection**: Supabase client connects successfully
- **Authentication**: Service role key is valid and working
- **Services**: Auth and Storage services are accessible
- **Issue**: Database schema not yet created (tables missing)

## Required Action 🔧

The database schema needs to be created manually through the Supabase Dashboard.

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/editor

### Step 2: Apply Initial Schema Migration

1. Click on "SQL Editor" in the left sidebar
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql` 
4. Paste into the SQL editor
5. Click "Run" to execute

### Step 3: Apply RLS Policies Migration

1. Create another new query
2. Copy the entire contents of `supabase/migrations/002_rls_policies.sql`
3. Paste into the SQL editor  
4. Click "Run" to execute

### Step 4: Verify Setup

Run the verification script to confirm everything is working:

```bash
cd packages/adapters
node src/verify-setup.js
```

## Migration Files Location

- **Initial Schema**: `supabase/migrations/001_initial_schema.sql`
- **RLS Policies**: `supabase/migrations/002_rls_policies.sql`

## Expected Tables After Migration

- `users_profile` - User profiles and account info
- `gigs` - Gig postings
- `applications` - Gig applications  
- `media` - Media files and metadata
- `moodboards` - Gig mood boards
- `moodboard_items` - Individual mood board items
- `messages` - Direct messaging
- `showcases` - Portfolio showcases
- `showcase_media` - Media in showcases
- `reviews` - User reviews
- `subscriptions` - Subscription management
- `reports` - Content reporting

## Custom Types Created

- `user_role` - CONTRIBUTOR, TALENT, ADMIN
- `subscription_tier` - FREE, PLUS, PRO  
- `subscription_status` - ACTIVE, CANCELLED, EXPIRED, TRIAL
- `gig_status` - DRAFT, PUBLISHED, APPLICATIONS_CLOSED, BOOKED, COMPLETED, CANCELLED
- `compensation_type` - TFP, PAID, EXPENSES
- `application_status` - PENDING, SHORTLISTED, ACCEPTED, DECLINED, WITHDRAWN
- `showcase_visibility` - DRAFT, PUBLIC, PRIVATE
- `media_type` - image, video, pdf

## Troubleshooting

If you encounter any errors during migration:

1. Check that all custom types are created first
2. Ensure extensions (uuid-ossp, postgis) are enabled
3. Verify foreign key references are valid
4. Check for any naming conflicts with existing objects

## Next Steps After Migration

Once the schema is applied:

1. ✅ Verify setup with `node src/verify-setup.js`
2. 🏗️ Create and test repository adapters
3. 🔐 Implement authentication adapters
4. 📁 Set up storage adapters
5. 🧪 Write integration tests