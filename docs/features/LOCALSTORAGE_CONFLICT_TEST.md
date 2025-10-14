# LocalStorage Conflict Test 🧪

## Quick Test to Verify localStorage Issues

### **Test 1: Check Current localStorage Usage**

Open browser DevTools and run this in the console:

```javascript
// Check localStorage usage
function checkStorageUsage() {
  let totalSize = 0
  let authKeys = []
  let formKeys = []
  
  for (let key in localStorage) {
    const value = localStorage[key]
    totalSize += value.length
    
    if (key.includes('auth') || key.includes('sb-')) {
      authKeys.push({ key, size: value.length })
    }
    
    if (key.includes('gig-') || key.includes('preset')) {
      formKeys.push({ key, size: value.length })
    }
  }
  
  console.log('📊 Storage Analysis:')
  console.log('Total size:', totalSize, 'bytes')
  console.log('Auth keys:', authKeys)
  console.log('Form keys:', formKeys)
  
  // Check quota
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(estimate => {
      console.log('Storage quota:', estimate.quota)
      console.log('Storage used:', estimate.usage)
      console.log('Available:', estimate.quota - estimate.usage)
    })
  }
}

checkStorageUsage()
```

### **Test 2: Simulate Form Auto-Save**

```javascript
// Test if form auto-save affects auth tokens
function testFormAutoSave() {
  console.log('🧪 Testing form auto-save impact...')
  
  // Get current auth token
  const authKeys = Object.keys(localStorage).filter(key => key.includes('auth'))
  const authToken = authKeys.length > 0 ? localStorage.getItem(authKeys[0]) : null
  
  console.log('Auth token before test:', authToken ? 'EXISTS' : 'MISSING')
  
  // Simulate form auto-save
  const formData = {
    title: 'Test Gig',
    description: 'A'.repeat(1000), // Large description
    lastSaved: new Date().toISOString()
  }
  
  try {
    localStorage.setItem('test-gig-create-draft', JSON.stringify(formData))
    console.log('✅ Form data saved successfully')
  } catch (error) {
    console.log('❌ Form data save failed:', error)
  }
  
  // Check auth token after
  const authTokenAfter = authKeys.length > 0 ? localStorage.getItem(authKeys[0]) : null
  console.log('Auth token after test:', authTokenAfter ? 'EXISTS' : 'MISSING')
  
  // Clean up
  localStorage.removeItem('test-gig-create-draft')
}

testFormAutoSave()
```

### **Test 3: Check for Storage Errors**

```javascript
// Check if localStorage operations are failing
function checkStorageErrors() {
  console.log('🔍 Checking for storage errors...')
  
  const testKey = 'preset-storage-test'
  
  try {
    // Test basic operations
    localStorage.setItem(testKey, 'test')
    const retrieved = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)
    
    console.log('✅ Basic localStorage operations working')
    
    // Test with larger data
    const largeData = {
      title: 'Test',
      description: 'A'.repeat(10000),
      data: new Array(1000).fill('test data')
    }
    
    localStorage.setItem(testKey, JSON.stringify(largeData))
    const retrievedLarge = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)
    
    console.log('✅ Large data operations working')
    
  } catch (error) {
    console.log('❌ Storage error detected:', error)
    console.log('Error type:', error.name)
    console.log('Error message:', error.message)
  }
}

checkStorageErrors()
```

### **Test 4: Monitor Real-Time Operations**

```javascript
// Monitor localStorage operations in real-time
function monitorStorageOperations() {
  console.log('👀 Monitoring localStorage operations...')
  
  const originalSetItem = localStorage.setItem
  const originalGetItem = localStorage.getItem
  const originalRemoveItem = localStorage.removeItem
  
  localStorage.setItem = function(key, value) {
    console.log('📝 localStorage.setItem:', key, 'Size:', value.length)
    try {
      return originalSetItem.call(this, key, value)
    } catch (error) {
      console.error('❌ setItem failed:', error)
      throw error
    }
  }
  
  localStorage.getItem = function(key) {
    console.log('📖 localStorage.getItem:', key)
    return originalGetItem.call(this, key)
  }
  
  localStorage.removeItem = function(key) {
    console.log('🗑️ localStorage.removeItem:', key)
    return originalRemoveItem.call(this, key)
  }
  
  console.log('Monitoring enabled. Try using the form now.')
}

monitorStorageOperations()
```

## Expected Results

### **If localStorage is working correctly:**
- ✅ All tests should pass
- ✅ Auth tokens should remain intact
- ✅ Form data should save successfully
- ✅ No error messages in console

### **If localStorage has issues:**
- ❌ Storage quota exceeded errors
- ❌ Auth tokens disappearing
- ❌ Form data save failures
- ❌ Browser storage errors

## What to Look For

### **Red Flags:**
1. **QuotaExceededError** - Browser storage limit reached
2. **Auth tokens disappearing** - localStorage corruption
3. **Form data not saving** - Storage operations failing
4. **Console errors** - JavaScript errors during storage

### **Good Signs:**
1. **All operations successful** - No errors in console
2. **Auth tokens preserved** - User stays logged in
3. **Form data saves** - Auto-save working correctly
4. **Reasonable storage usage** - Under browser limits

## Next Steps Based on Results

### **If Tests Pass:**
- localStorage is not the issue
- Look for other causes of logout problems
- Check network issues, session timeouts, etc.

### **If Tests Fail:**
- localStorage is likely the culprit
- Implement the fixes we made (reduced frequency, error handling)
- Consider switching to sessionStorage or IndexedDB
- Monitor the issue in production

## How to Run the Tests

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Copy and paste each test function**
4. **Run the functions one by one**
5. **Check the results and console output**
6. **Report any errors or issues found**

This will help us determine if the unsaved changes auto-save system is indeed causing the logout issues.
