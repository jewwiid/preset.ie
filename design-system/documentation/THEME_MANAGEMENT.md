# Theme Management with Tweakcn

## Overview

Your project now has a **uniform shadcn/ui theme system** that is fully compatible with [tweakcn](https://tweakcn.com/) - a visual theme editor for shadcn/ui components. This means you can easily customize and update your entire design system using a visual interface.

## ✅ Compatibility Status

### **Current Setup**
- ✅ **shadcn/ui v4** components with latest patterns
- ✅ **CSS Custom Properties** architecture 
- ✅ **Uniform theme variables** across all components
- ✅ **Dark/Light mode** support structure
- ✅ **Tailwind CSS** integration with proper utilities

### **Components Using Uniform Theme**
Your **25 shadcn/ui components** all reference the same CSS custom properties:

| Component Type | Components | Theme Variables Used |
|---|---|---|
| **Form** | button, input, textarea, checkbox, switch, label, form, select | `--primary`, `--secondary`, `--border`, `--input`, `--ring` |
| **Layout** | card, dialog, separator, accordion, tabs | `--background`, `--card`, `--border`, `--muted` |
| **Feedback** | alert, toast, skeleton, badge | `--destructive`, `--accent`, `--muted` |
| **Media** | avatar | `--muted`, `--background` |
| **Navigation** | dropdown-menu | `--popover`, `--accent` |
| **Data** | table, calendar, popover | All theme variables |

## 🎨 How to Use Tweakcn

### **Step 1: Generate Theme**
1. Visit [https://tweakcn.com/](https://tweakcn.com/)
2. Use the visual editor to customize:
   - Colors (primary, secondary, accent, etc.)
   - Border radius
   - Component styles
3. Preview changes in real-time
4. Export CSS when satisfied

### **Step 2: Apply Theme**
Replace the CSS custom properties in your `apps/web/app/globals.css`:

```css
@layer base {
  :root {
    /* Replace these values with tweakcn export */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: YOUR_NEW_PRIMARY_COLOR;
    --primary-foreground: YOUR_NEW_PRIMARY_FOREGROUND;
    /* ... other variables */
  }
  
  .dark {
    /* Replace these values with tweakcn dark theme export */
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... other dark variables */
  }
}
```

### **Step 3: Automatic Updates**
All 25 components will automatically update with the new theme - no component changes needed!

## 🛠️ Theme Structure

Your theme system uses these core CSS variables:

### **Required Variables (Tweakcn Compatible)**
```css
:root {
  /* Base */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  
  /* Components */
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  
  /* Interactive */
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  
  /* States */
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  
  /* Borders & Inputs */
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  
  /* Sizing */
  --radius: 0.5rem;
}
```

### **Custom Brand Variables (Preserved)**
Your custom preset brand colors are preserved alongside the theme system:

```css
:root {
  /* Your Custom Preset Brand Colors */
  --preset-50: #f0fdf9;
  --preset-100: #ccfbef;
  --preset-200: #99f6e0;
  --preset-300: #5eead4;
  --preset-400: #2dd4bf;
  --preset-500: #00876f;  /* Your primary brand color */
  --preset-600: #0d7d72;
  --preset-700: #15706b;
  --preset-800: #155e56;
  --preset-900: #134e48;
}
```

## 🧪 Testing Theme Changes

Use the included demo component to test theme compatibility:

```tsx
import { ThemeCompatibilityDemo } from "@/components/theme-compatibility-demo"

// Add to any page to test themes
<ThemeCompatibilityDemo />
```

This demo includes:
- ✅ All component variants
- ✅ Theme switching examples  
- ✅ Compatibility checker
- ✅ Visual theme comparison

## 🔄 Theme Update Workflow

### **Option 1: Tweakcn Visual Editor (Recommended)**
1. Open [tweakcn.com](https://tweakcn.com/)
2. Load your current theme or start fresh
3. Customize visually using the editor
4. Export CSS variables
5. Replace in `globals.css`
6. Test with demo component

### **Option 2: Manual CSS Updates**
1. Edit `apps/web/app/globals.css`
2. Modify CSS custom properties in `:root` and `.dark`
3. Use HSL color format: `hue saturation% lightness%`
4. Test across all components

### **Option 3: Programmatic Theme Switching**
Use the included theme utilities:

```tsx
import { applyTweakcnTheme } from "@/lib/theme-utils"

// Apply a theme programmatically
const customTheme = {
  primary: "221.2 83.2% 53.3%",
  secondary: "210 40% 96%",
  // ... other colors
}

applyTweakcnTheme(customTheme, "light")
```

## 📋 Compatibility Checklist

✅ **Components**: All 25 components use uniform theme variables  
✅ **CSS Architecture**: Proper CSS custom properties structure  
✅ **Color Format**: HSL values compatible with tweakcn  
✅ **Dark Mode**: Complete dark theme variable set  
✅ **Tailwind**: Proper integration with Tailwind utilities  
✅ **TypeScript**: Theme utilities with full type safety  

## 🎯 Benefits of This Setup

1. **Visual Theme Editing**: Use tweakcn's drag-and-drop interface
2. **Instant Updates**: Change one CSS file, update entire design system  
3. **Consistent Branding**: All components follow the same theme rules
4. **Dark Mode Ready**: Built-in dark theme support
5. **Developer Friendly**: Type-safe theme utilities included
6. **Future Proof**: Compatible with shadcn/ui updates

## 🚀 Next Steps

1. **Visit tweakcn.com** and explore theme options
2. **Test the demo component** to see theme switching in action  
3. **Create your custom theme** using the visual editor
4. **Export and apply** to see instant results across all components
5. **Share themes** with your team using the exported CSS

Your shadcn/ui setup is now fully optimized for easy theme management! 🎨