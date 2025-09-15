# Languages System Documentation

## Overview

The new languages system provides a comprehensive solution for managing user languages with predefined options and custom language support. It replaces the simple `TEXT[]` array with a structured approach that includes proficiency levels, primary language designation, and extensive language metadata.

## Database Structure

### Tables Created

1. **`languages_master`** - Master list of predefined languages
   - Contains 87+ languages including popular, regional, sign, and constructed languages
   - Includes native names, ISO codes, regions, and popularity flags
   - Supports sorting and filtering

2. **`user_languages`** - User language selections
   - Links users to languages (predefined or custom)
   - Tracks proficiency levels (beginner, intermediate, advanced, native)
   - Supports primary language designation (one per user)
   - Allows custom language names for languages not in master list

### Key Features

- **Predefined Languages**: 87+ languages with metadata (native names, ISO codes, regions)
- **Custom Languages**: Users can add languages not in the predefined list
- **Proficiency Levels**: Four levels from beginner to native
- **Primary Language**: Each user can designate one primary language
- **Backward Compatibility**: Maintains sync with existing `languages` column
- **Search & Filtering**: Full-text search across language names and codes
- **Popular Languages**: Priority display for commonly spoken languages

## Migration Files

### 072_languages_system.sql
- Creates the core languages system
- Populates 87+ predefined languages
- Sets up RLS policies and indexes
- Creates management functions

### 073_migrate_existing_languages_data.sql
- Migrates existing data from `users_profile.languages` array
- Creates backward compatibility triggers
- Maintains sync between old and new systems

### 074_languages_usage_examples.sql
- Provides comprehensive usage examples
- Creates helper views and functions
- Demonstrates common query patterns

## API Functions

### Core Functions

```sql
-- Get user's languages
SELECT * FROM get_user_languages(profile_id);

-- Add a language to user
SELECT add_user_language(profile_id, language_id, custom_name, proficiency, is_primary);

-- Remove a language from user
SELECT remove_user_language(user_language_id);

-- Search languages
SELECT * FROM search_languages('spanish');

-- Get popular languages for UI
SELECT * FROM get_popular_languages(20);

-- Get all languages
SELECT * FROM get_all_languages(100);
```

### Helper Functions

```sql
-- Get language suggestions
SELECT * FROM get_language_suggestions(profile_id, 5);

-- Validate proficiency level
SELECT validate_language_proficiency('advanced');

-- Get user language summary
SELECT * FROM user_language_summary WHERE profile_id = 'uuid';
```

## Usage Examples

### Adding Languages

```sql
-- Add predefined language
SELECT add_user_language(
    'profile-uuid'::UUID,
    'language-uuid'::UUID,  -- From languages_master
    NULL,                   -- No custom name
    'advanced',             -- Proficiency level
    TRUE                    -- Set as primary
);

-- Add custom language
SELECT add_user_language(
    'profile-uuid'::UUID,
    NULL,                   -- No predefined language
    'Klingon',              -- Custom language name
    'beginner',             -- Proficiency level
    FALSE                   -- Not primary
);
```

### Querying Languages

```sql
-- Find users who speak Spanish
SELECT DISTINCT up.display_name, up.handle
FROM users_profile up
JOIN user_languages ul ON up.id = ul.profile_id
JOIN languages_master lm ON ul.language_id = lm.id
WHERE lm.name = 'Spanish';

-- Find users with multiple languages
SELECT up.display_name, COUNT(ul.id) as language_count
FROM users_profile up
JOIN user_languages ul ON up.id = ul.profile_id
GROUP BY up.id, up.display_name
HAVING COUNT(ul.id) > 1
ORDER BY language_count DESC;
```

## Language Categories

### Popular Languages (Priority Display)
- English, Mandarin Chinese, Spanish, Hindi, Arabic
- Portuguese, Bengali, Russian, Japanese, Punjabi
- French, German, Italian, Dutch, Swedish, etc.

### Regional Languages
- European: Polish, Czech, Hungarian, Romanian, Greek, Turkish
- Asian: Korean, Vietnamese, Thai, Indonesian, Malay, Tagalog
- African: Swahili, Amharic, Hausa, Yoruba, Igbo, Zulu
- American: Quechua, Guarani, Nahuatl, Aymara

### Special Categories
- Sign Languages: ASL, BSL, French Sign Language, etc.
- Constructed Languages: Esperanto, Klingon, Dothraki, Valyrian

## Frontend Integration

### Dropdown Population
```javascript
// Get popular languages for primary dropdown
const popularLanguages = await supabase
  .rpc('get_popular_languages', { limit_count: 20 });

// Search for specific languages
const searchResults = await supabase
  .rpc('search_languages', { p_search_term: 'spanish' });
```

### User Language Management
```javascript
// Add a language
const { data } = await supabase
  .rpc('add_user_language', {
    p_profile_id: userProfileId,
    p_language_id: selectedLanguageId,
    p_proficiency_level: 'intermediate',
    p_is_primary: false
  });

// Get user's languages
const { data: userLanguages } = await supabase
  .rpc('get_user_languages', { p_profile_id: userProfileId });
```

## Data Migration

The system automatically migrates existing `languages` array data:
- Converts array elements to structured language records
- Attempts to match with predefined languages
- Falls back to custom language names for unmatched entries
- Sets first language as primary
- Maintains backward compatibility

## Security

- **RLS Policies**: Users can only access their own language data
- **Public Read Access**: Languages master list is publicly readable
- **Data Validation**: Constraints ensure data integrity
- **Audit Trail**: All changes tracked with timestamps

## Performance

- **Indexes**: Optimized for common query patterns
- **Views**: Pre-computed summaries for fast lookups
- **Functions**: Efficient language operations
- **Caching**: Popular languages cached for UI performance

## Future Enhancements

Potential additions to the system:
- Language learning progress tracking
- Language exchange matching
- Gig language requirements
- Translation services integration
- Language proficiency verification
- Regional language preferences

## Maintenance

### Adding New Languages
```sql
INSERT INTO languages_master (name, native_name, iso_code, region, is_popular, sort_order)
VALUES ('New Language', 'Native Name', 'code', 'Region', false, 999);
```

### Updating Language Metadata
```sql
UPDATE languages_master 
SET is_popular = true, sort_order = 5
WHERE name = 'Language Name';
```

### Cleaning Up Custom Languages
```sql
-- Find frequently used custom languages to add to master list
SELECT custom_language_name, COUNT(*) as usage_count
FROM user_languages
WHERE custom_language_name IS NOT NULL
GROUP BY custom_language_name
ORDER BY usage_count DESC;
```

This comprehensive languages system provides a robust foundation for multilingual user management while maintaining flexibility for custom language needs.
