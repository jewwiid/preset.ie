# Phase 1: Marketplace Database Foundation - Setup Guide

## 🎯 Overview

This guide walks you through setting up the marketplace database schema and storage infrastructure for the Preset Rent & Sell Marketplace.

## 📋 Prerequisites

- Supabase project configured and accessible
- Environment variables set up (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Node.js installed for running setup scripts

## 🚀 Step-by-Step Setup

### Step 1: Apply Database Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Apply Marketplace Schema Migration**
   - Create a new query
   - Copy the entire contents of `supabase/migrations/092_marketplace_schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

3. **Verify Migration Success**
   - Check that all tables were created successfully
   - Verify RLS policies are enabled
   - Confirm indexes are in place

### Step 2: Set Up Storage Bucket

1. **Run Storage Setup Script**
   ```bash
   node setup-marketplace-storage.js
   ```

2. **Verify Storage Setup**
   - Check that `listings` bucket was created
   - Confirm RLS policies are applied
   - Verify bucket is public and accessible

### Step 3: Test Schema Implementation

1. **Run Schema Test Script**
   ```bash
   node test-marketplace-schema.js
   ```

2. **Review Test Results**
   - All tests should pass
   - Verify table structures are correct
   - Confirm RLS policies are working
   - Check that constraints and triggers function properly

## 📊 What Gets Created

### Database Tables
- **`listings`** - Equipment listings for rent/sale
- **`listing_images`** - Images associated with listings
- **`listing_availability`** - Availability blocks and reservations
- **`rental_orders`** - Rental transactions and bookings
- **`sale_orders`** - Sale transactions
- **`offers`** - Price/terms negotiation offers
- **`marketplace_reviews`** - Reviews for marketplace transactions
- **`marketplace_disputes`** - Dispute tracking

### Storage Infrastructure
- **`listings` bucket** - Public storage for listing images
- **RLS policies** - Secure access control for storage
- **Folder structure** - `listings/{listing_id}/{filename}.jpg`

### Security Features
- **Row Level Security** - Users can only access their own data
- **Public read access** - Active listings are publicly readable
- **Owner-only write access** - Only listing owners can modify their listings
- **Transaction isolation** - Orders are private between parties

## 🔒 Security Implementation

### RLS Policies Applied
- **Listings**: Public read for active listings, owner-only write
- **Images**: Read if parent listing is visible, owner-only write
- **Orders**: Users can only see their own orders
- **Offers**: Users can only see offers they sent/received
- **Reviews**: Users can only see reviews they wrote/received

### Data Validation
- **Pricing constraints** - Valid rent/sale pricing required
- **Date validation** - End dates must be after start dates
- **User validation** - Orders cannot be between same user
- **Availability checking** - Prevents double-booking

## 🧪 Testing Checklist

### Database Tests
- [ ] All marketplace tables exist and are accessible
- [ ] Table structures match specification
- [ ] RLS policies are active and working
- [ ] Constraints prevent invalid data
- [ ] Triggers update timestamps correctly
- [ ] Availability checking prevents conflicts

### Storage Tests
- [ ] Listings bucket exists and is public
- [ ] Storage RLS policies are applied
- [ ] Folder structure is properly organized
- [ ] File upload/download works correctly

### Integration Tests
- [ ] Schema integrates with existing user system
- [ ] Storage integrates with existing media system
- [ ] RLS policies work with existing auth system

## 🚨 Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check for existing table conflicts
   - Verify all dependencies are met
   - Review error messages for specific issues
   - **PostgreSQL CHECK Constraint Error**: If you see "cannot use subquery in check constraint", this has been fixed in the latest version

2. **Storage Setup Fails**
   - Verify service role key has storage permissions
   - Check bucket name conflicts
   - Ensure RLS policies are properly formatted

3. **Tests Fail**
   - Verify migration was applied completely
   - Check that all tables exist
   - Confirm RLS policies are active

### Error Resolution

1. **Permission Errors**
   - Ensure service role key has full database access
   - Verify storage permissions are enabled
   - Check RLS policy syntax

2. **Constraint Violations**
   - Review data validation rules
   - Check foreign key relationships
   - Verify enum values are correct

3. **Storage Access Issues**
   - Confirm bucket is public
   - Check RLS policy conditions
   - Verify folder structure permissions

## 📈 Success Criteria

### Technical Success
- [ ] All 8 marketplace tables created successfully
- [ ] 25+ indexes created for performance
- [ ] 20+ RLS policies applied and working
- [ ] Storage bucket accessible with proper policies
- [ ] All tests passing (100% success rate)

### Functional Success
- [ ] Users can create listings (with proper auth)
- [ ] Public users can browse active listings
- [ ] Storage allows image uploads for listing owners
- [ ] Constraints prevent invalid data entry
- [ ] Triggers maintain data integrity

## 🔄 Next Steps

After successful Phase 1 completion:

1. **Phase 2: Backend API Development**
   - Create marketplace API endpoints
   - Implement CRUD operations
   - Integrate with existing payment systems

2. **Phase 3: Frontend Components**
   - Build marketplace UI components
   - Create listing management interfaces
   - Implement browsing and search

3. **Phase 4: Integration & Polish**
   - Connect all systems together
   - Add notifications and real-time features
   - Implement safety and verification features

## 📞 Support

If you encounter issues during setup:

1. **Check the logs** - Review error messages carefully
2. **Verify prerequisites** - Ensure all dependencies are met
3. **Test incrementally** - Run tests after each step
4. **Review documentation** - Check the main implementation plan

---

**Ready to proceed?** Once Phase 1 is complete and all tests pass, you'll have a solid foundation for building the marketplace features in subsequent phases.
