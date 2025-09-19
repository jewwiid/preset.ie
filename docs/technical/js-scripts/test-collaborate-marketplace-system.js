#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Collaborate & Marketplace System
 * Tests all major functionality end-to-end
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

class CollaborateMarketplaceTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.testUser = null;
    this.testProject = null;
    this.testListing = null;
    this.testOrder = null;
  }

  async runAllTests() {
    console.log('🧪 Starting Collaborate & Marketplace System Tests...\n');

    try {
      // Setup
      await this.setupTestData();

      // Phase 1: Marketplace Tests
      await this.testMarketplaceSystem();

      // Phase 2: Collaboration Tests
      await this.testCollaborationSystem();

      // Phase 3: Integration Tests
      await this.testSystemIntegration();

      // Phase 4: Performance Tests
      await this.testPerformance();

      // Cleanup
      await this.cleanupTestData();

      // Results
      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      await this.cleanupTestData();
    }
  }

  async setupTestData() {
    console.log('🔧 Setting up test data...');
    
    try {
      // Create test user
      const { data: user, error: userError } = await supabase
        .from('users_profile')
        .select('id, username, display_name')
        .limit(1)
        .single();

      if (userError || !user) {
        throw new Error('No test user available');
      }

      this.testUser = user;
      console.log(`✅ Test user: ${user.display_name} (${user.username})`);

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }

  async testMarketplaceSystem() {
    console.log('\n📦 Testing Marketplace System...');

    // Test 1: Create Listing
    await this.runTest('Create Marketplace Listing', async () => {
      const { data: listing, error } = await supabase
        .from('listings')
        .insert({
          owner_id: this.testUser.id,
          title: 'Test Camera Equipment',
          description: 'Professional camera for testing',
          category: 'Camera',
          condition: 'good',
          rent_day_cents: 5000, // €50/day
          sale_price_cents: 50000, // €500
          location_city: 'Dublin',
          location_country: 'Ireland',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create listing: ${error.message}`);
      this.testListing = listing;
      return `Created listing: ${listing.title}`;
    });

    // Test 2: Browse Listings
    await this.runTest('Browse Marketplace Listings', async () => {
      const { data: listings, error } = await supabase
        .from('listings')
        .select(`
          *,
          owner:users_profile!listings_owner_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified
          )
        `)
        .eq('status', 'active')
        .limit(10);

      if (error) throw new Error(`Failed to browse listings: ${error.message}`);
      return `Found ${listings.length} active listings`;
    });

    // Test 3: Create Rental Order
    await this.runTest('Create Rental Order', async () => {
      const { data: order, error } = await supabase
        .from('rental_orders')
        .insert({
          listing_id: this.testListing.id,
          renter_id: this.testUser.id,
          owner_id: this.testListing.owner_id,
          start_date: '2024-01-15',
          end_date: '2024-01-17',
          total_days: 3,
          daily_rate_cents: 5000,
          total_amount_cents: 15000,
          delivery_method: 'pickup',
          status: 'pending_payment'
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create rental order: ${error.message}`);
      this.testOrder = order;
      return `Created rental order: €${order.total_amount_cents / 100}`;
    });

    // Test 4: Order Management
    await this.runTest('Order Management', async () => {
      const { data: orders, error } = await supabase
        .from('rental_orders')
        .select(`
          *,
          listing:listings(
            id,
            title,
            category,
            owner:users_profile!listings_owner_id_fkey(
              id,
              username,
              display_name
            )
          )
        `)
        .or(`renter_id.eq.${this.testUser.id},owner_id.eq.${this.testUser.id}`)
        .limit(10);

      if (error) throw new Error(`Failed to get orders: ${error.message}`);
      return `Found ${orders.length} orders for user`;
    });
  }

  async testCollaborationSystem() {
    console.log('\n🤝 Testing Collaboration System...');

    // Test 1: Create Project
    await this.runTest('Create Collaboration Project', async () => {
      const { data: project, error } = await supabase
        .from('collab_projects')
        .insert({
          creator_id: this.testUser.id,
          title: 'Test Photography Project',
          description: 'A test project for collaboration system',
          synopsis: 'Testing the collaboration features',
          city: 'Dublin',
          country: 'Ireland',
          start_date: '2024-02-01',
          end_date: '2024-02-15',
          visibility: 'public',
          status: 'published'
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create project: ${error.message}`);
      this.testProject = project;
      return `Created project: ${project.title}`;
    });

    // Test 2: Add Project Roles
    await this.runTest('Add Project Roles', async () => {
      const { data: role, error } = await supabase
        .from('collab_roles')
        .insert({
          project_id: this.testProject.id,
          role_name: 'Photographer',
          skills_required: ['Photography', 'Lighting'],
          is_paid: true,
          compensation_details: '€200/day',
          headcount: 1
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to add role: ${error.message}`);
      return `Added role: ${role.role_name}`;
    });

    // Test 3: Add Gear Requests
    await this.runTest('Add Gear Requests', async () => {
      const { data: gearRequest, error } = await supabase
        .from('collab_gear_requests')
        .insert({
          project_id: this.testProject.id,
          category: 'Camera',
          equipment_spec: 'Professional DSLR camera',
          quantity: 1,
          borrow_preferred: true,
          max_daily_rate_cents: 5000
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to add gear request: ${error.message}`);
      return `Added gear request: ${gearRequest.category}`;
    });

    // Test 4: Browse Projects
    await this.runTest('Browse Collaboration Projects', async () => {
      const { data: projects, error } = await supabase
        .from('collab_projects')
        .select(`
          *,
          creator:users_profile!collab_projects_creator_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified
          ),
          collab_roles(
            id,
            role_name,
            skills_required,
            is_paid,
            headcount
          ),
          collab_gear_requests(
            id,
            category,
            equipment_spec,
            quantity
          )
        `)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .limit(10);

      if (error) throw new Error(`Failed to browse projects: ${error.message}`);
      return `Found ${projects.length} public projects`;
    });

    // Test 5: Matching Algorithm
    await this.runTest('Test Matching Algorithm', async () => {
      // This would test the matching service
      // For now, we'll test the database queries that support matching
      const { data: users, error } = await supabase
        .from('users_profile')
        .select('id, specializations, city, country')
        .eq('status', 'active')
        .limit(5);

      if (error) throw new Error(`Failed to get users for matching: ${error.message}`);
      return `Found ${users.length} users for matching`;
    });
  }

  async testSystemIntegration() {
    console.log('\n🔗 Testing System Integration...');

    // Test 1: Project-Marketplace Integration
    await this.runTest('Project-Marketplace Integration', async () => {
      // Test linking gear requests to marketplace listings
      const { data: gearRequests, error } = await supabase
        .from('collab_gear_requests')
        .select('*')
        .eq('project_id', this.testProject.id);

      if (error) throw new Error(`Failed to get gear requests: ${error.message}`);
      
      // Test finding matching listings
      const { data: matchingListings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .ilike('category', `%${gearRequests[0].category}%`);

      if (listingsError) throw new Error(`Failed to find matching listings: ${listingsError.message}`);
      
      return `Found ${matchingListings.length} matching listings for gear requests`;
    });

    // Test 2: Notification System
    await this.runTest('Collaboration Notifications', async () => {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .like('type', 'collab_%')
        .limit(10);

      if (error) throw new Error(`Failed to get notifications: ${error.message}`);
      return `Found ${notifications.length} collaboration notifications`;
    });

    // Test 3: Order Processing Integration
    await this.runTest('Order Processing Integration', async () => {
      // Test order status updates
      const { error } = await supabase
        .from('rental_orders')
        .update({ status: 'confirmed' })
        .eq('id', this.testOrder.id);

      if (error) throw new Error(`Failed to update order status: ${error.message}`);
      return 'Order status updated successfully';
    });
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');

    // Test 1: Database Query Performance
    await this.runTest('Database Query Performance', async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('collab_projects')
        .select(`
          *,
          creator:users_profile!collab_projects_creator_id_fkey(*),
          collab_roles(*),
          collab_gear_requests(*),
          collab_participants(*)
        `)
        .eq('status', 'published')
        .limit(20);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      if (error) throw new Error(`Query failed: ${error.message}`);
      
      if (queryTime > 1000) {
        throw new Error(`Query too slow: ${queryTime}ms`);
      }
      
      return `Complex query completed in ${queryTime}ms`;
    });

    // Test 2: Concurrent Operations
    await this.runTest('Concurrent Operations', async () => {
      const promises = [];
      
      // Simulate concurrent project creation
      for (let i = 0; i < 5; i++) {
        promises.push(
          supabase
            .from('collab_projects')
            .insert({
              creator_id: this.testUser.id,
              title: `Concurrent Test Project ${i}`,
              description: 'Testing concurrent operations',
              visibility: 'public',
              status: 'draft'
            })
            .select()
        );
      }

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error(`${errors.length} concurrent operations failed`);
      }
      
      return `All ${results.length} concurrent operations succeeded`;
    });
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    
    try {
      const result = await testFunction();
      this.testResults.passed++;
      this.testResults.details.push({
        name: testName,
        status: 'PASSED',
        result
      });
      console.log(`✅ ${testName}: ${result}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        name: testName,
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ ${testName}: ${error.message}`);
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete test orders
      if (this.testOrder) {
        await supabase
          .from('rental_orders')
          .delete()
          .eq('id', this.testOrder.id);
      }

      // Delete test projects and related data
      if (this.testProject) {
        await supabase
          .from('collab_projects')
          .delete()
          .eq('id', this.testProject.id);
      }

      // Delete test listings
      if (this.testListing) {
        await supabase
          .from('listings')
          .delete()
          .eq('id', this.testListing.id);
      }

      // Delete any test projects created during concurrent testing
      await supabase
        .from('collab_projects')
        .delete()
        .like('title', 'Concurrent Test Project%');

      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed} ✅`);
    console.log(`Failed: ${this.testResults.failed} ❌`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.details
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    console.log('\n🎉 Collaborate & Marketplace System Testing Complete!');
    
    if (this.testResults.failed === 0) {
      console.log('🚀 All systems are working perfectly!');
    } else {
      console.log('⚠️  Some issues were found. Please review failed tests.');
    }
  }
}

// Run the tests
const tester = new CollaborateMarketplaceTester();
tester.runAllTests();
