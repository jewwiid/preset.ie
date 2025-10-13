# Preset Design System v2.0
**The Definitive Design Language for Preset Platform**

Last Updated: January 2025

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Navigation](#navigation)
7. [Cards & Containers](#cards--containers)
8. [Forms & Inputs](#forms--inputs)
9. [Buttons](#buttons)
10. [Tabs](#tabs)
11. [Badges & Tags](#badges--tags)
12. [Responsive Design](#responsive-design)
13. [Implementation Guidelines](#implementation-guidelines)

---

## Design Philosophy

Preset's design system is built on these core principles:

### 1. **Theme-First Approach**
- All colors MUST use CSS variables from the theme system
- No hardcoded colors (e.g., `bg-gray-500`, `text-white`, etc.)
- Support both light and dark modes seamlessly

### 2. **Consistent Spacing**
- Use Tailwind's spacing scale consistently
- Responsive spacing with breakpoint modifiers
- Predictable spacing ratios across all components

### 3. **shadcn/ui Foundation**
- Build on shadcn/ui components
- Maintain consistency with shadcn patterns
- Extend, don't override unnecessarily

### 4. **Accessibility & Clarity**
- High contrast ratios for readability
- Clear focus states
- Semantic HTML structure

---

## Color System

### Theme Variables (CSS Custom Properties)

**NEVER use hardcoded colors. ALWAYS use these semantic color variables:**

```css
/* Base Colors */
--background         /* Page background */
--foreground         /* Primary text */

/* Muted Colors */
--muted             /* Subtle backgrounds */
--muted-foreground  /* Secondary text */

/* Accent Colors */
--accent            /* Hover states, secondary actions */
--accent-foreground /* Text on accent backgrounds */

/* Primary Colors */
--primary           /* Brand color, CTAs, active states */
--primary-foreground /* Text on primary backgrounds */

/* Borders & Separators */
--border            /* All borders, dividers */

/* Destructive (Danger) */
--destructive       /* Error states, delete actions */
--destructive-foreground /* Text on destructive backgrounds */

/* Interactive States */
--ring              /* Focus ring color */
```

### Usage Examples

```tsx
// ✅ CORRECT - Theme-aware
<div className="bg-background text-foreground border-border">
<p className="text-muted-foreground">
<button className="bg-primary text-primary-foreground hover:bg-primary/90">

// ❌ WRONG - Hardcoded colors
<div className="bg-white text-black border-gray-200">
<p className="text-gray-500">
<button className="bg-green-500 text-white hover:bg-green-600">
```

---

## Typography

### Heading Hierarchy

```tsx
// H1 - Page titles
<h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>

// H2 - Section titles
<h2 className="text-2xl font-bold text-foreground">Notification Preferences</h2>

// H3 - Subsection titles
<h3 className="text-xl font-semibold text-foreground">Email Settings</h3>

// H4 - Card titles (use CardTitle component)
<h4 className="text-lg font-medium text-foreground">Account Information</h4>
```

### Body Text

```tsx
// Primary text
<p className="text-base text-foreground">

// Secondary/descriptive text
<p className="text-sm text-muted-foreground">

// Small text (labels, metadata)
<span className="text-xs text-muted-foreground">
```

### Font Weights
- `font-bold` - Page titles, important headings
- `font-semibold` - Section headings
- `font-medium` - Card titles, labels, buttons
- `font-normal` - Body text (default)

---

## Spacing & Layout

### Container Widths

```tsx
// Page containers
<div className="max-w-4xl mx-auto">     // Settings pages
<div className="max-w-7xl mx-auto">     // Main content areas
<div className="max-w-6xl mx-auto">     // Dashboards
```

### Page Padding

```tsx
// Standard page padding
<div className="py-8 px-4">                    // Mobile
<div className="py-8 px-4 sm:px-6 lg:px-8">   // Responsive
```

### Component Spacing

```tsx
// Section spacing
<div className="space-y-6">    // Between cards/sections
<div className="space-y-4">    // Between form groups
<div className="space-y-2">    // Between related items

// Gaps (for flex/grid)
<div className="gap-2 lg:gap-4">      // Responsive gaps
<div className="gap-3">                // Fixed gaps
```

---

## Components

### Page Header Pattern

```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-foreground">
    Platform Settings
  </h1>
  <p className="text-muted-foreground mt-2">
    Manage your account preferences, notifications, and security settings.
  </p>
</div>
```

---

## Navigation

### Desktop Navigation

```tsx
// Navigation container
<div className="hidden md:flex md:items-center md:gap-3 lg:gap-4">

// Navigation items (dropdowns & links)
<button className="inline-flex items-center h-10 px-3 lg:px-4 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
  <Icon className="w-4 h-4 lg:mr-2" />
  <span className="hidden lg:inline">Label</span>
  <ChevronDown className="w-4 h-4 lg:ml-1" />
</button>
```

### Mobile Navigation

```tsx
// Mobile right side
<div className="flex md:hidden items-center gap-3">
  {/* Action buttons, theme toggle, notifications, profile */}
</div>
```

### Profile Dropdown

```tsx
// Avatar button
<Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all">
  <img className="w-10 h-10 rounded-full object-cover border-2 border-border" />
</Button>

// Dropdown content
<DropdownMenuContent className="w-72 p-4" align="end">
  {/* Profile header */}
  <div className="flex flex-col space-y-2 pb-3">
    <h3 className="text-lg font-bold leading-tight">Name</h3>
    <p className="text-sm text-muted-foreground -mt-1">@handle</p>
    <Badge className="text-xs font-medium bg-primary text-primary-foreground">
      Role
    </Badge>
  </div>

  <DropdownMenuSeparator className="my-2" />

  {/* Menu items */}
  <div className="space-y-1">
    <DropdownMenuItem className="py-3 cursor-pointer">
      <Icon className="mr-3 h-5 w-5" />
      <span className="text-base">Label</span>
    </DropdownMenuItem>
  </div>
</DropdownMenuContent>
```

---

## Cards & Containers

### Standard Card Pattern

```tsx
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>
      Description explaining what this section does.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Card content */}
  </CardContent>
</Card>
```

### Card Styling
- Cards use default shadcn styling with `bg-card` and `border-border`
- Maintain consistent padding via CardHeader and CardContent
- Use `space-y-6` for spacing between items in CardContent

---

## Forms & Inputs

### Form Field Pattern

```tsx
<div className="space-y-2">
  <Label htmlFor="field-id" className="text-base">
    Field Label
  </Label>
  <Input
    id="field-id"
    type="text"
    placeholder="Placeholder text"
    className="..."
  />
  <p className="text-sm text-muted-foreground">
    Helper text explaining the field
  </p>
</div>
```

### Switch/Toggle Pattern

```tsx
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="switch-id" className="text-base">
      Setting Label
    </Label>
    <p className="text-sm text-muted-foreground">
      Description of what this toggle does.
    </p>
  </div>
  <Switch
    id="switch-id"
    checked={value}
    onCheckedChange={handler}
  />
</div>
```

### Select Pattern

```tsx
<div className="space-y-2">
  <Label htmlFor="select-id" className="text-base">
    Select Label
  </Label>
  <Select value={value} onValueChange={handler}>
    <SelectTrigger id="select-id">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">Option Label</SelectItem>
      <SelectItem value="option2">Option Label</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## Buttons

### Button Variants

```tsx
// Primary - Main actions
<Button>Primary Action</Button>
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">

// Secondary - Less important actions
<Button variant="outline">Secondary Action</Button>

// Destructive - Delete/dangerous actions
<Button variant="destructive">Delete Account</Button>

// Ghost - Minimal style for tertiary actions
<Button variant="ghost">Cancel</Button>
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>
<Button size="icon" className="h-10 w-10">Icon Only</Button>
```

### Button States

```tsx
// Loading state
<Button disabled>
  {loading ? 'Loading...' : 'Submit'}
</Button>

// Disabled state
<Button disabled>Disabled</Button>
```

---

## Tabs

### Tab Component Structure

```tsx
<Tabs defaultValue="tab1" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="tab1">Notifications</TabsTrigger>
    <TabsTrigger value="tab2">Privacy</TabsTrigger>
    <TabsTrigger value="tab3">Security</TabsTrigger>
    <TabsTrigger value="tab4">Account</TabsTrigger>
  </TabsList>

  <TabsContent value="tab1" className="space-y-6 mt-6">
    {/* Tab content */}
  </TabsContent>
</Tabs>
```

### Tab Styling
- **Container**: `bg-muted/50 backdrop-blur-xl border-border shadow-lg rounded-xl h-14 p-1.5`
- **Inactive tabs**: `text-muted-foreground hover:text-foreground hover:bg-accent/50`
- **Active tab**: `bg-background text-foreground shadow-lg shadow-primary/5`
- **Spacing**: `gap-3 lg:gap-4` between navbar items

---

## Badges & Tags

### Badge Variants

```tsx
// Primary badge (solid background)
<Badge className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
  Contributor
</Badge>

// Secondary badge (subtle)
<Badge variant="secondary" className="text-xs">
  Secondary
</Badge>

// Outline badge
<Badge variant="outline" className="text-xs">
  Outline
</Badge>
```

### Usage Context
- **Profile roles**: Primary badge with solid background
- **Status indicators**: Secondary or outline badges
- **Tags/categories**: Outline badges

---

## Responsive Design

### Breakpoints

```
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large desktops
```

### Responsive Patterns

#### Hide/Show Content

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">

// Show on mobile, hide on desktop
<div className="md:hidden">

// Responsive flex
<div className="hidden md:flex">
```

#### Responsive Spacing

```tsx
// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">

// Responsive gaps
<div className="gap-2 lg:gap-4">
<div className="space-x-2 lg:space-x-4">
```

#### Responsive Typography

```tsx
// Responsive text sizes
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">

// Responsive leading
<h3 className="text-lg font-bold leading-tight">
```

#### Responsive Button Text

```tsx
// Icon only on mobile, text on desktop
<Button className="hidden lg:inline-flex h-10 px-4">
  <Plus className="w-4 h-4 mr-2" />
  Gig
</Button>
<Button size="icon" className="lg:hidden h-10 w-10">
  <Plus className="w-4 h-4" />
</Button>
```

---

## Implementation Guidelines

### 1. Always Check the Design System First
Before creating a new component or page, refer to this document for:
- Color usage patterns
- Spacing conventions
- Component structures
- Responsive behaviors

### 2. No Hardcoded Colors
**Rule**: Every color MUST use a theme variable.

```tsx
// ✅ CORRECT
className="bg-background border-border text-muted-foreground"

// ❌ WRONG
className="bg-gray-100 border-gray-200 text-gray-600"
className="bg-white border-gray-300 text-black"
className="bg-[#f5f5f5] text-[#333333]"
```

### 3. Use shadcn Components
Leverage existing shadcn components:
- Button
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Input, Label, Switch, Select
- Tabs, TabsList, TabsTrigger, TabsContent
- Badge
- DropdownMenu

### 4. Consistent Spacing
- Between sections: `space-y-6` or `mt-6`
- Between form fields: `space-y-4`
- Between related items: `space-y-2`
- Card padding: Use CardHeader and CardContent components

### 5. Responsive Design
- Mobile-first approach
- Use responsive modifiers: `sm:`, `md:`, `lg:`, `xl:`
- Test on all breakpoints
- Hide/show appropriately for different screen sizes

### 6. Typography Hierarchy
Maintain clear hierarchy:
- Page title: `text-3xl font-bold`
- Section title: `text-2xl font-bold` or `text-xl font-semibold`
- Card title: Use `<CardTitle>` component
- Body text: `text-base` or `text-sm`
- Helper text: `text-sm text-muted-foreground`

### 7. Interactive States
Always provide clear states:
- Hover: `hover:bg-accent/50 hover:text-foreground`
- Active: `data-[state=active]:bg-primary/10`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring`
- Disabled: `disabled:opacity-50 disabled:pointer-events-none`

### 8. Accessibility
- Use semantic HTML
- Include proper ARIA labels
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Provide focus indicators

---

## Common Patterns Reference

### Settings Page Layout

```tsx
<div className="max-w-4xl mx-auto py-8 px-4">
  {/* Page Header */}
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-foreground">Page Title</h1>
    <p className="text-muted-foreground mt-2">Page description</p>
  </div>

  {/* Tabs */}
  <Tabs defaultValue="tab1" className="w-full">
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
      <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    </TabsList>

    <TabsContent value="tab1" className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content */}
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
</div>
```

### Form Section Pattern

```tsx
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Section description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Toggle setting */}
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label className="text-base">Setting Name</Label>
        <p className="text-sm text-muted-foreground">Setting description</p>
      </div>
      <Switch checked={value} onCheckedChange={handler} />
    </div>

    {/* Divider between settings */}
    <hr className="my-6" />

    {/* Another setting */}

    {/* Save button */}
    <Button onClick={handleSave}>
      Save Settings
    </Button>
  </CardContent>
</Card>
```

---

## Migration Checklist

When updating existing pages to match this design system:

- [ ] Replace all hardcoded colors with theme variables
- [ ] Update card structures to use shadcn Card components
- [ ] Ensure consistent spacing (space-y-6 for sections, space-y-4 for forms)
- [ ] Update typography to use correct hierarchy
- [ ] Add responsive modifiers for mobile support
- [ ] Update buttons to use proper variants
- [ ] Ensure all interactive states are styled
- [ ] Test in both light and dark modes
- [ ] Verify keyboard navigation and accessibility

---

## Questions or Updates?

This design system is the single source of truth for Preset's design language. All pages should follow these patterns.

**Last Updated**: January 2025
**Version**: 2.0
**Status**: Active & Definitive

---
