# Theme Migration Guide - OKLCH Implementation

## 🚀 **Quick Migration Steps**

### **Step 1: Update Core Files**

1. **Web App Globals** ✅ (Already updated)
   - `apps/web/app/globals.css` - Updated with OKLCH variables

2. **Design Tokens** (Next)
   - `packages/tokens/src/colors.ts` - Add OKLCH variants
   - `packages/tokens/src/index.ts` - Export new theme

3. **Tailwind Config** ✅ (Already compatible)
   - `apps/web/tailwind.config.js` - Uses CSS variables

### **Step 2: Component Updates**

Update components to use semantic color classes:

```tsx
// OLD: Hard-coded colors
<div className="bg-preset-500 text-white">

// NEW: Semantic colors
<div className="bg-primary text-primary-foreground">
```

### **Step 3: Mobile App Updates**

Update mobile styles to use the new theme:

```typescript
// apps/mobile/styles/colors.ts
export const colors = {
  primary: 'oklch(0.5563 0.1055 174.3329)',
  secondary: 'oklch(0.6889 0.0727 172.2422)',
  // ... other colors
}
```

## 🎨 **Enhanced OKLCH Theme Features**

### **Color Improvements**
1. **Better Color Consistency** - Perceptually uniform color space
2. **Improved Dark Mode** - Better contrast ratios
3. **Future-Proof** - Modern CSS standard
4. **Accessibility** - Better color contrast
5. **Enhanced Primary Color** - More vibrant `oklch(0.6665 0.2081 16.4383)`
6. **Rich Chart Colors** - 5 diverse chart color variants

### **Typography Enhancements**
- **Poppins Font** - Modern, clean typography
- **Enhanced Letter Spacing** - Better readability
- **Consistent Font Stack** - Fallback support

### **Visual Improvements**
- **Larger Border Radius** - `1.0rem` for modern feel
- **Enhanced Shadow System** - 8 shadow variants with better depth
- **Improved Spacing** - Consistent spacing system
- **Better Focus States** - Enhanced ring colors

## 📋 **Migration Checklist**

- [x] Update web app globals.css ✅
- [x] Update Tailwind config ✅
- [x] Add enhanced OKLCH theme ✅
- [x] Add Poppins font support ✅
- [x] Add enhanced shadow system ✅
- [x] Add larger border radius (1.0rem) ✅
- [ ] Update design tokens
- [ ] Update mobile app colors
- [ ] Test all components
- [ ] Verify dark mode
- [ ] Update documentation
- [ ] Deploy changes

## 🔧 **Testing Commands**

```bash
# Test web app
npm run dev

# Test mobile app
npm run mobile:dev

# Build and test
npm run build
```

## 🚨 **Rollback Plan**

If issues occur, revert to:
```css
/* Legacy colors */
--primary: #00876f;
--primary-foreground: #ffffff;
```

## 📚 **Resources**

- [OKLCH Color Space](https://oklch.com/)
- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/)
- [Design System Documentation](./README.md)
