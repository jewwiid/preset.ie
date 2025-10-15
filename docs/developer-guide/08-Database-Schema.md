# Database Schema - Preset Platform

## 🗄️ Database Overview

Preset uses **Supabase (PostgreSQL)** as its primary database, implementing a comprehensive schema designed for scalability, security, and performance. The database follows Domain-Driven Design principles with clear entity relationships and robust Row Level Security (RLS) policies.

## 🏗️ Schema Architecture

### **Core Design Principles**
- **Normalization**: Proper 3NF normalization to avoid data redundancy
- **Performance**: Strategic indexing for frequently queried columns
- **Security**: Row Level Security (RLS) on all tables
- **Scalability**: Designed to handle millions of users and gigs
- **Audit Trail**: Complete audit logging for all operations

### **Database Structure**
```
preset_db/
├── Core Tables (12 tables)
│   ├── users                    # User authentication
│   ├── profiles                 # User profiles
│   ├── gigs                     # Creative gigs
│   ├── applications             # Talent applications
│   ├── showcases                # Portfolio items
│   ├── reviews                  # User reviews
│   ├── messages                 # Per-gig messaging
│   ├── conversations            # Message threads
│   ├── media                    # File storage metadata
│   ├── moodboards               # Visual inspiration
│   ├── subscriptions            # Subscription management
│   └── reports                  # Content moderation
├── AI & Credits (6 tables)
│   ├── platform_credits         # Platform AI credits
│   ├── user_credits             # User credit balances
│   ├── credit_packages          # Credit marketplace
│   ├── credit_transactions      # Credit usage logs
│   ├── ai_enhancements          # AI enhancement history
│   └── source_images            # Source image tracking
├── Safety & Moderation (4 tables)
│   ├── content_moderation_log    # Moderation audit trail
│   ├── user_content_preferences # Content filtering
│   ├── user_image_type_library  # Custom image types
│   └── verification_requests    # ID verification
└── System Tables (3 tables)
    ├── domain_events            # Event sourcing
    ├── notifications            # Push/email notifications
    └── audit_logs               # System audit trail
```

## 👥 User Management Tables

### **users**
Core user authentication and subscription data.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('talent', 'contributor', 'admin')),
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'email_verified', 'phone_verified', 'id_verified')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'pro')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'unpaid')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    subscription_started_at TIMESTAMPTZ,
    subscription_expires_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
```

### **profiles**
Extended user profile information.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    handle TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    city TEXT,
    country TEXT,
    style_tags TEXT[] DEFAULT '{}',
    looking_for_types TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    equipment TEXT[] DEFAULT '{}',
    portfolio_urls TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    profile_completion_percentage INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    verification_badge TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_handle ON profiles(handle);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_style_tags ON profiles USING GIN(style_tags);
CREATE INDEX idx_profiles_looking_for_types ON profiles USING GIN(looking_for_types);
CREATE INDEX idx_profiles_completion ON profiles(profile_completion_percentage);
```

## 🎬 Gig Management Tables

### **gigs**
Creative gig postings and management.

```sql
CREATE TABLE gigs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    comp_type TEXT NOT NULL CHECK (comp_type IN ('tfp', 'paid', 'expenses')),
    comp_amount DECIMAL(10,2),
    comp_currency TEXT DEFAULT 'EUR',
    location_text TEXT NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_radius INTEGER DEFAULT 10,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    application_deadline TIMESTAMPTZ,
    max_applicants INTEGER DEFAULT 20,
    usage_rights TEXT,
    safety_notes TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'completed', 'cancelled')),
    boost_level INTEGER DEFAULT 0,
    moodboard_id UUID REFERENCES moodboards(id),
    looking_for_types TEXT[] DEFAULT '{}',
    applicant_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gigs_owner_user_id ON gigs(owner_user_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_location ON gigs USING GIST(ST_Point(location_lng, location_lat));
CREATE INDEX idx_gigs_comp_type ON gigs(comp_type);
CREATE INDEX idx_gigs_start_time ON gigs(start_time);
CREATE INDEX idx_gigs_application_deadline ON gigs(application_deadline);
CREATE INDEX idx_gigs_boost_level ON gigs(boost_level);
CREATE INDEX idx_gigs_looking_for_types ON gigs USING GIN(looking_for_types);
```

### **applications**
Talent applications to gigs.

```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    applicant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'accepted', 'declined', 'withdrawn')),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    profile_snapshot JSONB,
    compatibility_score DECIMAL(3,2),
    
    UNIQUE(gig_id, applicant_user_id)
);

-- Indexes
CREATE INDEX idx_applications_gig_id ON applications(gig_id);
CREATE INDEX idx_applications_applicant_user_id ON applications(applicant_user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applied_at ON applications(applied_at);
CREATE INDEX idx_applications_compatibility_score ON applications(compatibility_score);
```

## 🎨 Portfolio & Showcase Tables

### **showcases**
Collaborative portfolio items from completed gigs.

```sql
CREATE TABLE showcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    creator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    talent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_ids UUID[] NOT NULL,
    caption TEXT,
    tags TEXT[] DEFAULT '{}',
    palette TEXT[] DEFAULT '{}',
    approved_by_creator_at TIMESTAMPTZ,
    approved_by_talent_at TIMESTAMPTZ,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_showcases_gig_id ON showcases(gig_id);
CREATE INDEX idx_showcases_creator_user_id ON showcases(creator_user_id);
CREATE INDEX idx_showcases_talent_user_id ON showcases(talent_user_id);
CREATE INDEX idx_showcases_visibility ON showcases(visibility);
CREATE INDEX idx_showcases_tags ON showcases USING GIN(tags);
CREATE INDEX idx_showcases_created_at ON showcases(created_at);
```

### **media**
File storage metadata and management.

```sql
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    showcase_id UUID REFERENCES showcases(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document')),
    bucket TEXT NOT NULL,
    path TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT,
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- for videos
    palette TEXT[] DEFAULT '{}',
    blurhash TEXT,
    exif_data JSONB,
    generation_metadata JSONB,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_owner_user_id ON media(owner_user_id);
CREATE INDEX idx_media_gig_id ON media(gig_id);
CREATE INDEX idx_media_showcase_id ON media(showcase_id);
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_visibility ON media(visibility);
CREATE INDEX idx_media_created_at ON media(created_at);
```

## 💬 Communication Tables

### **conversations**
Per-gig message threads.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    participants UUID[] NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'archived')),
    last_message_at TIMESTAMPTZ,
    last_message_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_gig_id ON conversations(gig_id);
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);
```

### **messages**
Individual messages within conversations.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
CREATE INDEX idx_messages_read_at ON messages(read_at);
```

## ⭐ Review & Rating Tables

### **reviews**
Mutual reviews after completed gigs.

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    tags TEXT[] DEFAULT '{}',
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(gig_id, reviewer_id, reviewee_id)
);

-- Indexes
CREATE INDEX idx_reviews_gig_id ON reviews(gig_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
```

## 🎨 Creative Tools Tables

### **moodboards**
Visual inspiration boards for gigs.

```sql
CREATE TABLE moodboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    items JSONB DEFAULT '[]',
    palette TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_moodboards_gig_id ON moodboards(gig_id);
CREATE INDEX idx_moodboards_owner_user_id ON moodboards(owner_user_id);
CREATE INDEX idx_moodboards_is_public ON moodboards(is_public);
CREATE INDEX idx_moodboards_created_at ON moodboards(created_at);
```

## 💳 Subscription & Payment Tables

### **subscriptions**
User subscription management.

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'plus', 'pro')),
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);
```

## 🤖 AI & Credit Tables

### **platform_credits**
Platform AI credit management.

```sql
CREATE TABLE platform_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    current_balance DECIMAL(15,2) DEFAULT 0,
    low_balance_threshold DECIMAL(15,2) DEFAULT 100,
    credit_ratio DECIMAL(5,2) DEFAULT 1.0,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider)
);

-- Indexes
CREATE INDEX idx_platform_credits_provider ON platform_credits(provider);
CREATE INDEX idx_platform_credits_current_balance ON platform_credits(current_balance);
```

### **user_credits**
User credit balances and transactions.

```sql
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_balance INTEGER DEFAULT 0,
    total_purchased INTEGER DEFAULT 0,
    total_used INTEGER DEFAULT 0,
    last_purchase_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_current_balance ON user_credits(current_balance);
```

### **credit_transactions**
Detailed credit usage tracking.

```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    operation_type TEXT,
    operation_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_transaction_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_operation_type ON credit_transactions(operation_type);
```

## 🛡️ Safety & Moderation Tables

### **reports**
Content moderation and reporting system.

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('user', 'gig', 'message', 'showcase', 'review')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_reporter_user_id ON reports(reporter_user_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_content_type ON reports(content_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
```

### **user_content_preferences**
User content filtering preferences.

```sql
CREATE TABLE user_content_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allow_nsfw_content BOOLEAN DEFAULT false,
    show_nsfw_warnings BOOLEAN DEFAULT true,
    auto_hide_nsfw BOOLEAN DEFAULT true,
    content_filter_level TEXT DEFAULT 'moderate' CHECK (content_filter_level IN ('strict', 'moderate', 'lenient')),
    blocked_categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_content_preferences_user_id ON user_content_preferences(user_id);
CREATE INDEX idx_user_content_preferences_allow_nsfw ON user_content_preferences(allow_nsfw_content);
```

## 🔒 Row Level Security (RLS)

### **RLS Policies Overview**

#### **Users Table**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

#### **Gigs Table**
```sql
-- Anyone can view published gigs
CREATE POLICY "Anyone can view published gigs" ON gigs
    FOR SELECT USING (status = 'published');

-- Owners can view their own gigs
CREATE POLICY "Owners can view own gigs" ON gigs
    FOR SELECT USING (auth.uid() = owner_user_id);

-- Owners can update their own gigs
CREATE POLICY "Owners can update own gigs" ON gigs
    FOR UPDATE USING (auth.uid() = owner_user_id);

-- Owners can delete their own gigs
CREATE POLICY "Owners can delete own gigs" ON gigs
    FOR DELETE USING (auth.uid() = owner_user_id);
```

#### **Applications Table**
```sql
-- Applicants can view their own applications
CREATE POLICY "Applicants can view own applications" ON applications
    FOR SELECT USING (auth.uid() = applicant_user_id);

-- Gig owners can view applications to their gigs
CREATE POLICY "Gig owners can view applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM gigs 
            WHERE id = gig_id AND owner_user_id = auth.uid()
        )
    );

-- Applicants can create applications
CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = applicant_user_id);
```

### **RLS Best Practices**

#### **Policy Naming Convention**
- **Format**: `"[Action] [Resource] [Condition]"`
- **Examples**: 
  - `"Users can view own profile"`
  - `"Anyone can view published gigs"`
  - `"Admins can manage all content"`

#### **Policy Testing**
```sql
-- Test RLS policies
SET row_security = on;
SET role authenticated;

-- Test user can only see own data
SELECT * FROM users WHERE id = auth.uid();

-- Test user cannot see other users' data
SELECT * FROM users WHERE id != auth.uid();
```

## 📊 Performance Optimization

### **Strategic Indexing**

#### **Composite Indexes**
```sql
-- Gig discovery optimization
CREATE INDEX idx_gigs_discovery ON gigs(status, start_time, location_lat, location_lng)
WHERE status = 'published';

-- Application management optimization
CREATE INDEX idx_applications_management ON applications(gig_id, status, applied_at)
WHERE status IN ('pending', 'shortlisted');

-- User activity optimization
CREATE INDEX idx_user_activity ON users(last_login_at, subscription_tier)
WHERE last_login_at > NOW() - INTERVAL '30 days';
```

#### **Partial Indexes**
```sql
-- Only index active subscriptions
CREATE INDEX idx_active_subscriptions ON subscriptions(user_id, tier)
WHERE status = 'active';

-- Only index published gigs
CREATE INDEX idx_published_gigs ON gigs(owner_user_id, created_at)
WHERE status = 'published';

-- Only index unread messages
CREATE INDEX idx_unread_messages ON messages(to_user_id, sent_at)
WHERE read_at IS NULL;
```

### **Query Optimization**

#### **Common Query Patterns**
```sql
-- Gig discovery with location filtering
SELECT g.*, p.display_name, p.avatar_url, p.rating
FROM gigs g
JOIN profiles p ON g.owner_user_id = p.user_id
WHERE g.status = 'published'
  AND g.start_time > NOW()
  AND ST_DWithin(
    ST_Point(g.location_lng, g.location_lat),
    ST_Point($1, $2),
    g.location_radius * 1000
  )
ORDER BY g.boost_level DESC, g.created_at DESC
LIMIT 20;

-- User applications with gig details
SELECT a.*, g.title, g.status as gig_status, g.start_time
FROM applications a
JOIN gigs g ON a.gig_id = g.id
WHERE a.applicant_user_id = $1
ORDER BY a.applied_at DESC;
```

## 🔄 Database Migrations

### **Migration Strategy**

#### **Migration Files**
```sql
-- Migration: 001_create_users_table.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('talent', 'contributor', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: 002_add_subscription_fields.sql
ALTER TABLE users 
ADD COLUMN subscription_tier TEXT DEFAULT 'free',
ADD COLUMN stripe_customer_id TEXT UNIQUE;
```

#### **Migration Commands**
```bash
# Create new migration
npx supabase migration new add_new_feature

# Apply migrations
npx supabase db push

# Rollback migration
npx supabase db rollback

# Check migration status
npx supabase migration list
```

### **Data Seeding**

#### **Seed Data**
```sql
-- Seed admin user
INSERT INTO users (id, email, role, subscription_tier) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@preset.ie', 'admin', 'pro');

-- Seed test users
INSERT INTO users (id, email, role, subscription_tier) VALUES
('00000000-0000-0000-0000-000000000002', 'talent@example.com', 'talent', 'plus'),
('00000000-0000-0000-0000-000000000003', 'contributor@example.com', 'contributor', 'pro');
```

## 🔍 Database Monitoring

### **Performance Monitoring**

#### **Query Performance**
```sql
-- Slow query analysis
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage analysis
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### **Database Health**
```sql
-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Connection monitoring
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

### **Backup & Recovery**

#### **Backup Strategy**
```bash
# Daily backups
pg_dump preset_db > backup_$(date +%Y%m%d).sql

# Point-in-time recovery setup
# Configure WAL archiving
# Set up continuous archiving
```

#### **Recovery Procedures**
```bash
# Restore from backup
psql preset_db < backup_20240101.sql

# Point-in-time recovery
pg_basebackup -D /backup/location -Ft -z -P
```

---

This comprehensive database schema provides a robust foundation for Preset's growth while maintaining performance, security, and scalability. The design supports all platform features while ensuring data integrity and user privacy.
