# Preset API Reference

## Authentication
- Supabase Auth with email/password
- Role-based access control (RLS policies)
- JWT tokens for session management

## Core Endpoints

### Gigs
```
POST   /api/gigs              # Create new gig
GET    /api/gigs              # List published gigs (with filters)
GET    /api/gigs/:id          # Get gig details
PATCH  /api/gigs/:id          # Update gig (owner only)
POST   /api/gigs/:id/publish  # Publish draft gig
```

### Applications
```
POST   /api/gigs/:id/apply         # Apply to gig
GET    /api/gigs/:id/applications  # List applications (owner)
PATCH  /api/applications/:id       # Update application status
```

### Showcases
```
POST   /api/gigs/:id/showcase    # Create showcase
PATCH  /api/showcases/:id/approve # Approve showcase
GET    /api/showcases            # List public showcases
```

### Media
```
POST   /api/media/upload      # Upload media (images/videos)
GET    /api/media/:id         # Get media (signed URLs)
```

## Database Schema
- **users_profile** - User profiles and subscription info
- **gigs** - Gig details with location and compensation
- **applications** - Talent applications to gigs
- **showcases** - Collaborative portfolios
- **media** - Image/video storage with metadata
- **moodboards** - Gig visual references
- **messages** - Per-gig messaging threads
- **subscriptions** - Stripe subscription tracking
