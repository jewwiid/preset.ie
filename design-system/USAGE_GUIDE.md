# Preset Design System - Usage Guide

A comprehensive guide for developers on how to effectively use the Preset Design System in their applications.

## 🚀 Getting Started

### Installation

The design system is already integrated into your Preset platform. No additional installation is required.

### Import Methods

#### Method 1: Design Tokens (Recommended)
```typescript
import { colors, spacing, typography } from '@preset/tokens'

// Use in your components
const MyComponent = () => (
  <div style={{
    backgroundColor: colors.brand.preset[500],
    padding: spacing.lg,
    fontSize: typography.fontSize.lg
  }}>
    Content
  </div>
)
```

#### Method 2: Tailwind Classes
```tsx
// Use Tailwind utility classes
<div className="bg-preset-500 text-white p-6 text-lg">
  Content
</div>
```

#### Method 3: UI Components
```tsx
import { Button, Card, Input } from '@preset/ui'

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text..." />
      <Button variant="primary">Submit</Button>
    </Card>
  )
}
```

## 🎨 Color System Usage

### Brand Colors

#### Primary Brand Color
```tsx
// Primary brand color (#00876f)
<div className="bg-preset-500 text-white">
  Primary brand element
</div>

// CSS variable
<div style={{ backgroundColor: 'var(--preset-500)' }}>
  Using CSS variable
</div>

// Design token
<div style={{ backgroundColor: colors.brand.preset[500] }}>
  Using design token
</div>
```

#### Color Variants
```tsx
// Light variant for backgrounds
<div className="bg-preset-50 text-preset-900">
  Light background
</div>

// Medium variant for accents
<div className="bg-preset-300 text-preset-900">
  Medium accent
</div>

// Dark variant for text
<div className="bg-preset-800 text-preset-100">
  Dark background
</div>
```

### Semantic Colors

#### Success States
```tsx
// Success message
<div className="bg-green-50 text-green-800 border border-green-200">
  Success message
</div>

// Success button
<Button className="bg-green-600 hover:bg-green-700 text-white">
  Success Action
</Button>
```

#### Warning States
```tsx
// Warning message
<div className="bg-amber-50 text-amber-800 border border-amber-200">
  Warning message
</div>

// Warning button
<Button className="bg-amber-600 hover:bg-amber-700 text-white">
  Warning Action
</Button>
```

#### Error States
```tsx
// Error message
<div className="bg-rose-50 text-rose-800 border border-rose-200">
  Error message
</div>

// Error button
<Button className="bg-rose-600 hover:bg-rose-700 text-white">
  Error Action
</Button>
```

### Context-Specific Colors

#### Professional Information
```tsx
// Experience, skills, professional details
<div className="bg-blue-50 text-blue-800 border border-blue-200">
  Professional information
</div>

// Icons
<div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
  <Icon className="w-3 h-3 text-white" />
</div>
```

#### Specializations & Advanced Features
```tsx
// Specializations, advanced features
<div className="bg-purple-50 text-purple-800 border border-purple-200">
  Specializations
</div>

// Icons
<div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
  <Icon className="w-3 h-3 text-white" />
</div>
```

#### Pricing & Financial Information
```tsx
// Rates, pricing, financial data
<div className="bg-yellow-50 text-yellow-800 border border-yellow-200">
  Rate information
</div>

// Icons
<div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
  <Icon className="w-3 h-3 text-white" />
</div>
```

#### Travel & Availability
```tsx
// Travel, availability, positive actions
<div className="bg-green-50 text-green-800 border border-green-200">
  Travel availability
</div>

// Icons
<div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
  <Icon className="w-3 h-3 text-white" />
</div>
```

## 🧩 Component Usage

### Button Components

#### Variants
```tsx
// Primary button (main actions)
<Button variant="primary" size="lg">
  Create New Gig
</Button>

// Secondary button (secondary actions)
<Button variant="secondary" size="md">
  Cancel
</Button>

// Outline button (subtle actions)
<Button variant="outline" size="sm">
  Learn More
</Button>
```

#### Sizes
```tsx
// Small button
<Button size="sm">Small</Button>

// Medium button (default)
<Button size="md">Medium</Button>

// Large button
<Button size="lg">Large</Button>
```

#### States
```tsx
// Loading state
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Processing...
</Button>

// Icon button
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>
```

### Card Components

#### Basic Cards
```tsx
// Simple card
<Card>
  <CardContent className="p-6">
    <h3 className="text-lg font-semibold mb-2">Card Title</h3>
    <p className="text-gray-600">Card content...</p>
  </CardContent>
</Card>
```

#### Feature Cards
```tsx
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

### Input Components

#### Basic Inputs
```tsx
// Text input
<Input 
  type="text"
  placeholder="Enter your name"
  className="w-full"
/>

// Email input
<Input 
  type="email"
  placeholder="Enter your email"
  className="w-full"
/>

// Password input
<Input 
  type="password"
  placeholder="Enter your password"
  className="w-full"
/>
```

#### Input with Labels
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
    Full Name
  </label>
  <Input 
    type="text"
    placeholder="Enter your full name"
    className="w-full"
  />
</div>
```

## 📱 Responsive Design

### Breakpoint System
```typescript
// Breakpoints
xs: '475px'   // Mobile small
sm: '640px'   // Mobile large
md: '768px'   // Tablet
lg: '1024px'  // Desktop small
xl: '1280px'  // Desktop large
'2xl': '1536px' // Desktop extra large
```

### Mobile-First Approach
```tsx
// Responsive grid
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3
  gap-4
  p-4
  md:p-6
  lg:p-8
">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>

// Responsive typography
<h1 className="
  text-xl
  md:text-2xl
  lg:text-3xl
  font-bold
">
  Responsive Heading
</h1>

// Responsive spacing
<div className="
  p-4
  md:p-6
  lg:p-8
">
  Responsive padding
</div>
```

### Responsive Components
```tsx
// Responsive navigation
<nav className="hidden md:flex">
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/gigs">Browse Gigs</Link>
</nav>

// Mobile menu
<div className="md:hidden">
  <button className="p-2">
    <Menu className="w-6 h-6" />
  </button>
</div>
```

## 🌙 Dark Mode

### Automatic Dark Mode
```tsx
// Automatically adapts to user's theme preference
<div className="bg-background text-foreground">
  Content adapts automatically
</div>

// Using semantic colors
<Button className="bg-primary text-primary-foreground">
  Primary button
</Button>
```

### Manual Dark Mode
```tsx
// Explicit dark mode styling
<div className="bg-white dark:bg-gray-800">
  Manual dark mode
</div>

// Dark mode with brand colors
<div className="bg-preset-500 dark:bg-preset-400">
  Brand color with dark mode
</div>
```

### Dark Mode Best Practices
```tsx
// Good: Use semantic colors
<div className="bg-background text-foreground">
  Semantic colors
</div>

// Good: Use CSS variables
<div style={{ backgroundColor: 'var(--background)' }}>
  CSS variables
</div>

// Avoid: Hard-coded colors
<div className="bg-white dark:bg-gray-800">
  Hard-coded colors (use sparingly)
</div>
```

## 🎨 Styling Patterns

### Gradient Backgrounds
```tsx
// Brand gradient
<div className="bg-gradient-to-r from-emerald-600 to-teal-600">
  Brand gradient
</div>

// Subtle gradient
<div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
  Subtle gradient
</div>

// Hero gradient
<div className="bg-gradient-to-br from-emerald-500 to-teal-600">
  Hero gradient
</div>
```

### Glass Morphism
```tsx
// Glass effect
<div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/20 shadow-xl">
  Glass morphism
</div>
```

### Icon Containers
```tsx
// Large icon container
<div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
  <Icon className="w-4 h-4 text-white" />
</div>

// Small icon container
<div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
  <Icon className="w-3 h-3 text-white" />
</div>
```

## 🎯 Best Practices

### Component Composition
```tsx
// Good: Composed components
<Card className="bg-white/90 backdrop-blur-sm">
  <CardHeader>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-gradient-to-br from-preset-400 to-preset-600 rounded-lg">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <CardTitle>Section Title</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <Input placeholder="Enter text..." />
      <Button variant="primary">Submit</Button>
    </div>
  </CardContent>
</Card>

// Avoid: Inline styles
<div style={{ backgroundColor: '#00876f', padding: '16px' }}>
  Avoid inline styles
</div>
```

### Consistent Spacing
```tsx
// Good: Use design tokens
<div className="p-4 md:p-6 lg:p-8">
  Consistent spacing
</div>

// Good: Use semantic spacing
<Stack spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// Avoid: Random spacing
<div className="p-3.5 md:p-7 lg:p-9">
  Avoid random spacing
</div>
```

### Color Usage
```tsx
// Good: Use semantic colors
<Button variant="primary">Primary Action</Button>
<div className="bg-green-50 text-green-800">Success Message</div>

// Good: Use brand colors
<div className="bg-preset-500 text-white">Brand Element</div>

// Avoid: Hard-coded colors
<div className="bg-[#00876f]">Avoid hard-coded colors</div>
```

### Accessibility
```tsx
// Good: Proper labels
<label htmlFor="email" className="block text-sm font-medium">
  Email Address
</label>
<Input id="email" type="email" placeholder="Enter your email" />

// Good: ARIA attributes
<button 
  aria-label="Close dialog"
  aria-expanded={isOpen}
>
  <X className="w-4 h-4" />
</button>

// Good: Focus management
<Input 
  className="focus:ring-2 focus:ring-preset-500 focus:border-preset-500"
  aria-invalid={hasError}
/>
```

## 🚨 Common Mistakes

### ❌ Don't Do This
```tsx
// Hard-coded colors
<div className="bg-[#00876f]">Don't hard-code colors</div>

// Inconsistent spacing
<div className="p-3.5 md:p-7">Don't use random spacing</div>

// Missing accessibility
<button><Icon /></button> // Missing aria-label

// Inline styles
<div style={{ backgroundColor: '#00876f' }}>Don't use inline styles</div>
```

### ✅ Do This Instead
```tsx
// Use design tokens
<div className="bg-preset-500">Use design tokens</div>

// Consistent spacing
<div className="p-4 md:p-6">Use consistent spacing</div>

// Proper accessibility
<button aria-label="Close dialog"><Icon /></button>

// CSS classes
<div className="bg-preset-500">Use CSS classes</div>
```

## 🔧 Troubleshooting

### Common Issues

#### Colors Not Showing
```tsx
// Issue: Colors not appearing
<div className="bg-preset-500">Color not showing</div>

// Solution: Check Tailwind config
// Ensure preset colors are defined in tailwind.config.js
```

#### Dark Mode Not Working
```tsx
// Issue: Dark mode not switching
<div className="bg-white dark:bg-gray-800">Dark mode not working</div>

// Solution: Check CSS variables
// Ensure dark mode variables are defined in globals.css
```

#### Components Not Rendering
```tsx
// Issue: Components not rendering
import { Button } from '@preset/ui'

// Solution: Check imports
// Ensure components are properly exported from @preset/ui
```

### Debug Tips

1. **Check Tailwind Config**: Ensure all colors are defined
2. **Verify CSS Variables**: Check globals.css for proper variable definitions
3. **Test Responsive**: Use browser dev tools to test breakpoints
4. **Validate Accessibility**: Use accessibility tools to check compliance

## 📚 Additional Resources

- [Design System Overview](./DESIGN_SYSTEM_OVERVIEW.md)
- [Component Examples](./examples/COMPONENT_EXAMPLES.md)
- [Theme Management Guide](./documentation/THEME_MANAGEMENT.md)
- [Styling Consistency Guide](./documentation/STYLING_CONSISTENCY_IMPROVEMENTS.md)

---

This usage guide provides comprehensive instructions for implementing the Preset Design System. For additional support or questions, refer to the documentation or reach out to the development team.
