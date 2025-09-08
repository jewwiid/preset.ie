#!/usr/bin/env node

// Setup database schema
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from root .env file
const rootDir = path.resolve(__dirname, '../../../');
const envPath = path.join(rootDir, '.env');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
} catch (error) {
  console.error('❌ Could not load .env file:', error.message);
  process.exit(1);
}

async function setupDatabase() {
  console.log('🗄️ Setting up Preset database schema...\n');

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    console.log('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create admin client
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    console.log('📋 Creating database schema...\n');

    // 1. Enable extensions
    console.log('🔧 Enabling extensions...');
    const { error: uuidError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    });
    if (uuidError) {
      console.log(`ℹ️  UUID extension: ${uuidError.message}`);
    } else {
      console.log('✅ UUID extension enabled');
    }

    // 2. Create custom types
    console.log('\n📝 Creating custom types...');
    const customTypes = [
      `CREATE TYPE user_role AS ENUM ('talent', 'contributor', 'admin');`,
      `CREATE TYPE subscription_tier AS ENUM ('free', 'plus', 'pro');`,
      `CREATE TYPE gig_status AS ENUM ('draft', 'open', 'closed', 'booked', 'completed', 'cancelled');`,
      `CREATE TYPE application_status AS ENUM ('pending', 'shortlisted', 'declined', 'accepted', 'withdrawn');`,
      `CREATE TYPE compensation_type AS ENUM ('tfp', 'paid', 'expenses');`,
      `CREATE TYPE media_type AS ENUM ('image', 'video', 'pdf');`,
      `CREATE TYPE media_visibility AS ENUM ('private', 'public', 'showcase');`
    ];

    for (const typeSQL of customTypes) {
      const { error } = await supabase.rpc('exec_sql', { sql: typeSQL });
      if (error && !error.message.includes('already exists')) {
        console.log(`❌ Type creation failed: ${error.message}`);
      } else {
        const typeName = typeSQL.match(/CREATE TYPE (\w+)/)?.[1];
        console.log(`✅ Type ${typeName} created`);
      }
    }

    // 3. Create tables
    console.log('\n🏗️ Creating tables...');

    // Users profile table
    const usersProfileSQL = `
      CREATE TABLE IF NOT EXISTS users_profile (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        display_name TEXT NOT NULL,
        handle TEXT UNIQUE NOT NULL,
        avatar_url TEXT,
        bio TEXT,
        city TEXT,
        role_flags user_role[] NOT NULL DEFAULT '{talent}',
        style_tags TEXT[] DEFAULT '{}',
        subscription_tier subscription_tier NOT NULL DEFAULT 'free',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT handle_format CHECK (handle ~ '^[a-zA-Z0-9_]{3,30}$')
      );
    `;

    const { error: profileError } = await supabase.rpc('exec_sql', { sql: usersProfileSQL });
    if (profileError && !profileError.message.includes('already exists')) {
      console.log(`❌ Users profile table failed: ${profileError.message}`);
    } else {
      console.log('✅ Users profile table created');
    }

    // Gigs table
    const gigsSQL = `
      CREATE TABLE IF NOT EXISTS gigs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        purpose TEXT,
        comp_type compensation_type NOT NULL DEFAULT 'tfp',
        location_text TEXT,
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        radius_m INTEGER,
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        application_deadline TIMESTAMP WITH TIME ZONE,
        max_applicants INTEGER DEFAULT 50,
        usage_rights TEXT,
        safety_notes TEXT,
        status gig_status NOT NULL DEFAULT 'draft',
        boost_level INTEGER DEFAULT 0,
        style_tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: gigsError } = await supabase.rpc('exec_sql', { sql: gigsSQL });
    if (gigsError && !gigsError.message.includes('already exists')) {
      console.log(`❌ Gigs table failed: ${gigsError.message}`);
    } else {
      console.log('✅ Gigs table created');
    }

    // Applications table
    const applicationsSQL = `
      CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE NOT NULL,
        applicant_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
        note TEXT,
        status application_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(gig_id, applicant_user_id)
      );
    `;

    const { error: appsError } = await supabase.rpc('exec_sql', { sql: applicationsSQL });
    if (appsError && !appsError.message.includes('already exists')) {
      console.log(`❌ Applications table failed: ${appsError.message}`);
    } else {
      console.log('✅ Applications table created');
    }

    // Media table
    const mediaSQL = `
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
        gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
        type media_type NOT NULL,
        bucket TEXT NOT NULL,
        path TEXT NOT NULL,
        filename TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        duration INTEGER,
        palette TEXT[],
        blurhash TEXT,
        exif_json JSONB,
        visibility media_visibility NOT NULL DEFAULT 'private',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: mediaError } = await supabase.rpc('exec_sql', { sql: mediaSQL });
    if (mediaError && !mediaError.message.includes('already exists')) {
      console.log(`❌ Media table failed: ${mediaError.message}`);
    } else {
      console.log('✅ Media table created');
    }

    // Messages table
    const messagesSQL = `
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE NOT NULL,
        from_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
        to_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
        body TEXT NOT NULL,
        attachments UUID[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE
      );
    `;

    const { error: messagesError } = await supabase.rpc('exec_sql', { sql: messagesSQL });
    if (messagesError && !messagesError.message.includes('already exists')) {
      console.log(`❌ Messages table failed: ${messagesError.message}`);
    } else {
      console.log('✅ Messages table created');
    }

    // Showcases table
    const showcasesSQL = `
      CREATE TABLE IF NOT EXISTS showcases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE NOT NULL,
        creator_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
        talent_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
        media_ids UUID[] NOT NULL DEFAULT '{}',
        caption TEXT,
        tags TEXT[] DEFAULT '{}',
        palette TEXT[],
        approved_by_creator_at TIMESTAMP WITH TIME ZONE,
        approved_by_talent_at TIMESTAMP WITH TIME ZONE,
        visibility media_visibility NOT NULL DEFAULT 'private',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: showcasesError } = await supabase.rpc('exec_sql', { sql: showcasesSQL });
    if (showcasesError && !showcasesError.message.includes('already exists')) {
      console.log(`❌ Showcases table failed: ${showcasesError.message}`);
    } else {
      console.log('✅ Showcases table created');
    }

    // Subscriptions table
    const subscriptionsSQL = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
        tier subscription_tier NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: subscriptionsError } = await supabase.rpc('exec_sql', { sql: subscriptionsSQL });
    if (subscriptionsError && !subscriptionsError.message.includes('already exists')) {
      console.log(`❌ Subscriptions table failed: ${subscriptionsError.message}`);
    } else {
      console.log('✅ Subscriptions table created');
    }

    // 4. Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_profile_handle ON users_profile(handle);',
      'CREATE INDEX IF NOT EXISTS idx_users_profile_user_id ON users_profile(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_gigs_owner ON gigs(owner_user_id);',
      'CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);',
      'CREATE INDEX IF NOT EXISTS idx_gigs_location ON gigs(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_applications_gig ON applications(gig_id);',
      'CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(applicant_user_id);',
      'CREATE INDEX IF NOT EXISTS idx_media_owner ON media(owner_user_id);',
      'CREATE INDEX IF NOT EXISTS idx_media_gig ON media(gig_id);',
      'CREATE INDEX IF NOT EXISTS idx_messages_gig ON messages(gig_id);'
    ];

    for (const indexSQL of indexes) {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (error && !error.message.includes('already exists')) {
        console.log(`❌ Index creation failed: ${error.message}`);
      } else {
        const indexName = indexSQL.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1];
        console.log(`✅ Index ${indexName} created`);
      }
    }

    console.log('\n🎉 Database schema setup completed!');

    // 5. Verify tables exist
    console.log('\n✅ Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log(`❌ Could not verify tables: ${tablesError.message}`);
    } else {
      const tableNames = tables.map(t => t.table_name);
      const expectedTables = ['users_profile', 'gigs', 'applications', 'media', 'messages', 'showcases', 'subscriptions'];
      
      expectedTables.forEach(tableName => {
        if (tableNames.includes(tableName)) {
          console.log(`✅ Table ${tableName} exists`);
        } else {
          console.log(`❌ Table ${tableName} missing`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

console.log('🚀 Starting database setup...\n');
setupDatabase().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});