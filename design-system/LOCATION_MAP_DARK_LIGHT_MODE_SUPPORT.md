# Location Map Dark/Light Mode Support

## Overview

The LocationMap component now fully supports dark and light mode themes with automatic map style switching, themed zoom controls, and enhanced visual design.

## ✨ **New Features**

### **1. Theme-Aware Map Tiles**
- **Light Mode**: Standard OpenStreetMap tiles (bright, clear streets)
- **Dark Mode**: CartoDB Dark Matter tiles (dark background, light streets)
- **Automatic Switching**: Detects theme changes and updates map style
- **Fallback Services**: Multiple tile servers for reliability

### **2. Enhanced Visual Design**
- **Animated Location Pin**: Bouncing green pin with shadow effect
- **Larger Map**: Increased height from 192px to 256px (h-48 → h-64)
- **Green Zoom Controls**: Primary theme color for +/- buttons
- **Theme-Aware Fallback**: Different gradient intensities for light/dark

### **3. Improved Functionality**
- **Working Zoom**: +/- buttons actually change zoom level (8-18)
- **Event Isolation**: Zoom controls don't trigger external maps
- **Proper Layering**: Z-index ensures controls are always clickable
- **Smooth Transitions**: Theme changes trigger graceful map updates

## 🗂️ **Technical Implementation**

### **Theme Detection**
```typescript
import { useTheme } from 'next-themes'

const { theme, resolvedTheme } = useTheme()
const isDark = resolvedTheme === 'dark'
```

### **Theme-Aware Map Services**

#### **Light Mode Maps:**
```typescript
// Primary: Standard OpenStreetMap
return `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`

// Alternative: Geoapify OSM Bright
return `https://maps.geoapify.com/v1/staticmap?style=osm-bright&...`

// Fallback: Alternative OSM server
return `https://a.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`
```

#### **Dark Mode Maps:**
```typescript
// Primary: CartoDB Dark Matter
return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${zoom}/${tileX}/${tileY}.png`

// Alternative: Geoapify Dark Matter
return `https://maps.geoapify.com/v1/staticmap?style=dark-matter&...`

// Fallback: Stamen Toner (dark style)
return `https://stamen-tiles.a.ssl.fastly.net/toner/${zoom}/${tileX}/${tileY}.png`
```

### **Dynamic Map Updates**
```typescript
// Reset map when theme changes
useEffect(() => {
  if (coords) {
    setMapAttempt(0)      // Try first service again
    setMapError(false)    // Reset error state
    setMapLoading(true)   // Show loading
  }
}, [resolvedTheme, coords])

// Force re-render with theme in key
key={`map-${zoomLevel}-${mapAttempt}-${resolvedTheme}`}
```

### **Enhanced Location Pin**
```typescript
{/* Map Pin Overlay */}
<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
  <div className="relative">
    {/* Pin shadow */}
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full blur-sm"></div>
    {/* Main pin */}
    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-primary-foreground animate-bounce">
      <MapPin className="w-5 h-5 text-primary-foreground" />
    </div>
  </div>
</div>
```

**Pin Features:**
- ✅ **Primary Green**: Matches your theme color
- ✅ **Animated Bounce**: Draws attention to location
- ✅ **Drop Shadow**: Realistic shadow effect below pin
- ✅ **Border**: White border for contrast
- ✅ **Proper Layering**: Above map, below controls

### **Green Zoom Controls**
```typescript
<Button
  variant="default"
  size="icon"
  className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-0"
  onClick={(e) => {
    e.preventDefault()        // Prevent default behavior
    e.stopPropagation()      // Don't trigger parent clicks
    setZoomLevel(prev => Math.min(prev + 1, 18))
    // ... reset states for new map
  }}
>
  <Plus className="w-4 h-4" />
</Button>
```

**Control Features:**
- ✅ **Primary Green**: `bg-primary` matches theme
- ✅ **Proper Hover**: `hover:bg-primary/90`
- ✅ **Event Isolation**: Doesn't trigger external maps
- ✅ **High Z-Index**: `z-30` ensures always clickable
- ✅ **Working Zoom**: Actually changes map zoom level

## 🎨 **Visual Design**

### **Light Mode:**
```
┌─────────────────────────────────────┐
│ [Bright OSM Map]               ┌─┐ │ ← Green controls
│   🛣️ Light streets            │+│ │   (primary theme)
│   🏢 Clear buildings           └─┘ │
│         📍 Green Pin           ┌─┐ │ ← Animated pin
│     (bounces on location)      │-│ │   (shows exact spot)
│                                └─┘ │
└─────────────────────────────────────┘
```

### **Dark Mode:**
```
┌─────────────────────────────────────┐
│ [Dark CartoDB Map]             ┌─┐ │ ← Green controls
│   🌃 Dark background           │+│ │   (same theme)
│   💡 Light streets             └─┘ │
│         📍 Green Pin           ┌─┐ │ ← Same animated pin
│     (consistent theming)       │-│ │   (works in both modes)
│                                └─┘ │
└─────────────────────────────────────┘
```

### **Theme-Aware Fallback:**
```typescript
// Different gradient intensities for each theme
className={`w-full h-full ${resolvedTheme === 'dark' 
  ? 'bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10'  // Stronger in dark
  : 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5'   // Subtle in light
} flex items-center justify-center relative overflow-hidden`}
```

## 🚀 **Benefits**

### **1. Perfect Theme Integration**
- **Automatic**: Maps change style when user switches theme
- **Consistent**: Map colors complement your design system
- **Professional**: No jarring color mismatches

### **2. Enhanced User Experience**
- **Larger Maps**: Better visibility with 256px height
- **Working Controls**: Zoom buttons actually zoom
- **Clear Location**: Animated pin shows exact spot
- **Smooth Interactions**: No conflicts between controls

### **3. Reliable Fallbacks**
- **Multiple Services**: 3 different tile servers per theme
- **Error Recovery**: Automatically tries next service if one fails
- **Beautiful Fallback**: Enhanced gradient design when maps fail

### **4. Performance Optimized**
- **Smart Loading**: Only regenerates when theme actually changes
- **Cached Tiles**: Map services provide efficient caching
- **Lazy Loading**: Images load only when needed

## 🌙 **Dark Mode Map Services**

### **CartoDB Dark Matter** (Primary):
- **Style**: Dark background with light streets
- **Reliability**: Excellent uptime and performance
- **Coverage**: Global coverage with detailed streets

### **Geoapify Dark Matter** (Alternative):
- **Style**: Similar dark theme with green markers
- **Features**: Supports custom marker colors
- **API**: Demo key works for development

### **Stamen Toner** (Fallback):
- **Style**: High contrast black and white
- **Aesthetic**: Clean, minimalist design
- **Reliability**: Stable tile service

## ☀️ **Light Mode Map Services**

### **OpenStreetMap Standard** (Primary):
- **Style**: Classic bright map with clear streets
- **Reliability**: Most reliable free map service
- **Detail**: Excellent street and landmark detail

### **Geoapify OSM Bright** (Alternative):
- **Style**: Enhanced bright theme
- **Features**: Supports green markers
- **Quality**: High-quality rendering

### **Alternative OSM Server** (Fallback):
- **Style**: Same as primary, different server
- **Reliability**: Backup for high-traffic periods

## 🔧 **Implementation Details**

### **Files Modified:**
- ✅ `apps/web/components/LocationMap.tsx` - Added theme support and improvements

### **Dependencies Added:**
- ✅ `useTheme` from `next-themes` - For theme detection
- ✅ `Plus`, `Minus` icons from Lucide - For zoom controls

### **Key Changes:**
1. **Theme Detection**: `const { theme, resolvedTheme } = useTheme()`
2. **Conditional Tile URLs**: Different services for light/dark
3. **Enhanced Pin**: Animated green pin with shadow
4. **Proper Event Handling**: Isolated zoom control events
5. **Improved Dimensions**: Larger map for better UX

## 🎯 **Usage Examples**

### **Basic Usage:**
```typescript
<LocationMap location="Dublin, Ireland" />
// Automatically detects theme and shows appropriate map style
```

### **With Coordinates:**
```typescript
<LocationMap 
  location="Dublin, Ireland"
  latitude={53.3498}
  longitude={-6.2603}
/>
// Uses exact coordinates with theme-appropriate map tiles
```

### **Compact Mode:**
```typescript
<LocationMap 
  location="Dublin, Ireland"
  showFullMap={false}
/>
// Shows simple card without full map (theme-aware)
```

## 🔮 **Future Enhancements**

### **Potential Additions:**
- **Custom Map Styles**: Create branded map themes
- **Interactive Elements**: Hover effects on map features
- **Multiple Pins**: Show multiple locations on same map
- **Route Display**: Show directions between points
- **Terrain Modes**: Satellite, terrain, hybrid views

### **Performance Optimizations:**
- **Tile Caching**: Local storage for frequently viewed areas
- **Progressive Loading**: Load lower resolution first
- **Preloading**: Cache adjacent zoom levels

**The LocationMap now provides a seamless, theme-aware mapping experience that perfectly integrates with your design system in both light and dark modes!** 🌙☀️🗺️✨
