## Unified Presets System - "System" Creator is CORRECT

### Question:
Why does the preset `cinematic_454bb50a-9a13-48a8-bce6-c0f26bbf0a4d` show:
- Creator: "System"
- Handle: "@preset"

### Answer:
**This is CORRECT behavior** because it's a **cinematic preset**, not a user-created preset.

---

## Understanding Preset Types (Updated - Unified Structure)

### 1. **Regular Presets** (User-Created)
- **Table**: `presets`
- **Has `user_id`**: ✅ Yes (references `auth.users.id`)
- **Creator**: The user who created it
- **Example**: Custom presets created by users in `/presets/create`

### 2. **Cinematic Presets** (System/Built-in)
- **Table**: `cinematic_presets`
- **Has `user_id`**: ✅ **YES** (nullable for system presets)
- **Creator**: System (user_id = null) OR User (user_id = user's ID)
- **Example**: Portrait, Landscape, Cinematic, Fashion, etc.

### 3. **Unified Structure** (NEW)
Both tables now have **identical schemas** for consistency:

#### Unified Schema:
```sql
-- Both presets and cinematic_presets now have:
CREATE TABLE presets (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),  -- nullable for system presets
    name VARCHAR(100),
    display_name VARCHAR(100),               -- human-readable name
    description TEXT,
    category VARCHAR(50),
    prompt_template TEXT,
    negative_prompt TEXT,
    style_settings JSONB DEFAULT '{}',       -- migrated from parameters
    technical_settings JSONB DEFAULT '{}',
    ai_metadata JSONB DEFAULT '{}',
    seedream_config JSONB DEFAULT '{}',
    generation_mode VARCHAR(20) DEFAULT 'image',
    is_public BOOLEAN DEFAULT false,         -- true for cinematic presets
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    is_for_sale BOOLEAN DEFAULT false,
    sale_price INTEGER DEFAULT 0,
    seller_user_id UUID REFERENCES auth.users(id),
    marketplace_status VARCHAR(20) DEFAULT 'private',
    total_sales INTEGER DEFAULT 0,
    revenue_earned INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- cinematic_presets has identical structure + legacy 'parameters' column
```

---

## Why This Matters

### Cinematic Presets Are:
1. **Pre-built** - Created as part of system migration
2. **Always public** - Available to all users
3. **No ownership** - Not created by any specific user
4. **Professional templates** - Curated cinematic looks

### Examples of Cinematic Presets:
From [migration 20250922101602](supabase/migrations/20250922101602_create_cinematic_presets_table.sql#L38-L255):
- Portrait (9:16 ratio, soft lighting, warm tones)
- Landscape (16:9 ratio, natural light, earth tones)
- Cinematic (21:9 ratio, dramatic lighting, teal/orange)
- Fashion (4:3 ratio, rim lighting, jewel tones)
- Street (3:2 ratio, handheld, monochrome)
- Commercial, Artistic, Documentary, Nature, Urban

---

## How the API Handles This (Updated - Unified Structure)

### From [/api/presets/[id]/route.ts](apps/web/app/api/presets/[id]/route.ts):

```typescript
// Line 18-21: Detect cinematic preset by ID prefix
if (rawId.startsWith('cinematic_')) {
    id = rawId.replace('cinematic_', '');
    isCinematicPreset = true;
}

// Line 29-84: Use unified view for consistent structure
const { data: preset, error } = await supabase
    .from('unified_presets')
    .select(`
        id, preset_type, user_id, name, display_name,
        description, category, prompt_template, negative_prompt,
        style_settings, technical_settings, ai_metadata,
        seedream_config, generation_mode, is_public, is_featured,
        is_active, sort_order, usage_count, last_used_at,
        is_for_sale, sale_price, marketplace_status,
        total_sales, revenue_earned, likes_count,
        created_at, updated_at
    `)
    .eq('id', id)
    .eq('preset_type', isCinematicPreset ? 'cinematic' : 'regular')
    .single();

// Get cinematic parameters from original table if needed
let cinematicParameters = null;
if (isCinematicPreset) {
    const { data: cinematicData } = await supabase
        .from('cinematic_presets')
        .select('parameters')
        .eq('id', id)
        .single();
    
    cinematicParameters = cinematicData?.parameters || null;
}

// Creator info lookup - now works for both types
let creatorInfo = {
    display_name: 'System',
    handle: 'preset',
    ...
};

if (preset.user_id) {  // ← For system presets, this is null
    // Lookup user profile...
} else {
    // Stay as "System" / "preset" ← System presets end up here
}
```

---

## Verification

### To check if a preset is cinematic:
Run the diagnostic script:
```bash
psql $DATABASE_URL -f scripts/check-cinematic-preset.sql
```

This will tell you:
- ✅ If it's in `cinematic_presets` table → "System" is correct
- ⚠️ If it's in `presets` table → Should show actual creator

### URL Pattern Recognition:
- **Cinematic**: `/presets/cinematic_<uuid>`
- **Regular**: `/presets/<uuid>` (no prefix)

---

## Summary (Updated - Unified Structure)

| Preset Type | ID Format | Table | Creator | Display | Structure |
|-------------|-----------|-------|---------|---------|-----------|
| **Cinematic (System)** | `cinematic_<uuid>` | `cinematic_presets` | None (user_id = null) | "System" / "@preset" ✅ | Unified ✅ |
| **Cinematic (User)** | `cinematic_<uuid>` | `cinematic_presets` | user_id | User's name / @handle ✅ | Unified ✅ |
| **Regular** | `<uuid>` | `presets` | user_id | User's name / @handle ✅ | Unified ✅ |

### For Your Preset:
```
ID: cinematic_454bb50a-9a13-48a8-bce6-c0f26bbf0a4d
     ^^^^^^^^^^
     This prefix means it's a CINEMATIC preset
```

**Showing "System" / "@preset" is CORRECT behavior!** 🎉

---

## New Unified Features

✅ **Unified Schema**: Both tables now have identical structure  
✅ **Unified API**: Single endpoint handles both preset types consistently  
✅ **Unified View**: `unified_presets` view combines both tables  
✅ **User-Created Cinematic**: Users can now create their own cinematic presets  
✅ **Usage Tracking**: Cinematic presets now track usage counts  
✅ **Marketplace Ready**: Both preset types support marketplace features  
✅ **Better Performance**: Optimized indexes and queries  

### Helper Functions Available:
- `get_preset_by_id(preset_id)` - Get any preset by ID
- `increment_preset_usage(preset_id, preset_type)` - Track usage for any preset
- `unified_presets` view - Query both tables as one

The system is now much more flexible and consistent! 🚀
