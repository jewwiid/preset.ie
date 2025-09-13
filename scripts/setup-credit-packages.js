#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupCreditPackages() {
  console.log('🚀 Setting up Credit Packages...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
    process.exit(1);
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Connected to Supabase database');

    // Create credit_packages table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS credit_packages (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          credits INTEGER NOT NULL,
          price_usd DECIMAL(10,2) NOT NULL,
          stripe_price_id VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          is_popular BOOLEAN DEFAULT false,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
      );

      ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

      CREATE POLICY IF NOT EXISTS "Users can view active credit packages" ON credit_packages
          FOR SELECT USING (is_active = true);
    `;

    console.log('📄 Creating credit_packages table...');
    const { error: tableError } = await supabase.rpc('exec', { sql: createTableSQL });
    
    if (tableError) {
      console.warn('⚠️  Table creation warning:', tableError.message);
    } else {
      console.log('✅ Credit packages table created successfully');
    }

    // Insert sample packages
    const packages = [
      { id: 'starter', name: 'Starter Pack', description: 'Perfect for trying out image enhancements', credits: 10, price_usd: 2.99, is_popular: false, sort_order: 1 },
      { id: 'basic', name: 'Basic Pack', description: 'Great for regular users', credits: 25, price_usd: 6.99, is_popular: false, sort_order: 2 },
      { id: 'popular', name: 'Popular Pack', description: 'Most popular choice - best value', credits: 50, price_usd: 12.99, is_popular: true, sort_order: 3 },
      { id: 'pro', name: 'Pro Pack', description: 'For power users and professionals', credits: 100, price_usd: 24.99, is_popular: false, sort_order: 4 },
      { id: 'enterprise', name: 'Enterprise Pack', description: 'Maximum credits for heavy usage', credits: 250, price_usd: 59.99, is_popular: false, sort_order: 5 }
    ];

    console.log('📦 Inserting sample credit packages...');
    for (const pkg of packages) {
      const { error: insertError } = await supabase
        .from('credit_packages')
        .upsert(pkg, { onConflict: 'id' });

      if (insertError) {
        console.error(`❌ Error inserting package ${pkg.id}:`, insertError.message);
      } else {
        console.log(`✅ Package "${pkg.name}" created/updated`);
      }
    }

    // Verify packages were created
    console.log('\n🔍 Verifying packages...');
    const { data: packagesData, error: selectError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (selectError) {
      console.error('❌ Error verifying packages:', selectError.message);
    } else {
      console.log(`✅ Found ${packagesData.length} active packages:`);
      packagesData.forEach(pkg => {
        console.log(`   • ${pkg.name}: ${pkg.credits} credits for $${pkg.price_usd} ${pkg.is_popular ? '(Popular)' : ''}`);
      });
    }

    console.log('\n🎉 Credit packages setup completed successfully!');
    console.log('💡 You can now test the "Buy Credits" tab in the profile settings.');

  } catch (error) {
    console.error('💥 Error setting up credit packages:', error);
    process.exit(1);
  }
}

// Run the setup
setupCreditPackages();
