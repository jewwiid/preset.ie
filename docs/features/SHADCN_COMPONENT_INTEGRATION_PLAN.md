# Shadcn UI Component Integration Plan 🎨

## Overview
This document outlines how to integrate the newly added Shadcn UI components throughout the Preset codebase to improve user experience, consistency, and functionality.

## New Components Added ✅

### 1. **Sonner** (`sonner.tsx`) - Enhanced Toast Notifications
- **Purpose**: Better toast notifications with animations and positioning
- **Current Usage**: Basic toast notifications throughout the app
- **Improvement**: Smoother animations, better positioning, and more notification types

### 2. **Resizable** (`resizable.tsx`) - Flexible Layouts
- **Purpose**: Resizable panels and layouts for better user control
- **Current Usage**: Fixed layouts in various components
- **Improvement**: User-controlled resizing for better productivity

### 3. **HoverCard** (`hover-card.tsx`) - Rich Hover Interactions
- **Purpose**: Rich hover interactions with detailed information
- **Current Usage**: Basic tooltips and hover states
- **Improvement**: More informative and interactive hover experiences

### 4. **ContextMenu** (`context-menu.tsx`) - Right-Click Functionality
- **Purpose**: Right-click context menus for enhanced interactions
- **Current Usage**: Limited right-click functionality
- **Improvement**: Power-user features and quick actions

### 5. **Menubar** (`menubar.tsx`) - Application Navigation
- **Purpose**: Application-level menu bars for navigation
- **Current Usage**: Basic navigation components
- **Improvement**: More structured and accessible navigation

### 6. **AspectRatio** (`aspect-ratio.tsx`) - Consistent Media Sizing
- **Purpose**: Consistent image and video sizing across the app
- **Current Usage**: Inconsistent image sizing
- **Improvement**: Uniform media presentation

---

## Integration Plan by Feature Area

### 🎬 **Gigs & Applications**

#### **Current Components to Enhance:**
- `apps/web/app/gigs/page.tsx` - Gigs listing page
- `apps/web/app/gigs/create/page.tsx` - Gig creation form
- `apps/web/app/gigs/[id]/edit/page.tsx` - Gig editing
- `apps/web/components/GigsMap.tsx` - Map component
- `apps/web/components/GigsMapSidebar.tsx` - Map sidebar

#### **Proposed Enhancements:**

**1. Sonner Integration:**
```tsx
// Replace existing toast notifications
import { toast } from "sonner"

// Gig creation success
toast.success("Gig created successfully!", {
  description: "Your gig is now live and visible to creators"
})

// Map loading states
toast.loading("Loading gigs in your area...")
```

**2. HoverCard for Gig Cards:**
```tsx
// apps/web/components/gig-card.tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

<HoverCard>
  <HoverCardTrigger asChild>
    <GigCard gig={gig} />
  </HoverCardTrigger>
  <HoverCardContent className="w-80">
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{gig.title}</h4>
      <p className="text-sm text-muted-foreground">{gig.description}</p>
      <div className="flex items-center space-x-2">
        <MapPin className="h-4 w-4" />
        <span className="text-sm">{gig.location_text}</span>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

**3. ContextMenu for Gig Actions:**
```tsx
// Right-click actions on gig cards
import { ContextMenu, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger>
    <GigCard gig={gig} />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={() => handleEdit(gig.id)}>
      Edit Gig
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleDuplicate(gig.id)}>
      Duplicate
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleShare(gig.id)}>
      Share
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

**4. Resizable for Map Layout:**
```tsx
// apps/web/app/gigs/page.tsx - Map view
import { Resizable, ResizableHandle, ResizablePanel } from "@/components/ui/resizable"

<Resizable direction="horizontal" className="h-full">
  <ResizablePanel defaultSize={60} minSize={30}>
    <GigsMap />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={40} minSize={20}>
    <GigsMapSidebar />
  </ResizablePanel>
</Resizable>
```

### 🎨 **Moodboards & Creative Tools**

#### **Current Components to Enhance:**
- `apps/web/app/components/moodboard/MoodboardBuilder.tsx`
- `apps/web/app/components/moodboard/components/MoodboardHeader.tsx`
- `apps/web/app/components/moodboard/components/PaletteDisplay.tsx`

#### **Proposed Enhancements:**

**1. AspectRatio for Images:**
```tsx
// apps/web/app/components/moodboard/components/MoodboardItem.tsx
import { AspectRatio } from "@/components/ui/aspect-ratio"

<AspectRatio ratio={16 / 9} className="bg-muted">
  <img
    src={item.url}
    alt={item.title}
    className="rounded-md object-cover h-full w-full"
  />
</AspectRatio>
```

**2. HoverCard for Color Palettes:**
```tsx
// Enhanced palette display with hover information
<HoverCard>
  <HoverCardTrigger asChild>
    <div className="flex space-x-1">
      {palette.map((color, index) => (
        <div key={index} className="w-8 h-8 rounded" style={{ backgroundColor: color }} />
      ))}
    </div>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Color Palette</h4>
      {palette.map((color, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
          <span className="text-sm font-mono">{color}</span>
        </div>
      ))}
    </div>
  </HoverCardContent>
</HoverCard>
```

**3. Resizable for Moodboard Layout:**
```tsx
// apps/web/app/components/moodboard/MoodboardBuilder.tsx
<Resizable direction="vertical" className="h-full">
  <ResizablePanel defaultSize={70} minSize={50}>
    <MoodboardGrid />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={30} minSize={20}>
    <PaletteDisplay />
  </ResizablePanel>
</Resizable>
```

### 👤 **User Profiles & Settings**

#### **Current Components to Enhance:**
- `apps/web/app/profile/settings/page.tsx`
- `apps/web/components/EnhancedProfileForm.tsx`
- `apps/web/app/dashboard/page.tsx`

#### **Proposed Enhancements:**

**1. Menubar for Dashboard Navigation:**
```tsx
// apps/web/app/dashboard/page.tsx
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar"

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Dashboard</MenubarTrigger>
    <MenubarContent>
      <MenubarItem onClick={() => router.push('/dashboard')}>Overview</MenubarItem>
      <MenubarItem onClick={() => router.push('/dashboard/analytics')}>Analytics</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Gigs</MenubarTrigger>
    <MenubarContent>
      <MenubarItem onClick={() => router.push('/gigs/my-gigs')}>My Gigs</MenubarItem>
      <MenubarItem onClick={() => router.push('/gigs/create')}>Create Gig</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>
```

**2. HoverCard for User Avatars:**
```tsx
// Enhanced user profile hover cards
<HoverCard>
  <HoverCardTrigger asChild>
    <Avatar>
      <AvatarImage src={user.avatar_url} />
      <AvatarFallback>{user.display_name[0]}</AvatarFallback>
    </Avatar>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{user.display_name}</h4>
      <p className="text-sm text-muted-foreground">@{user.handle}</p>
      <div className="flex items-center space-x-2">
        <Badge variant="secondary">{user.subscription_tier}</Badge>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

### 💳 **Credits & Subscriptions**

#### **Current Components to Enhance:**
- `apps/web/app/components/CreditPurchase.tsx`
- `apps/web/app/subscription/page.tsx`
- `apps/web/hooks/useCreditPurchase.ts`

#### **Proposed Enhancements:**

**1. Sonner for Credit Purchase Feedback:**
```tsx
// apps/web/hooks/useCreditPurchase.ts
import { toast } from "sonner"

// Enhanced purchase feedback
const handlePurchaseSuccess = () => {
  toast.success("Credits purchased successfully!", {
    description: `${credits} credits added to your account`,
    action: {
      label: "View Balance",
      onClick: () => router.push('/dashboard')
    }
  })
}

const handlePurchaseError = (error: string) => {
  toast.error("Purchase failed", {
    description: error,
    action: {
      label: "Try Again",
      onClick: () => retryPurchase()
    }
  })
}
```

**2. HoverCard for Credit Packages:**
```tsx
// Enhanced credit package information
<HoverCard>
  <HoverCardTrigger asChild>
    <CreditPackageCard package={pkg} />
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{pkg.name}</h4>
      <p className="text-sm text-muted-foreground">{pkg.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{pkg.credits} credits</span>
        <span className="text-sm font-bold">${pkg.price}</span>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

### 🗺️ **Map & Location Features**

#### **Current Components to Enhance:**
- `apps/web/components/GigsMap.tsx`
- `apps/web/components/GigsMapSidebar.tsx`

#### **Proposed Enhancements:**

**1. ContextMenu for Map Markers:**
```tsx
// Right-click actions on map markers
<ContextMenu>
  <ContextMenuTrigger>
    <MapMarker gig={gig} />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={() => handleViewGig(gig.id)}>
      View Details
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleDirections(gig.location)}>
      Get Directions
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleShare(gig.id)}>
      Share Location
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

**2. HoverCard for Map Popups:**
```tsx
// Enhanced map popups
<HoverCard>
  <HoverCardTrigger asChild>
    <MapMarker gig={gig} />
  </HoverCardTrigger>
  <HoverCardContent className="w-80">
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{gig.title}</h4>
      <p className="text-sm text-muted-foreground line-clamp-2">{gig.description}</p>
      <div className="flex items-center space-x-2">
        <MapPin className="h-4 w-4" />
        <span className="text-sm">{gig.location_text}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4" />
        <span className="text-sm">{formatDate(gig.start_time)}</span>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

---

## Implementation Priority

### **Phase 1: High Impact, Low Effort** 🚀
1. **Sonner Integration** - Replace all toast notifications
2. **AspectRatio for Images** - Consistent media sizing
3. **HoverCard for User Avatars** - Enhanced user interactions

### **Phase 2: Medium Impact, Medium Effort** 📈
1. **Resizable for Map Layout** - Better user control
2. **HoverCard for Gig Cards** - Richer information display
3. **ContextMenu for Map Markers** - Power-user features

### **Phase 3: High Impact, High Effort** 🎯
1. **Menubar for Dashboard** - Complete navigation overhaul
2. **Resizable for Moodboard** - Advanced layout control
3. **ContextMenu for Gig Cards** - Comprehensive right-click actions

---

## Code Examples & Templates

### **Sonner Setup:**
```tsx
// apps/web/app/layout.tsx
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### **HoverCard Template:**
```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export function EnhancedCard({ item }: { item: any }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">
          {/* Your existing card content */}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{item.title}</h4>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          {/* Additional information */}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
```

### **ContextMenu Template:**
```tsx
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"

export function ContextualCard({ item }: { item: any }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="cursor-pointer">
          {/* Your existing card content */}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleEdit(item.id)}>
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleDelete(item.id)}>
          Delete
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleShare(item.id)}>
          Share
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
```

---

## Benefits Summary

### **User Experience Improvements:**
- ✅ **Smoother Interactions** - Sonner provides better feedback
- ✅ **Richer Information** - HoverCard shows more details
- ✅ **Power User Features** - ContextMenu for quick actions
- ✅ **Flexible Layouts** - Resizable panels for user control
- ✅ **Consistent Media** - AspectRatio for uniform presentation

### **Developer Experience Improvements:**
- ✅ **Consistent API** - All components follow Shadcn patterns
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Accessibility** - Built on Radix UI primitives
- ✅ **Customizable** - Full control over styling and behavior

### **Performance Benefits:**
- ✅ **Lightweight** - Only import what you use
- ✅ **Optimized** - Radix UI primitives are performance-focused
- ✅ **Tree Shakeable** - Unused code is eliminated

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize implementations** based on user feedback
3. **Start with Phase 1** components for quick wins
4. **Measure impact** of each enhancement
5. **Iterate and improve** based on usage data

This integration plan will significantly enhance the user experience while maintaining the high-quality, accessible design system you've already established with Shadcn UI.
