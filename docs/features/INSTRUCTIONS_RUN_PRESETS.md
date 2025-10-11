# Instructions: Add New Presets to Database

## Quick Summary
You need to run 3 SQL files to add all the new presets and fix visibility.

## Method 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor**
3. Click "**New query**"

### Run These Files in Order:

#### Step 1: Add Additional Headshot & Product Presets
Copy and paste the contents of `additional_headshot_product_presets.sql` into the SQL editor and click "Run"

**Adds:**
- Executive Portrait
- Actor Headshot
- Real Estate Agent Portrait
- Healthcare Professional Portrait
- Tech Professional Portrait
- Food Product Photography
- Jewelry Product Photography
- Fashion Product Photography
- Electronics Product Photography
- Beauty Product Photography
- Automotive Product Photography
- Furniture Product Photography

#### Step 2: Add Instant Film Presets
Copy and paste the contents of `instant_film_presets.sql` into the SQL editor and click "Run"

**Adds:**
- Polaroid Originals Classic
- Polaroid 600 Series
- Fujifilm Instax Mini
- Fujifilm Instax Wide
- Polaroid SX-70 Vintage
- Polaroid Spectra Wide
- Polaroid Go Modern
- Vintage Instant Film
- Black & White Instant Film
- Sepia Instant Film
- Double Exposure Instant Film
- Overexposed Instant Film
- Underexposed Instant Film
- Polaroid Rainbow Border
- Instant Film Portrait
- Instant Film Landscape

#### Step 3: Fix Visibility (IMPORTANT!)
Copy and paste the contents of `scripts/fix-preset-visibility.sql` into the SQL editor and click "Run"

**This makes all presets public so they appear in search results**

---

## Method 2: Using Command Line (psql)

Get your database connection string from Supabase Dashboard → Project Settings → Database → Connection String

```bash
# Navigate to preset directory
cd /Users/judeokun/Documents/GitHub/preset/preset.ie/preset

# Run each file
psql "your-connection-string-here" -f additional_headshot_product_presets.sql
psql "your-connection-string-here" -f instant_film_presets.sql
psql "your-connection-string-here" -f scripts/fix-preset-visibility.sql
```

---

## Method 3: Using the Script (Automated)

```bash
cd /Users/judeokun/Documents/GitHub/preset/preset.ie/preset
./scripts/run-new-presets.sh
```

Follow the prompts to enter your database credentials.

---

## Verification

After running all scripts, verify in Supabase SQL Editor:

```sql
-- Count new presets
SELECT
    COUNT(*) FILTER (WHERE name ILIKE '%headshot%') as headshot_presets,
    COUNT(*) FILTER (WHERE name ILIKE '%product%') as product_presets,
    COUNT(*) FILTER (WHERE name ILIKE '%instant%' OR name ILIKE '%polaroid%' OR name ILIKE '%instax%') as instant_film_presets,
    COUNT(*) FILTER (WHERE is_public = true) as public_presets,
    COUNT(*) FILTER (WHERE is_featured = true) as featured_presets
FROM presets;
```

**Expected Results:**
- headshot_presets: 8-10
- product_presets: 9-12
- instant_film_presets: 16
- public_presets: Should be > 30
- featured_presets: Should be > 20

---

## Check Individual Presets

```sql
-- Headshot presets
SELECT name, is_public, is_featured
FROM presets
WHERE name ILIKE '%headshot%' OR category IN ('headshot', 'professional_portrait')
ORDER BY name;

-- Product presets
SELECT name, is_public, is_featured
FROM presets
WHERE name ILIKE '%product%' OR category = 'product_photography'
ORDER BY name;

-- Instant film presets
SELECT name, is_public, is_featured
FROM presets
WHERE name ILIKE '%instant%' OR name ILIKE '%polaroid%' OR name ILIKE '%instax%'
ORDER BY name;
```

All should have:
- `is_public = true` ✅
- `is_featured = true` ✅

---

## Troubleshooting

### Problem: "User does not exist" error
**Solution:** The user_id `c231dca2-2973-46f6-98ba-a20c51d71b69` must exist in `auth.users` table. Either:
1. Create this user first, OR
2. Replace the user_id in the SQL files with an existing admin user's ID

### Problem: Presets don't appear in marketplace
**Solution:** Run `scripts/fix-preset-visibility.sql` to set `is_public = true`

### Problem: Duplicate key violations
**Solution:** Presets already exist. Either:
1. Delete existing presets first: `DELETE FROM presets WHERE name = 'Preset Name';`
2. Or skip the INSERT for those specific presets

---

## What These Presets Add

### Headshot Presets (12 total)
- Professional Corporate Headshot
- LinkedIn Professional Portrait
- Creative Professional Portrait
- **NEW:** Executive Portrait
- **NEW:** Actor Headshot
- **NEW:** Real Estate Agent Portrait
- **NEW:** Healthcare Professional Portrait
- **NEW:** Tech Professional Portrait

### Product Photography Presets (12 total)
- E-commerce Product Photography
- Lifestyle Product Photography
- Studio Product Photography
- **NEW:** Food Product Photography
- **NEW:** Jewelry Product Photography
- **NEW:** Fashion Product Photography
- **NEW:** Electronics Product Photography
- **NEW:** Beauty Product Photography
- **NEW:** Automotive Product Photography
- **NEW:** Furniture Product Photography

### Instant Film Presets (16 NEW)
- Multiple Polaroid styles (Originals, 600, SX-70, Spectra, Go)
- Fujifilm Instax (Mini, Wide)
- Creative styles (B&W, Sepia, Double Exposure, Over/Underexposed)
- Specialized (Portrait, Landscape, Vintage, Rainbow Border)

---

## Summary

**Total New Presets:** ~35
- 5 additional headshot presets
- 7 additional product presets
- 16 instant film presets
- 7 specialty variations

All presets are configured to be:
✅ Public (visible in marketplace)
✅ Featured (promoted)
✅ High quality (0.9-0.95 quality settings)
✅ Properly categorized and tagged
