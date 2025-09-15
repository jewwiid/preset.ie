# Enhanced Demographics and Matchmaking System

## Overview

This migration (`077_enhanced_demographics_and_matchmaking.sql`) introduces a comprehensive demographic and professional information system to significantly improve gig matching and user discovery on the Preset platform. The system addresses the current gaps in matchmaking by providing detailed user profiles, professional specializations, and intelligent compatibility scoring.

## Key Features

### 🎯 **Intelligent Matchmaking**
- **Compatibility Scoring**: Algorithm that calculates compatibility between users and gigs based on multiple factors
- **Smart Filtering**: Advanced filtering based on demographics, experience, location, and preferences
- **Recommendation Engine**: Functions to find compatible users for gigs and vice versa

### 👥 **Comprehensive Demographics**
- **Inclusive Identity Options**: Gender identity, ethnicity, nationality with respectful and comprehensive options
- **Physical Attributes**: Height, weight, body type, eye/hair color for talent matching
- **Location & Travel**: Country, state, city, timezone, travel preferences, passport status
- **Privacy Controls**: Granular privacy settings for each demographic field

### 💼 **Professional Specializations**
- **Categorized Skills**: Organized specializations (Photography, Videography, Modeling, Styling, etc.)
- **Skill Levels**: Beginner to Expert proficiency tracking
- **Experience Tracking**: Years of experience per specialization
- **Portfolio Integration**: Link specializations to portfolio items

### 🛠️ **Equipment & Tools**
- **Equipment Categories**: Organized equipment types and brands
- **Software Proficiency**: Track software skills (Photoshop, Lightroom, Premiere Pro, etc.)
- **Certification Tracking**: Professional certifications and credentials
- **Cost Management**: Track subscription costs for software tools

### ⚙️ **Work Preferences**
- **Compensation Preferences**: Hourly rate ranges, TFP acceptance, expenses-only options
- **Schedule Flexibility**: Weekday/weekend availability, evening/overnight preferences
- **Content Comfort**: Comfort levels with different types of content
- **Collaboration Style**: Solo work vs. team collaboration preferences

## Database Schema

### Core Tables

#### 1. `user_demographics`
Stores comprehensive demographic information with privacy controls.

**Key Fields:**
- `gender_identity`: Inclusive gender options
- `ethnicity`: Comprehensive ethnicity options
- `nationality`: Country of origin
- `date_of_birth` / `age`: Age verification and calculation
- `height_cm`, `weight_kg`, `body_type`: Physical attributes
- `eye_color`, `hair_color`, `skin_tone`: Appearance details
- `years_experience`, `experience_level`: Professional experience
- `country`, `state_province`, `city`: Location information
- `available_for_travel`, `travel_radius_km`: Travel preferences
- `availability_status`: Current availability
- `show_age`, `show_location`, `show_physical_attributes`: Privacy settings

#### 2. `specialization_categories`
Organizes specializations into logical categories.

**Categories:**
- Photography
- Videography  
- Modeling
- Styling
- Makeup
- Hair Styling
- Post-Production
- Production

#### 3. `specializations`
Individual specializations within categories.

**Examples:**
- Photography: Portrait, Fashion, Commercial, Wedding, Street, Nature, Product, Documentary
- Videography: Cinematography, Documentary Video, Commercial Video, Music Video, Event Videography
- Modeling: Fashion Model, Commercial Model, Portrait Model, Fitness Model, Plus Size Model

#### 4. `user_specializations`
Junction table linking users to their specializations.

**Fields:**
- `skill_level`: Beginner, Intermediate, Advanced, Expert
- `years_experience`: Years of experience in this specialization
- `is_primary`: Whether this is a primary specialization
- `portfolio_items`: References to relevant portfolio pieces

#### 5. `work_preferences`
User work preferences and requirements.

**Key Areas:**
- Compensation preferences (hourly rates, TFP acceptance)
- Work type preferences (studio vs. outdoor, shoot duration)
- Schedule preferences (weekdays, weekends, evenings)
- Content comfort levels (nudity, intimate content)
- Collaboration preferences (solo vs. team work)

#### 6. `gig_requirements`
Detailed requirements for gigs to enable better matching.

**Requirement Types:**
- Demographic requirements (gender, ethnicity, age range, height range)
- Professional requirements (experience level, specializations)
- Physical requirements (body type, eye/hair color, tattoos/piercings)
- Location requirements (local only, travel required, passport needed)
- Equipment requirements (specific equipment or software needed)
- Content requirements (nudity involved, model release required)

### Supporting Tables

#### 7. `equipment_categories`
Organized equipment categories with hierarchical structure.

#### 8. `software_tools`
Software and tools with subscription information and costs.

#### 9. `user_software_proficiency`
User proficiency in specific software tools.

## Matchmaking Algorithm

### Compatibility Scoring

The `calculate_gig_compatibility()` function calculates a compatibility score (0-100) based on:

1. **Gender Compatibility** (20 points)
   - Matches user's gender identity with gig requirements
   - No penalty if no gender requirements specified

2. **Age Compatibility** (20 points)
   - Checks if user's age falls within gig's age range
   - No penalty if no age requirements specified

3. **Height Compatibility** (15 points)
   - Matches user's height with gig's height requirements
   - No penalty if no height requirements specified

4. **Experience Compatibility** (25 points)
   - Compares user's years of experience with gig requirements
   - No penalty if no experience requirements specified

5. **Specialization Compatibility** (20 points)
   - Calculates percentage of required specializations that user has
   - Weighted by number of matching specializations

### Minimum Compatibility Threshold

- **60% compatibility score** required for recommendations
- Ensures only genuinely compatible matches are suggested
- Prevents low-quality matches from cluttering results

## Helper Functions

### 1. `find_compatible_users_for_gig(gig_id, limit)`
Finds users compatible with a specific gig.

**Returns:**
- `profile_id`: User's profile ID
- `compatibility_score`: Calculated compatibility score
- `match_factors`: Detailed breakdown of match factors
- `display_name`: User's display name
- `city`: User's city

### 2. `find_compatible_gigs_for_user(profile_id, limit)`
Finds gigs compatible with a specific user.

**Returns:**
- `gig_id`: Gig ID
- `compatibility_score`: Calculated compatibility score
- `match_factors`: Detailed breakdown of match factors
- `title`: Gig title
- `location_text`: Gig location
- `start_time`: Gig start time

## Privacy and Security

### Row Level Security (RLS)
- **Public Demographics**: Only shows fields marked as public by user
- **Private Information**: Demographics only visible to user themselves
- **Specializations**: Publicly visible for matchmaking
- **Work Preferences**: Publicly visible for gig matching
- **Gig Requirements**: Publicly visible for user matching

### Privacy Controls
- `show_age`: Control age visibility
- `show_location`: Control location visibility  
- `show_physical_attributes`: Control physical attribute visibility

### Data Validation
- Age constraints (18+ minimum)
- Height/weight reasonable ranges
- Experience years validation
- Travel radius validation

## Performance Optimizations

### Indexes
- **Demographic Indexes**: Gender, ethnicity, age, height, location
- **Specialization Indexes**: Category-based and user-based lookups
- **Compatibility Indexes**: Multi-column indexes for complex queries
- **GIN Indexes**: For array fields (specializations, requirements)

### Query Optimization
- **Lateral Joins**: Efficient compatibility calculations
- **Composite Indexes**: Multi-column indexes for common query patterns
- **Partial Indexes**: Indexes on filtered subsets (active records only)

## Usage Examples

### Finding Compatible Users for a Gig

```sql
-- Find users compatible with a specific gig
SELECT * FROM find_compatible_users_for_gig('gig-uuid-here', 10);
```

### Finding Compatible Gigs for a User

```sql
-- Find gigs compatible with a specific user
SELECT * FROM find_compatible_gigs_for_user('profile-uuid-here', 10);
```

### Calculating Compatibility Score

```sql
-- Calculate compatibility between user and gig
SELECT * FROM calculate_gig_compatibility('profile-uuid', 'gig-uuid');
```

### Adding User Demographics

```sql
-- Insert user demographics
INSERT INTO user_demographics (
    profile_id, gender_identity, ethnicity, nationality, 
    height_cm, years_experience, country, city
) VALUES (
    'profile-uuid', 'female', 'asian', 'American',
    165, 3, 'United States', 'New York'
);
```

### Adding User Specializations

```sql
-- Add user specializations
INSERT INTO user_specializations (
    profile_id, specialization_id, skill_level, years_experience, is_primary
) VALUES (
    'profile-uuid', 'specialization-uuid', 'intermediate', 2, true
);
```

### Setting Gig Requirements

```sql
-- Set gig requirements
INSERT INTO gig_requirements (
    gig_id, required_gender, age_range_min, age_range_max,
    height_range_min, height_range_max, required_years_experience
) VALUES (
    'gig-uuid', ARRAY['female'], 20, 35, 160, 180, 2
);
```

## Benefits for Preset Platform

### 1. **Improved User Experience**
- **Better Matches**: More relevant gig recommendations
- **Reduced Noise**: Filter out incompatible opportunities
- **Faster Discovery**: Quick access to suitable gigs/users

### 2. **Enhanced Platform Value**
- **Higher Success Rates**: Better matches lead to more successful collaborations
- **User Retention**: Relevant recommendations keep users engaged
- **Premium Features**: Advanced filtering can be a premium feature

### 3. **Data-Driven Insights**
- **Market Analysis**: Understand user demographics and preferences
- **Trend Identification**: Spot emerging specializations and skills
- **Pricing Intelligence**: Analyze rate preferences and market rates

### 4. **Professional Development**
- **Skill Tracking**: Help users identify skill gaps
- **Career Progression**: Track experience and specialization growth
- **Portfolio Optimization**: Link specializations to portfolio pieces

## Migration Notes

### Backward Compatibility
- All new tables are additive (no changes to existing tables)
- Existing functionality remains unchanged
- Gradual adoption possible (users can opt-in to new features)

### Data Population
- Default specialization categories and specializations included
- Common software tools pre-populated
- Users can add their own custom specializations

### Performance Considerations
- Indexes created for optimal query performance
- Compatibility calculations optimized with lateral joins
- Caching strategies can be implemented for frequently accessed data

## Future Enhancements

### 1. **Machine Learning Integration**
- **Behavioral Analysis**: Learn from user interactions
- **Predictive Matching**: Improve recommendations over time
- **Dynamic Scoring**: Adjust compatibility weights based on success rates

### 2. **Advanced Filtering**
- **Saved Searches**: Users can save complex filter combinations
- **Alert System**: Notifications for new compatible gigs/users
- **Geographic Clustering**: Group users by geographic proximity

### 3. **Analytics Dashboard**
- **User Insights**: Demographic and skill distribution
- **Market Trends**: Popular specializations and skills
- **Success Metrics**: Match quality and collaboration success rates

### 4. **Integration Features**
- **Calendar Integration**: Availability synchronization
- **Portfolio Linking**: Direct integration with portfolio systems
- **Social Verification**: Link to social media profiles for verification

## Conclusion

This enhanced demographics and matchmaking system transforms Preset from a basic gig platform into an intelligent, data-driven creative collaboration ecosystem. By providing comprehensive user profiles, professional specializations, and intelligent matching algorithms, the platform can deliver significantly better user experiences and higher success rates for creative collaborations.

The system is designed to be:
- **Scalable**: Handles growing user base and data volume
- **Flexible**: Adapts to changing market needs and user preferences  
- **Privacy-Focused**: Respects user privacy while enabling effective matching
- **Performance-Optimized**: Fast queries and efficient data structures
- **Future-Ready**: Extensible architecture for advanced features

This foundation enables Preset to compete effectively in the creative collaboration space by providing superior matchmaking capabilities that help users find the right opportunities and collaborators for their creative projects.
