# 🔄 Role Categorization Migration Guide

## 📋 Overview

This migration simplifies the confusing role categorization system by renaming database fields to be more intuitive.

---

## 🎯 What Changed

### **Database Fields (users_profile table)**

| Old Name (Confusing) | New Name (Clear) | Purpose |
|---------------------|------------------|---------|
| `talent_categories` | `performance_roles` | What user performs AS (Model, Actor, Dancer) |
| `specializations` | `professional_skills` | Services user PROVIDES (Photography, Video Editing) |
| `contributor_roles` | `contributor_roles` | *(No change - already clear)* |
| `primary_skill` | `primary_skill` | *(No change - consider renaming to `primary_role` later)* |

### **Database Tables**

| Old Name | New Name | Purpose |
|----------|----------|---------|
| `predefined_talent_categories` | `predefined_performance_roles` | List of performance roles |
| `specializations` | `predefined_professional_skills` | List of professional skills |
| `predefined_roles` | `predefined_roles` | *(No change)* |

### **Table Columns**

| Table | Old Column | New Column |
|-------|-----------|------------|
| `predefined_performance_roles` | `category_name` | `role_name` |
| `predefined_professional_skills` | `name` | `skill_name` |

---

## 🚀 Migration Files

### **1. Main Migration**
**File:** `20251011000000_simplify_role_categorization.sql`

**What it does:**
- Renames `talent_categories` → `performance_roles`
- Renames `specializations` → `professional_skills`
- Renames predefined tables
- Updates indexes, policies, and comments
- Creates backward-compatible view

### **2. Function Updates**
**File:** `20251011000001_update_functions_for_new_schema.sql`

**What it does:**
- Updates `calculate_profile_completion()` function
- Updates triggers
- Creates helper functions for role-based filtering
- Adds search functions with new field names

---

## 📝 Code Changes Needed

### **1. API Routes**

#### `/api/predefined-data/route.ts`
```typescript
// BEFORE
return NextResponse.json({
  talent_categories: talentCategoriesResult.data || [],
  specializations: specializationsResult.data || [],
})

// AFTER
return NextResponse.json({
  performance_roles: performanceRolesResult.data || [],
  professional_skills: professionalSkillsResult.data || [],
  
  // Keep old names for transition period
  talent_categories: performanceRolesResult.data || [], 
  specializations: professionalSkillsResult.data || [],
})
```

### **2. TypeScript Interfaces**

#### Profile Data Interface
```typescript
// BEFORE
interface ProfileData {
  talentCategories?: string[]
  specializations?: string[]
}

// AFTER
interface ProfileData {
  performanceRoles?: string[]
  professionalSkills?: string[]
  
  // Optional: Keep old names with deprecation notice
  /** @deprecated Use performanceRoles instead */
  talentCategories?: string[]
  /** @deprecated Use professionalSkills instead */
  specializations?: string[]
}
```

### **3. UI Components**

#### CategoriesStep.tsx
```typescript
// BEFORE
const [selectedTalentCategories, setSelectedTalentCategories] = useState<string[]>(
  profileData.talentCategories || []
)
const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(
  profileData.specializations || []
)

// AFTER
const [selectedPerformanceRoles, setSelectedPerformanceRoles] = useState<string[]>(
  profileData.performanceRoles || []
)
const [selectedProfessionalSkills, setSelectedProfessionalSkills] = useState<string[]>(
  profileData.professionalSkills || []
)
```

#### Database Queries
```typescript
// BEFORE
const { data } = await supabase
  .from('users_profile')
  .select('talent_categories, specializations')

// AFTER  
const { data } = await supabase
  .from('users_profile')
  .select('performance_roles, professional_skills')
```

---

## 🧪 Testing the Migration

### **Step 1: Backup Database**
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_before_migration.sql
```

### **Step 2: Run Migration**
```bash
# Apply migrations
supabase db push

# Or manually:
psql $DATABASE_URL < supabase/migrations/20251011000000_simplify_role_categorization.sql
psql $DATABASE_URL < supabase/migrations/20251011000001_update_functions_for_new_schema.sql
```

### **Step 3: Verify Data Integrity**
```sql
-- Check that data was preserved
SELECT 
  COUNT(*) as total_profiles,
  COUNT(performance_roles) as with_performance_roles,
  COUNT(professional_skills) as with_professional_skills,
  COUNT(CASE WHEN array_length(performance_roles, 1) > 0 THEN 1 END) as non_empty_performance,
  COUNT(CASE WHEN array_length(professional_skills, 1) > 0 THEN 1 END) as non_empty_skills
FROM users_profile;

-- Check that no data was lost
SELECT id, display_name, performance_roles, professional_skills
FROM users_profile
WHERE performance_roles IS NOT NULL OR professional_skills IS NOT NULL
LIMIT 10;
```

### **Step 4: Test API Endpoints**
```bash
# Test predefined data endpoint
curl http://localhost:3000/api/predefined-data | jq '.performance_roles[0:3], .professional_skills[0:3]'

# Test profile fetching
curl http://localhost:3000/api/talent-profiles?role=TALENT | jq '.[0] | {display_name, performance_roles, professional_skills}'
```

---

## 🔄 Migration Rollback Plan

If something goes wrong, you can rollback:

```sql
-- Rollback: Rename back to old names
ALTER TABLE users_profile RENAME COLUMN performance_roles TO talent_categories;
ALTER TABLE users_profile RENAME COLUMN professional_skills TO specializations;

ALTER TABLE predefined_performance_roles RENAME TO predefined_talent_categories;
ALTER TABLE predefined_professional_skills RENAME TO specializations;

-- Restore backup if needed
psql $DATABASE_URL < backup_before_migration.sql
```

---

## 📅 Migration Timeline

### **Phase 1: Database Migration** (Day 1)
- ✅ Run database migrations
- ✅ Verify data integrity
- ✅ Keep backward-compatible view

### **Phase 2: API Layer** (Day 2-3)
- Update API routes to use new names
- Keep returning both old and new names for transition

### **Phase 3: UI Components** (Day 4-5)
- Update React components
- Update TypeScript interfaces
- Update form handlers

### **Phase 4: Cleanup** (Day 6-7)
- Remove backward-compatible view
- Remove old field name aliases
- Update documentation

---

## 💡 Key Benefits

### **Before Migration:**
```
User: "What's the difference between talent_categories and specializations?"
Dev: "Uh... talent_categories are for performers and specializations are for...um..."
```

### **After Migration:**
```
User: "What's the difference between performance_roles and professional_skills?"
Dev: "Performance roles are what you PERFORM AS (Model, Actor). Professional skills are SERVICES YOU PROVIDE (Photography, Editing)."
User: "Oh, that makes sense!"
```

---

## 🎨 Updated UI Labels

### **For TALENT Users:**
- **Old:** "Talent Categories"
- **New:** "Performance Roles" or "What I Perform As"

### **For CONTRIBUTOR Users:**
- **Old:** "Specializations"
- **New:** "Professional Skills" or "Services I Provide"

---

## 🔍 Files to Update

### **Backend Files:**
- ✅ `supabase/migrations/20251011000000_simplify_role_categorization.sql`
- ✅ `supabase/migrations/20251011000001_update_functions_for_new_schema.sql`
- ⏳ `apps/web/app/api/predefined-data/route.ts`
- ⏳ `apps/web/app/api/talent-profiles/route.ts`

### **Frontend Files:**
- ⏳ `apps/web/components/auth/complete-profile/steps/CategoriesStep.tsx`
- ⏳ `apps/web/components/auth/complete-profile/CompleteProfileProvider.tsx`
- ⏳ `apps/web/components/profile/sections/TalentSpecificSection.tsx`
- ⏳ `apps/web/components/profile/sections/ProfessionalSection.tsx`
- ⏳ `apps/web/app/[slug]/page.tsx`
- ⏳ `apps/web/app/hooks/usePlatformGeneratedImages.ts`

### **Type Definition Files:**
- ⏳ Any TypeScript interface files that define profile structure

---

## ✅ Checklist

- [ ] Backup database
- [ ] Run migration scripts
- [ ] Verify data integrity
- [ ] Update API routes
- [ ] Update TypeScript interfaces
- [ ] Update UI components
- [ ] Update form handlers
- [ ] Test signup flow
- [ ] Test profile editing
- [ ] Test role-based pages
- [ ] Remove backward-compatible code (after transition period)

---

## 📞 Support

If you encounter issues during migration:
1. Check the verification queries in the migration files
2. Review the rollback plan above
3. Check Supabase logs for any errors
4. Test with a single user profile first

---

**Migration Created:** 2025-10-11  
**Status:** Ready for testing  
**Estimated Duration:** 1-2 weeks for full transition

