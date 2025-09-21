# Preset Design System

## 🎯 **Mission: Zero Hardcoded Colors**

This design system ensures **100% theme consistency** across all components by eliminating hardcoded colors and providing comprehensive templates, guidelines, and tools.

## 📚 **Quick Start Guide**

### **1. Read the Core Guide**
Start with [`DESIGN_CONSISTENCY_GUIDE.md`](./DESIGN_CONSISTENCY_GUIDE.md) - this is your bible for maintaining consistency.

### **2. Use Component Templates**
Copy templates from [`COMPONENT_TEMPLATE_GENERATOR.md`](./COMPONENT_TEMPLATE_GENERATOR.md) for instant theme-aware components.

### **3. Install VS Code Snippets**
Add [`vscode-snippets.json`](./vscode-snippets.json) to your VS Code snippets for rapid component creation.

## 🚀 **VS Code Setup**

### **Install Snippets**
1. Open VS Code
2. Go to `File > Preferences > Configure User Snippets`
3. Select `typescriptreact.json`
4. Copy the contents of [`vscode-snippets.json`](./vscode-snippets.json)
5. Save and restart VS Code

### **Available Snippets**
- `preset-component` - Creates a new theme-aware component
- `preset-form` - Creates a form with proper styling
- `preset-list` - Creates a list component with empty states
- `theme` - Shows all available theme classes

## 🎨 **Theme Classes Reference**

### **Background Colors**
```css
bg-background        /* Main page background */
bg-card             /* Card backgrounds */
bg-muted            /* Subtle backgrounds */
bg-primary          /* Primary actions */
bg-secondary        /* Secondary actions */
bg-destructive      /* Error/danger states */
bg-accent           /* Accent highlights */
```

### **Text Colors**
```css
text-foreground        /* Primary text */
text-muted-foreground  /* Secondary text */
text-primary           /* Primary accent text */
text-secondary         /* Secondary accent text */
text-destructive       /* Error text */
text-card-foreground   /* Text on cards */
```

### **Border Colors**
```css
border-border          /* Default borders */
border-primary         /* Primary borders */
border-destructive     /* Error borders */
border-muted           /* Subtle borders */
```

## 🚫 **Forbidden Patterns**

### **Never Use These:**
```typescript
// ❌ Hardcoded colors
className="bg-red-500 text-white border-gray-300"

// ❌ Inline styles
style={{ backgroundColor: '#ef4444', color: '#ffffff' }}

// ❌ Custom CSS with hardcoded colors
className="my-custom-red-button"
```

### **Always Use These:**
```typescript
// ✅ Theme-aware classes
className="bg-destructive text-destructive-foreground border-destructive"

// ✅ CSS variables
className="bg-primary text-primary-foreground hover:bg-primary/90"

// ✅ Semantic classes
className="bg-card text-card-foreground border-border"
```

## 🏗️ **Component Creation Workflow**

### **1. Choose Your Template**
- **Basic Card**: Use `preset-component` snippet
- **Forms**: Use `preset-form` snippet  
- **Lists**: Use `preset-list` snippet
- **Custom**: Copy from template generator

### **2. Customize Your Component**
```typescript
// Start with template
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MyComponent() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>My Component</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Your content */}
      </CardContent>
    </Card>
  )
}
```

### **3. Test Theme Consistency**
- ✅ **Light mode**: Check appearance
- ✅ **Dark mode**: Verify contrast
- ✅ **Responsive**: Test mobile/desktop
- ✅ **Accessibility**: Verify focus states

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

## 🎯 **Common Patterns**

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
```

### **Loading States**
```typescript
// Loading Spinner
<div className="flex items-center justify-center p-8">
  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
</div>

// Loading Skeleton
<div className="bg-muted animate-pulse rounded-lg h-4 w-3/4"></div>
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

## 🔧 **Development Tools**

### **VS Code Extensions**
- **Tailwind CSS IntelliSense** - Autocomplete for theme classes
- **TypeScript Importer** - Auto-import shadcn components
- **Prettier** - Consistent code formatting

### **Browser Extensions**
- **Tailwind CSS DevTools** - Inspect theme classes
- **ColorZilla** - Verify color contrast ratios

## 📖 **Documentation Files**

- [`DESIGN_CONSISTENCY_GUIDE.md`](./DESIGN_CONSISTENCY_GUIDE.md) - Core principles and guidelines
- [`COMPONENT_TEMPLATE_GENERATOR.md`](./COMPONENT_TEMPLATE_GENERATOR.md) - Ready-to-use templates
- [`vscode-snippets.json`](./vscode-snippets.json) - VS Code snippets for rapid development
- [`README.md`](./README.md) - This overview guide

## 🚀 **Getting Help**

### **Quick Questions**
1. **Need a component template?** → Check `COMPONENT_TEMPLATE_GENERATOR.md`
2. **What colors can I use?** → Run the `theme` snippet in VS Code
3. **Is this color allowed?** → Check `DESIGN_CONSISTENCY_GUIDE.md`

### **Best Practices**
1. **Always start with a template** - don't build from scratch
2. **Use VS Code snippets** - they enforce best practices
3. **Test in both themes** - light and dark mode
4. **Review with the checklist** - before submitting PRs

## 🎉 **Success Metrics**

When following this design system, you'll achieve:

- ✅ **100% theme consistency** across all components
- ✅ **Zero hardcoded colors** in the codebase
- ✅ **Faster development** with templates and snippets
- ✅ **Better accessibility** with semantic classes
- ✅ **Easier maintenance** with centralized theming
- ✅ **Professional appearance** with consistent styling

---

**Remember: Every component should look like it was designed by the same person, following the same principles, using the same design language. This system makes that effortless.**