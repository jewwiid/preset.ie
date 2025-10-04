# Gig Applicant Preferences Schema

## Overview
When creating a gig, you can specify detailed requirements for applicants. The matchmaking system will score applicants based on how well they match your preferences.

## Complete Preferences JSON Structure

```json
{
  "physical": {
    "height_range": {"min": 165, "max": 185},
    "eye_colors": ["blue", "green", "hazel"],
    "hair_colors": ["blonde", "brown", "red"],
    "hair_lengths": ["medium", "long"],
    "skin_tones": ["fair", "light", "medium"],
    "body_types": ["slim", "athletic", "average"],
    "tattoos_allowed": true,
    "piercings_allowed": false
  },
  "demographics": {
    "gender_identities": ["female", "non_binary"],
    "ethnicities": ["caucasian", "asian", "mixed_race"],
    "nationalities": ["American", "British", "Canadian"]
  },
  "professional": {
    "experience_levels": ["intermediate", "advanced", "professional"],
    "specializations": ["Portrait Photography", "Fashion Photography", "Commercial Modeling"]
  },
  "work_preferences": {
    "accepts_tfp": true,
    "location_type": "studio",
    "schedule": "weekends"
  }
}
```

## Detailed Field Reference

### Physical Attributes (35 points max)

#### `height_range` (10 points)
```json
"height_range": {"min": 165, "max": 185}
```
- Height in centimeters
- Both `min` and `max` are optional
- User must have height within range to match

#### `eye_colors` (5 points)
```json
"eye_colors": ["blue", "green", "hazel", "brown", "grey"]
```
**Available options:**
- blue, green, hazel, brown, grey, amber, black

#### `hair_colors` (5 points)
```json
"hair_colors": ["blonde", "brown", "red"]
```
**Available options:**
- blonde, brown, black, red, auburn, grey, white, other

#### `hair_lengths` (3 points) ✨ NEW
```json
"hair_lengths": ["short", "medium", "long"]
```
**Available options:**
- very_short, short, medium, long, very_long

#### `skin_tones` (3 points) ✨ NEW
```json
"skin_tones": ["fair", "light", "medium"]
```
**Available options:**
- very_fair, fair, light, medium, olive, tan, dark, very_dark

#### `body_types` (4 points) ✨ NEW
```json
"body_types": ["slim", "athletic"]
```
**Available options:**
- petite, slim, athletic, average, curvy, plus_size, muscular, tall, short, other

#### `tattoos_allowed` (3 points)
```json
"tattoos_allowed": true
```
- `true`: Tattoos are okay
- `false`: No tattoos allowed (users with tattoos won't match well)

#### `piercings_allowed` (2 points)
```json
"piercings_allowed": false
```
- `true`: Piercings are okay
- `false`: No piercings allowed

---

### Demographics (15 points max) ✨ NEW

#### `gender_identities` (8 points)
```json
"gender_identities": ["female", "non_binary"]
```
**Available options:**
- male, female, non_binary, genderfluid, agender, transgender_male, transgender_female, other, prefer_not_to_say

#### `ethnicities` (4 points)
```json
"ethnicities": ["caucasian", "asian"]
```
**Available options:**
- african_american, asian, caucasian, hispanic_latino, middle_eastern, native_american, pacific_islander, mixed_race, other, prefer_not_to_say

#### `nationalities` (3 points)
```json
"nationalities": ["American", "British", "Canadian"]
```
- 167 countries available (full alphabetical list from database)

---

### Professional Requirements (20 points max)

#### `experience_levels` (8 points) ✨ NEW
```json
"experience_levels": ["intermediate", "advanced", "professional"]
```
**Available options:**
- beginner, intermediate, advanced, professional, expert

#### `specializations` (12 points)
```json
"specializations": ["Portrait Photography", "Fashion Photography"]
```
- Array of required specializations
- Score is proportional to how many match
- Example: If you require 4 specs and user has 3 → 9 points (75% of 12)

---

### Work Preferences (10 points max) ✨ NEW

#### `accepts_tfp` (3 points)
```json
"accepts_tfp": true
```
- Match users who accept TFP work
- Important for unpaid collaboration gigs

#### `location_type` (4 points)
```json
"location_type": "studio"
```
**Options:**
- `studio`: Matches users who prefer studio work
- `outdoor`: Matches users who prefer outdoor/location shoots

#### `schedule` (3 points)
```json
"schedule": "weekends"
```
**Options:**
- `weekdays`: Matches users available on weekdays
- `weekends`: Matches users available on weekends
- `evenings`: Matches users available for evening work

---

## Scoring System

### How It Works

**Total possible points:** Base 20 + sum of all requirements you specify (up to 100 max)

**Example calculation:**
```
You specify:
- height_range (10 pts)
- eye_colors (5 pts)
- gender_identities (8 pts)
- experience_levels (8 pts)

Total possible = 20 (base) + 10 + 5 + 8 + 8 = 51 points

User matches:
- height ✅ (10 pts)
- eye_color ✅ (5 pts)
- gender ✅ (8 pts)
- experience ❌ (0 pts)

User score = (20 + 10 + 5 + 8 + 0) / 51 * 100 = 84.3%
```

### Match Quality

- **90-100%**: Excellent match
- **75-89%**: Good match
- **60-74%**: Fair match
- **Below 60%**: Poor match

---

## Usage Examples

### Example 1: Fashion Model Gig
Looking for tall, experienced female models with specific look:

```json
{
  "physical": {
    "height_range": {"min": 175, "max": 185},
    "hair_colors": ["blonde", "brown"],
    "hair_lengths": ["long", "very_long"],
    "skin_tones": ["fair", "light"],
    "body_types": ["slim", "athletic"],
    "tattoos_allowed": false,
    "piercings_allowed": false
  },
  "demographics": {
    "gender_identities": ["female"]
  },
  "professional": {
    "experience_levels": ["advanced", "professional", "expert"],
    "specializations": ["Fashion Modeling", "Runway Modeling"]
  }
}
```

### Example 2: Creative Portrait Collaboration (TFP)
Open to diverse talent, creative shoot:

```json
{
  "physical": {
    "tattoos_allowed": true,
    "piercings_allowed": true
  },
  "professional": {
    "experience_levels": ["beginner", "intermediate", "advanced"],
    "specializations": ["Portrait Modeling", "Creative Modeling"]
  },
  "work_preferences": {
    "accepts_tfp": true,
    "location_type": "outdoor",
    "schedule": "weekends"
  }
}
```

### Example 3: Commercial Ad Campaign
Specific requirements for brand campaign:

```json
{
  "physical": {
    "height_range": {"min": 165, "max": 180},
    "age_range": {"min": 25, "max": 40},
    "body_types": ["average", "athletic"],
    "ethnicity": ["asian", "mixed_race"],
    "tattoos_allowed": false
  },
  "demographics": {
    "gender_identities": ["male", "female"],
    "nationalities": ["American", "Canadian"]
  },
  "professional": {
    "experience_levels": ["professional", "expert"],
    "specializations": ["Commercial Modeling", "Print Advertising"]
  },
  "work_preferences": {
    "accepts_tfp": false,
    "location_type": "studio",
    "schedule": "weekdays"
  }
}
```

---

## Implementation

### Setting Preferences (Backend)
```sql
SELECT set_gig_preferences(
    'gig-uuid-here',
    '{"physical": {...}, "demographics": {...}}'::JSONB
);
```

### Calculating Compatibility
```sql
SELECT *
FROM calculate_gig_compatibility_with_preferences(
    'profile-uuid-here',
    'gig-uuid-here'
);
```

**Returns:**
- `score`: Overall match percentage (0-100)
- `breakdown`: Detailed scoring by category
- `matched_attributes`: List of what matched
- `missing_requirements`: List of what's missing from profile

---

## Frontend Implementation

When creating a gig, the form should allow selecting:

1. **Physical Requirements** (optional):
   - Height range sliders
   - Multi-select for eye colors, hair colors, hair lengths, skin tones, body types
   - Checkboxes for tattoos/piercings allowed

2. **Demographics** (optional):
   - Multi-select for gender identities, ethnicities
   - Searchable dropdown for nationalities

3. **Professional** (optional):
   - Multi-select for experience levels
   - Tag input for specializations

4. **Work Preferences** (optional):
   - TFP checkbox
   - Radio for location type
   - Radio for schedule preference

All fields should be **optional** - only specify what truly matters for the gig!

---

## Best Practices

1. **Only specify what matters**: Don't add requirements that aren't truly necessary
2. **Be inclusive**: Avoid unnecessary restrictions on demographics
3. **Use ranges**: For height/age, use ranges rather than exact values
4. **Consider TFP carefully**: Only require TFP acceptance if truly unpaid
5. **Prioritize skills**: Professional requirements should carry more weight than appearance
6. **Test your preferences**: Use the compatibility function to see how many users match

---

## Migration Reference
- Migration 20251004000009: Enhanced gig matching with all new attributes
- Database: `gigs.applicant_preferences` (JSONB column)
