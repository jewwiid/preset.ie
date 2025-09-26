# Complete Color Table - Preset Platform Theme System

## 🎨 **Comprehensive Color Reference**

This document provides a complete visual reference for all colors in the Preset platform theme system, showing both light and dark mode values.

---

## 📊 **Core Color System**

### **Primary Colors (Brand Green)**
| Color Variable | Light Mode | Dark Mode | Usage | CSS Class |
|----------------|------------|-----------|-------|-----------|
| `--primary` | `oklch(0.5563 0.1055 174.3329)` | `oklch(0.5563 0.1055 174.3329)` | Brand color, buttons, links | `bg-primary`, `text-primary` |
| `--primary-foreground` | `oklch(1.0000 0 0)` | `oklch(1.0000 0 0)` | Text on primary | `text-primary-foreground` |

**Visual Representation:**
- **Light Mode**: ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) `#00876f` - Consistent green
- **Dark Mode**: ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) `#00876f` - Same green

---

### **Background Colors**
| Color Variable | Light Mode | Dark Mode | Usage | CSS Class |
|----------------|------------|-----------|-------|-----------|
| `--background` | `oklch(1.0000 0 0)` | `oklch(0.1448 0 0)` | Page background | `bg-background` |
| `--card` | `oklch(0.9900 0.0030 174.3329)` | `oklch(0.2103 0.0059 285.8852)` | Card backgrounds | `bg-card` |
| `--popover` | `oklch(0.9850 0.0040 174.3329)` | `oklch(0.2739 0.0055 286.0326)` | Dropdowns, modals | `bg-popover` |
| `--muted` | `oklch(0.9800 0.0035 174.3329)` | `oklch(0.2739 0.0055 286.0326)` | Input backgrounds | `bg-muted` |
| `--accent` | `oklch(0.9750 0.0050 174.3329)` | `oklch(0.2739 0.0055 286.0326)` | Hover states | `bg-accent` |

**Visual Representation:**
- **Light Mode**: 
  - Background: ![#ffffff](https://via.placeholder.com/20x20/ffffff/ffffff?text=+) `#ffffff`
  - Card: ![#fefefe](https://via.placeholder.com/20x20/fefefe/fefefe?text=+) `#fefefe`
  - Muted: ![#fafafa](https://via.placeholder.com/20x20/fafafa/fafafa?text=+) `#fafafa`
- **Dark Mode**:
  - Background: ![#252525](https://via.placeholder.com/20x20/252525/252525?text=+) `#252525`
  - Card: ![#363636](https://via.placeholder.com/20x20/363636/363636?text=+) `#363636`
  - Muted: ![#454545](https://via.placeholder.com/20x20/454545/454545?text=+) `#454545`

---

### **Text Colors**
| Color Variable | Light Mode | Dark Mode | Usage | CSS Class |
|----------------|------------|-----------|-------|-----------|
| `--foreground` | `oklch(0.1448 0 0)` | `oklch(0.9851 0 0)` | Primary text | `text-foreground` |
| `--muted-foreground` | `oklch(0.5544 0.0407 257.4166)` | `oklch(0.7118 0.0129 286.0665)` | Secondary text | `text-muted-foreground` |

**Visual Representation:**
- **Light Mode**:
  - Primary Text: ![#252525](https://via.placeholder.com/20x20/252525/252525?text=+) `#252525`
  - Muted Text: ![#8b8b8b](https://via.placeholder.com/20x20/8b8b8b/8b8b8b?text=+) `#8b8b8b`
- **Dark Mode**:
  - Primary Text: ![#fafafa](https://via.placeholder.com/20x20/fafafa/fafafa?text=+) `#fafafa`
  - Muted Text: ![#b5b5b5](https://via.placeholder.com/20x20/b5b5b5/b5b5b5?text=+) `#b5b5b5`

---

### **Semantic Colors**
| Color Variable | Light Mode | Dark Mode | Usage | CSS Class |
|----------------|------------|-----------|-------|-----------|
| `--destructive` | `oklch(0.6368 0.2078 25.3313)` | `oklch(0.3958 0.1331 25.7230)` | Errors, delete actions | `bg-destructive`, `text-destructive` |
| `--destructive-foreground` | `oklch(1.0000 0 0)` | `oklch(0.9851 0 0)` | Text on destructive | `text-destructive-foreground` |
| `--secondary` | `oklch(0.9750 0.0050 174.3329)` | `oklch(0.2739 0.0055 286.0326)` | Secondary elements | `bg-secondary` |
| `--secondary-foreground` | `oklch(0.1448 0 0)` | `oklch(0.9851 0 0)` | Text on secondary | `text-secondary-foreground` |

**Visual Representation:**
- **Light Mode**:
  - Destructive: ![#dc2626](https://via.placeholder.com/20x20/dc2626/dc2626?text=+) `#dc2626`
  - Secondary: ![#f5f5f5](https://via.placeholder.com/20x20/f5f5f5/f5f5f5?text=+) `#f5f5f5`
- **Dark Mode**:
  - Destructive: ![#ef4444](https://via.placeholder.com/20x20/ef4444/ef4444?text=+) `#ef4444`
  - Secondary: ![#454545](https://via.placeholder.com/20x20/454545/454545?text=+) `#454545`

---

### **Border & Input Colors**
| Color Variable | Light Mode | Dark Mode | Usage | CSS Class |
|----------------|------------|-----------|-------|-----------|
| `--border` | `oklch(0.9288 0.0126 255.5078)` | `oklch(0.2739 0.0055 286.0326)` | Borders, dividers | `border-border` |
| `--input` | `oklch(0.9288 0.0126 255.5078)` | `oklch(0.2739 0.0055 286.0326)` | Input borders | `border-input` |
| `--ring` | `oklch(0.6665 0.2081 16.4383)` | `oklch(0.6665 0.2081 16.4383)` | Focus rings | `ring-ring` |

**Visual Representation:**
- **Light Mode**:
  - Border: ![#e5e5e5](https://via.placeholder.com/20x20/e5e5e5/e5e5e5?text=+) `#e5e5e5`
  - Ring: ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) `#00876f`
- **Dark Mode**:
  - Border: ![#454545](https://via.placeholder.com/20x20/454545/454545?text=+) `#454545`
  - Ring: ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) `#00876f`

---

## 🎯 **Color Usage Patterns**

### **Status Indicators**
| Status | Light Mode | Dark Mode | CSS Classes |
|--------|------------|-----------|-------------|
| **Success/Active** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) on ![#f0fdf9](https://via.placeholder.com/20x20/f0fdf9/f0fdf9?text=+) | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) on ![#1a1a1a](https://via.placeholder.com/20x20/1a1a1a/1a1a1a?text=+) | `bg-primary/10 text-primary` |
| **Warning** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) on ![#f0fdf9](https://via.placeholder.com/20x20/f0fdf9/f0fdf9?text=+) | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) on ![#1a1a1a](https://via.placeholder.com/20x20/1a1a1a/1a1a1a?text=+) | `bg-primary/10 text-primary` |
| **Error** | ![#dc2626](https://via.placeholder.com/20x20/dc2626/dc2626?text=+) on ![#fef2f2](https://via.placeholder.com/20x20/fef2f2/fef2f2?text=+) | ![#ef4444](https://via.placeholder.com/20x20/ef4444/ef4444?text=+) on ![#1a1a1a](https://via.placeholder.com/20x20/1a1a1a/1a1a1a?text=+) | `bg-destructive/10 text-destructive` |
| **Inactive** | ![#8b8b8b](https://via.placeholder.com/20x20/8b8b8b/8b8b8b?text=+) on ![#f5f5f5](https://via.placeholder.com/20x20/f5f5f5/f5f5f5?text=+) | ![#b5b5b5](https://via.placeholder.com/20x20/b5b5b5/b5b5b5?text=+) on ![#454545](https://via.placeholder.com/20x20/454545/454545?text=+) | `bg-muted text-muted-foreground` |

### **Interactive States**
| State | Light Mode | Dark Mode | CSS Classes |
|-------|------------|-----------|-------------|
| **Default Button** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) | `bg-primary text-primary-foreground` |
| **Hover Button** | ![#007a63](https://via.placeholder.com/20x20/007a63/007a63?text=+) | ![#007a63](https://via.placeholder.com/20x20/007a63/007a63?text=+) | `hover:bg-primary/90` |
| **Active Button** | ![#006b56](https://via.placeholder.com/20x20/006b56/006b56?text=+) | ![#006b56](https://via.placeholder.com/20x20/006b56/006b56?text=+) | `active:bg-primary/80` |
| **Focus Ring** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) | `focus:ring-ring` |

---

## 📈 **Chart Colors**

### **Data Visualization**
| Chart Color | Light Mode | Dark Mode | Usage |
|-------------|------------|-----------|-------|
| `--chart-1` | `oklch(0.6665 0.2081 16.4383)` | `oklch(0.6665 0.2081 16.4383)` | Primary data series |
| `--chart-2` | `oklch(0.6231 0.1880 259.8145)` | `oklch(0.5461 0.2152 262.8809)` | Secondary data series |
| `--chart-3` | `oklch(0.6959 0.1491 162.4796)` | `oklch(0.5960 0.1274 163.2254)` | Tertiary data series |
| `--chart-4` | `oklch(0.7686 0.1647 70.0804)` | `oklch(0.6658 0.1574 58.3183)` | Quaternary data series |
| `--chart-5` | `oklch(0.6056 0.2189 292.7172)` | `oklch(0.5413 0.2466 293.0090)` | Quinary data series |

---

## 🎨 **Opacity Variations**

### **Primary Color Opacity Levels**
| Opacity | Light Mode | Dark Mode | CSS Class |
|---------|------------|-----------|-----------|
| **10%** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 10% opacity | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 10% opacity | `bg-primary/10` |
| **20%** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 20% opacity | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 20% opacity | `bg-primary/20` |
| **30%** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 30% opacity | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 30% opacity | `bg-primary/30` |
| **50%** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 50% opacity | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 50% opacity | `bg-primary/50` |
| **90%** | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 90% opacity | ![#00876f](https://via.placeholder.com/20x20/00876f/00876f?text=+) with 90% opacity | `bg-primary/90` |

---

## 🔧 **Special Effects**

### **Backdrop & Glass Effects**
| Effect | Light Mode | Dark Mode | Usage |
|--------|------------|-----------|-------|
| `--backdrop` | `oklch(1.0000 0 0 / 0.8)` | `oklch(0.1448 0 0 / 0.8)` | Modal overlays |
| `--glass-bg` | `oklch(0.9900 0.0020 247.8575 / 0.8)` | `oklch(0.2739 0.0055 286.0326 / 0.8)` | Glass morphism |
| `--glass-border` | `oklch(0.9288 0.0126 255.5078 / 0.2)` | `oklch(0.2739 0.0055 286.0326 / 0.2)` | Glass borders |

---

## 📱 **Sidebar Colors**

### **Navigation Sidebar**
| Color Variable | Light Mode | Dark Mode | Usage |
|----------------|------------|-----------|-------|
| `--sidebar` | `oklch(1.0000 0 0)` | `oklch(0.1448 0 0)` | Sidebar background |
| `--sidebar-foreground` | `oklch(0.1448 0 0)` | `oklch(0.9851 0 0)` | Sidebar text |
| `--sidebar-primary` | `oklch(0.5563 0.1055 174.3329)` | `oklch(0.5563 0.1055 174.3329)` | Active sidebar items |
| `--sidebar-accent` | `oklch(0.9683 0.0069 247.8956)` | `oklch(0.2739 0.0055 286.0326)` | Sidebar hover states |

---

## 🎯 **Quick Reference**

### **Most Common Color Combinations**

#### **Page Layout**
```tsx
<div className="min-h-screen bg-background">
  <Card className="bg-card border-border">
    <h1 className="text-foreground">Title</h1>
    <p className="text-muted-foreground">Description</p>
    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
      Action
    </Button>
  </Card>
</div>
```

#### **Status Badges**
```tsx
<Badge className="bg-primary/10 text-primary">Active</Badge>
<Badge className="bg-destructive/10 text-destructive">Error</Badge>
<Badge className="bg-muted text-muted-foreground">Inactive</Badge>
```

#### **Interactive Elements**
```tsx
<button className="nav-item">Navigation Item</button>
<input className="bg-background border-border focus:ring-ring" />
<div className="hover-interactive">Interactive Element</div>
```

---

## 🚀 **Key Benefits**

1. **Perfect Brand Consistency** - Same green color (`#00876f`) in both light and dark mode
2. **Automatic Theme Adaptation** - All colors automatically switch with theme
3. **Semantic Meaning** - Colors have purpose, not just appearance
4. **Accessibility Compliant** - Proper contrast ratios maintained
5. **Future-Proof** - Easy to update colors globally
6. **Zero Hardcoded Colors** - All colors use CSS variables

---

## 📋 **Usage Guidelines**

### **✅ Always Use**
- `bg-primary` instead of `bg-green-500`
- `text-foreground` instead of `text-gray-900`
- `border-border` instead of `border-gray-200`
- `bg-destructive/10` instead of `bg-red-50`

### **❌ Never Use**
- Hardcoded Tailwind colors: `bg-green-500`, `text-gray-600`
- Hex colors: `#00876f`, `#ffffff`
- RGB colors: `rgb(0, 135, 111)`

---

*This comprehensive color table ensures perfect theme consistency across the entire Preset platform!* 🎨✨
