# Equipment View Fix Documentation

## Problem
The frontend was encountering an error when trying to fetch equipment data:
```
Error fetching equipment data: 
Object { code: "42703", details: null, hint: null, message: "column user_equipment_view.profile_id does not exist" }
```

## Root Cause Analysis
The error suggests that the `user_equipment_view` either:
1. Doesn't exist in the database
2. Has a different column structure than expected
3. Has a schema mismatch between the view definition and actual database state

## Solution

### Migration Files Created

#### 075_fix_user_equipment_view.sql
This migration:
- **Drops and recreates** the `user_equipment_view` to ensure it's correct
- **Adds helper functions** for safe equipment data access
- **Grants proper permissions** to authenticated users
- **Provides alternative access methods** if the view continues to have issues

#### 076_test_equipment_view.sql
This migration:
- **Tests the view existence** and structure
- **Provides debugging information** about the equipment tables
- **Creates test functions** to verify the view works
- **Offers simple alternatives** for equipment data access

### Key Functions Added

#### 1. `get_user_equipment_data(profile_id)`
```sql
SELECT * FROM get_user_equipment_data('profile-uuid-here');
```
- Safely retrieves user equipment data
- Returns all equipment information with proper joins
- Handles errors gracefully

#### 2. `add_user_equipment(profile_id, equipment_model_id, is_primary, display_order)`
```sql
SELECT add_user_equipment('profile-uuid', 'model-uuid', true, 0);
```
- Adds equipment to user profile
- Automatically handles primary equipment logic
- Returns the new equipment ID

#### 3. `remove_user_equipment(equipment_id)`
```sql
SELECT remove_user_equipment('equipment-uuid');
```
- Removes equipment from user profile
- Automatically promotes another equipment to primary if needed
- Returns success status

#### 4. `get_equipment_types()`
```sql
SELECT * FROM get_equipment_types();
```
- Returns all active equipment types
- Sorted by display order

#### 5. `get_equipment_brands(equipment_type_id)`
```sql
SELECT * FROM get_equipment_brands('type-uuid');
```
- Returns brands for a specific equipment type
- Sorted by display order

#### 6. `get_predefined_models(equipment_type_id)`
```sql
SELECT * FROM get_predefined_models('type-uuid');
```
- Returns predefined models for a specific equipment type
- Sorted by display order

#### 7. `test_equipment_view()`
```sql
SELECT * FROM test_equipment_view();
```
- Tests if the equipment view works correctly
- Returns test result and row count

#### 8. `get_user_equipment_simple(profile_id)`
```sql
SELECT * FROM get_user_equipment_simple('profile-uuid');
```
- Simple alternative to the view
- Returns basic equipment information
- More reliable than the view

## Frontend Integration

### Option 1: Use the Fixed View
```javascript
const { data, error } = await supabase
  .from('user_equipment_view')
  .select('*')
  .eq('profile_id', profileId);
```

### Option 2: Use the Helper Function (Recommended)
```javascript
const { data, error } = await supabase
  .rpc('get_user_equipment_data', { p_profile_id: profileId });
```

### Option 3: Use the Simple Function
```javascript
const { data, error } = await supabase
  .rpc('get_user_equipment_simple', { p_profile_id: profileId });
```

## Equipment Management

### Adding Equipment
```javascript
const { data, error } = await supabase
  .rpc('add_user_equipment', {
    p_profile_id: profileId,
    p_equipment_model_id: modelId,
    p_is_primary: false,
    p_display_order: 0
  });
```

### Removing Equipment
```javascript
const { data, error } = await supabase
  .rpc('remove_user_equipment', { p_equipment_id: equipmentId });
```

### Getting Equipment Types
```javascript
const { data, error } = await supabase
  .rpc('get_equipment_types');
```

### Getting Brands for a Type
```javascript
const { data, error } = await supabase
  .rpc('get_equipment_brands', { p_equipment_type_id: typeId });
```

### Getting Predefined Models
```javascript
const { data, error } = await supabase
  .rpc('get_predefined_models', { p_equipment_type_id: typeId });
```

## Testing

### Test the View
```sql
SELECT * FROM test_equipment_view();
```

### Test User Equipment
```sql
SELECT * FROM get_user_equipment_simple('your-profile-uuid');
```

### Check View Structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'user_equipment_view'
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## Troubleshooting

### If the view still doesn't work:
1. **Use the helper functions** instead of the view
2. **Check the test function** to see what's wrong
3. **Verify table structure** with the debugging queries
4. **Check permissions** on the view and underlying tables

### Common Issues:
1. **Missing equipment data**: Ensure equipment_types, equipment_models, and user_equipment tables have data
2. **Permission issues**: Verify RLS policies are correct
3. **Schema mismatches**: Run the test migration to check table structure

## Migration Order
Run these migrations in order:
1. `075_fix_user_equipment_view.sql`
2. `076_test_equipment_view.sql`

## Benefits
- **Reliable data access** through helper functions
- **Better error handling** with proper exception management
- **Comprehensive equipment management** with all CRUD operations
- **Debugging tools** to identify issues quickly
- **Alternative access methods** if the view fails

This solution provides multiple ways to access equipment data, ensuring the frontend can work regardless of any view issues.
