# 🚀 Complete Messaging System Setup Guide

This guide provides step-by-step instructions to set up the complete messaging system for Preset.ie in Supabase.

## 📋 What This Migration Includes

The `055_complete_messaging_system.sql` migration includes ALL messaging functionality:

### ✅ **Core Features:**
1. **Real-time Messaging** - Message delivery, read receipts, typing indicators
2. **User Blocking System** - Users can block/unblock each other 
3. **Rate Limiting** - Subscription-based message limits (free/plus/pro)
4. **Content Moderation** - Automatic flagging of inappropriate content
5. **Message Reporting** - Users can report messages to admins
6. **Performance Optimization** - 15+ database indexes for fast queries
7. **Security Enhancements** - Row Level Security with blocking integration

### 🗄️ **Database Tables Created/Enhanced:**

**Existing Enhanced:**
- `messages` - Added conversation_id, updated_at, status columns

**New Tables:**
- `user_blocks` - User blocking relationships
- `typing_indicators` - Real-time typing status
- `rate_limit_usage` - API rate limiting tracking  
- `moderation_queue` - Content moderation queue
- `rate_limits` - Rate limit configurations

**Views:**
- `admin_moderation_dashboard` - Admin moderation interface
- `messaging_performance_stats` - Performance monitoring

## 🎯 **How to Apply the Migration**

### Step 1: Run the SQL Migration

1. **Open Supabase Dashboard**
   - Go to your Preset.ie project
   - Navigate to **SQL Editor**

2. **Execute the Migration**
   - Copy the entire contents of `055_complete_messaging_system.sql`
   - Paste into Supabase SQL Editor
   - Click **Run** ▶️

3. **Verify Success**
   - You should see success messages and notices
   - Check that all tables were created successfully

### ⚠️ **Important Notes**

**Function Requirements**: The migration includes the `generate_conversation_id` function marked as `IMMUTABLE` and ensures the `uuid-ossp` extension is available.

**Policy Safety**: The migration drops existing policies before recreating them to avoid "already exists" errors when run multiple times.

**Enum Compatibility**: Uses the correct uppercase subscription tier values ('FREE', 'PLUS', 'PRO') to match the existing database schema.

**Index Creation**: The migration creates indexes using `CREATE INDEX` (not `CONCURRENTLY`) to avoid transaction block issues. This is safe for Supabase but may briefly lock tables during creation. For production systems with large amounts of existing data, consider:

1. Running the migration during low-traffic periods
2. Creating indexes separately using `CREATE INDEX CONCURRENTLY` via individual queries
3. Monitoring index creation progress in Supabase logs

### Step 2: Enable Real-time Replication

**⚠️ IMPORTANT:** This must be done manually in Supabase Dashboard

1. **Go to Database > Replication**
2. **Enable replication for these tables:**
   - ✅ `messages` 
   - ✅ `typing_indicators`
   - ✅ `user_blocks` (optional)
   - ✅ `moderation_queue` (optional)

**Alternative via Supabase CLI:**
```bash
supabase sql -f - <<EOF
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE user_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE moderation_queue;
EOF
```

## 🔧 **What Each Component Does**

### **Real-time Messaging**
- Message status tracking (sent → delivered → read)
- Conversation grouping by gig + participants
- Typing indicators for live conversations
- Automatic message timestamps

### **User Blocking System**
- Users can block others to prevent communication
- Integrated with message policies (blocked users can't message)
- Admin can view blocking relationships
- Prevents both direct and indirect communication

### **Rate Limiting**
- **Free Users:** 10 messages/5min, 5 reports/hour, 5 blocks/hour
- **Plus Users:** 30 messages/5min, 10 reports/hour, 10 blocks/hour  
- **Pro Users:** 100 messages/5min, 20 reports/hour, 20 blocks/hour
- Automatic cleanup of old usage records

### **Content Moderation**
- Real-time scanning for inappropriate content
- Automatic flagging based on keywords/patterns
- Severity scoring (0-100)
- Admin queue for manual review
- Integration with user violation history

### **Message Reporting**
- Users can report inappropriate messages
- Priority-based escalation system
- Integration with existing reports table
- Admin resolution workflow

### **Performance Optimization**
- Specialized indexes for all common queries
- Optimized functions for conversation lists
- Efficient pagination support
- Performance monitoring views

## 🧪 **Testing the Setup**

After applying the migration, test these features:

### 1. **Basic Messaging**
```sql
-- Check if messages table has new columns
SELECT conversation_id, status, updated_at 
FROM messages 
LIMIT 1;
```

### 2. **User Blocking**
```sql
-- Test blocking function
SELECT can_users_communicate('user1-uuid', 'user2-uuid');
```

### 3. **Rate Limiting**
```sql
-- Check rate limits are configured
SELECT * FROM rate_limits;
```

### 4. **Content Moderation**
```sql
-- Test content checking
SELECT * FROM check_content_moderation(
  'test-uuid', 
  'message', 
  'This is a test message', 
  'user-uuid'
);
```

## 🔒 **Security Features**

The migration includes comprehensive security:

### **Row Level Security (RLS)**
- Users can only see their own conversations
- Blocking prevents access to messages
- Admins have elevated access for moderation
- Rate limiting prevents abuse

### **Content Filtering**
- Automatic detection of inappropriate language
- Spam pattern recognition
- URL link detection
- Excessive caps/repetition detection

### **Access Control**
- Message participants must be gig owner or applicant
- Recipients can mark messages as read
- Users can only block/unblock for themselves
- Admin-only access to moderation tools

## 📊 **Admin Capabilities**

Admins get access to:

### **Moderation Dashboard**
```sql
SELECT * FROM admin_moderation_dashboard 
WHERE status = 'pending' 
ORDER BY severity_score DESC;
```

### **Performance Monitoring**
```sql
SELECT * FROM messaging_performance_stats;
```

### **User Violation Tracking**
- View flagged content by user
- Track repeat offenders
- Monitor resolution times
- Bulk moderation actions

## 🚨 **Troubleshooting**

### **Common Issues:**

**1. Migration Fails on Existing Data**
- The migration handles existing data safely
- Uses `IF NOT EXISTS` for table creation
- Gracefully adds columns to existing tables

**2. Real-time Not Working**
- Ensure replication is enabled in Dashboard
- Check that tables are added to `supabase_realtime` publication

**3. Permission Errors**
- Verify RLS policies are created
- Check user has proper subscription tier
- Ensure users_profile has required role_flags column

**4. Performance Issues**
- Indexes are created `CONCURRENTLY` to avoid locks
- Monitor with `messaging_performance_stats` view
- Consider running `ANALYZE` on tables after large data loads

## 🎉 **Success Verification**

After successful setup, you should have:

✅ **Enhanced Messages Table** with conversation tracking  
✅ **4 New Tables** for blocking, moderation, rate limiting  
✅ **15+ Database Indexes** for performance  
✅ **10+ Functions** for business logic  
✅ **Comprehensive RLS Policies** for security  
✅ **Real-time Capabilities** for live messaging  
✅ **Admin Dashboard Views** for moderation  

## 🔄 **Rollback Instructions**

If you need to rollback the migration:

```sql
-- Remove new tables (WARNING: This deletes data!)
DROP TABLE IF EXISTS user_blocks CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;  
DROP TABLE IF EXISTS rate_limit_usage CASCADE;
DROP TABLE IF EXISTS moderation_queue CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;

-- Remove added columns from messages
ALTER TABLE messages 
DROP COLUMN IF EXISTS conversation_id,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS status;

-- Remove types
DROP TYPE IF EXISTS message_status CASCADE;
```

## 🆘 **Support**

If you encounter any issues:

1. Check Supabase logs in Dashboard > Logs
2. Verify all tables exist: Database > Tables  
3. Test functions in SQL Editor
4. Check RLS policies: Database > Policies
5. Monitor performance: Use the performance stats view

---

**🎯 Result:** Complete messaging system with real-time features, security, moderation, and performance optimization - ready for production! 🚀