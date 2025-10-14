# Unsaved Changes System Test Plan 🧪

## Overview
This document outlines how to test the unsaved changes restoration system for gig creation and editing forms.

## Test Scenarios

### 1. **Gig Creation Form - Unsaved Changes**

#### **Test Steps:**
1. Navigate to `/gigs/create`
2. Fill out the basic details step:
   - Title: "Test Gig"
   - Description: "This is a test gig"
   - Purpose: Select any option
   - Compensation: Select any option
3. **DO NOT** click "Save Draft" or "Publish"
4. Navigate away from the page (go to dashboard or another page)
5. Navigate back to `/gigs/create`

#### **Expected Result:**
- ✅ Yellow warning banner appears at the top
- ✅ Banner shows "Unsaved Changes Found" message
- ✅ Two buttons: "Restore Changes" and "Discard & Start Fresh"
- ✅ Form data is restored when clicking "Restore Changes"
- ✅ Form is cleared when clicking "Discard & Start Fresh"

#### **Test Data to Verify:**
- Title field should contain "Test Gig"
- Description field should contain "This is a test gig"
- Purpose and Compensation selections should be preserved

---

### 2. **Gig Edit Form - Unsaved Changes**

#### **Test Steps:**
1. Navigate to an existing gig edit page (e.g., `/gigs/[id]/edit`)
2. Make changes to the form:
   - Change the title
   - Modify the description
   - Update other fields
3. **DO NOT** click "Save Changes"
4. Navigate away from the page
5. Navigate back to the same gig edit page

#### **Expected Result:**
- ✅ Yellow warning banner appears at the top
- ✅ Banner shows "Unsaved Changes Found" message
- ✅ Two buttons: "Restore Changes" and "Discard & Start Fresh"
- ✅ Form data is restored when clicking "Restore Changes"
- ✅ Form reverts to original data when clicking "Discard & Start Fresh"

---

### 3. **Cross-Session Persistence**

#### **Test Steps:**
1. Fill out a gig creation form with data
2. Close the browser tab/window
3. Open a new browser tab/window
4. Navigate to `/gigs/create`

#### **Expected Result:**
- ✅ Unsaved changes are still detected
- ✅ Restore prompt appears
- ✅ Data can be restored successfully

---

### 4. **Multiple Form Steps**

#### **Test Steps:**
1. Start creating a gig
2. Fill out multiple steps:
   - Basic Details
   - Location & Schedule
   - Requirements
3. Navigate away without saving
4. Return to the form

#### **Expected Result:**
- ✅ All form data from all steps is preserved
- ✅ Current step position is remembered
- ✅ Completed steps are preserved

---

### 5. **Browser Storage Cleanup**

#### **Test Steps:**
1. Create unsaved changes
2. Click "Discard & Start Fresh"
3. Navigate away and back

#### **Expected Result:**
- ✅ No restore prompt appears
- ✅ Form starts fresh
- ✅ LocalStorage is cleaned up

---

### 6. **Successful Save Cleanup**

#### **Test Steps:**
1. Create unsaved changes
2. Complete the form and save/publish successfully
3. Navigate away and back

#### **Expected Result:**
- ✅ No restore prompt appears
- ✅ LocalStorage is cleaned up after successful save

---

## Manual Testing Checklist

### **Gig Creation Form (`/gigs/create`)**
- [ ] Unsaved changes detection works
- [ ] Restore prompt appears with correct styling
- [ ] "Restore Changes" button works
- [ ] "Discard & Start Fresh" button works
- [ ] Form data is properly restored
- [ ] LocalStorage is cleaned up after actions
- [ ] Cross-session persistence works

### **Gig Edit Form (`/gigs/[id]/edit`)**
- [ ] Unsaved changes detection works
- [ ] Restore prompt appears with correct styling
- [ ] "Restore Changes" button works
- [ ] "Discard & Start Fresh" button works
- [ ] Form data is properly restored
- [ ] Original data is restored when discarding
- [ ] LocalStorage is cleaned up after actions

### **UI/UX Testing**
- [ ] Warning banner has proper amber/yellow styling
- [ ] Icons are appropriate (warning triangle)
- [ ] Text is clear and actionable
- [ ] Buttons have proper hover states
- [ ] Close button works (if present)
- [ ] Responsive design works on mobile

### **Edge Cases**
- [ ] Empty form doesn't trigger restore prompt
- [ ] Form with only whitespace doesn't trigger restore prompt
- [ ] Corrupted localStorage data is handled gracefully
- [ ] Multiple tabs with same form work correctly
- [ ] Form works after browser refresh

---

## Automated Testing (Future)

### **Unit Tests to Add:**
```typescript
// Test the useGigFormPersistence hook
describe('useGigFormPersistence', () => {
  it('should save form data to localStorage')
  it('should restore form data from localStorage')
  it('should clear form data when requested')
  it('should detect unsaved changes')
})

// Test the UnsavedChangesPrompt component
describe('UnsavedChangesPrompt', () => {
  it('should render when isVisible is true')
  it('should call onRestore when restore button is clicked')
  it('should call onDiscard when discard button is clicked')
  it('should call onDismiss when close button is clicked')
})
```

### **Integration Tests:**
```typescript
// Test the complete flow
describe('Gig Creation Unsaved Changes', () => {
  it('should show restore prompt after navigation')
  it('should restore data when restore is clicked')
  it('should clear data when discard is clicked')
})
```

---

## Known Issues & Fixes

### **Issue 1: Restore Prompt Not Appearing**
**Symptoms:** Form has unsaved changes but restore prompt doesn't show
**Possible Causes:**
- localStorage key mismatch
- Data serialization issues
- Component not re-rendering

**Debug Steps:**
1. Check browser DevTools → Application → Local Storage
2. Look for `gig-create-draft` or `gig-edit-[id]` keys
3. Verify data structure matches expected format

### **Issue 2: Data Not Restoring**
**Symptoms:** Restore prompt appears but data doesn't restore
**Possible Causes:**
- Form state not updating
- Data structure mismatch
- Component lifecycle issues

**Debug Steps:**
1. Check console for errors
2. Verify `setFormData` is being called
3. Check if form fields are controlled components

### **Issue 3: Styling Issues**
**Symptoms:** Restore prompt looks broken or unstyled
**Possible Causes:**
- CSS classes not applied
- Tailwind CSS not loaded
- Component import issues

**Debug Steps:**
1. Check if Tailwind CSS is loaded
2. Verify component imports
3. Check for CSS conflicts

---

## Performance Considerations

### **LocalStorage Usage:**
- Form data is saved on every change (debounced)
- Data is cleaned up after successful save
- Storage size should be minimal (< 1MB per form)

### **Memory Usage:**
- Form state is kept in memory
- LocalStorage data is only read on mount
- No memory leaks from event listeners

---

## Browser Compatibility

### **Supported Browsers:**
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### **Features Used:**
- localStorage API
- JSON.parse/stringify
- React hooks (useState, useEffect, useCallback)
- Next.js router

---

## Security Considerations

### **Data Storage:**
- Form data is stored locally (client-side only)
- No sensitive data should be in form fields
- Data is automatically cleaned up

### **XSS Prevention:**
- All user input is properly escaped
- No innerHTML usage
- React's built-in XSS protection

---

## Future Enhancements

### **Planned Features:**
1. **Auto-save indicators** - Show when form is auto-saving
2. **Conflict resolution** - Handle multiple users editing same gig
3. **Version history** - Keep multiple versions of unsaved changes
4. **Cloud sync** - Sync unsaved changes across devices
5. **Smart restore** - Suggest which changes to restore

### **UI Improvements:**
1. **Progress indicators** - Show how much of form is completed
2. **Change highlights** - Highlight what changed since last save
3. **Keyboard shortcuts** - Ctrl+S to save, Ctrl+Z to undo
4. **Drag & drop** - Reorder form steps

This comprehensive test plan ensures the unsaved changes system works reliably across all scenarios and provides a great user experience.
