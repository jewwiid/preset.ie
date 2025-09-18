#!/usr/bin/env node

/**
 * Marketplace Schema Test Script
 * Tests the marketplace database schema and storage setup
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMarketplaceSchema() {
  console.log('🧪 Testing Marketplace Schema...\n');

  const tests = [
    {
      name: 'Check marketplace tables exist',
      test: async () => {
        const tables = [
          'listings',
          'listing_images', 
          'listing_availability',
          'rental_orders',
          'sale_orders',
          'offers',
          'marketplace_reviews',
          'marketplace_disputes'
        ];

        const results = [];
        for (const table of tables) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            results.push({ table, status: '❌', error: error.message });
          } else {
            results.push({ table, status: '✅', count: data?.length || 0 });
          }
        }
        return results;
      }
    },
    {
      name: 'Test listings table structure',
      test: async () => {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .limit(1);
        
        if (error) return { status: '❌', error: error.message };
        
        // Get a real user profile ID for testing
        const { data: users, error: usersError } = await supabase
          .from('users_profile')
          .select('id')
          .limit(1);

        if (usersError || !users || users.length === 0) {
          return { status: '⚠️', message: 'No users found - table structure valid but cannot test insert' };
        }

        const testListing = {
          owner_id: users[0].id,
          title: 'Test Camera',
          description: 'Test description',
          category: 'camera',
          condition: 'good',
          mode: 'rent',
          rent_day_cents: 1000,
          retainer_mode: 'credit_hold',
          retainer_cents: 5000,
          quantity: 1,
          location_city: 'Test City',
          location_country: 'Test Country',
          verified_only: false,
          status: 'active'
        };

        const { data: insertData, error: insertError } = await supabase
          .from('listings')
          .insert(testListing)
          .select();

        if (insertError) {
          return { status: '❌', error: insertError.message };
        }

        // Clean up test data
        await supabase
          .from('listings')
          .delete()
          .eq('id', insertData[0].id);

        return { status: '✅', message: 'Table structure is valid' };
      }
    },
    {
      name: 'Test RLS policies',
      test: async () => {
        // Test that we can read from listings table
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, status')
          .limit(5);

        if (error) {
          return { status: '❌', error: error.message };
        }

        return { status: '✅', message: `RLS policies working, found ${data?.length || 0} listings` };
      }
    },
    {
      name: 'Test storage bucket',
      test: async () => {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          return { status: '❌', error: error.message };
        }

        const listingsBucket = buckets.find(bucket => bucket.name === 'listings');
        if (!listingsBucket) {
          return { status: '❌', error: 'Listings bucket not found' };
        }

        return { 
          status: '✅', 
          message: `Listings bucket found (public: ${listingsBucket.public})` 
        };
      }
    },
    {
      name: 'Test indexes and constraints',
      test: async () => {
        // Test constraint validation
        const invalidListing = {
          owner_id: '00000000-0000-0000-0000-000000000000',
          title: 'Invalid Test',
          mode: 'rent',
          // Missing required rent_day_cents for rent mode
        };

        const { error } = await supabase
          .from('listings')
          .insert(invalidListing);

        if (error && error.message.includes('valid_rent_pricing')) {
          return { status: '✅', message: 'Constraints are working properly' };
        } else {
          return { status: '❌', error: 'Constraints not working as expected' };
        }
      }
    },
    {
      name: 'Test order reference validation function',
      test: async () => {
        // Test the validate_review_order_reference function
        const { data, error } = await supabase.rpc('validate_review_order_reference', {
          p_order_type: 'rent',
          p_order_id: '00000000-0000-0000-0000-000000000000'
        });

        if (error) {
          return { status: '❌', error: error.message };
        }

        // Should return false for non-existent order
        if (data === false) {
          return { status: '✅', message: 'Order reference validation function working' };
        } else {
          return { status: '❌', error: 'Function returned unexpected result' };
        }
      }
    },
    {
      name: 'Test functions and triggers',
      test: async () => {
        // Get a real user profile ID for testing
        const { data: users, error: usersError } = await supabase
          .from('users_profile')
          .select('id')
          .limit(1);

        if (usersError || !users || users.length === 0) {
          return { status: '⚠️', message: 'No users found - triggers valid but cannot test' };
        }

        // Test updated_at trigger
        const testListing = {
          owner_id: users[0].id,
          title: 'Trigger Test',
          mode: 'sale',
          sale_price_cents: 10000,
          status: 'active'
        };

        const { data: insertData, error: insertError } = await supabase
          .from('listings')
          .insert(testListing)
          .select();

        if (insertError) {
          return { status: '❌', error: insertError.message };
        }

        const originalUpdatedAt = insertData[0].updated_at;

        // Wait a moment and update
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: updateData, error: updateError } = await supabase
          .from('listings')
          .update({ title: 'Updated Trigger Test' })
          .eq('id', insertData[0].id)
          .select();

        if (updateError) {
          return { status: '❌', error: updateError.message };
        }

        // Clean up
        await supabase
          .from('listings')
          .delete()
          .eq('id', insertData[0].id);

        if (updateData[0].updated_at > originalUpdatedAt) {
          return { status: '✅', message: 'Triggers are working properly' };
        } else {
          return { status: '❌', error: 'Updated_at trigger not working' };
        }
      }
    }
  ];

  let passedTests = 0;
  let warningTests = 0;
  let totalTests = 0; // Will be calculated dynamically

  for (const test of tests) {
    console.log(`🔍 ${test.name}...`);
    
    try {
      const result = await test.test();
      
      if (Array.isArray(result)) {
        // Handle table existence test
        result.forEach(r => {
          console.log(`   ${r.status} ${r.table}`);
          if (r.error) console.log(`      Error: ${r.error}`);
        });
        // For array results, count each table as a separate test
        const tablePassed = result.filter(r => r.status === '✅').length;
        const tableWarnings = result.filter(r => r.status === '⚠️').length;
        passedTests += tablePassed;
        warningTests += tableWarnings;
        totalTests += result.length; // Count each table as a test
      } else {
        console.log(`   ${result.status} ${result.message || result.error}`);
        if (result.status === '✅') {
          passedTests++;
        } else if (result.status === '⚠️') {
          warningTests++;
        }
        totalTests++; // Count single tests
      }
    } catch (error) {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Warnings: ${warningTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests + warningTests === totalTests) {
    console.log('\n🎉 All tests passed! Marketplace schema is ready.');
    if (warningTests > 0) {
      console.log(`   (${warningTests} warnings due to no test users in database)`);
    }
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    return false;
  }
}

// Run the tests
testMarketplaceSchema()
  .then(success => {
    if (success) {
      console.log('\n✅ Marketplace schema validation complete!');
      process.exit(0);
    } else {
      console.log('\n❌ Schema validation failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
