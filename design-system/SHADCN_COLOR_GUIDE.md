# Shadcn Component Color Guide

## Overview

This guide explains how to customize colors for all shadcn/ui components using the Brand Design Testing System. The system provides comprehensive control over button variants, form elements, navigation components, interactive states, and more.

## 🎨 Color Categories

### 1. **Primary Colors**
- `--primary`: Main brand color for buttons, links, and accents
- `--primary-foreground`: Text color on primary backgrounds

### 2. **Background Colors**
- `--background`: Main page background
- `--card`: Card and component backgrounds
- `--card-foreground`: Text color on card backgrounds
- `--muted`: Muted backgrounds for inputs and secondary areas
- `--accent`: Accent backgrounds for hover states
- `--accent-foreground`: Text color on accent backgrounds

### 3. **Text Colors**
- `--foreground`: Primary text color
- `--muted-foreground`: Secondary text color

### 4. **Button Colors**
- `--secondary`: Secondary button background color
- `--secondary-foreground`: Text color on secondary buttons

### 5. **Semantic Colors**
- `--destructive`: Error and destructive action colors
- `--destructive-foreground`: Text color on destructive backgrounds

### 6. **Form Colors**
- `--input`: Input field border color

### 7. **Border Colors**
- `--border`: Border and divider colors
- `--ring`: Focus ring color

### 8. **Navigation Colors**
- `--popover`: Popover and dropdown backgrounds
- `--popover-foreground`: Text color in popovers

## 🧩 Component-Specific Color Usage

### **Buttons**
```tsx
// Primary Button
<Button>Primary</Button>
// Uses: --primary background, --primary-foreground text

// Secondary Button
<Button variant="secondary">Secondary</Button>
// Uses: --secondary background, --secondary-foreground text

// Destructive Button
<Button variant="destructive">Destructive</Button>
// Uses: --destructive background, --destructive-foreground text

// Outline Button
<Button variant="outline">Outline</Button>
// Uses: --border border, --foreground text

// Ghost Button
<Button variant="ghost">Ghost</Button>
// Uses: transparent background, --foreground text
```

### **Form Elements**
```tsx
// Input Fields
<Input placeholder="Enter text..." />
// Uses: --background, --border, --foreground

// Textarea
<textarea className="border border-border bg-background text-foreground" />
// Uses: --background, --border, --foreground

// Checkboxes & Radio Buttons
<input type="checkbox" className="border-border" />
// Uses: --border for border color

// Sliders
<Slider defaultValue={[50]} />
// Uses: --primary for active track, --border for inactive track

// Switches
<Switch />
// Uses: --primary for active state, --border for inactive state
```

### **Navigation Elements**
```tsx
// Badges
<Badge>Default</Badge>
// Uses: --primary background, --primary-foreground text

<Badge variant="secondary">Secondary</Badge>
// Uses: --secondary background, --secondary-foreground text

<Badge variant="destructive">Destructive</Badge>
// Uses: --destructive background, --destructive-foreground text

<Badge variant="outline">Outline</Badge>
// Uses: --border border, --foreground text

// Navigation Items
<Button variant="ghost" size="sm">Nav Item</Button>
// Uses: --foreground text, --accent on hover
```

### **Interactive States**
```tsx
// Hover States
<Button className="hover:bg-primary/90">Hover State</Button>
// Uses: --primary with 90% opacity

// Active States
<Button className="active:bg-primary/80">Active State</Button>
// Uses: --primary with 80% opacity

// Focus States
<Button className="focus:ring-2 focus:ring-ring">Focus State</Button>
// Uses: --ring for focus ring

// Disabled States
<Button disabled>Disabled State</Button>
// Uses: --muted-foreground text, --muted background
```

## 🎯 Using the Brand Tester

### **Access the Brand Tester**
1. Navigate to `http://localhost:3000/brand-tester`
2. Use the **Components** tab to see live previews of all shadcn components
3. Modify colors in the **Colors** tab to see real-time changes

### **Color Customization Workflow**
1. **Select Category**: Choose from Primary, Background, Text, Button, Semantic, Form, Border, or Navigation colors
2. **Modify Values**: Update both light and dark mode values using OKLCH format
3. **Live Preview**: See changes immediately in the Components tab
4. **Save Configuration**: Use the save button to persist your changes
5. **Export/Import**: Share configurations with your team

### **OKLCH Color Format**
The system uses OKLCH format for better color consistency:
```css
/* Format: oklch(lightness chroma hue) */
--primary: oklch(0.5563 0.1055 174.3329);
```

## 🔧 Advanced Customization

### **Custom Color Variables**
You can add custom color variables by modifying the `COLOR_DEFINITIONS` array in the brand tester:

```typescript
{
  name: 'Custom Color',
  variable: '--custom-color',
  lightValue: 'oklch(0.7 0.1 200)',
  darkValue: 'oklch(0.3 0.1 200)',
  description: 'Custom color for special components',
  category: 'custom'
}
```

### **Component-Specific Overrides**
For components that need special styling, you can create custom CSS:

```css
.custom-component {
  background-color: var(--custom-color);
  color: var(--custom-color-foreground);
}
```

## 📱 Responsive Design Considerations

### **Light/Dark Mode**
- All colors automatically adapt to the current theme
- Test both light and dark modes in the brand tester
- Ensure proper contrast ratios for accessibility

### **Accessibility**
- Maintain WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Test with screen readers and keyboard navigation
- Use semantic colors appropriately (red for errors, green for success)

## 🚀 Best Practices

### **Color Consistency**
1. **Use Semantic Colors**: Use `--destructive` for errors, `--primary` for actions
2. **Maintain Hierarchy**: Use `--foreground` for primary text, `--muted-foreground` for secondary
3. **Consistent States**: Use the same color patterns for hover, focus, and active states

### **Performance**
1. **CSS Variables**: All colors use CSS variables for optimal performance
2. **Theme Switching**: Colors change instantly without page reload
3. **Caching**: Saved configurations are cached in localStorage

### **Team Collaboration**
1. **Export Configurations**: Share color schemes with team members
2. **Version Control**: Keep track of design iterations
3. **Documentation**: Document custom color choices and their usage

## 🎨 Example Color Schemes

### **Modern Dark Theme**
```css
--primary: oklch(0.7 0.15 200);
--background: oklch(0.1 0 0);
--foreground: oklch(0.95 0 0);
--muted: oklch(0.15 0 0);
--border: oklch(0.2 0 0);
```

### **Warm Light Theme**
```css
--primary: oklch(0.6 0.12 45);
--background: oklch(0.98 0.01 45);
--foreground: oklch(0.2 0 0);
--muted: oklch(0.95 0.02 45);
--border: oklch(0.9 0.02 45);
```

### **High Contrast Theme**
```css
--primary: oklch(0.5 0.2 0);
--background: oklch(1 0 0);
--foreground: oklch(0 0 0);
--muted: oklch(0.95 0 0);
--border: oklch(0.8 0 0);
```

## 🔍 Troubleshooting

### **Common Issues**
1. **Colors Not Updating**: Check that CSS variables are properly defined
2. **Poor Contrast**: Use online contrast checkers to verify ratios
3. **Theme Switching Issues**: Ensure both light and dark values are set

### **Debugging**
1. **Browser DevTools**: Inspect CSS variables in the computed styles
2. **Brand Tester**: Use the live preview to test changes
3. **Console Logs**: Check for any JavaScript errors in the browser console

## 📚 Additional Resources

- [OKLCH Color Format Guide](https://oklch.com/)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Color System](https://tailwindcss.com/docs/customizing-colors)

---

*This guide is part of the Preset Brand Design Testing System. For more information, see the [Brand Testing Guide](./BRAND_TESTING_GUIDE.md).*
