# Design Comparison: `/profile` vs `/users/[handle]`

## Overview
Comparing the design and functionality of the **own profile page** (`/profile`) versus the **public user profile page** (`/users/[handle]`).

---

## 🎨 Layout & Structure

### **Own Profile (`/profile`)**
```
┌─────────────────────────────────────────┐
│ NavBar                                  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [Back Button]                       │ │
│ ├─────────────────────────────────────┤ │
│ │ Header Banner (with Edit button)   │ │
│ │   ┌─────┐                           │ │
│ │   │     │ James Murphy              │ │
│ │   └─────┘ Actor                     │ │
│ │           @james_actor              │ │
│ │ [Edit Profile Button]               │ │
│ ├─────────────────────────────────────┤ │
│ │ Bio (expandable)                    │ │
│ │ Rating • Location • Availability    │ │
│ │ [Additional Information - Dropdown] │ │
│ ├─────────────────────────────────────┤ │
│ │ Tabs: Professional | Contact | Phys│ │
│ ├─────────────────────────────────────┤ │
│ │ Main Content Area                   │ │
│ ├─────────────────────────────────────┤ │
│ │ Sidebar:                            │ │
│ │ • Profile Completion (60%)          │ │
│ │ • Smart Suggestions                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Bottom Tabs: Profile | Settings |      │
│             Credits | Notifications     │
└─────────────────────────────────────────┘
```

### **User Profile (`/users/[handle]`)**
```
┌─────────────────────────────────────────┐
│ NavBar                                  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Hero Banner (Full Width)            │ │
│ │ ┌─────┐                             │ │
│ │ │     │  [Back to Home - Top Left]  │ │
│ │ │     │                             │ │
│ │ └─────┘  James Murphy               │ │
│ │          @james_actor               │ │
│ │          📍 Galway, Ireland         │ │
│ │          📅 Member since 10/8/2025  │ │
│ │          [Actor Badge]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ About                               │ │
│ │ [Bio text in card]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Professional Information            │ │
│ │ • Availability Status               │ │
│ │ • Social Links                      │ │
│ │ • Stats (3 Cards)                   │ │
│ │   - Showcases: 0                    │ │
│ │   - Gigs Created: 0                 │ │
│ │   - Years Experience: 0             │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Active Gigs Carousel - if any]        │
└─────────────────────────────────────────┘
```

---

## 📊 Key Differences

### **1. Header/Banner Section**

| Feature | Own Profile (`/profile`) | User Profile (`/users/[handle]`) |
|---------|-------------------------|----------------------------------|
| **Banner Height** | ~192px (h-48) | ~320px (h-80) - **LARGER** |
| **Banner Style** | Background with gradient overlay | Full hero with dark gradient overlay |
| **Avatar Position** | Overlay on banner, bottom-left | Inside banner, bottom-left |
| **Avatar Size** | Medium | Large (112x112px) |
| **Back Button** | Simple "Back" button | "Back to Home" with arrow |
| **Edit Button** | ✅ "Edit Profile" button | ❌ None (viewing only) |
| **Banner Upload** | ✅ Can edit/drag position | ❌ View only |
| **Info Display** | Compact, below banner | Integrated into hero banner |

### **2. User Information Display**

| Element | Own Profile | User Profile |
|---------|------------|--------------|
| **Display Name** | H1, below banner | H1, in white over banner |
| **Primary Skill** | Small badge "Actor" | ❌ Not shown prominently |
| **Handle** | Small text @james_actor | White text @james_actor |
| **Location** | In compact info section | 📍 Icon + pill in banner |
| **Member Since** | Not shown | 📅 Icon + pill in banner |
| **Specialization** | "Not specified" text | Badge in banner (if available) |
| **Style Tags** | Not shown | Badges in banner |
| **Verification Badges** | ❌ Not visible | ✅ Next to name |

### **3. Content Sections**

#### **Own Profile:**
- ✅ **Profile Completion Card** (60% with breakdown)
- ✅ **Smart Suggestions** (field-by-field guidance)
- ✅ **Expandable Tabs** (Professional, Contact, Physical)
- ✅ **Additional Information Dropdown**
- ✅ **Edit Mode** (inline editing)
- ✅ **Bottom Navigation** (Profile, Settings, Credits, Notifications)
- ⚠️ **Stats** (shown as "Not specified")
- ❌ **No Active Gigs Display**

#### **User Profile:**
- ❌ **No Profile Completion**
- ❌ **No Smart Suggestions**
- ✅ **About Section** (clean card layout)
- ✅ **Professional Information Card**
- ✅ **Availability Status Badge** (color-coded)
- ✅ **Social Links** (Website, Instagram, Portfolio)
- ✅ **Stats Cards** (3 prominent cards)
  - Showcases count
  - Gigs Created count
  - Years Experience
- ✅ **Active Gigs Carousel** (horizontal scroll)
- ❌ **No Tabs**
- ❌ **No Edit Functionality**

---

## 🎯 Visual Design Comparison

### **Color & Styling**

#### **Own Profile:**
- Uses `bg-card` for sections
- More compact spacing
- Tabs and navigation heavy
- Information-dense layout
- Edit controls throughout
- Profile completion prominently displayed

#### **User Profile:**
- Hero-style banner with overlay
- Cleaner, more spacious layout
- Card-based sections with clear hierarchy
- Focus on showcasing user
- Public-facing, professional appearance
- Stats displayed prominently

### **Typography**

| Element | Own Profile | User Profile |
|---------|------------|--------------|
| **Name** | Large, dark text | Extra large (4xl), white on banner |
| **Section Headers** | H3, medium weight | H2, larger, more prominent |
| **Body Text** | Standard size | Slightly larger, more readable |
| **Labels** | Many labels for empty fields | Only shows filled fields |

---

## ⚠️ Issues & Inconsistencies

### **Own Profile Issues:**

1. **Profile Completion**
   - Shows "Equipment NaN%" (calculation error)
   - Many fields show "Not specified"
   - Cluttered with empty field indicators

2. **Information Overload**
   - Too many tabs and sections
   - Profile completion takes significant space
   - Smart suggestions can be overwhelming

3. **Visual Hierarchy**
   - Less clear what's important
   - Edit controls compete for attention
   - Header feels cramped

4. **Missing Data Display**
   - Years of experience not shown (shows "Not specified")
   - No stats cards
   - No showcase of work/gigs

### **User Profile Issues:**

1. **Limited Information**
   - Only shows basics (no detailed attributes)
   - No ratings displayed
   - No reviews section

2. **Missing Elements**
   - No "Contact User" button
   - No "Invite to Project" action
   - No work samples/gallery (just gigs)

3. **Sparse Data**
   - All stats showing "0"
   - No gigs displayed (carousel empty)
   - Missing professional details

---

## 🎨 Design Recommendations

### **1. Unify Header Design**

**Recommendation:** Use the **User Profile hero banner style** for both pages

**Why:**
- More visually impressive
- Better use of space
- Information hierarchy clearer
- More professional appearance

**For Own Profile:**
- Keep edit functionality
- Add edit icons overlay on hover
- Maintain drag-to-reposition banner

**For User Profile:**
- Keep current hero design
- Add "Contact" and "Invite" buttons
- Consider adding verification badges more prominently

### **2. Standardize Content Cards**

**Use consistent card styling:**
```tsx
// Standard card component for both pages
<div className="bg-card rounded-lg border p-6 mb-8">
  <h2 className="text-xl font-semibold mb-4">{title}</h2>
  {content}
</div>
```

### **3. Improve Stats Display**

**Own Profile:**
- Add the same 3-card stats layout as User Profile
- Show actual numbers (not "Not specified")
- Make it visually prominent

**User Profile:**
- Keep current card design
- Add more stats (profile views, response rate, etc.)

### **4. Fix Profile Completion**

**Issues to fix:**
- "Equipment NaN%" error
- Better categorization of fields
- Less intrusive display option
- Progress bar instead of full breakdown

### **5. Add Missing Features**

**Own Profile needs:**
- ✅ Stats cards (like User Profile)
- ✅ Active gigs display
- ✅ Cleaner header design
- ⚠️ Less clutter from empty fields

**User Profile needs:**
- ✅ "Contact User" button
- ✅ "Invite to Project" button
- ✅ Work samples/gallery
- ✅ Reviews/ratings section

---

## 🔧 Specific UI Improvements

### **Header Banner**

**Recommended unified design:**
```tsx
<div className="relative h-80 overflow-hidden">
  {/* Banner with image or gradient */}
  <div className="absolute inset-0">
    <Image src={banner} alt="Banner" fill className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
  </div>
  
  {/* Content overlay */}
  <div className="relative h-full flex flex-col justify-between py-6 px-8">
    {/* Top: Back/Edit buttons */}
    <div className="flex justify-between">
      <Button variant="ghost">{/* Back button */}</Button>
      {isOwnProfile && <Button>{/* Edit button */}</Button>}
    </div>
    
    {/* Bottom: Profile info */}
    <div className="flex items-center gap-6">
      <Avatar size="xl" />
      <div className="flex-1 text-white">
        <h1 className="text-4xl font-bold">{name}</h1>
        <p className="text-lg">@{handle}</p>
        <div className="flex gap-2 mt-2">
          {/* Info pills: location, member since, etc */}
        </div>
      </div>
    </div>
  </div>
</div>
```

### **Stats Card Design**

```tsx
// Use for both Own Profile and User Profile
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <div className="bg-card rounded-lg border p-6 text-center">
    <div className="text-3xl font-bold text-primary">{count}</div>
    <div className="text-muted-foreground mt-1">{label}</div>
  </div>
</div>
```

---

## 📈 Priority Changes

### **High Priority:**

1. ✅ **Fix "Equipment NaN%"** error in profile completion
2. ✅ **Add stats cards** to Own Profile page
3. ✅ **Unify header design** (use hero banner style)
4. ✅ **Add "Contact" button** to User Profile page
5. ✅ **Show verification badges** prominently on both pages

### **Medium Priority:**

6. 🔄 **Reduce clutter** on Own Profile (hide "Not specified" fields)
7. 🔄 **Add gigs carousel** to Own Profile
8. 🔄 **Improve mobile responsiveness** on both pages
9. 🔄 **Add work samples gallery** to User Profile
10. 🔄 **Standardize spacing** and padding across both pages

### **Low Priority:**

11. ⏳ **Add reviews section** to User Profile
12. ⏳ **Improve profile completion UX** (make it collapsible)
13. ⏳ **Add "Invite to Project"** quick action
14. ⏳ **Add profile views counter**
15. ⏳ **Add "Share Profile"** button

---

## 🎯 Conclusion

### **Current State:**

| Aspect | Own Profile | User Profile |
|--------|-------------|--------------|
| **Visual Appeal** | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Information Clarity** | ⭐⭐ | ⭐⭐⭐⭐ |
| **Functionality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Mobile Friendly** | ⭐⭐ | ⭐⭐⭐ |
| **Consistency** | ⭐⭐ | ⭐⭐⭐ |

### **Target State:**

Both pages should have:
- ✅ **Unified hero banner design**
- ✅ **Consistent card layouts**
- ✅ **Clear visual hierarchy**
- ✅ **Prominent stats display**
- ✅ **Mobile-optimized layouts**
- ✅ **Context-appropriate actions**

The **User Profile page** has better visual design and information hierarchy, while the **Own Profile page** has more functionality but suffers from information overload and inconsistent styling.
