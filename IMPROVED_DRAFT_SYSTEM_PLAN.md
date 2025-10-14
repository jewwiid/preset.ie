# Improved Draft System Plan

## Current System Analysis
- **Local Storage Only**: Uses `localStorage` for draft persistence
- **Two Keys**: `gig-create-draft` (new) and `gig-edit-${gigId}` (existing)
- **Auto-save**: Debounced saving every 1 second
- **Restore Prompt**: Shows dialog on page load if unsaved data exists

## Problems with Current System
1. **Data Loss Risk**: Cleared browser data = lost drafts
2. **No Cross-Device Sync**: Can't continue on different device
3. **No Server Backup**: No database persistence
4. **No Conflict Resolution**: Multiple device editing issues
5. **No Cleanup**: Old drafts never expire

## Recommended Hybrid Approach

### 1. **Database Draft Table**
```sql
CREATE TABLE gig_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE, -- NULL for new gigs
  form_data JSONB NOT NULL,
  current_step VARCHAR(50) DEFAULT 'basic',
  completed_steps TEXT[] DEFAULT '{}',
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gig_drafts_user_id ON gig_drafts(user_id);
CREATE INDEX idx_gig_drafts_gig_id ON gig_drafts(gig_id);
CREATE INDEX idx_gig_drafts_expires_at ON gig_drafts(expires_at);

-- RLS Policies
ALTER TABLE gig_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own drafts" ON gig_drafts
  FOR ALL USING (user_id = auth.uid()::uuid);
```

### 2. **Enhanced Hook: useGigFormPersistence**
```typescript
export function useGigFormPersistence(gigId?: string) {
  const [isOnline, setIsOnline] = useState(true)
  const [lastServerSave, setLastServerSave] = useState<Date | null>(null)
  
  // Hybrid save: localStorage + database
  const saveGigData = useCallback(async (data: Partial<GigFormData>) => {
    // 1. Save to localStorage immediately (fast)
    saveToLocalStorage(data)
    
    // 2. Save to database if online (reliable)
    if (isOnline) {
      try {
        await saveToDatabase(data)
        setLastServerSave(new Date())
      } catch (error) {
        console.warn('Failed to save to server:', error)
        // Keep trying in background
      }
    }
  }, [isOnline, gigId])
  
  // Auto-cleanup expired drafts
  const cleanupExpiredDrafts = useCallback(async () => {
    if (isOnline) {
      await supabase.rpc('cleanup_expired_drafts')
    }
  }, [isOnline])
  
  return {
    saveGigData,
    debouncedSaveGigData,
    getGigData,
    clearGigData,
    hasUnsavedData,
    lastServerSave,
    isOnline
  }
}
```

### 3. **Server-Side Functions**
```sql
-- Save draft to database
CREATE OR REPLACE FUNCTION save_gig_draft(
  p_user_id UUID,
  p_gig_id UUID DEFAULT NULL,
  p_form_data JSONB,
  p_current_step VARCHAR(50) DEFAULT 'basic',
  p_completed_steps TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  draft_id UUID;
BEGIN
  -- Upsert draft
  INSERT INTO gig_drafts (user_id, gig_id, form_data, current_step, completed_steps)
  VALUES (p_user_id, p_gig_id, p_form_data, p_current_step, p_completed_steps)
  ON CONFLICT (user_id, COALESCE(gig_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET
    form_data = EXCLUDED.form_data,
    current_step = EXCLUDED.current_step,
    completed_steps = EXCLUDED.completed_steps,
    last_saved_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO draft_id;
  
  RETURN draft_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired drafts
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM gig_drafts 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's drafts
CREATE OR REPLACE FUNCTION get_user_drafts(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  gig_id UUID,
  form_data JSONB,
  current_step VARCHAR(50),
  completed_steps TEXT[],
  last_saved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.gig_id,
    d.form_data,
    d.current_step,
    d.completed_steps,
    d.last_saved_at
  FROM gig_drafts d
  WHERE d.user_id = p_user_id
    AND d.expires_at > NOW()
  ORDER BY d.last_saved_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. **Enhanced UI Features**

#### **Draft Status Indicator**
```typescript
const DraftStatus = () => {
  const { lastServerSave, isOnline } = useGigFormPersistence(gigId)
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isOnline ? (
        lastServerSave ? (
          <span>Saved {formatDistanceToNow(lastServerSave)} ago</span>
        ) : (
          <span>Saving...</span>
        )
      ) : (
        <span className="text-orange-500">Offline - saving locally</span>
      )}
    </div>
  )
}
```

#### **Draft Management Page**
```typescript
const DraftsPage = () => {
  const [drafts, setDrafts] = useState([])
  
  const loadDrafts = async () => {
    const { data } = await supabase.rpc('get_user_drafts', { 
      p_user_id: user.id 
    })
    setDrafts(data || [])
  }
  
  return (
    <div>
      <h2>Your Drafts</h2>
      {drafts.map(draft => (
        <DraftCard 
          key={draft.id}
          draft={draft}
          onRestore={() => restoreDraft(draft)}
          onDelete={() => deleteDraft(draft.id)}
        />
      ))}
    </div>
  )
}
```

### 5. **Migration Strategy**

#### **Phase 1: Add Database Support**
1. Create `gig_drafts` table
2. Add server-side functions
3. Update `useGigFormPersistence` hook
4. Keep localStorage as fallback

#### **Phase 2: Enhanced Features**
1. Add draft management UI
2. Implement conflict resolution
3. Add offline/online indicators
4. Add draft sharing capabilities

#### **Phase 3: Advanced Features**
1. Auto-save to multiple devices
2. Draft versioning
3. Collaborative editing
4. Draft templates

## Benefits of Improved System

### **Reliability**
- ✅ **No data loss** - Server backup + localStorage fallback
- ✅ **Cross-device sync** - Continue on any device
- ✅ **Offline support** - Works without internet

### **User Experience**
- ✅ **Seamless saving** - User never thinks about it
- ✅ **Draft management** - See all drafts in one place
- ✅ **Conflict resolution** - Handle multiple device editing

### **Performance**
- ✅ **Fast local saves** - Immediate localStorage updates
- ✅ **Background sync** - Server saves don't block UI
- ✅ **Auto-cleanup** - Expired drafts removed automatically

### **Scalability**
- ✅ **Database persistence** - Survives browser data loss
- ✅ **User isolation** - RLS policies protect data
- ✅ **Expiration handling** - Automatic cleanup

## Implementation Priority

1. **High Priority**: Database table + basic server functions
2. **Medium Priority**: Enhanced hook with hybrid saving
3. **Low Priority**: Draft management UI + advanced features

This approach gives you the best of both worlds: fast local saves for immediate feedback, and reliable server backup for data safety.
