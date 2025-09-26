# Custom Color & Font Selection Guide

## Overview

The Brand Design Testing System now includes advanced custom color selection and font modification capabilities. You can visually pick colors using HTML5 color pickers and specify custom fonts that will be properly saved and applied throughout your application.

## 🎨 **Custom Color Selection**

### **Visual Color Pickers**
Each color configuration now includes HTML5 color picker inputs that allow you to:

- **Visual Selection**: Click the color square to open a visual color picker
- **Real-time Preview**: See color changes instantly in the color swatch
- **OKLCH Conversion**: Colors are automatically converted to OKLCH format
- **Theme Consistency**: Colors work seamlessly with light/dark mode switching

### **How to Use Color Pickers**

1. **Navigate to Colors Tab**: Go to the "Colors" tab in the Brand Tester
2. **Select Color Category**: Choose from Primary, Background, Text, Button, etc.
3. **Use Color Picker**: Click the small color square next to the OKLCH input
4. **Visual Selection**: Use the color picker to select your desired color
5. **Automatic Conversion**: The color is converted to OKLCH format automatically
6. **Live Preview**: See the change immediately in the color swatch and components

### **Color Categories Available**

#### **Text Colors**
- **Primary Text** (`--foreground`): Main text color for headings and body text
- **Secondary Text** (`--muted-foreground`): Subtle text for captions and descriptions
- **Primary Brand Text** (`--primary`): Brand-colored text for links and accents
- **Error Text** (`--destructive`): Text color for error messages and warnings

#### **Background Colors**
- **Page Background** (`--background`): Main page background color
- **Card Background** (`--card`): Background for cards and containers
- **Muted Background** (`--muted`): Subtle backgrounds for inputs and secondary areas
- **Primary Background** (`--primary`): Brand-colored backgrounds for buttons and highlights

#### **Interactive Colors**
- **Button Colors**: Primary, Secondary, Destructive variants
- **Border Colors**: Default borders, focus rings, and dividers
- **Navigation Colors**: Popover backgrounds and dropdown styling

## 🔤 **Custom Font Selection**

### **Font Configuration Options**

#### **1. Predefined Font Selection**
Choose from a curated list of high-quality fonts:
- **Sans Serif**: Inter, System UI, Arial, Helvetica, sans-serif
- **Serif**: Georgia, Times New Roman, serif
- **Monospace**: Fira Code, JetBrains Mono, Source Code Pro, Consolas, Courier New

#### **2. Custom Font Input**
For each font category, you can specify a custom font family:

```css
/* Example custom font inputs */
--font-sans-custom: "Custom Font Name, sans-serif"
--font-serif-custom: "Another Custom Font, serif"
--font-mono-custom: "Custom Monospace Font, monospace"
```

### **How to Use Custom Fonts**

1. **Navigate to Fonts Tab**: Go to the "Fonts" tab in the Brand Tester
2. **Select Base Font**: Choose a predefined font from the dropdown
3. **Add Custom Font**: Enter your custom font family in the "Custom Font" field
4. **Live Preview**: See the font change immediately in the preview section
5. **Save Configuration**: Save your font settings for future use

### **Font Priority System**
The system uses a priority order for font application:

1. **Custom Font** (highest priority): If specified, overrides all others
2. **Selected Font**: From the predefined dropdown
3. **Default Font**: System fallback fonts

### **Font Categories**

#### **Sans Serif Fonts**
- **Primary Use**: Body text, headings, UI elements
- **Variable**: `--font-sans`
- **Custom Variable**: `--font-sans-custom`
- **Examples**: Inter, System UI, Arial, Helvetica

#### **Serif Fonts**
- **Primary Use**: Formal content, articles, elegant typography
- **Variable**: `--font-serif`
- **Custom Variable**: `--font-serif-custom`
- **Examples**: Georgia, Times New Roman

#### **Monospace Fonts**
- **Primary Use**: Code blocks, technical content, data display
- **Variable**: `--font-mono`
- **Custom Variable**: `--font-mono-custom`
- **Examples**: Fira Code, JetBrains Mono, Source Code Pro

## 💾 **Saving and Persistence**

### **Configuration Saving**
- **Save Button**: Click "Save" to store your current configuration
- **Automatic Naming**: Configurations are automatically named with timestamps
- **Local Storage**: Settings are saved in browser local storage
- **Export/Import**: Share configurations with team members

### **CSS Generation**
The system generates comprehensive CSS that includes:

```css
:root {
  /* Color variables */
  --primary: oklch(0.5563 0.1055 174.3329);
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.1448 0 0);
  
  /* Font variables */
  --font-sans: Inter, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: Fira Code, monospace;
}

.dark {
  /* Dark mode color overrides */
  --background: oklch(0.1448 0 0);
  --foreground: oklch(0.9851 0 0);
}

/* Custom font overrides */
--font-sans {
  font-family: "Custom Font Name, sans-serif";
}
```

## 🎯 **Best Practices**

### **Color Selection**
1. **Accessibility**: Ensure sufficient contrast ratios (4.5:1 for normal text)
2. **Consistency**: Use the same color palette across all components
3. **Brand Alignment**: Choose colors that reflect your brand identity
4. **Theme Testing**: Test colors in both light and dark modes

### **Font Selection**
1. **Readability**: Choose fonts that are easy to read at all sizes
2. **Web Fonts**: Use web-safe fonts or include font files in your project
3. **Performance**: Consider font loading performance
4. **Fallbacks**: Always include fallback fonts in your custom font declarations

### **Configuration Management**
1. **Regular Saves**: Save configurations frequently during design iterations
2. **Version Control**: Export configurations for version control
3. **Team Sharing**: Share configurations with team members
4. **Documentation**: Document your color and font choices

## 🔧 **Technical Implementation**

### **Color Conversion**
The system automatically converts between:
- **Hex Colors**: `#ff0000` → `oklch(0.6368 0.2078 25.3313)`
- **OKLCH Format**: Modern, perceptually uniform color space
- **Theme Variables**: CSS custom properties for dynamic theming

### **Font Application**
Custom fonts are applied through:
- **CSS Variables**: Dynamic font family assignment
- **Priority System**: Custom fonts override predefined selections
- **Fallback Chain**: Graceful degradation to system fonts

### **Persistence**
- **Local Storage**: Browser-based configuration storage
- **JSON Export**: Structured configuration format
- **CSS Generation**: Production-ready CSS output

## 🚀 **Advanced Features**

### **Real-time Preview**
- **Live Updates**: See changes immediately in the preview panel
- **Component Testing**: Test colors and fonts on actual UI components
- **Theme Switching**: Preview changes in both light and dark modes

### **Export Options**
- **CSS Export**: Copy generated CSS to clipboard
- **Configuration Export**: Save complete configuration as JSON
- **Team Sharing**: Share configurations with team members

### **Integration**
- **Design System**: Integrates with your existing design system
- **Component Library**: Works with shadcn/ui components
- **Theme System**: Compatible with CSS custom properties

## 📚 **Examples**

### **Custom Color Example**
```tsx
// Before: Using default colors
<div className="bg-primary text-primary-foreground">
  <h1 className="text-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// After: Using custom colors
// --primary: oklch(0.7 0.15 200) (custom blue)
// --foreground: oklch(0.2 0 0) (custom dark gray)
// --muted-foreground: oklch(0.5 0.05 200) (custom muted blue)
```

### **Custom Font Example**
```tsx
// Before: Using default fonts
<h1 className="font-sans">Heading</h1>
<p className="font-sans">Body text</p>
<code className="font-mono">Code example</code>

// After: Using custom fonts
// --font-sans-custom: "Roboto, sans-serif"
// --font-mono-custom: "Fira Code, monospace"
```

## 🐛 **Troubleshooting**

### **Common Issues**
1. **Color Not Updating**: Check that the color picker is properly connected
2. **Font Not Loading**: Ensure custom fonts are available in your project
3. **Configuration Not Saving**: Check browser local storage permissions
4. **CSS Not Applying**: Verify CSS variables are properly generated

### **Debug Tips**
1. **Browser DevTools**: Inspect CSS variables in computed styles
2. **Console Logs**: Check for any JavaScript errors
3. **Network Tab**: Verify font loading in browser network tab
4. **Color Contrast**: Use online tools to verify color accessibility

---

*This guide is part of the Preset Brand Design Testing System. For more information, see the [Brand Testing Guide](./BRAND_TESTING_GUIDE.md), [Shadcn Color Guide](./SHADCN_COLOR_GUIDE.md), and [Color Audit Guide](./COLOR_AUDIT_GUIDE.md).*
