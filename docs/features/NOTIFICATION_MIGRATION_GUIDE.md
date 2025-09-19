# Notification System Migration Guide

## 🚨 **Issue Identified**

The marketplace notification extension migration failed because the base notification system hasn't been applied yet.

**Error**: `relation "notifications" does not exist`

## 📋 **Required Migration Order**

### **Step 1: Apply Base Notification System**
**File**: `supabase/migrations/20250911162413_notification_system.sql`

### **Step 2: Apply Marketplace Notification Extensions**
**File**: `supabase/migrations/094_marketplace_notifications_extension.sql`

---

## 🔧 **Migration Steps**

### **Step 1: Apply Base Notification System**

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to **SQL Editor**

2. **Copy Base Migration**
   - Open `supabase/migrations/20250911162413_notification_system.sql`
   - Copy the entire contents

3. **Run Base Migration**
   - Paste the SQL into the SQL Editor
   - Click **Run** to execute
   - Wait for completion

4. **Verify Base Migration**
   - Check that `notifications` table exists
   - Check that `notification_preferences` table exists

### **Step 2: Apply Marketplace Extensions**

1. **Copy Extension Migration**
   - Open `supabase/migrations/094_marketplace_notifications_extension.sql`
   - Copy the entire contents

2. **Run Extension Migration**
   - Paste the SQL into the SQL Editor
   - Click **Run** to execute
   - Wait for completion

3. **Verify Extension Migration**
   - Check that `notifications` table has marketplace columns
   - Check that notification functions exist

---

## 🧪 **Verification Steps**

### **Run Database Test**
```bash
node test-marketplace-database.js
```

**Expected Result**: 100% success rate (24/24 tests passed)

### **Manual Verification**
1. **Check Tables Exist**:
   ```sql
   SELECT * FROM notifications LIMIT 1;
   SELECT * FROM notification_preferences LIMIT 1;
   ```

2. **Check Marketplace Columns**:
   ```sql
   SELECT related_listing_id, related_rental_order_id, related_sale_order_id, related_offer_id, related_review_id 
   FROM notifications LIMIT 1;
   ```

3. **Check Functions Exist**:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name IN ('create_marketplace_notification', 'notify_listing_event', 'notify_order_event');
   ```

---

## 📊 **Current Status**

### **✅ Completed**
- Marketplace core tables (8 tables)
- Marketplace API endpoints (11 endpoints)
- Marketplace frontend components (11 components)
- Navigation integration
- Safety features
- Messaging integration
- Payment integration
- Storage system

### **⚠️ Pending**
- Base notification system migration
- Marketplace notification extensions

---

## 🎯 **After Migration Completion**

Once both migrations are applied successfully:

1. **Run Database Test**: `node test-marketplace-database.js`
2. **Expected Result**: 100% success rate
3. **Marketplace Status**: 100% complete
4. **Ready for Production**: Yes

---

## 🚀 **Quick Migration Commands**

### **Check Current Status**
```bash
node apply-notification-migrations-simple.js
```

### **Run Database Test**
```bash
node test-marketplace-database.js
```

### **Run Structure Test**
```bash
node test-marketplace-structure.js
```

---

## 📁 **Migration Files**

- `supabase/migrations/20250911162413_notification_system.sql` - Base notification system
- `supabase/migrations/094_marketplace_notifications_extension.sql` - Marketplace extensions

---

## 🎉 **Expected Final Result**

After applying both migrations:

- **Database Test**: 100% success (24/24 tests)
- **Structure Test**: 100% success (71/71 tests)
- **Overall Success**: 100% complete
- **Production Ready**: Yes

The marketplace will then be fully functional with real-time notifications for all marketplace events.
