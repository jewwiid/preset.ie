# LocalStorage Auth Conflict Analysis 🔍

## Potential Issue: Unsaved Changes Auto-Save vs Auth Session

### **Hypothesis**
The frequent localStorage writes from the unsaved changes auto-save system might be interfering with Supabase's auth session management, causing users to be logged out unexpectedly.

## Analysis

### **Storage Keys Used**

#### **Auth Storage (Supabase):**
- `sb-<project-ref>-auth-token` - Main auth token
- `sb-<project-ref>-auth-token-code-verifier` - PKCE verifier
- Legacy keys: `supabase.auth.*`, `sb-preset-auth-token`

#### **Form Storage (Our System):**
- `gig-create-draft` - Gig creation form data
- `gig-edit-<gigId>` - Gig edit form data
- `gig-edit-<gigId>-step` - Current step
- `gig-edit-<gigId>-completed` - Completed steps

### **Potential Conflicts**

#### **1. Storage Quota Issues**
- **Problem**: Frequent localStorage writes might hit browser storage limits
- **Impact**: Could cause localStorage operations to fail, affecting auth tokens
- **Evidence**: Some browsers have strict localStorage quotas

#### **2. Concurrent Access**
- **Problem**: Multiple localStorage operations happening simultaneously
- **Impact**: Race conditions between auth and form data
- **Evidence**: Auth state changes while form is auto-saving

#### **3. Storage Corruption**
- **Problem**: Large form data might corrupt localStorage
- **Impact**: Could affect other localStorage entries including auth
- **Evidence**: JSON parsing errors in form data

#### **4. Browser Storage Policies**
- **Problem**: Some browsers clear localStorage under memory pressure
- **Impact**: Could clear auth tokens along with form data
- **Evidence**: Users getting logged out after form interactions

## Testing Plan

### **Test 1: Storage Quota**
```javascript
// Check localStorage usage
function checkStorageUsage() {
  let totalSize = 0
  for (let key in localStorage) {
    totalSize += localStorage[key].length
  }
  console.log('Total localStorage size:', totalSize, 'bytes')
  console.log('Available quota:', navigator.storage?.estimate?.())
}
```

### **Test 2: Concurrent Operations**
```javascript
// Test if concurrent localStorage operations cause issues
function testConcurrentOperations() {
  // Simulate auth token update
  localStorage.setItem('test-auth', JSON.stringify({ token: 'test' }))
  
  // Simulate form auto-save
  localStorage.setItem('test-form', JSON.stringify({ data: 'large data...' }))
  
  // Check if auth token is still valid
  const authToken = localStorage.getItem('test-auth')
  console.log('Auth token after concurrent ops:', authToken)
}
```

### **Test 3: Large Data Impact**
```javascript
// Test if large form data affects other localStorage entries
function testLargeDataImpact() {
  const largeData = {
    title: 'Test Gig',
    description: 'A'.repeat(10000), // Large description
    // ... other form fields
  }
  
  localStorage.setItem('test-large-form', JSON.stringify(largeData))
  
  // Check if auth token is still accessible
  const authToken = localStorage.getItem('sb-preset-auth-token')
  console.log('Auth token after large data:', authToken)
}
```

## Solutions

### **Immediate Fixes**

#### **1. Reduce Auto-Save Frequency**
```typescript
// Increase debounce delay to reduce localStorage writes
const debouncedSaveGigData = useCallback(
  debounce(saveGigData, 2000), // Increased from 1000ms to 2000ms
  [saveGigData]
)
```

#### **2. Add Error Handling**
```typescript
const saveGigData = useCallback((data: Partial<GigFormData>) => {
  try {
    // Check localStorage quota before saving
    const testKey = 'test-quota-check'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    
    // Proceed with save
    localStorage.setItem(storageKey, JSON.stringify(updated))
  } catch (error) {
    console.warn('localStorage quota exceeded or error:', error)
    // Don't crash the app, just skip auto-save
  }
}, [storageKey])
```

#### **3. Use sessionStorage for Form Data**
```typescript
// Use sessionStorage instead of localStorage for form data
// This won't persist across browser sessions but won't interfere with auth
const storage = typeof window !== 'undefined' ? sessionStorage : null
storage?.setItem(storageKey, JSON.stringify(updated))
```

### **Long-term Solutions**

#### **1. Implement IndexedDB**
```typescript
// Use IndexedDB for form data storage
// More robust, larger capacity, better performance
const saveToIndexedDB = async (data: any) => {
  const db = await openDB('preset-forms', 1)
  await db.put('forms', data, 'gig-create-draft')
}
```

#### **2. Server-Side Draft Storage**
```typescript
// Store drafts on the server instead of localStorage
// More reliable, no storage conflicts
const saveDraftToServer = async (data: any) => {
  await fetch('/api/drafts/gig-create', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}
```

#### **3. Separate Storage Domains**
```typescript
// Use different storage strategies for different data types
const storageStrategies = {
  auth: 'localStorage', // Critical, needs persistence
  forms: 'sessionStorage', // Temporary, session-only
  preferences: 'localStorage', // User preferences
  cache: 'IndexedDB' // Large data, performance-critical
}
```

## Monitoring

### **Add Logging**
```typescript
// Add comprehensive logging to track storage issues
const logStorageOperation = (operation: string, key: string, success: boolean) => {
  console.log(`Storage ${operation}: ${key} - ${success ? 'SUCCESS' : 'FAILED'}`)
  
  // Track in analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'storage_operation', {
      operation,
      key,
      success,
      timestamp: Date.now()
    })
  }
}
```

### **Health Checks**
```typescript
// Regular health checks for localStorage
const checkStorageHealth = () => {
  try {
    // Test basic operations
    const testKey = 'health-check'
    localStorage.setItem(testKey, 'test')
    localStorage.getItem(testKey)
    localStorage.removeItem(testKey)
    
    return { healthy: true, error: null }
  } catch (error) {
    return { healthy: false, error: error.message }
  }
}
```

## Recommended Actions

### **Immediate (High Priority)**
1. **Reduce auto-save frequency** from 1s to 2-3s
2. **Add error handling** for localStorage operations
3. **Add logging** to track storage issues
4. **Test with large form data** to reproduce the issue

### **Short-term (Medium Priority)**
1. **Switch to sessionStorage** for form data
2. **Implement storage health checks**
3. **Add user feedback** when auto-save fails
4. **Monitor storage usage** in production

### **Long-term (Low Priority)**
1. **Implement IndexedDB** for form storage
2. **Add server-side draft storage**
3. **Implement storage strategies** based on data type
4. **Add comprehensive monitoring** and alerting

## Conclusion

The unsaved changes auto-save system **could potentially** be causing logout issues through:

1. **Storage quota exhaustion**
2. **Concurrent localStorage operations**
3. **Storage corruption from large data**
4. **Browser storage policies**

The most likely culprit is **frequent localStorage writes** interfering with Supabase's auth token management. The recommended immediate fix is to **reduce auto-save frequency** and **add proper error handling**.

## Next Steps

1. **Test the hypothesis** by temporarily disabling auto-save
2. **Implement immediate fixes** (reduce frequency, add error handling)
3. **Monitor the results** to see if logout issues decrease
4. **Plan long-term solution** (IndexedDB or server-side storage)
