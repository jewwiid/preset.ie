# Component Usage Examples

This document provides practical examples of how to use the Preset Design System components in real-world scenarios.

## 🧩 Basic Components

### Button Examples

#### Primary Actions
```tsx
// Main call-to-action buttons
<Button variant="primary" size="lg">
  Create New Gig
</Button>

<Button variant="primary" size="md">
  Apply Now
</Button>

<Button variant="primary" size="sm">
  Save Changes
</Button>
```

#### Secondary Actions
```tsx
// Secondary actions
<Button variant="secondary" size="md">
  Cancel
</Button>

<Button variant="outline" size="md">
  Learn More
</Button>
```

#### Button States
```tsx
// Loading state
<Button variant="primary" disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Processing...
</Button>

// Icon buttons
<Button variant="outline" size="sm">
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>
```

### Card Examples

#### Basic Cards
```tsx
// Simple content card
<Card>
  <CardContent className="p-6">
    <h3 className="text-lg font-semibold mb-2">Card Title</h3>
    <p className="text-gray-600">Card content goes here...</p>
  </CardContent>
</Card>
```

#### Feature Cards with Gradients
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

// Specializations card
<Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-100 dark:border-purple-800/50">
  <CardContent className="p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
        <Target className="w-3 h-3 text-white" />
      </div>
      <span className="text-purple-800 dark:text-purple-200 text-sm font-medium">Specializations</span>
    </div>
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-sm rounded-full">
        Portrait Photography
      </span>
      <span className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-sm rounded-full">
        Event Photography
      </span>
    </div>
  </CardContent>
</Card>
```

#### Pricing Cards
```tsx
// Rate information card
<Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-100 dark:border-yellow-800/50">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
          <DollarSign className="w-3 h-3 text-white" />
        </div>
        <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">Rate Range</span>
      </div>
      <span className="text-gray-900 dark:text-white font-bold">$50 - $150 / hour</span>
    </div>
  </CardContent>
</Card>
```

### Input Examples

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
// Labeled input
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

#### Input States
```tsx
// Error state
<Input 
  type="email"
  placeholder="Enter your email"
  className="w-full border-red-300 focus:border-red-500 focus:ring-red-500"
  aria-invalid="true"
/>

// Success state
<Input 
  type="email"
  placeholder="Enter your email"
  className="w-full border-green-300 focus:border-green-500 focus:ring-green-500"
  aria-invalid="false"
/>
```

## 🎨 Layout Components

### Stack Layout
```tsx
// Vertical stack
<Stack direction="column" spacing="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>

// Horizontal stack
<Stack direction="row" spacing="sm" align="center">
  <Button variant="outline">Cancel</Button>
  <Button variant="primary">Save</Button>
</Stack>
```

### Grid Layout
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>
    <CardContent>Card 1</CardContent>
  </Card>
  <Card>
    <CardContent>Card 2</CardContent>
  </Card>
  <Card>
    <CardContent>Card 3</CardContent>
  </Card>
</div>
```

## 🎯 Real-World Examples

### Navigation Component
```tsx
// Navigation with brand colors
<nav className="bg-white shadow-lg">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-2">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900">Preset</span>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:ml-6 md:flex md:space-x-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-emerald-600 bg-emerald-50"
        >
          <Home className="h-4 w-4 mr-1.5" />
          Dashboard
        </Link>
        <Link
          href="/gigs"
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
        >
          <Briefcase className="h-4 w-4 mr-1.5" />
          Browse Gigs
        </Link>
      </div>

      {/* User Menu */}
      <div className="flex items-center">
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Gig
        </Button>
      </div>
    </div>
  </div>
</nav>
```

### Profile Section
```tsx
// Professional details section
<div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 mt-6 border border-white/20 shadow-xl">
  <div className="flex items-center mb-6">
    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
      <Briefcase className="w-4 h-4 text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Professional Details</h3>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Experience Card */}
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

    {/* Rate Card */}
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-100 dark:border-yellow-800/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <DollarSign className="w-3 h-3 text-white" />
            </div>
            <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">Rate Range</span>
          </div>
          <span className="text-gray-900 dark:text-white font-bold">$50 - $150</span>
        </div>
      </CardContent>
    </Card>

    {/* Travel Card */}
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <span className="text-green-800 dark:text-green-200 text-sm font-medium">Travel</span>
          </div>
          <span className="text-gray-900 dark:text-white font-bold">50km radius</span>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
```

### Filter Section
```tsx
// Creator profile filters
<div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
      <Filter className="w-4 h-4 text-white" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Creator Profile Filters</h3>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Experience Filter */}
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800/50">
      <CardContent className="p-4">
        <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
          Experience (Years)
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            max="50"
            placeholder="Min"
            className="w-full"
          />
          <Input
            type="number"
            min="0"
            max="50"
            placeholder="Max"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>

    {/* Rate Filter */}
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-100 dark:border-yellow-800/50">
      <CardContent className="p-4">
        <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
          Hourly Rate ($)
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Min"
            className="w-full"
          />
          <Input
            type="number"
            min="0"
            placeholder="Max"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>

    {/* Availability Filter */}
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800/50">
      <CardContent className="p-4">
        <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-3">
          Availability
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 w-4 h-4 text-green-600 bg-white dark:bg-gray-700 border-green-300 dark:border-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Available for Travel</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 w-4 h-4 text-green-600 bg-white dark:bg-gray-700 border-green-300 dark:border-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Has Studio</span>
          </label>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
```

## 🎨 Styling Patterns

### Gradient Backgrounds
```tsx
// Brand gradient
<div className="bg-gradient-to-r from-emerald-600 to-teal-600">
  Brand gradient background
</div>

// Subtle gradient
<div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
  Subtle gradient background
</div>

// Hero gradient
<div className="bg-gradient-to-br from-emerald-500 to-teal-600">
  Hero section gradient
</div>
```

### Glass Morphism
```tsx
// Glass effect
<div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/20 shadow-xl">
  Glass morphism effect
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

## 📱 Responsive Examples

### Mobile-First Design
```tsx
// Responsive grid
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  md:grid-cols-3 
  lg:grid-cols-4 
  gap-4
  p-4
  md:p-6
  lg:p-8
">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
  <Card>Card 4</Card>
</div>

// Responsive typography
<h1 className="
  text-xl
  sm:text-2xl
  md:text-3xl
  lg:text-4xl
  font-bold
  text-gray-900
  dark:text-white
">
  Responsive Heading
</h1>

// Responsive spacing
<div className="
  p-4
  sm:p-6
  md:p-8
  lg:p-12
">
  Responsive padding
</div>
```

### Mobile Navigation
```tsx
// Mobile menu
<div className="md:hidden">
  <div className="px-2 pt-2 pb-3 space-y-1">
    <Link
      href="/dashboard"
      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-emerald-600 bg-emerald-50"
    >
      <Home className="h-5 w-5 mr-2" />
      Dashboard
    </Link>
    <Link
      href="/gigs"
      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
    >
      <Briefcase className="h-5 w-5 mr-2" />
      Browse Gigs
    </Link>
  </div>
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

---

These examples demonstrate the proper usage of the Preset Design System components. Always refer to the component documentation for the latest API and follow the established patterns for consistency across the platform.
