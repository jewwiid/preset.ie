# Preset Design System

## Overview
The Preset design system is built on top of shadcn/ui components with our brand colors (`#00876f` - teal green) integrated throughout. This ensures consistency across all platforms while maintaining the visual identity from our brandkit.

## Brand Colors

### Primary Palette (Preset Green)
```css
preset-50:  #f0fdf9  /* Lightest tint - backgrounds */
preset-100: #ccfbef  /* Very light - subtle backgrounds */
preset-200: #99f6e0  /* Light - hover states */
preset-300: #5eead4  /* Medium light - accents */
preset-400: #2dd4bf  /* Medium - secondary buttons */
preset-500: #00876f  /* Primary brand color */
preset-600: #0d7d72  /* Slightly darker - hover states */
preset-700: #15706b  /* Dark - text on light backgrounds */
preset-800: #155e56  /* Darker - emphasis */
preset-900: #134e48  /* Darkest - high contrast text */
preset-950: #0a3b35  /* Ultra dark - maximum contrast */
```

### Brand Semantic Colors
```css
brand-primary:   #00876f  /* Main brand color */
brand-secondary: #2dd4bf  /* Secondary brand color */
brand-light:     #ccfbef  /* Light brand tint */
brand-dark:      #134e48  /* Dark brand shade */
```

## shadcn/ui Theme Integration

### Light Mode
- **Primary**: `preset-500` (#00876f) - buttons, links, focus states
- **Secondary**: Very light preset tint - subtle backgrounds
- **Accent**: `preset-300` - lighter interactions
- **Ring/Focus**: `preset-500` - focus outlines

### Dark Mode
- **Primary**: `preset-300` (#5eead4) - better contrast on dark backgrounds
- **Secondary**: Dark with subtle preset tint
- **Accent**: `preset-600` - medium preset tone
- **Ring/Focus**: `preset-300` - bright focus outlines

## Usage Examples

### Buttons
```tsx
// Primary button (uses brand color automatically)
<Button>Primary Action</Button>

// Secondary button
<Button variant="secondary">Secondary Action</Button>

// Custom brand colors
<Button className="bg-preset-500 hover:bg-preset-600">Custom Button</Button>
<Button className="bg-brand-primary hover:bg-brand-dark">Brand Button</Button>
```

### Cards and Surfaces
```tsx
// Standard card (uses theme colors)
<Card>
  <CardContent>Content here</CardContent>
</Card>

// Brand-tinted card
<Card className="border-preset-200 bg-preset-50">
  <CardContent>Brand-tinted content</CardContent>
</Card>
```

### Text and Typography
```tsx
// Brand-colored text
<h1 className="text-preset-600">Brand Heading</h1>
<p className="text-preset-700">Brand paragraph</p>

// Gradient text effect (pre-built class)
<h1 className="text-gradient">Gradient Brand Text</h1>
```

### Backgrounds and Gradients
```tsx
// Pre-built gradient classes
<div className="gradient-preset">Primary gradient background</div>
<div className="gradient-preset-radial">Radial gradient background</div>
<div className="gradient-hero">Hero section gradient</div>

// Custom gradient backgrounds
<div className="bg-gradient-to-r from-preset-500 to-preset-300">
  Custom gradient
</div>
```

## Glass Morphism Effects
```tsx
// Light glass effect
<div className="glass">Glass morphism light</div>

// Dark glass effect
<div className="glass-dark">Glass morphism dark</div>
```

## Components with Brand Integration

All shadcn/ui components automatically use the brand colors:

- **Input fields**: Focus rings use `preset-500`
- **Buttons**: Primary variant uses brand colors
- **Checkboxes & Radio buttons**: Use accent brand color
- **Progress bars**: Use brand color for progress
- **Alerts**: Can use brand colors for different states
- **Badges**: Brand-colored variants available

## Typography

### Font Stack
- **Primary**: Geist Sans (modern, clean)
- **Monospace**: Geist Mono
- **Brand**: Bloc W01 Regular (for brand elements)

### Usage
```tsx
// Brand font for special elements
<h1 className="font-bloc">Brand Typography</h1>

// Standard typography (uses Geist Sans automatically)
<h1>Standard Heading</h1>
<p>Standard paragraph text</p>
```

## Animations and Interactions

### Pre-built Animations
- `animate-float`: Subtle floating effect
- `animate-fade-in`: Fade in animation
- `animate-slide-in`: Slide in from left
- `animate-fadeIn`: Custom fade in

### Hover States
Most components include subtle hover transitions using brand colors:
```tsx
<Button className="transition-colors hover:bg-preset-600">
  Smooth hover transition
</Button>
```

## Dark Mode Support

The design system automatically adapts to dark mode using CSS media queries and the `dark:` prefix:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Adaptive content
</div>
```

## Best Practices

1. **Consistency**: Always use the predefined color tokens rather than custom hex values
2. **Contrast**: Ensure sufficient contrast ratios, especially with brand colors on light backgrounds
3. **Hierarchy**: Use the color scale to establish visual hierarchy (50 for subtle, 900 for emphasis)
4. **Brand Balance**: Use brand colors strategically - not everything needs to be green
5. **Accessibility**: Test color combinations for accessibility compliance

## Component Patterns

### Hero Section
```tsx
<section className="gradient-hero">
  <div className="container mx-auto px-4 py-16">
    <h1 className="text-gradient text-4xl font-bold">Welcome to Preset</h1>
    <p className="text-preset-700 mt-4">Your creative collaboration platform</p>
    <Button className="mt-8">Get Started</Button>
  </div>
</section>
```

### Feature Card
```tsx
<Card className="border-preset-200 hover:border-preset-300 transition-colors">
  <CardHeader>
    <CardTitle className="text-preset-800">Feature Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-preset-600">Feature description</p>
  </CardContent>
</Card>
```

This design system ensures consistency across your entire application while maintaining the distinctive Preset brand identity through the strategic use of your teal green brand color.