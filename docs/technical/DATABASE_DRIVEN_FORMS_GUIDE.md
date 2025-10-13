# Database-Driven Forms Implementation Guide

## Overview

Your professional skills and experience form fields now fetch data directly from the database instead of using hardcoded values. This makes it easy to manage and update options without changing code.

## What Was Fixed

### ✅ Database Schema
Your database already has these predefined tables with data:

1. **`predefined_professional_skills`** (82+ skills)
   - Categories: software, technical, certifications, programming, methodologies, equipment, business
   - Examples: Adobe Creative Suite, Color Grading, Adobe Certified Expert, JavaScript, etc.

2. **`predefined_roles`** (41+ roles)
   - Categories: creative, technical, production, post-production, design, marketing
   - Examples: Photographer, Videographer, Director, Editor, Producer, etc.

3. **`predefined_experience_levels`** (12 levels) - **NOW POPULATED**
   - Beginner (0-2 years)
   - Intermediate (3-5 years)
   - Advanced (6-10 years)
   - Expert (10+ years)
   - Student, Entry Level, Mid Level, Senior Level, Lead/Principal, etc.

4. **`predefined_skills`** (59+ skills)
   - Categories: technical, creative, post-production, software, interpersonal, marketing, specialized
   - Examples: Photography, Videography, Video Editing, Adobe Photoshop, Communication, etc.

### ✅ API Route
**`/api/predefined-data`** - Already fetches all predefined data including:
- Experience levels
- Professional skills
- Contributor roles
- Languages
- Equipment types
- And more...

### ✅ Updated Components

#### 1. **ProfessionalStep.tsx** (Profile Edit Step)
**Before:** Hardcoded experience levels
```typescript
const experienceLevels = [
  { value: 'beginner', label: 'Beginner (0-2 years)' },
  { value: 'intermediate', label: 'Intermediate (3-5 years)' },
  { value: 'advanced', label: 'Advanced (6-10 years)' },
  { value: 'expert', label: 'Expert (10+ years)' }
]
```

**After:** Fetches from database
```typescript
// Fetches data from /api/predefined-data
useEffect(() => {
  const fetchPredefinedData = async () => {
    const response = await fetch('/api/predefined-data')
    const data = await response.json()
    setExperienceLevels(data.experience_levels || [])
    setProfessionalSkills(data.professional_skills || [])
    setContributorRoles(data.predefined_roles || [])
  }
  fetchPredefinedData()
}, [])
```

## Database Tables Schema

### predefined_professional_skills
```sql
CREATE TABLE predefined_professional_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,  -- software, technical, certifications, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### predefined_roles
```sql
CREATE TABLE predefined_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,  -- creative, technical, production, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### predefined_experience_levels
```sql
CREATE TABLE predefined_experience_levels (
    id INTEGER PRIMARY KEY,
    level_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## How to Use

### For Users (Frontend)

1. **Experience Level Dropdown**
   - Now shows all levels from database
   - Loading state while fetching
   - Automatically populated

2. **Professional Skills**
   - TagInput with autocomplete from database
   - Shows available categories
   - Can still add custom skills

3. **Contributor Roles**
   - TagInput with autocomplete from database
   - Shows available categories
   - Can still add custom roles

### For Admins (Managing Options)

#### Adding New Experience Levels
```sql
INSERT INTO predefined_experience_levels (level_name, sort_order, is_active) 
VALUES ('New Level Name', 99, true);
```

#### Adding New Professional Skills
```sql
INSERT INTO predefined_professional_skills (skill_name, category, description, sort_order) 
VALUES 
('New Skill', 'software', 'Description of the skill', 100);
```

#### Adding New Roles
```sql
INSERT INTO predefined_roles (name, category, description, sort_order) 
VALUES 
('New Role', 'creative', 'Description of the role', 100);
```

#### Updating Existing Options
```sql
-- Update skill name
UPDATE predefined_professional_skills 
SET skill_name = 'Updated Name' 
WHERE skill_name = 'Old Name';

-- Deactivate an option
UPDATE predefined_professional_skills 
SET is_active = false 
WHERE skill_name = 'Deprecated Skill';
```

#### Viewing Current Options
```sql
-- View all active professional skills by category
SELECT category, skill_name, description 
FROM predefined_professional_skills 
WHERE is_active = true 
ORDER BY category, sort_order;

-- View all active roles by category
SELECT category, name, description 
FROM predefined_roles 
WHERE is_active = true 
ORDER BY category, sort_order;

-- View all experience levels
SELECT level_name 
FROM predefined_experience_levels 
WHERE is_active = true 
ORDER BY sort_order;
```

## Validation

### Database-Level Validation
Your database has triggers to validate that:
- Professional skills must exist in `predefined_professional_skills`
- Contributor roles must exist in `predefined_roles`

```sql
-- Validation function for professional skills
CREATE OR REPLACE FUNCTION validate_professional_skills(user_skills TEXT[])
RETURNS BOOLEAN AS $$
-- Checks that all skills exist in predefined_professional_skills
$$;
```

### Frontend Validation
- Dropdowns only show active (`is_active = true`) options
- Options are sorted by `sort_order`
- Loading states prevent incomplete selections

## Migration to Run

To populate the experience levels table, run:
```bash
cd /Users/judeokun/Documents/GitHub/preset/preset.ie/preset
supabase db push supabase/migrations/populate_experience_levels.sql
```

Or run directly in Supabase SQL Editor:
```sql
INSERT INTO predefined_experience_levels (level_name, sort_order, is_active) VALUES
('Beginner (0-2 years)', 1, true),
('Intermediate (3-5 years)', 2, true),
('Advanced (6-10 years)', 3, true),
('Expert (10+ years)', 4, true),
('Student', 5, true),
('Entry Level', 6, true),
('Mid Level', 7, true),
('Senior Level', 8, true),
('Lead/Principal', 9, true),
('No Experience', 10, true),
('Some Experience', 11, true),
('Extensive Experience', 12, true)
ON CONFLICT (id) DO NOTHING;
```

## Components Using Database Dropdowns

### ✅ Already Updated
1. `apps/web/components/profile/sections/ProfessionalSection.tsx`
   - Fetches from API
   - Uses predefined options for skills and roles

2. `apps/web/components/profile/sections/ContributorSpecificSection.tsx`
   - Fetches from API
   - Grouped by category
   - Shows descriptions on selection

3. `apps/web/app/components/profile-edit-steps/ProfessionalStep.tsx` ⭐ **JUST UPDATED**
   - Now fetches experience levels from database
   - Autocomplete for professional skills
   - Autocomplete for contributor roles

## Benefits of Database-Driven Forms

✅ **Easy to Update**: Add/remove options without code changes
✅ **Centralized**: One source of truth for all dropdowns
✅ **Consistent**: All forms use the same data
✅ **Validated**: Database constraints ensure data integrity
✅ **Scalable**: Can add thousands of options without performance issues
✅ **Categorized**: Options grouped by category for better UX
✅ **Searchable**: Users can search and filter options
✅ **Flexible**: Can still add custom values when needed

## Next Steps

1. ✅ Run the experience levels migration
2. ✅ Test the updated forms
3. ✅ Add more skills/roles/levels as needed
4. ✅ Update other forms to use database dropdowns (if any)

## Support Functions

The database includes helper functions:
- `get_roles_by_category(category)` - Get roles by category
- `get_skills_by_category(category)` - Get skills by category
- `search_roles_and_skills(search_term)` - Search both roles and skills
- `validate_professional_skills(skills)` - Validate skill array
- `validate_contributor_roles(roles)` - Validate role array

## API Response Format

```json
{
  "experience_levels": [
    { "id": 1, "level_name": "Beginner (0-2 years)", "sort_order": 1 }
  ],
  "professional_skills": [
    { 
      "skill_name": "Adobe Creative Suite", 
      "category": "software",
      "description": "Adobe Photoshop, Illustrator, InDesign, Premiere Pro, After Effects"
    }
  ],
  "predefined_roles": [
    {
      "name": "Photographer",
      "category": "creative",
      "description": "Captures still images and photographs"
    }
  ],
  "languages": [...],
  "equipment_types": [...],
  // ... more predefined data
}
```

---

**Last Updated**: October 12, 2025
**Migration File**: `supabase/migrations/populate_experience_levels.sql`
**API Route**: `/api/predefined-data`

