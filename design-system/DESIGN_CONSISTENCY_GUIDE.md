# Design Consistency Guide - No Hardcoded Colors

## 🎯 **Core Principle: Always Use Theme-Aware Classes**

**NEVER use hardcoded colors like `bg-red-500`, `text-blue-600`, `border-gray-300`**
**ALWAYS use semantic theme classes like `bg-destructive`, `text-primary`, `border-border`**

## ✅ **Approved Theme Classes**

### **Background Colors**
```typescript
// ✅ CORRECT - Theme-aware
bg-background        // Main page background
bg-card             // Card backgrounds
bg-muted            // Subtle backgrounds
bg-primary          // Primary actions
bg-secondary        // Secondary actions
bg-destructive      // Error/danger states
bg-accent           // Accent highlights

// ❌ WRONG - Hardcoded
bg-white
bg-gray-50
bg-blue-100
bg-red-500
```

### **Text Colors**
```typescript
// ✅ CORRECT - Theme-aware
text-foreground        // Primary text
text-muted-foreground  // Secondary text
text-primary           // Primary accent text
text-secondary         // Secondary accent text
text-destructive       // Error text
text-card-foreground   // Text on cards

// ❌ WRONG - Hardcoded
text-gray-900
text-gray-600
text-blue-600
text-red-500
```

### **Border Colors**
```typescript
// ✅ CORRECT - Theme-aware
border-border          // Default borders
border-primary         // Primary borders
border-destructive     // Error borders
border-muted           // Subtle borders

// ❌ WRONG - Hardcoded
border-gray-200
border-blue-300
border-red-500
```

### **Interactive States**
```typescript
// ✅ CORRECT - Theme-aware
hover:bg-accent           // Hover backgrounds
hover:text-foreground     // Hover text
focus:ring-primary        // Focus rings
active:bg-primary         // Active states

// ❌ WRONG - Hardcoded
hover:bg-gray-100
hover:text-blue-600
focus:ring-blue-500
```

## 🏗️ **Component Creation Template**

### **1. Always Start with This Structure**
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Import other shadcn components as needed

interface YourComponentProps {
  // Define props with proper TypeScript
}

export default function YourComponent({ ...props }: YourComponentProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          Component Title
        </CardTitle>
        <CardDescription>
          Component description using theme-aware text
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content here */}
      </CardContent>
    </Card>
  )
}
```

### **2. Standard Layout Patterns**
```typescript
// Main Container
<div className="min-h-screen bg-background text-foreground">
  
  // Page Header
  <div className="bg-card border-b border-border">
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Page Title</h1>
      <p className="text-muted-foreground mt-2">Page description</p>
    </div>
  </div>

  // Content Area
  <div className="container mx-auto px-4 py-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Grid items */}
    </div>
  </div>
</div>
```

### **3. Form Components**
```typescript
// Form Container
<Card>
  <CardHeader>
    <CardTitle>Form Title</CardTitle>
    <CardDescription>Form description</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    
    // Input Groups
    <div className="space-y-2">
      <Label className="text-base font-medium">Field Label</Label>
      <Input 
        className="bg-background border-border focus:ring-primary"
        placeholder="Enter value"
      />
      <p className="text-sm text-muted-foreground">Helper text</p>
    </div>

    // Buttons
    <div className="flex gap-3 pt-4">
      <Button variant="default" className="bg-primary text-primary-foreground">
        Primary Action
      </Button>
      <Button variant="outline" className="border-border">
        Secondary Action
      </Button>
    </div>
  </CardContent>
</Card>
```

## 🎨 **Color Usage Guidelines**

### **Primary Colors (Brand)**
- `bg-primary` - Main brand actions, CTAs
- `text-primary` - Brand text, links
- `border-primary` - Primary borders, focus states

### **Secondary Colors (Support)**
- `bg-secondary` - Secondary actions, alternatives
- `text-secondary` - Secondary text, subtitles
- `border-secondary` - Secondary borders

### **Semantic Colors (Meaning)**
- `bg-destructive` - Errors, deletions, dangerous actions
- `text-destructive` - Error messages, warnings
- `border-destructive` - Error borders, invalid states

### **Neutral Colors (Structure)**
- `bg-background` - Page backgrounds
- `bg-card` - Component backgrounds
- `bg-muted` - Subtle backgrounds, disabled states
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text, labels
- `border-border` - Default borders

## 🔧 **Common Patterns**

### **Status Indicators**
```typescript
// Success
<Badge className="bg-green-500/20 text-green-600 border-green-200">
  ✅ Success
</Badge>

// Error
<Badge className="bg-destructive/20 text-destructive border-destructive/20">
  ❌ Error
</Badge>

// Warning
<Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-200">
  ⚠️ Warning
</Badge>

// Info
<Badge className="bg-blue-500/20 text-blue-600 border-blue-200">
  ℹ️ Info
</Badge>
```

### **Loading States**
```typescript
// Loading Skeleton
<div className="bg-muted animate-pulse rounded-lg h-4 w-3/4"></div>

// Loading Spinner
<div className="flex items-center justify-center p-8">
  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
</div>
```

### **Empty States**
```typescript
<div className="text-center py-12">
  <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
  <h3 className="text-lg font-medium text-foreground mb-2">No items found</h3>
  <p className="text-muted-foreground mb-4">Description of empty state</p>
  <Button className="bg-primary text-primary-foreground">
    Add First Item
  </Button>
</div>
```

## 🚫 **Forbidden Patterns**

### **Never Use These:**
```typescript
// ❌ Hardcoded colors
className="bg-red-500 text-white border-gray-300"

// ❌ Inline styles
style={{ backgroundColor: '#ef4444', color: '#ffffff' }}

// ❌ Custom CSS classes with hardcoded colors
className="my-custom-red-button"

// ❌ Tailwind color variants
className="bg-blue-500 hover:bg-blue-600 text-white"
```

### **Instead Use:**
```typescript
// ✅ Theme-aware classes
className="bg-destructive text-destructive-foreground border-destructive"

// ✅ CSS variables
className="bg-primary text-primary-foreground hover:bg-primary/90"

// ✅ Semantic classes
className="bg-card text-card-foreground border-border"
```

## 📋 **Pre-Development Checklist**

Before creating any new component:

- [ ] **Import shadcn components** instead of custom elements
- [ ] **Use semantic color classes** (primary, secondary, destructive, etc.)
- [ ] **Apply consistent spacing** (space-y-4, gap-3, p-4, etc.)
- [ ] **Include proper TypeScript interfaces**
- [ ] **Add loading and empty states**
- [ ] **Ensure responsive design** (md:, lg: breakpoints)
- [ ] **Test in both light and dark modes**
- [ ] **Verify accessibility** (proper labels, focus states)

## 🔍 **Code Review Checklist**

When reviewing code, check for:

- [ ] **No hardcoded colors** (`bg-red-500`, `text-blue-600`)
- [ ] **Proper shadcn component usage**
- [ ] **Consistent spacing patterns**
- [ ] **Theme-aware hover/focus states**
- [ ] **Proper TypeScript types**
- [ ] **Responsive design patterns**
- [ ] **Accessibility considerations**

## 🎯 **Quick Reference Card**

```typescript
// Copy-paste template for new components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NewComponent() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">Content</p>
        <Button className="bg-primary text-primary-foreground">
          Action
        </Button>
      </CardContent>
    </Card>
  )
}
```

This guide ensures all new components automatically inherit the theme and maintain visual consistency across the application.
