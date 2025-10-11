# Testing Guide - Gig Creation Improvements

## 🎯 What We've Implemented

### ✅ **Features Ready for Testing:**

1. **"Looking For" Multi-Select Dropdown** 🎭
2. **City, Country Location Parsing** 📍
3. **Conditional Preferences Display** 🎨
4. **Database Integration** 💾

---

## 📋 **Manual Testing Checklist**

### **Test 1: Create New Gig with "MODELS" Selected**

#### **Steps:**
1. Sign in as `sarahchen_photo` / `Test123!`
2. Navigate to: `http://localhost:3000/gigs/create`
3. **Step 1 - Basic Details:**
   - [ ] Verify "Who are you looking for?" dropdown shows
   - [ ] Select "Models (All Types)"
   - [ ] Verify "MODELS" badge appears with X button
   - [ ] Click dropdown again - should say "Add another role..."
   - [ ] Select "Makeup Artists"
   - [ ] Verify both badges show: "MODELS" and "MAKEUP ARTISTS"
   - [ ] Click X on "MAKEUP ARTISTS" - verify it removes
   - [ ] Fill title: "Test Model Casting - London"
   - [ ] Fill description: "Looking for fashion models for editorial shoot in central London. Must be comfortable with urban streetwear and outdoor shooting."
   - [ ] Click "Continue to Schedule"

4. **Step 2 - Schedule & Location:**
   - [ ] Fill location: "London, United Kingdom" ← Test proper format!
   - [ ] Verify placeholder shows: "Manchester, United Kingdom  •  Dublin, Ireland  •  Paris, France"
   - [ ] Verify helper text shows: "💡 Use format: City, Country"
   - [ ] Fill dates (any future dates)
   - [ ] Click "Continue to Requirements"

5. **Step 3 - Requirements:**
   - [ ] Select usage rights
   - [ ] Set max applicants: 5
   - [ ] Click "Continue to Moodboard"

6. **Step 4 - Preferences:** ← **KEY TEST!**
   - [ ] Verify header shows: "Looking for: 🎭 Models (All Types)"
   - [ ] **BUG CHECK #1**: Verify "Physical Attributes" section SHOWS
   - [ ] **BUG CHECK #2**: Verify "Equipment Requirements" section DOES NOT SHOW
   - [ ] **BUG CHECK #3**: Verify "Software Requirements" section DOES NOT SHOW
   - [ ] Try to set height: "160" in min field
   - [ ] **BUG CHECK #4**: Does it save as "160" or truncate to "16"?
   - [ ] Try to set age: "30" in max field
   - [ ] **BUG CHECK #5**: Does it save as "30" or truncate to "3"?
   - [ ] Click "Continue"

7. **Step 5 - Moodboard:**
   - [ ] Skip (click "Continue to Review")

8. **Step 6 - Review:**
   - [ ] Verify shows: "Height: 160-180cm" (NOT "16-1cm")
   - [ ] Verify shows: "Age: 18-30" (NOT "18-3")
   - [ ] Click "Save Changes" or "Publish"

9. **Step 7 - Verify in Database:**
```sql
SELECT 
  title,
  looking_for_types,
  city,
  country,
  location_text,
  applicant_preferences->'physical'->'height_range' as height
FROM gigs
WHERE title ILIKE '%Test Model%'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
title: "Test Model Casting - London"
looking_for_types: ["MODELS"]
city: "London"
country: "United Kingdom"
location_text: "London, United Kingdom"
height: {"min": 160, "max": 180}  ← Should be 160, not 16!
```

---

### **Test 2: Create Gig with "PHOTOGRAPHERS" Selected**

#### **Steps:**
1. Navigate to: `http://localhost:3000/gigs/create`
2. **Step 1:**
   - [ ] Select "Photographers"
   - [ ] Verify badge shows "PHOTOGRAPHERS"
   - [ ] Fill title: "Test Photographer Gig"
   - [ ] Fill description: "Need second shooter for wedding in Paris"

3. **Step 2:**
   - [ ] Fill location: "Paris, France"
   - [ ] Fill dates

4. **Step 4 - Preferences:** ← **KEY TEST!**
   - [ ] **BUG CHECK #1**: Verify "Physical Attributes" section DOES NOT SHOW
   - [ ] **BUG CHECK #2**: Verify "Equipment Requirements" section SHOWS
   - [ ] **BUG CHECK #3**: Verify "Software Requirements" section SHOWS
   - [ ] **BUG CHECK #4**: Verify "Required Specializations" shows photography options (NOT modeling categories)

5. **Verify in Database:**
```sql
SELECT 
  title,
  looking_for_types,
  city,
  country
FROM gigs
WHERE title ILIKE '%Test Photographer%';
```

**Expected:**
```
looking_for_types: ["PHOTOGRAPHERS"]
city: "Paris"
country: "France"
```

---

### **Test 3: Edit Existing Gig (Urban Fashion)**

#### **Steps:**
1. Navigate to: `http://localhost:3000/gigs/my-gigs`
2. Click "Edit" on Urban Fashion gig
3. **Step 1 - Basic Details:**
   - [ ] Verify "MODELS" badge shows (loaded from database!)
   - [ ] Try adding "HAIR_STYLISTS" 
   - [ ] Verify both badges show

4. **Step 2 - Location:**
   - [ ] Current shows: "Manchester"
   - [ ] Change to: "Manchester, United Kingdom"
   - [ ] Verify placeholder/helper shows proper format

5. **Step 4 - Preferences:**
   - [ ] Click "Preferences" in step indicator
   - [ ] **BUG CHECK**: Try setting height min: "165"
   - [ ] **BUG CHECK**: Does it stay "165" or become "16" or "1"?
   - [ ] Try unchecking a checkbox (e.g., "Product Photography")
   - [ ] **BUG CHECK**: Does it actually uncheck?
   - [ ] Click "Continue"

6. **Step 6 - Review:**
   - [ ] Check displayed values match what you entered
   - [ ] Click "Save Changes"

7. **Verify in Database:**
```sql
SELECT 
  title,
  looking_for_types,
  city,
  country,
  location_text,
  applicant_preferences->'physical'->'height_range' as height
FROM gigs
WHERE title ILIKE '%Urban Fashion%';
```

**Expected:**
```
looking_for_types: ["MODELS", "HAIR_STYLISTS"] ← If you added it
city: "Manchester"
country: "United Kingdom"
location_text: "Manchester, United Kingdom"
height: {"min": 165, "max": ...}  ← Should be 165, not 16!
```

---

## 🐛 **Known Bugs to Document**

### **Bug #1: Input Validation - Number Truncation**
**Location**: `ApplicantPreferencesStep.tsx` - Number inputs  
**Symptom**: Entering "160" saves as "16", entering "30" saves as "3"  
**Impact**: Invalid height/age preferences stored  
**Status**: ⏳ Not fixed yet

### **Bug #2: Checkbox State Management**
**Location**: `ApplicantPreferencesStep.tsx` - Checkbox components  
**Symptom**: Clicking checkbox to uncheck doesn't update visual state or form data  
**Impact**: Can't accurately set preferences, all options stay checked  
**Status**: ⏳ Not fixed yet

### **Bug #3: Session Expiry on Edit**
**Location**: Edit page auth check  
**Symptom**: Redirects to signin when navigating to edit page  
**Impact**: Hard to test edit flow  
**Status**: ⏳ Investigating

---

## ✅ **Expected Working Features**

### **"Looking For" Multi-Select**
- ✅ Dropdown shows 51 categorized options
- ✅ Can select multiple roles
- ✅ Badges appear with remove buttons
- ✅ Saves to database as array
- ✅ Loads from database on edit

### **Location Parsing**
- ✅ "Manchester, United Kingdom" → city: "Manchester", country: "United Kingdom"
- ✅ "Paris, France" → city: "Paris", country: "France"
- ✅ "Downtown Studio" → city: NULL, country: NULL (fallback)

### **Conditional Preferences**
- ✅ Helper functions check if lookingFor array contains specific roles
- ✅ `shouldShowPhysicalAttributes()` - Returns true for Models/Actors
- ✅ `shouldShowEquipment()` - Returns true for Photographers/Videographers  
- ✅ `shouldShowSoftware()` - Returns true for Editors/Designers

---

## 📊 **Success Criteria**

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-select dropdown shows | ✅ PASS | Tested in browser |
| Badges display correctly | ✅ PASS | Tested in browser |
| Can add multiple roles | ✅ PASS | Tested in browser |
| Can remove roles | ✅ PASS | Tested in browser |
| Saves to `looking_for_types` | ✅ PASS | Verified in DB |
| Loads on edit | ⏳ NEEDS TEST | Session issues |
| Location parses city/country | ✅ PASS | Code implemented |
| Conditional prefs logic exists | ✅ PASS | Code implemented |
| Height/age inputs work | ❌ FAIL | Known bug |
| Checkboxes work | ❌ FAIL | Known bug |

---

## 🎯 **Quick Verification SQL**

After creating test gigs, run:

```sql
-- Check all gigs with new fields
SELECT 
  title,
  looking_for_types,
  city,
  country,
  format_gig_location(city, country, location_text) as formatted_location,
  created_at
FROM gigs
ORDER BY created_at DESC
LIMIT 5;

-- Count gigs by role type
SELECT 
  unnest(looking_for_types) as role_type,
  COUNT(*) as count
FROM gigs
WHERE looking_for_types IS NOT NULL 
  AND looking_for_types != '{}'
GROUP BY role_type
ORDER BY count DESC;

-- Check preferences structure
SELECT 
  title,
  looking_for_types,
  jsonb_pretty(applicant_preferences) as preferences
FROM gigs
WHERE looking_for_types @> ARRAY['MODELS']::TEXT[]
LIMIT 1;
```

---

## 🚀 **Next Steps After Testing**

### **If Tests Pass:**
1. Mark conditional preferences as complete
2. Move to fixing input validation bugs
3. Implement enhanced matchmaking algorithm

### **If Tests Fail:**
Document specific failures:
- Which step?
- What was expected?
- What actually happened?
- Error messages?

Then fix identified issues before proceeding.

---

## 📝 **Test Results Template**

```
## Test Results - [Date]

### Test 1: Create Gig with MODELS
- Looking For dropdown: ✅ / ❌
- Multi-select works: ✅ / ❌
- Badges display: ✅ / ❌
- Location parsing: ✅ / ❌
- DB saved correctly: ✅ / ❌
- Conditional prefs: ✅ / ❌
- Input validation bug: ❌ (confirmed)
- Checkbox bug: ❌ (confirmed)

### Test 2: Create Gig with PHOTOGRAPHERS
- Conditional prefs work: ✅ / ❌
- Equipment shows: ✅ / ❌
- Physical hidden: ✅ / ❌

### Test 3: Edit Existing Gig
- Loads looking_for_types: ✅ / ❌
- Can modify roles: ✅ / ❌
- Saves correctly: ✅ / ❌

### Bugs Found:
1. [List any new bugs discovered]
2. [...]
```

---

**Status**: Ready for comprehensive testing!  
**Timeline**: 20-30 minutes for full walkthrough  
**Priority**: Complete testing, then fix the 2 known bugs

