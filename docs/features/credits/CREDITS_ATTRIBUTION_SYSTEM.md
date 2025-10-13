# Credits and Attribution System

## Overview

This system provides comprehensive crediting and attribution for all work created on the platform, including gigs, showcases, and collaboration projects. It ensures that everyone involved in a production (directors, models, makeup artists, stylists, extras, etc.) can be properly credited and their work is traceable and verifiable.

## Key Features

✅ **Role Assignment** - When accepting applicants, assign specific roles (MODEL, PHOTOGRAPHER, MAKEUP_ARTIST, etc.)
✅ **Custom Role Titles** - Use custom titles like "Lead Stylist" or "Assistant Director"
✅ **Multi-Collaborator Showcases** - Credit more than just creator + talent
✅ **Automatic Credit Tracking** - All accepted applicants automatically tracked
✅ **Credit History** - Complete portfolio/resume view for each user
✅ **Privacy Controls** - Users can control credit visibility
✅ **Platform Verification** - All credits verified through application system

---

## Database Schema

### New Fields in `applications` Table

```sql
- role_assigned TEXT       -- Role category (e.g., MODEL, PHOTOGRAPHER)
- role_title TEXT          -- Custom role title (e.g., "Lead Makeup Artist")
- credits_visible BOOLEAN  -- Whether to show in public credits (default: true)
```

### New Field in `showcases` Table

```sql
- collaborators JSONB  -- Array of all collaborators with roles
```

Example structure:
```json
[
  {
    "user_id": "uuid",
    "role": "PHOTOGRAPHER",
    "role_title": "Lead Photographer",
    "display_order": 1
  },
  {
    "user_id": "uuid",
    "role": "MAKEUP_ARTIST",
    "role_title": "Makeup Artist",
    "display_order": 2
  }
]
```

---

## Database Views and Functions

### 1. `gig_credits` View

Consolidated view of all gig credits.

```sql
SELECT * FROM gig_credits WHERE gig_id = 'some-uuid';
```

Returns:
- Gig owner (director/producer)
- All accepted crew members with roles
- Crew count

### 2. `showcase_credits` View

Consolidated view of all showcase credits.

```sql
SELECT * FROM showcase_credits WHERE showcase_id = 'some-uuid';
```

Returns:
- Creator
- Talent
- Extended collaborators
- Linked gig crew (if showcase is from a gig)

### 3. `get_gig_credits(p_gig_id UUID)` Function

Get complete credits for a specific gig.

```sql
SELECT * FROM get_gig_credits('gig-uuid');
```

### 4. `get_showcase_credits(p_showcase_id UUID)` Function

Get complete credits for a specific showcase.

```sql
SELECT * FROM get_showcase_credits('showcase-uuid');
```

### 5. `get_user_credit_history(p_user_id UUID)` Function

Get complete credit history for a user across all projects.

```sql
SELECT * FROM get_user_credit_history('user-uuid');
```

Returns credits from:
- Gigs as director/producer
- Gigs as crew member
- Showcases as creator
- Showcases as featured talent
- Collaboration projects

---

## API Endpoints

### 1. Get Gig Credits

```
GET /api/gigs/[id]/credits
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gig_id": "uuid",
    "gig_title": "Fashion Shoot",
    "gig_status": "COMPLETED",
    "director": {
      "user_id": "uuid",
      "display_name": "John Doe",
      "handle": "johndoe",
      "avatar_url": "...",
      "role": "DIRECTOR",
      "role_title": "Director/Producer"
    },
    "crew": [
      {
        "user_id": "uuid",
        "display_name": "Jane Smith",
        "handle": "janesmith",
        "avatar_url": "...",
        "role": "MODEL",
        "role_title": "Lead Model",
        "accepted_at": "2025-10-12T10:00:00Z"
      },
      {
        "user_id": "uuid",
        "display_name": "Bob Johnson",
        "handle": "bobjohnson",
        "avatar_url": "...",
        "role": "MAKEUP_ARTIST",
        "role_title": "Makeup Artist",
        "accepted_at": "2025-10-12T10:05:00Z"
      }
    ],
    "total_crew_count": 2
  }
}
```

### 2. Get Showcase Credits

```
GET /api/showcases/[id]/credits
```

**Response:**
```json
{
  "success": true,
  "data": {
    "showcase_id": "uuid",
    "showcase_title": "Editorial Shoot",
    "creator": {
      "user_id": "uuid",
      "display_name": "Photographer Name",
      "handle": "photographer",
      "avatar_url": "...",
      "role": "CREATOR",
      "role_title": "Creator"
    },
    "talent": {
      "user_id": "uuid",
      "display_name": "Model Name",
      "handle": "model",
      "avatar_url": "...",
      "role": "TALENT",
      "role_title": "Talent"
    },
    "collaborators": [...],
    "gig_crew": [...],
    "total_collaborators": 5
  }
}
```

### 3. Add Collaborators to Showcase

```
POST /api/showcases/[id]/credits
Authorization: Bearer <token>
```

**Body:**
```json
{
  "collaborators": [
    {
      "user_id": "uuid",
      "role": "MAKEUP_ARTIST",
      "role_title": "Makeup Artist",
      "display_order": 1
    },
    {
      "user_id": "uuid",
      "role": "STYLIST",
      "role_title": "Wardrobe Stylist",
      "display_order": 2
    }
  ]
}
```

### 4. Get User Credit History

```
GET /api/users/[handle]/credits
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "display_name": "John Doe",
      "handle": "johndoe",
      "avatar_url": "..."
    },
    "credits": {
      "gigs_as_director": [...],
      "gigs_as_crew": [...],
      "showcases_as_creator": [...],
      "showcases_as_talent": [...],
      "collaboration_projects": [...]
    },
    "stats": {
      "total_projects": 15,
      "gigs_directed": 5,
      "gigs_as_crew": 8,
      "showcases_created": 10,
      "showcases_featured": 5,
      "collaborations": 3
    }
  }
}
```

### 5. Update Application Status with Role Assignment

```
PATCH /api/gigs/[id]/applications/[applicationId]
Authorization: Bearer <token>
```

**Body:**
```json
{
  "status": "ACCEPTED",
  "role_assigned": "MODEL",
  "role_title": "Lead Model",
  "credits_visible": true
}
```

---

## Usage Examples

### Example 1: Accept an Applicant with Role Assignment

```typescript
const response = await fetch(`/api/gigs/${gigId}/applications/${applicationId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'ACCEPTED',
    role_assigned: 'MAKEUP_ARTIST',
    role_title: 'Lead Makeup Artist',
    credits_visible: true
  })
})
```

### Example 2: Display Credits on Gig Page

```typescript
const response = await fetch(`/api/gigs/${gigId}/credits`)
const { data } = await response.json()

// Display director
console.log(`Directed by: ${data.director.display_name}`)

// Display crew
data.crew.forEach(member => {
  console.log(`${member.role_title}: ${member.display_name}`)
})
```

### Example 3: Add Collaborators to Showcase

```typescript
const response = await fetch(`/api/showcases/${showcaseId}/credits`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    collaborators: [
      {
        user_id: 'makeup-artist-uuid',
        role: 'MAKEUP_ARTIST',
        role_title: 'Makeup Artist',
        display_order: 1
      },
      {
        user_id: 'stylist-uuid',
        role: 'STYLIST',
        role_title: 'Wardrobe Stylist',
        display_order: 2
      }
    ]
  })
})
```

### Example 4: Display User's Credit Portfolio

```typescript
const response = await fetch(`/api/users/${handle}/credits`)
const { data } = await response.json()

console.log(`Total Projects: ${data.stats.total_projects}`)
console.log(`Gigs Directed: ${data.stats.gigs_directed}`)
console.log(`Showcases Created: ${data.stats.showcases_created}`)

// Display recent work
data.credits.gigs_as_director.forEach(gig => {
  console.log(`${gig.project_title} - ${gig.role_title}`)
  gig.collaborators.forEach(collab => {
    console.log(`  - ${collab.display_name} (${collab.role_title})`)
  })
})
```

---

## Role Types

Common role types (you can use any string, but these are recommended):

### Talent Roles
- `MODEL` - Model
- `ACTOR` - Actor
- `EXTRA` - Extra/Background Actor
- `DANCER` - Dancer
- `PERFORMER` - Performer

### Photography/Video Roles
- `PHOTOGRAPHER` - Photographer
- `VIDEOGRAPHER` - Videographer
- `CINEMATOGRAPHER` - Cinematographer
- `CAMERA_OPERATOR` - Camera Operator
- `DIRECTOR` - Director
- `ASSISTANT_DIRECTOR` - Assistant Director

### Production Roles
- `PRODUCER` - Producer
- `PRODUCTION_ASSISTANT` - Production Assistant
- `PRODUCTION_MANAGER` - Production Manager

### Styling Roles
- `MAKEUP_ARTIST` - Makeup Artist
- `HAIR_STYLIST` - Hair Stylist
- `WARDROBE_STYLIST` - Wardrobe Stylist
- `FASHION_STYLIST` - Fashion Stylist

### Technical Roles
- `LIGHTING_TECHNICIAN` - Lighting Technician
- `SOUND_ENGINEER` - Sound Engineer
- `EDITOR` - Editor
- `RETOUCHER` - Retoucher
- `COLORIST` - Colorist

### Other Roles
- `SET_DESIGNER` - Set Designer
- `PROP_MASTER` - Prop Master
- `LOCATION_SCOUT` - Location Scout
- `CASTING_DIRECTOR` - Casting Director

---

## Migration

To apply this system to your database:

```bash
# Run the migration
psql -d your_database -f supabase/migrations/20251012150000_add_credits_attribution_system.sql
```

Or if using Supabase CLI:

```bash
supabase db push
```

---

## Benefits

1. **Professional Credits** - Everyone gets proper credit for their work
2. **Traceable History** - Complete portfolio/resume for all users
3. **Platform Verification** - Credits verified through application system
4. **SEO Benefits** - Proper attribution improves discoverability
5. **Legal Compliance** - Clear record of who worked on what
6. **Trust & Transparency** - Users can see full production teams
7. **Networking** - Easy to discover collaborators through credits

---

## Next Steps

1. ✅ Run the database migration
2. Update gig application acceptance UI to include role assignment
3. Create credits display components for:
   - Gig detail pages
   - Showcase detail pages
   - User profile pages
4. Add credits filtering/search on user profiles
5. Consider adding credits export (PDF resume generation)

---

## Support

For questions or issues with the credits system:
- Check the API endpoint responses for detailed error messages
- Verify role_assigned is included when accepting applications
- Ensure proper authentication tokens are provided
- Review the database views/functions for data access patterns
