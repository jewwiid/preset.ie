# UI Component Migration Guide

## Overview
This guide helps developers migrate from custom UI patterns to the new consolidated components.

## Quick Reference

### LoadingSpinner

**Before:**
```tsx
{loading && (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  </div>
)}
```

**After:**
```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

{loading && <LoadingSpinner size="md" />}
```

**Full-Screen Loading:**
```tsx
// Before: Complex div structure with positioning
<div className="fixed inset-0 flex items-center justify-center bg-background/80">
  <div className="animate-spin..."></div>
</div>

// After: One line
<LoadingSpinner fullScreen />
```

---

### AsyncButton

**Before:**
```tsx
<button
  disabled={loading}
  className="..."
>
  {loading ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
      Saving...
    </>
  ) : (
    <>
      Save
      <CheckIcon className="ml-2" />
    </>
  )}
</button>
```

**After:**
```tsx
import { AsyncButton } from '@/components/ui/async-button'

<AsyncButton
  isLoading={loading}
  loadingText="Saving..."
  icon={CheckIcon}
  iconPosition="right"
>
  Save
</AsyncButton>
```

---

### IconBadge

**Before:**
```tsx
<div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
  <Settings className="w-4 h-4" />
</div>
```

**After:**
```tsx
import { IconBadge } from '@/components/ui/icon-badge'

<IconBadge icon={Settings} size="md" variant="primary" />
```

---

### InfoCard

**Before:**
```tsx
<div className="p-4 rounded-xl bg-muted/50 border border-muted">
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
      <Info className="w-4 h-4" />
    </div>
    <div>
      <p className="text-sm font-medium">Title</p>
      <p className="text-xs text-muted-foreground">Description</p>
    </div>
  </div>
</div>
```

**After:**
```tsx
import { InfoCard } from '@/components/ui/info-card'

<InfoCard
  icon={Info}
  title="Title"
  description="Description"
  variant="default"
/>
```

---

### EnhancedCardHeader

**Before:**
```tsx
<CardHeader>
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
      <Settings className="w-4 h-4" />
    </div>
    <div>
      <CardTitle>Settings</CardTitle>
      <CardDescription>Manage your preferences</CardDescription>
    </div>
  </div>
</CardHeader>
```

**After:**
```tsx
import { EnhancedCardHeader } from '@/components/ui/enhanced-card-header'

<CardHeader>
  <EnhancedCardHeader
    icon={Settings}
    title="Settings"
    description="Manage your preferences"
  />
</CardHeader>
```

---

### DialogFooterActions

**Before:**
```tsx
<DialogFooter>
  <Button variant="outline" onClick={onCancel} disabled={loading}>
    Cancel
  </Button>
  <Button onClick={onConfirm} disabled={loading}>
    {loading ? (
      <>
        <div className="animate-spin..."></div>
        Saving...
      </>
    ) : (
      'Confirm'
    )}
  </Button>
</DialogFooter>
```

**After:**
```tsx
import { DialogFooterActions } from '@/components/ui/dialog-footer-actions'

<DialogFooterActions
  onCancel={onCancel}
  onConfirm={onConfirm}
  isLoading={loading}
  cancelText="Cancel"
  confirmText="Confirm"
  loadingText="Saving..."
/>
```

---

## Migration Strategy

### Phase 1: High-Traffic Files (Completed)
- ✅ Playground components
- ✅ Auth pages
- ✅ Dashboard main page

### Phase 2: Dashboard Components (Next)
- PendingInvitationsCard.tsx
- DashboardMatchmakingCard.tsx
- RecentMessagesCard.tsx

### Phase 3: Bulk Migration
Files with 5+ spinner occurrences:
- marketplace components
- profile components
- gig management pages

## Search Patterns

Use these grep patterns to find migration candidates:

```bash
# Find custom spinners
grep -r "animate-spin.*rounded-full.*border" apps/web --include="*.tsx"

# Find loading buttons
grep -r "disabled={.*loading.*}" apps/web --include="*.tsx" -A 5 | grep -E "animate-spin|Loader2"

# Find icon circles
grep -r "rounded-full.*flex.*items-center.*justify-center" apps/web --include="*.tsx" -B 1 -A 1 | grep -E "className.*w-[0-9].*h-[0-9]"
```

## Benefits

- **Consistency**: All loading states look and behave the same
- **Maintainability**: Update one component instead of 215+ locations
- **Performance**: Smaller bundle size from reduced duplication
- **Developer Experience**: Less code to write, easier to read
- **Accessibility**: Centralized place to add ARIA attributes

## Rollback

If issues arise, the old patterns still work. Simply don't import the new components.

## Questions?

Check the [consolidation plan](./UI_COMPONENT_CONSOLIDATION_PLAN.md) for full details.
