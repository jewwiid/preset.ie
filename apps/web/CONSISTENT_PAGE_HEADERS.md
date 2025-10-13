# Consistent Page Headers System

## Overview
A reusable page header system with admin-configurable background images for consistent design across all major platform pages.

## Components Created

### 1. `PageHeader` Component
**Location**: `/components/PageHeader.tsx`

Reusable header component with:
- Title and subtitle
- Optional icon
- Optional stats display
- Optional action buttons
- Background image support (with fallback gradient)
- Auto dark overlay when image is present for text readability

### 2. `usePageHeaderImage` Hook
**Location**: `/hooks/usePageHeaderImage.ts`

Custom hook to fetch header background images from database:
```typescript
const { headerImage, loading } = usePageHeaderImage('page-category');
```

### 3. Admin Platform Images
**Location**: `/app/admin/platform-images/page.tsx`

New "Page Header Backgrounds" section with categories for:
- `gigs-header` - Gigs page
- `collaborate-header` - Collaborate page
- `marketplace-header` - Marketplace page
- `playground-header` - Playground page
- `presets-header` - Presets page
- `showcases-header` - Showcases page
- `treatments-header` - Treatments page
- `moodboards-header` - Moodboards page

## Usage Example (Gigs Page - Already Implemented)

```tsx
import { PageHeader } from '@/components/PageHeader';
import { usePageHeaderImage } from '@/hooks/usePageHeaderImage';
import { Camera, Users, Sparkles, Eye } from 'lucide-react';

export default function GigsPage() {
  const { headerImage } = usePageHeaderImage('gigs-header');
  const [gigs, setGigs] = useState([]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          title="Gigs"
          subtitle="Discover creative opportunities and collaborate with talented professionals"
          icon={Camera}
          stats={[
            { icon: Users, label: `${gigs.length} Active Gigs` },
            { icon: Sparkles, label: 'Find Your Next Creative Project' }
          ]}
          actions={
            <>
              <Link href="/gigs/my-gigs">
                <Button size="lg" variant="outline">
                  <Eye className="h-5 w-5 mr-2" />
                  My Gigs
                </Button>
              </Link>
              <Link href="/gigs/create">
                <Button size="lg">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Gig
                </Button>
              </Link>
            </>
          }
          backgroundImage={headerImage}
        />

        {/* Rest of page content */}
      </div>
    </div>
  );
}
```

## How to Add to Other Pages

### Step 1: Import Required Components
```tsx
import { PageHeader } from '@/components/PageHeader';
import { usePageHeaderImage } from '@/hooks/usePageHeaderImage';
import { YourIcon } from 'lucide-react';
```

### Step 2: Use the Hook
```tsx
const { headerImage } = usePageHeaderImage('page-category-here');
// e.g., 'marketplace-header', 'playground-header', etc.
```

### Step 3: Add PageHeader Component
```tsx
<PageHeader
  title="Page Title"
  subtitle="Optional subtitle text"
  icon={YourIcon} // Optional
  stats={[ // Optional
    { icon: IconName, label: 'Stat text' }
  ]}
  actions={ // Optional
    <>
      <Button>Action 1</Button>
      <Button>Action 2</Button>
    </>
  }
  backgroundImage={headerImage}
/>
```

## Pages to Update

### Priority 1 (Main Platform Pages)
- [x] Gigs (`/app/gigs/page.tsx`) - ✅ COMPLETED
- [ ] Collaborate (`/app/collaborate/page.tsx`)
- [ ] Marketplace (`/app/marketplace/page.tsx` or `/app/gear/page.tsx`)
- [ ] Playground (`/app/playground/page.tsx`)

### Priority 2 (Content Pages)
- [ ] Presets (`/app/presets/page.tsx` or marketplace page)
- [ ] Showcases (`/app/showcases/page.tsx`)
- [ ] Treatments (`/app/treatments/page.tsx`)
- [ ] Moodboards (`/app/moodboards/page.tsx`)

## Admin Setup Instructions - Ready to Use! ✅

The admin interface is **already configured** and ready for uploading header images.

### How to Upload Header Images:

1. **Navigate**: Go to **Admin → Platform Images**
2. **Find Section**: Scroll down to **"Page Header Backgrounds"** section
3. **Select Page**: Choose which page header you want to customize:
   - Gigs Header Background
   - Collaborate Header Background
   - Marketplace Header Background
   - Playground Header Background
   - Presets Header Background
   - Showcases Header Background
   - Treatments Header Background
   - Moodboards Header Background
4. **Upload**: Click **Add** button on the empty slot
5. **Configure**:
   - Upload your image
   - Set category (will auto-populate)
   - Set `is_active` to **true**
   - Add optional alt text/title
   - Set display order (if multiple images)
6. **Save**: Image appears automatically on that page!

### Image Specifications

#### Optimal Dimensions
- **Recommended**: `1920 x 400px` (wide landscape format)
- **Minimum**: `1600 x 350px`
- **Maximum**: `2560 x 600px`
- **Aspect Ratio**: 4:1 to 5:1 works best

#### File Guidelines
- **Format**: JPG, PNG, or WebP
- **File Size**: Under 500KB (optimize for web)
- **Resolution**: 72-150 DPI (web resolution)
- **Color Profile**: sRGB

#### Design Tips
- **Focal Point**: Keep important subjects in center 60%
- **Text Area**: Leave clear space for text overlay (usually left side)
- **Contrast**: Images get 50% dark overlay, so bright/colorful images work best
- **Mobile Safe**: Test that key elements visible at 768px width
- **Theme Aware**: Works in both light and dark mode
- **Professional**: Use high-quality, relevant images for each section

### Testing After Upload

After uploading an image:
- [ ] Visit the page to see the header
- [ ] Check text is readable (dark overlay applied automatically)
- [ ] Test on desktop (1920px+)
- [ ] Test on tablet (768px-1024px)
- [ ] Test on mobile (375px-768px)
- [ ] Check in light mode
- [ ] Check in dark mode
- [ ] Verify icon and buttons are visible

## Benefits

✅ **Consistency** - All major pages have the same header design pattern
✅ **Flexibility** - Admin can customize each page's background independently
✅ **Maintainability** - Single component to update for all pages
✅ **Performance** - Images lazy load and cache properly
✅ **UX** - Professional, polished look across entire platform
✅ **Accessibility** - Dark overlay ensures text is always readable

## Design Specifications

### With Background Image:
- Image covers full header area
- 50% black overlay for text readability
- White text color for all content
- Icon stays in primary colored box

### Without Background Image (Fallback):
- Subtle gradient from primary to background
- Low opacity dot pattern texture
- Theme-aware text colors
- Consistent with existing design system

## Migration Checklist for Each Page

When adding to a new page:
- [ ] Import `PageHeader` and `usePageHeaderImage`
- [ ] Add appropriate icon from lucide-react
- [ ] Use hook with correct category name
- [ ] Replace existing header HTML with `<PageHeader />`
- [ ] Move any stats to `stats` prop
- [ ] Move any action buttons to `actions` prop
- [ ] Test with and without background image
- [ ] Test on mobile, tablet, and desktop
- [ ] Verify text readability with different images
- [ ] Update this document to mark as complete

## Notes

- The component automatically handles responsive design
- Stats and actions are optional - omit if not needed
- Images should be high quality but optimized for web
- Recommended dimensions: 1920x400px to 2560x600px
- Use images with good contrast areas for text placement
- Test with both light and dark theme modes
