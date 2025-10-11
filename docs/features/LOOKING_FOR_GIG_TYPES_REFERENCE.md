# "Looking For" / Gig Type Reference Document

## Overview
This document maps the available "Looking For" options for gig creation based on:
1. **Homepage "Connecting" section** - Roles featured on the platform
2. **Database tables** - `predefined_talent_categories` and `specializations`
3. **Current implementation** - `gig-form-persistence.ts`

---

## Current Implementation (gig-form-persistence.ts)

```typescript
export type LookingForType = 
  | 'MODELS'
  | 'ACTORS'
  | 'PHOTOGRAPHERS'
  | 'VIDEOGRAPHERS'
  | 'MAKEUP_ARTISTS'
  | 'HAIR_STYLISTS'
  | 'FASHION_STYLISTS'
  | 'PRODUCTION_CREW'
  | 'CREATIVE_DIRECTORS'
  | 'ART_DIRECTORS'
  | 'OTHER'
```

**Status**: ✅ Good foundation, but missing many roles from database and homepage

---

## Homepage "Connecting" Section Roles

### Row 1 (Left to Right)
1. PHOTOGRAPHERS
2. VIDEOGRAPHERS
3. FREELANCERS
4. CREATIVE DIRECTORS
5. BRAND MANAGERS
6. CONTENT CREATORS
7. ART DIRECTORS
8. AGENCIES
9. ENTREPRENEURS
10. INFLUENCERS
11. MARKETING TEAMS
12. SOCIAL MEDIA MANAGERS

### Row 2 (Right to Left)
1. STUDIOS
2. MODELS
3. MAKEUP ARTISTS
4. HAIR STYLISTS
5. FASHION STYLISTS
6. PRODUCERS
7. DESIGNERS
8. EDITORS
9. RETOUCHERS
10. WRITERS
11. ANIMATORS
12. ILLUSTRATORS

**Total**: 24 roles featured on homepage

---

## Database: predefined_talent_categories Table

### Talent/Performer Categories (20 total)

```sql
-- From: supabase/migrations/20251004000011_add_talent_categories.sql

1. Model                    -- Professional model for photography and video shoots
2. Actor                    -- Performer for video, film, and commercial content
3. Actress                  -- Female performer for video, film, and commercial content
4. Dancer                   -- Professional dancer and choreographer
5. Musician                 -- Musical performer and artist
6. Singer                   -- Vocal performer
7. Voice Actor              -- Voice-over artist and narrator
8. Influencer               -- Social media content creator and influencer
9. Content Creator          -- Digital content creator across platforms
10. Performer               -- General performance artist
11. Stunt Performer         -- Professional stunt artist
12. Extra/Background Actor  -- Background performer for productions
13. Hand Model              -- Specialized hand modeling
14. Fitness Model           -- Fitness and athletic modeling
15. Commercial Model        -- Commercial and advertising modeling
16. Fashion Model           -- Runway and fashion modeling
17. Plus-Size Model         -- Plus-size fashion and commercial modeling
18. Child Model             -- Child talent for productions
19. Teen Model              -- Teenage talent for productions
20. Mature Model            -- Mature/senior talent for productions
```

---

## Database: specializations Table

### Categories and Specializations (49 total)

#### **Photography (15 specializations)**
1. Portrait Photography
2. Fashion Photography
3. Wedding Photography
4. Commercial Photography
5. Product Photography
6. Architecture Photography
7. Street Photography
8. Sports Photography
9. Food Photography
10. Travel Photography
11. Fine Art Photography
12. Documentary Photography
13. Event Photography
14. Real Estate Photography
15. Medical Photography

#### **Videography (10 specializations)**
16. Corporate Video
17. Wedding Videography
18. Documentary Filmmaking
19. Music Video Production
20. Commercial Video
21. Social Media Content
22. Live Streaming
23. Event Videography
24. Educational Video
25. Drone Videography

#### **Post-Production (8 specializations)**
26. Video Editing
27. Color Grading
28. Motion Graphics
29. Visual Effects (VFX)
30. Audio Post-Production
31. 3D Animation
32. Title Design
33. Video Compression

#### **Technical (8 specializations)**
34. Camera Operation
35. Lighting Design
36. Audio Engineering
37. Equipment Management
38. Studio Management
39. Drone Operation
40. Stabilization Systems
41. Live Production

#### **Business (8 specializations)**
42. Project Management
43. Client Relations
44. Marketing Strategy
45. Business Development
46. Team Leadership
47. Budget Management
48. Contract Negotiation
49. Quality Assurance

---

## Recommended "Looking For" Options (Consolidated)

### **Tier 1: Primary Roles (Most Common)**

#### **Talent/Performers** 🎭
- Models (All Types)
  - Fashion Models
  - Commercial Models
  - Fitness Models
  - Plus-Size Models
  - Hand Models
  - Child/Teen/Mature Models
- Actors/Actresses
- Dancers
- Musicians & Singers
- Voice Actors
- Performers (General)

#### **Content Creators** 📱
- Influencers
- Content Creators
- Social Media Managers

#### **Visual Creators** 📸
- Photographers
  - Portrait Photography
  - Fashion Photography
  - Commercial Photography
  - Event Photography
  - Product Photography
- Videographers
  - Commercial Video
  - Documentary Filmmaking
  - Music Video Production
  - Social Media Content

#### **Production & Crew** 🎬
- Production Crew
  - Camera Operators
  - Lighting Technicians
  - Audio Engineers
  - Equipment Managers
  - Drone Operators
- Producers
- Directors
  - Creative Directors
  - Art Directors

#### **Post-Production** 🎨
- Editors (Video/Photo)
- Color Grading
- VFX Artists
- Motion Graphics Designers
- 3D Animators

#### **Styling & Beauty** 💄
- Makeup Artists
- Hair Stylists
- Fashion Stylists
- Wardrobe Stylists

#### **Design & Creative** 🎨
- Designers
  - Graphic Designers
  - UI/UX Designers
  - Set Designers
- Illustrators
- Animators
- Retouchers

#### **Business & Strategy** 💼
- Brand Managers
- Marketing Teams
- Project Managers
- Agencies
- Studios

#### **Writing & Content** ✍️
- Writers
- Copywriters
- Script Writers
- Content Strategists

---

## Proposed Implementation Structure

### **Option A: Hierarchical Dropdown**

```
Looking For: *

┌─────────────────────────────────────┐
│ 🎭 Talent & Performers              │ ← Category
│   • Models (All Types)              │
│   • Actors/Actresses                │
│   • Dancers                         │
│   • Musicians & Singers             │
│   • Voice Actors                    │
│                                     │
│ 📸 Visual Creators                  │
│   • Photographers                   │
│   • Videographers                   │
│                                     │
│ 🎬 Production & Crew                │
│   • Production Crew                 │
│   • Producers                       │
│   • Directors                       │
│                                     │
│ 🎨 Post-Production                  │
│   • Editors                         │
│   • VFX Artists                     │
│   • Motion Graphics                 │
│                                     │
│ 💄 Styling & Beauty                 │
│   • Makeup Artists                  │
│   • Hair Stylists                   │
│   • Fashion Stylists                │
│                                     │
│ 🎨 Design & Creative                │
│   • Designers                       │
│   • Illustrators                    │
│   • Retouchers                      │
│                                     │
│ 📱 Content & Social                 │
│   • Influencers                     │
│   • Content Creators                │
│   • Social Media Managers           │
│                                     │
│ 💼 Business & Teams                 │
│   • Agencies                        │
│   • Brand Managers                  │
│   • Marketing Teams                 │
│                                     │
│ ✍️ Writing & Strategy               │
│   • Writers                         │
│   • Copywriters                     │
│   • Content Strategists             │
└─────────────────────────────────────┘
```

### **Option B: Flat List with Search**

```
Looking For: *

┌─────────────────────────────────────┐
│ Search or select...                 │
└─────────────────────────────────────┘

Recent / Popular:
• Models
• Photographers  
• Videographers
• Makeup Artists

All Options (alphabetically):
• Actors/Actresses
• Agencies
• Animators
• Art Directors
• Brand Managers
• Camera Operators
• Content Creators
... (scroll for more)
```

### **Option C: Multi-Select with Categories (RECOMMENDED)**

```
Who are you looking for? * (Select all that apply)

┌─────────────────────────────────────────────────────────┐
│ 🎭 Talent & Performers                                  │
│ ☐ Models          ☐ Actors/Actresses   ☐ Dancers       │
│ ☐ Musicians       ☐ Singers            ☐ Voice Actors  │
│ ☐ Influencers     ☐ Content Creators                   │
│                                                         │
│ 📸 Visual Creators                                      │
│ ☐ Photographers   ☐ Videographers                      │
│                                                         │
│ 🎬 Production                                           │
│ ☐ Production Crew ☐ Producers          ☐ Directors     │
│ ☐ Camera Ops      ☐ Lighting Tech      ☐ Audio Eng     │
│                                                         │
│ 🎨 Post & Design                                        │
│ ☐ Editors         ☐ VFX Artists        ☐ Motion Graphics│
│ ☐ Designers       ☐ Illustrators       ☐ Retouchers    │
│                                                         │
│ 💄 Styling & Beauty                                     │
│ ☐ Makeup Artists  ☐ Hair Stylists      ☐ Fashion Stylists│
│                                                         │
│ 💼 Business & Teams                                     │
│ ☐ Agencies        ☐ Brand Managers     ☐ Marketing Teams│
│                                                         │
│ + Show More Options                                     │
└─────────────────────────────────────────────────────────┘

ℹ️ Selecting multiple roles will show combined preferences
```

---

## Conditional Preferences Mapping

### When "Models" is Selected:
**Show**:
- Physical Attributes (height, measurements, eye/hair color)
- Age Range
- Modeling Categories (Fashion, Commercial, Fitness, etc.)
- Portfolio Required
- Travel Availability

**Hide**:
- Equipment Requirements
- Software Requirements
- Photography/Videography Specializations
- Technical Skills

### When "Photographers" is Selected:
**Show**:
- Photography Specializations
- Equipment Requirements
- Software Requirements (Lightroom, Photoshop, etc.)
- Experience Level
- Portfolio Required

**Hide**:
- Physical Attributes
- Modeling Categories
- Body Measurements

### When "Production Crew" is Selected:
**Show**:
- Technical Specializations (Camera Op, Lighting, Audio)
- Equipment Proficiency
- Union Status
- Certifications
- Experience Level

**Hide**:
- Physical Attributes
- Modeling Categories

### When "Makeup Artists" is Selected:
**Show**:
- Makeup Specializations (Beauty, SFX, Bridal, etc.)
- Kit Requirements
- Experience Level
- Portfolio Required
- Travel Availability

**Hide**:
- Photography Equipment
- Camera Skills

---

## Database Schema Recommendations

### **New Table: `gig_looking_for_types`**

```sql
CREATE TABLE gig_looking_for_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'MODELS', 'PHOTOGRAPHERS'
  display_name VARCHAR(100) NOT NULL,    -- e.g., 'Models', 'Photographers'
  category VARCHAR(50) NOT NULL,          -- e.g., 'talent', 'visual', 'production'
  icon_name VARCHAR(50),                  -- e.g., 'users', 'camera', 'film'
  description TEXT,
  show_physical_prefs BOOLEAN DEFAULT FALSE,
  show_equipment_prefs BOOLEAN DEFAULT FALSE,
  show_software_prefs BOOLEAN DEFAULT FALSE,
  show_modeling_categories BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert data
INSERT INTO gig_looking_for_types 
  (type_code, display_name, category, icon_name, show_physical_prefs, show_modeling_categories) 
VALUES 
  ('MODELS', 'Models', 'talent', 'users', TRUE, TRUE),
  ('PHOTOGRAPHERS', 'Photographers', 'visual', 'camera', FALSE, FALSE),
  ('VIDEOGRAPHERS', 'Videographers', 'visual', 'film', FALSE, FALSE);
```

### **Update `gigs` Table**

```sql
ALTER TABLE gigs 
ADD COLUMN looking_for_types TEXT[] DEFAULT '{}';

-- Index for querying
CREATE INDEX idx_gigs_looking_for ON gigs USING GIN (looking_for_types);
```

---

## Implementation Priority

### **Phase 1: Critical (Week 1)**
1. ✅ Add "Looking For" field to Basic Details step
2. ✅ Implement basic type selection (Models, Photographers, Videographers, etc.)
3. ✅ Store selection in database

### **Phase 2: Smart Preferences (Week 2)**
4. ✅ Implement conditional preferences display
5. ✅ Hide/show relevant options based on selection
6. ✅ Add multi-select capability

### **Phase 3: Polish (Week 3)**
7. ✅ Add search/filter functionality
8. ✅ Implement hierarchical categories
9. ✅ Add icons and visual indicators

---

## Summary

**Current Implementation**: 11 options
**Homepage Featured**: 24 roles
**Database Talent Categories**: 20 types
**Database Specializations**: 49 types
**Recommended Final List**: ~35-40 consolidated options

**Key Insight**: The platform already has rich data in the database (`predefined_talent_categories` and `specializations` tables) that should be leveraged for the "Looking For" dropdown. The current implementation in `gig-form-persistence.ts` only scratches the surface.

**Next Step**: Expand the `LookingForType` enum to include all major categories and implement conditional preferences display based on selection.

