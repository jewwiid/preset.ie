# Header Banner Drag Functionality

## ✅ **Drag to Reposition Header Banner**

Users can now **drag the header banner image** to adjust its position when in editing mode!

## How It Works

### **Visual Feedback**
- 🎯 **Drag Cursor**: Shows `cursor-move` when hovering over banner in edit mode
- 🎯 **Drag Indicator**: "Drag to reposition" tooltip appears in top-left corner
- 🎯 **Smooth Animation**: Smooth transitions when not dragging, instant when dragging
- 🎯 **Overflow Hidden**: Container prevents banner from dragging outside bounds

### **Drag Behavior**
- **Mouse Support**: Click and drag with mouse
- **Touch Support**: Touch and drag on mobile devices
- **Limited Range**: Dragging is constrained to ±100px vertically
- **Real-time Preview**: See position changes immediately as you drag
- **Auto-save**: Position is automatically saved to form data

### **Technical Implementation**

#### **Event Handling**
```tsx
// Start drag
onMouseDown={isEditing ? handleHeaderDragStart : undefined}
onTouchStart={isEditing ? handleHeaderDragStart : undefined}

// Prevent default drag behavior
draggable={false}
```

#### **Drag State Management**
```tsx
const [isDraggingHeader, setIsDraggingHeader] = useState(false)
const [headerPosition, setHeaderPosition] = useState({ y: 0, scale: 1 })
const [dragStart, setDragStart] = useState({ y: 0, initialY: 0 })
```

#### **Transform Application**
```tsx
style={{
  objectPosition: formData?.header_banner_position || 'center',
  transform: isEditing ? `translateY(${headerPosition.y}px) scale(${headerPosition.scale})` : undefined,
  transition: isDraggingHeader ? 'none' : 'transform 0.3s ease'
}}
```

## Files Updated

### ✅ **ProfileHeaderEnhanced.tsx**
- Added drag event handlers (lines 298-338)
- Updated header banner display with drag functionality (lines 505-530)
- Added cleanup for event listeners (lines 92-99)
- Added drag state management (line 84)

### ✅ **ProfileHeaderSimple.tsx**
- Added drag event handlers (lines 31-81)
- Updated header banner display with drag functionality (lines 162-187)
- Added cleanup for event listeners (lines 74-81)
- Added drag state management (line 18)

## User Experience

### **When Editing:**
1. **Upload banner** → Image appears with drag functionality
2. **See indicator** → "Drag to reposition" tooltip shows
3. **Hover to drag** → Cursor changes to move icon
4. **Click and drag** → Banner moves smoothly with mouse/touch
5. **Release** → Position is saved automatically
6. **Save changes** → Final position is persisted to database

### **When Viewing:**
- Banner displays in its saved position
- No drag functionality (cursor remains normal)
- Clean, professional appearance

## Database Integration

The drag position is saved as a CSS-compatible string:
```tsx
const positionString = `${headerPosition.y > 0 ? 'top' : 'bottom'} ${Math.abs(headerPosition.y)}px`
updateField('header_banner_position', positionString)
```

This gets stored in the `header_banner_position` field and used for:
- `objectPosition` CSS property when not dragging
- `transform` CSS property during drag operations

## Benefits

✅ **Intuitive UX** - Natural drag-to-reposition behavior  
✅ **Mobile Friendly** - Touch drag support for mobile devices  
✅ **Real-time Preview** - See changes immediately  
✅ **Auto-save** - Position saved without clicking save  
✅ **Visual Feedback** - Clear indicators when drag is available  
✅ **Smooth Animation** - Professional transitions  
✅ **Memory Safe** - Proper event listener cleanup  

## Testing

To test the drag functionality:
1. Go to profile page
2. Click "Edit Profile"
3. Upload a header banner image
4. **Verify**: "Drag to reposition" indicator appears
5. **Drag test**: Click and drag the banner image up/down
6. **Verify**: Banner moves smoothly with mouse/touch
7. **Release test**: Let go and verify position is maintained
8. **Save test**: Click "Save Changes" and refresh page
9. **Verify**: Banner appears in the new position

The drag functionality is now fully implemented and ready to use! 🎉
