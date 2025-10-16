# Badge System Usage Guide

## Overview

The Preset platform now uses a standardized Badge component system powered by Shadcn UI with custom variants tailored to our brand and theme. This guide explains how to use badges consistently across the application.

## Custom Badge Variants

### Available Variants

```typescript
variant: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success"
```

### Variant Styles & Use Cases

#### 1. **default** / **success** (Primary Green)
```tsx
<Badge variant="default">Active</Badge>
<Badge variant="success">Approved</Badge>
```
- **Color**: Primary green (`bg-primary/10 text-primary ring-primary/20`)
- **Use for**: Approved states, completed actions, success messages, active status
- **Examples**: "Published", "Approved", "Completed", "Success"

#### 2. **secondary** (Neutral)
```tsx
<Badge variant="secondary">Draft</Badge>
```
- **Color**: Secondary neutral (`bg-secondary text-secondary-foreground ring-border`)
- **Use for**: Neutral states, metadata, tags, categories
- **Examples**: "Draft", "Archived", hashtags, style tags

#### 3. **destructive** (Red)
```tsx
<Badge variant="destructive">Rejected</Badge>
```
- **Color**: Destructive red (`bg-destructive/10 text-destructive ring-destructive/20`)
- **Use for**: Errors, rejected states, blocked actions, critical alerts
- **Examples**: "Rejected", "Failed", "Error", "Blocked by Changes"

#### 4. **outline** (Border Only)
```tsx
<Badge variant="outline">Metadata</Badge>
```
- **Color**: Foreground with border (`text-foreground ring-border`)
- **Use for**: Low-emphasis information, metadata, supplementary data
- **Examples**: Compensation type, gig purpose, "View more"

#### 5. **warning** (Orange)
```tsx
<Badge variant="warning">Changes Requested</Badge>
```
- **Color**: Orange (`bg-orange-500/10 text-orange-700 dark:text-orange-400 ring-orange-500/20`)
- **Use for**: Warnings, actions required, changes requested
- **Examples**: "Changes Requested", "Attention Needed", "Expiring Soon"

#### 6. **info** (Yellow)
```tsx
<Badge variant="info">Pending Approval</Badge>
```
- **Color**: Yellow (`bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20`)
- **Use for**: Pending states, in-progress actions, awaiting response
- **Examples**: "Pending Approval", "In Progress", "Processing"

## Usage Examples

### Status Badges with Icons

```tsx
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, X } from 'lucide-react'

// Success with icon
<Badge variant="success">
  <CheckCircle className="w-3 h-3 mr-1" />
  Published
</Badge>

// Pending with icon
<Badge variant="info">
  <Clock className="w-3 h-3 mr-1" />
  Pending Approval
</Badge>

// Warning with icon
<Badge variant="warning">
  <X className="w-3 h-3 mr-1" />
  Changes Requested
</Badge>
```

### Multiple Badges in a Row

```tsx
<div className="flex items-center gap-2">
  <Badge variant="default">Active</Badge>
  <Badge variant="outline">Paid</Badge>
  <Badge variant="outline">Photography</Badge>
</div>
```

### Conditional Badge Rendering

```tsx
{status === 'approved' && (
  <Badge variant="success">Approved</Badge>
)}
{status === 'pending_approval' && (
  <Badge variant="info">Pending</Badge>
)}
{status === 'changes_requested' && (
  <Badge variant="warning">Changes Requested</Badge>
)}
{status === 'blocked_by_changes' && (
  <Badge variant="destructive">Blocked</Badge>
)}
```

## Migration from Custom Classes

### Before (Manual Classes)
```tsx
// ❌ DON'T use manual color classes
<Badge className="bg-green-100 text-green-800">Approved</Badge>
<Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
<Badge className="bg-red-100 text-red-800">Rejected</Badge>
```

### After (Variants)
```tsx
// ✅ DO use semantic variants
<Badge variant="success">Approved</Badge>
<Badge variant="info">Pending</Badge>
<Badge variant="destructive">Rejected</Badge>
```

## Status Mapping Reference

Use this table to determine which variant to use for common status values:

| Status Value | Variant | Display Text |
|--------------|---------|--------------|
| `approved` | `success` | "Approved" |
| `published` | `success` | "Published" |
| `completed` | `success` | "Completed" |
| `active` | `default` | "Active" |
| `pending_approval` | `info` | "Pending Approval" |
| `in_progress` | `info` | "In Progress" |
| `processing` | `info` | "Processing" |
| `changes_requested` | `warning` | "Changes Requested" |
| `attention_needed` | `warning` | "Attention Needed" |
| `blocked_by_changes` | `destructive` | "Blocked by Changes" |
| `rejected` | `destructive` | "Rejected" |
| `failed` | `destructive` | "Failed" |
| `error` | `destructive` | "Error" |
| `draft` | `secondary` | "Draft" |
| `archived` | `secondary` | "Archived" |
| `metadata` | `outline` | (context-specific) |

## Theme Compatibility

All badge variants automatically adapt to light and dark mode:

- **Light Mode**: Uses lighter backgrounds with darker text
- **Dark Mode**: Automatically adjusts text brightness for readability
- **Primary Green**: Maintains brand consistency in both modes
- **Destructive Red**: Clear error states in both modes
- **Warning/Info**: Custom colors designed for both modes

## Accessibility

All badges include:
- ✅ **Keyboard focus states** - Ring on focus for navigation
- ✅ **Color contrast** - WCAG AA compliant in both modes
- ✅ **Hover states** - Subtle background change on interaction
- ✅ **Screen reader support** - Use with icons for better context

### Best Practices

```tsx
// ✅ Good: Icon provides visual + semantic meaning
<Badge variant="success">
  <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
  <span>Approved</span>
</Badge>

// ⚠️ Consider: Add aria-label for icon-only badges
<Badge variant="success" aria-label="Approved">
  <CheckCircle className="w-4 h-4" />
</Badge>
```

## TypeScript Support

The Badge component is fully typed with autocomplete support:

```typescript
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'

// Full type safety
const MyBadge: React.FC<{ status: string }> = ({ status }) => {
  return <Badge variant="success">{status}</Badge>
  //             ^
  //             TypeScript will autocomplete variant options
}
```

## Testing

When writing tests, use the variant prop for better test readability:

```typescript
// ✅ Good: Clear intent
expect(screen.getByText('Approved')).toHaveAttribute('data-variant', 'success')

// ❌ Avoid: Brittle class-based tests
expect(screen.getByText('Approved')).toHaveClass('bg-green-100')
```

## Files Using Badge Component

Reference these files for real-world usage examples:

- `apps/web/app/gigs/[id]/page.tsx` - Showcase status badges
- `apps/web/app/components/showcases/ShowcaseApprovalReview.tsx` - Approval flow badges
- `apps/web/app/components/dashboard/PendingShowcaseApprovals.tsx` - Dashboard status badges
- `apps/web/lib/utils/badge-helpers.ts` - Badge utility functions

## Related Documentation

- [Shadcn Component Integration Plan](./features/SHADCN_COMPONENT_INTEGRATION_PLAN.md)
- [Shadcn Standardization Complete](./SHADCN_STANDARDIZATION_COMPLETE.md)
- [Design System Colors](../design-system/)

