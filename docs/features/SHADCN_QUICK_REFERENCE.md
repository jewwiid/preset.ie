# Shadcn UI Quick Reference Guide 🚀

## New Components Available

| Component | Import Path | Use Case | Example |
|-----------|-------------|----------|---------|
| **Sonner** | `@/components/ui/sonner` | Toast notifications | `toast.success("Success!")` |
| **Resizable** | `@/components/ui/resizable` | Resizable panels | `<ResizablePanel>` |
| **HoverCard** | `@/components/ui/hover-card` | Rich hover info | `<HoverCard>` |
| **ContextMenu** | `@/components/ui/context-menu` | Right-click menus | `<ContextMenu>` |
| **Menubar** | `@/components/ui/menubar` | App navigation | `<Menubar>` |
| **AspectRatio** | `@/components/ui/aspect-ratio` | Consistent media | `<AspectRatio ratio={16/9}>` |

## Quick Implementation Examples

### 1. Replace Toast Notifications
```tsx
// Before
import { toast } from 'react-hot-toast'
toast.success('Success!')

// After
import { toast } from 'sonner'
toast.success('Success!', {
  description: 'Additional context here'
})
```

### 2. Add Hover Information
```tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

<HoverCard>
  <HoverCardTrigger asChild>
    <Button>Hover me</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <p>Additional information appears here</p>
  </HoverCardContent>
</HoverCard>
```

### 3. Make Layouts Resizable
```tsx
import { Resizable, ResizableHandle, ResizablePanel } from "@/components/ui/resizable"

<Resizable direction="horizontal">
  <ResizablePanel defaultSize={50}>Left Panel</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={50}>Right Panel</ResizablePanel>
</Resizable>
```

### 4. Add Right-Click Menus
```tsx
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger>
    <div>Right-click me</div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Edit</ContextMenuItem>
    <ContextMenuItem>Delete</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### 5. Consistent Image Sizing
```tsx
import { AspectRatio } from "@/components/ui/aspect-ratio"

<AspectRatio ratio={16 / 9}>
  <img src="/image.jpg" alt="Description" className="object-cover" />
</AspectRatio>
```

## Priority Implementation Areas

### 🎯 **High Priority (Quick Wins)**
1. **Gig Cards** - Add HoverCard for more info
2. **Toast Messages** - Replace with Sonner
3. **User Avatars** - Add HoverCard with profile info
4. **Images** - Use AspectRatio for consistency

### 📈 **Medium Priority**
1. **Map Layout** - Make resizable
2. **Moodboard** - Add context menus
3. **Dashboard** - Add menubar navigation

### 🎨 **Low Priority (Nice to Have)**
1. **Advanced Interactions** - Context menus everywhere
2. **Complex Layouts** - Multiple resizable panels
3. **Rich Hover States** - Detailed information cards

## File Locations to Update

### **Toast Notifications:**
- `apps/web/hooks/useCreditPurchase.ts`
- `apps/web/app/components/moodboard/hooks/useMoodboardData.ts`
- `apps/web/app/gigs/create/page.tsx`

### **Hover Cards:**
- `apps/web/components/gig-card.tsx` (if exists)
- `apps/web/app/components/moodboard/components/MoodboardItem.tsx`
- User avatar components

### **Resizable Layouts:**
- `apps/web/app/gigs/page.tsx` (map view)
- `apps/web/app/components/moodboard/MoodboardBuilder.tsx`
- Dashboard layouts

### **Context Menus:**
- `apps/web/components/GigsMap.tsx`
- `apps/web/app/components/moodboard/components/MoodboardItem.tsx`
- Any card components

## Testing Checklist

- [ ] Toast notifications work and look good
- [ ] Hover cards show correct information
- [ ] Resizable panels work smoothly
- [ ] Context menus appear on right-click
- [ ] Images maintain aspect ratios
- [ ] All components are accessible (keyboard navigation)
- [ ] Mobile responsiveness maintained

## Common Patterns

### **HoverCard with Avatar:**
```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <Avatar>
      <AvatarImage src={user.avatar_url} />
      <AvatarFallback>{user.name[0]}</AvatarFallback>
    </Avatar>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{user.name}</h4>
      <p className="text-sm text-muted-foreground">@{user.handle}</p>
    </div>
  </HoverCardContent>
</HoverCard>
```

### **ContextMenu with Actions:**
```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <Card>{/* content */}</Card>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={handleEdit}>Edit</ContextMenuItem>
    <ContextMenuItem onClick={handleShare}>Share</ContextMenuItem>
    <ContextMenuItem onClick={handleDelete} className="text-destructive">
      Delete
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### **Resizable with Multiple Panels:**
```tsx
<Resizable direction="horizontal" className="h-full">
  <ResizablePanel defaultSize={60} minSize={30}>
    <MainContent />
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={40} minSize={20}>
    <Sidebar />
  </ResizablePanel>
</Resizable>
```

This quick reference should help the team implement these components efficiently!
