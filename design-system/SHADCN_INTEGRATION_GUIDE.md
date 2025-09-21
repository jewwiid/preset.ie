# Shadcn/UI Integration Guide

## 🎯 Overview

This guide explains how to integrate and use shadcn/ui components within the Preset Design System, ensuring consistency and best practices across your platform.

## 🚀 What is Shadcn/UI?

Shadcn/ui is a collection of reusable components built using Radix UI and Tailwind CSS. It provides:

- **Accessible Components**: Built on Radix UI primitives
- **Customizable**: Easy to modify and extend
- **Type-Safe**: Full TypeScript support
- **Consistent**: Follows design system principles
- **Modern**: Uses latest React patterns

## 📦 Installed Components

Your web app already has the following shadcn components installed:

### Core Components
- ✅ **Button** - Primary, secondary, outline, ghost variants
- ✅ **Card** - Container with header, content, footer
- ✅ **Input** - Form input fields
- ✅ **Badge** - Status indicators and labels
- ✅ **Avatar** - User profile images
- ✅ **Alert** - Notifications and messages
- ✅ **Dialog** - Modal dialogs
- ✅ **Form** - Form validation and handling
- ✅ **Select** - Dropdown selections
- ✅ **Textarea** - Multi-line text input

### Advanced Components
- ✅ **Accordion** - Collapsible content
- ✅ **Alert Dialog** - Confirmation dialogs
- ✅ **Calendar** - Date picker
- ✅ **Checkbox** - Form checkboxes
- ✅ **Date Picker** - Date selection
- ✅ **Dropdown Menu** - Context menus
- ✅ **Navigation Menu** - Site navigation
- ✅ **Pagination** - Page navigation
- ✅ **Popover** - Floating content
- ✅ **Progress** - Loading indicators
- ✅ **Radio Group** - Radio button groups
- ✅ **Scroll Area** - Custom scrollbars
- ✅ **Separator** - Visual dividers
- ✅ **Sheet** - Slide-out panels
- ✅ **Skeleton** - Loading placeholders
- ✅ **Slider** - Range inputs
- ✅ **Switch** - Toggle switches
- ✅ **Table** - Data tables
- ✅ **Tabs** - Tabbed content
- ✅ **Toast** - Notifications
- ✅ **Tooltip** - Hover information

## 🎨 Component Usage Examples

### Button Component

```tsx
import { Button } from "@/components/ui/button"

// Primary button
<Button>Primary Action</Button>

// Secondary button
<Button variant="secondary">Secondary Action</Button>

// Outline button
<Button variant="outline">Outline Action</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Ghost button
<Button variant="ghost">Ghost Action</Button>

// Link button
<Button variant="link">Link Action</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// Icon button
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

### Card Component

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card"

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Professional details card
<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800/50">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <TrendingUp className="w-3 h-3 text-white" />
        </div>
        <span className="text-blue-800 dark:text-blue-200 text-sm font-medium">Experience</span>
      </div>
      <span className="text-gray-900 dark:text-white font-bold">5 years</span>
    </div>
  </CardContent>
</Card>
```

### Form Components

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Form with input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter your email"
    className="w-full"
  />
</div>

// Form with textarea
<div className="space-y-2">
  <Label htmlFor="message">Message</Label>
  <Textarea 
    id="message" 
    placeholder="Enter your message"
    className="w-full"
  />
</div>

// Form with select
<div className="space-y-2">
  <Label htmlFor="role">Role</Label>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select a role" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="creator">Creator</SelectItem>
      <SelectItem value="talent">Talent</SelectItem>
      <SelectItem value="both">Both</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Badge Component

```tsx
import { Badge } from "@/components/ui/badge"

// Status badges
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>

// Skill tags
<Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
  Photography
</Badge>
<Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
  Videography
</Badge>
```

### Avatar Component

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// User avatar
<Avatar>
  <AvatarImage src="/avatars/user.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Multiple avatars
<div className="flex -space-x-2">
  <Avatar className="border-2 border-white">
    <AvatarImage src="/avatars/user1.jpg" />
    <AvatarFallback>AB</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-white">
    <AvatarImage src="/avatars/user2.jpg" />
    <AvatarFallback>CD</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-white">
    <AvatarFallback>+2</AvatarFallback>
  </Avatar>
</div>
```

## 🎨 Design System Integration

### Using with Your OKLCH Theme

All shadcn components automatically work with your OKLCH theme through CSS variables:

```tsx
// These automatically use your theme colors
<Button className="bg-primary text-primary-foreground">
  Uses OKLCH primary color
</Button>

<Card className="bg-card text-card-foreground border-border">
  Uses OKLCH card colors
</Card>

<Input className="border-input bg-background text-foreground">
  Uses OKLCH input colors
</Input>
```

### Customizing Components

You can customize components by extending the base classes:

```tsx
// Custom button with brand colors
<Button className="bg-preset-500 hover:bg-preset-600 text-white">
  Brand Button
</Button>

// Custom card with gradient
<Card className="bg-gradient-to-r from-preset-50 to-preset-100 border-preset-200">
  <CardContent>
    Brand themed card
  </CardContent>
</Card>

// Custom input with focus states
<Input className="focus:ring-preset-500 focus:border-preset-500" />
```

## 🏗️ Component Composition Patterns

### Professional Profile Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

<Card className="w-full max-w-md">
  <CardHeader className="text-center">
    <Avatar className="w-20 h-20 mx-auto mb-4">
      <AvatarImage src="/avatars/profile.jpg" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
    <CardTitle>John Doe</CardTitle>
    <p className="text-sm text-muted-foreground">Photographer & Videographer</p>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">Photography</Badge>
      <Badge variant="outline">Videography</Badge>
      <Badge variant="outline">Editing</Badge>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Experience</span>
        <span className="font-medium">5 years</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Rate</span>
        <span className="font-medium">$150/hour</span>
      </div>
    </div>
    <Button className="w-full">View Profile</Button>
  </CardContent>
</Card>
```

### Form with Validation

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>Create Account</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input 
        id="email" 
        type="email" 
        placeholder="Enter your email"
        className={hasError ? "border-destructive" : ""}
      />
      {hasError && (
        <Alert variant="destructive">
          <AlertDescription>
            Please enter a valid email address
          </AlertDescription>
        </Alert>
      )}
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <Input 
        id="password" 
        type="password" 
        placeholder="Enter your password"
      />
    </div>
    <Button className="w-full" disabled={isLoading}>
      {isLoading ? "Creating Account..." : "Create Account"}
    </Button>
  </CardContent>
</Card>
```

## 🔧 Best Practices

### 1. Consistent Spacing

```tsx
// Use consistent spacing classes
<div className="space-y-4"> {/* 16px between children */}
  <Card>
    <CardContent className="p-6"> {/* 24px padding */}
      <div className="space-y-2"> {/* 8px between children */}
        <Label>Label</Label>
        <Input />
      </div>
    </CardContent>
  </Card>
</div>
```

### 2. Responsive Design

```tsx
// Responsive card layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>
    <CardContent className="p-4 md:p-6">
      Responsive content
    </CardContent>
  </Card>
</div>
```

### 3. Accessibility

```tsx
// Always include proper labels and ARIA attributes
<Label htmlFor="email">Email Address</Label>
<Input 
  id="email" 
  type="email" 
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
{hasError && (
  <p id="email-error" className="text-destructive text-sm">
    Please enter a valid email
  </p>
)}
```

### 4. Loading States

```tsx
// Use skeleton components for loading states
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-full" />
  </div>
) : (
  <Card>
    <CardContent>Loaded content</CardContent>
  </Card>
)}
```

## 🚀 Adding New Components

To add new shadcn components:

```bash
# Add a single component
npx shadcn@latest add @shadcn/component-name

# Add multiple components
npx shadcn@latest add @shadcn/component1 @shadcn/component2

# Add from specific registry
npx shadcn@latest add @registry/component-name
```

## 📚 Resources

- [Shadcn/UI Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Class Variance Authority](https://cva.style/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🎯 Next Steps

1. **Review Existing Components**: Check all installed components
2. **Update Design System**: Integrate shadcn patterns
3. **Create Examples**: Build comprehensive component examples
4. **Test Integration**: Ensure all components work with your theme
5. **Document Usage**: Create usage guidelines for your team

---

This integration ensures your design system uses industry-standard, accessible, and maintainable components while maintaining consistency with your brand theme.
