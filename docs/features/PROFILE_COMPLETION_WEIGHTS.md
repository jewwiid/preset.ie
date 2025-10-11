# Profile Completion Weights - Centralized System

## Overview
This document defines the **unified** profile completion calculation used across:
- ✅ Database trigger (`calculate_profile_completion` function)
- ✅ Frontend ProfileCompletionCard component
- ✅ Smart Suggestions system

## Weight Distribution by Priority

### 🔴 CRITICAL (Weight: 15 each)
**These are THE most important fields for all users**

| Field | Weight | Applies To | Why Critical |
|-------|--------|------------|--------------|
| `avatar_url` | **15** | ALL | Visual identity - first thing users see |
| `primary_skill` | **15** | ALL | What you do - essential for matching |

### 🟠 HIGH PRIORITY (Weight: 10-12)

| Field | Weight | Applies To | Category |
|-------|--------|------------|----------|
| `specializations` | 12 | ALL | Professional |
| `bio` | 10 | ALL | Basic |
| `years_experience` | 10 | ALL | Professional |
| `talent_categories` | 10 | TALENT only | Professional |
| `hourly_rate_min` | 10 | ALL | Professional |

### 🟡 MEDIUM PRIORITY (Weight: 5-8)

| Field | Weight | Applies To | Category |
|-------|--------|------------|----------|
| `city` | 8 | ALL | Location |
| `equipment_list` | 8 | CONTRIBUTOR only | Equipment |
| `portfolio_url` | 8 | ALL | Portfolio |
| `experience_level` | 8 | ALL | Professional |
| `editing_software` | 6 | CONTRIBUTOR only | Equipment |
| `typical_turnaround_days` | 6 | ALL | Professional |
| `height_cm` | 6 | TALENT only | Physical |
| `availability_status` | 5 | ALL | Professional |
| `country` | 5 | ALL | Location |
| `phone_number` | 5 | ALL | Contact |
| `website_url` | 5 | ALL | Portfolio |

### 🟢 LOW PRIORITY (Weight: 2-4)

| Field | Weight | Applies To | Category |
|-------|--------|------------|----------|
| `available_for_travel` | 4 | ALL | Professional |
| `languages` | 4 | ALL | Contact |
| `studio_name` | 4 | CONTRIBUTOR only | Equipment |
| `weight_kg` | 4 | TALENT only | Physical |
| `body_type` | 4 | TALENT only | Physical |
| `gender_identity` | 4 | TALENT only | Demographics |
| `has_studio` | 3 | CONTRIBUTOR only | Equipment |
| `instagram_handle` | 3 | ALL | Social |
| `eye_color` | 3 | TALENT only | Physical |
| `hair_color` | 3 | TALENT only | Physical |
| `ethnicity` | 3 | TALENT only | Demographics |
| `nationality` | 3 | TALENT only | Demographics |
| `tiktok_handle` | 2 | ALL | Social |
| `hair_length` | 2 | TALENT only | Physical |
| `skin_tone` | 2 | TALENT only | Physical |
| `tattoos` + `piercings` | 2 (1+1) | TALENT only | Physical |

## Total Weight by Role

### TALENT Profile
- **Universal Fields**: 117 points
- **Talent-Specific Fields**: 54 points
- **TOTAL**: 171 points

### CONTRIBUTOR Profile
- **Universal Fields**: 117 points
- **Contributor-Specific Fields**: 21 points
- **TOTAL**: 138 points

### BOTH (Talent + Contributor)
- **Universal Fields**: 117 points
- **Talent-Specific Fields**: 54 points
- **Contributor-Specific Fields**: 21 points
- **TOTAL**: 192 points

## James Murphy Example (TALENT)

### Current Fields Filled:
- ✅ avatar_url: ❌ (NO - needs to upload!)
- ✅ primary_skill: "Actor" (15 points)
- ✅ bio: Present (10 points)
- ✅ city: "Galway" (8 points)
- ✅ country: "Ireland" (5 points)
- ✅ experience_level: "professional" (8 points)
- ✅ availability_status: "Busy" (5 points)
- ✅ available_for_travel: false (4 points)
- ✅ languages: ["English"] (4 points)
- ✅ talent_categories: ["Actor", "Performer"] (10 points)
- ✅ height_cm: 180 (6 points)
- ✅ eye_color: "Blue" (3 points)
- ✅ hair_color: "Brown" (3 points)
- ✅ gender_identity: "male" (4 points)
- ✅ ethnicity: "white/caucasian" (3 points)
- ✅ nationality: "Irish" (3 points)
- ✅ tattoos: true (1 point)

### Calculation:
**Completed**: 15+10+8+5+8+5+4+4+10+6+3+3+4+3+3+1 = **92 points**
**Total Possible**: 171 points
**Percentage**: 92/171 = **53.8%** ≈ **54%**

### Missing High-Impact Fields:
1. 🔴 **Avatar Photo** (15 points) - CRITICAL!
2. 🟠 Specializations (12 points)
3. 🟠 Years Experience (10 points)
4. 🟠 Hourly Rate (10 points)

## Migration File
📄 `supabase/migrations/20251008130000_centralized_profile_completion.sql`

## Frontend Files
📄 `apps/web/lib/utils/smart-suggestions.ts`
📄 `apps/web/components/profile/sections/ProfileCompletionCard.tsx`

