# Admin Presets Analysis Report

**Admin User ID:** `c231dca2-2973-46f6-98ba-a20c51d71b69`
**Analysis Date:** 2025-10-08

---

## Executive Summary

The admin user owns **78 total presets** across two tables:
- **68 presets** in the main `presets` table
- **10 presets** in the `cinematic_presets` table

All presets are configured as **public** (`is_public = true`), meaning they are all eligible to appear on the `/presets` page.

---

## 1. Regular Presets Table (`presets`)

### Key Metrics

| Metric | Count |
|--------|-------|
| Total Presets Owned by Admin | 68 |
| Public Presets | 68 (100%) |
| Private Presets | 0 (0%) |
| Featured Presets | 51 (75%) |
| Public & Featured | 51 |

### Public vs Private Breakdown
- **Public:** 68 presets (100%)
- **Private:** 0 presets (0%)

**Finding:** ALL admin presets are public and will appear on the `/presets` page.

---

## 2. Presets Shown on `/presets` Page

### Criteria for Display
Based on the API code analysis (`/apps/web/app/api/presets/route.ts`):

```typescript
// Line 116-118
if (currentUserId) {
  filteredPresets = filteredPresets.filter(preset => preset.user_id === currentUserId);
} else {
  // Only show public presets if no user filter
  filteredPresets = filteredPresets.filter(preset => preset.is_public === true);
}
```

**Criteria:** `is_public = true`

**Result:** All **68 presets** meet this criteria and will be shown on the `/presets` page (when browsing as a non-authenticated user or when not filtering by user).

---

## 3. Pagination & Limits

### API Configuration
- **Default Limit:** 20 presets per page
- **Configurable:** Yes, via `?limit=N` query parameter
- **Current Code:** `/apps/web/app/api/presets/route.ts`, Line 14
  ```typescript
  const limit = parseInt(searchParams.get('limit') || '20');
  ```

### Pagination Details
- **Total Public Presets:** 68
- **Number of Pages (at 20/page):** 4 pages
- **Pagination Implementation:** Client-side slicing after combining both tables

**Note:** The API fetches ALL presets from both tables first, then applies filtering, sorting, and pagination in memory. This could be optimized for large datasets.

---

## 4. Category Breakdown (Public Presets)

| Category | Count | Percentage |
|----------|-------|------------|
| instant_film | 16 | 23.5% |
| effects | 12 | 17.6% |
| product_photography | 7 | 10.3% |
| headshot | 7 | 10.3% |
| artistic | 5 | 7.4% |
| cinematic | 4 | 5.9% |
| fashion_lifestyle | 2 | 2.9% |
| pet_animal | 2 | 2.9% |
| wedding_events | 2 | 2.9% |
| real_estate | 2 | 2.9% |
| food_culinary | 2 | 2.9% |
| travel_landscape | 2 | 2.9% |
| product_lifestyle | 1 | 1.5% |
| corporate_portrait | 1 | 1.5% |
| linkedin_photo | 1 | 1.5% |
| ecommerce | 1 | 1.5% |
| product_studio | 1 | 1.5% |

**Top 3 Categories:**
1. Instant Film (16 presets)
2. Effects (12 presets)
3. Product Photography & Headshot (7 presets each)

---

## 5. Featured Presets

- **Total Featured:** 51 presets (75% of all presets)
- **Public & Featured:** 51 presets
- **Not Featured:** 17 presets

**Note:** Featured status is stored in the `is_featured` column but doesn't affect visibility on the `/presets` page. It may be used for special highlighting or sorting.

---

## 6. Other Relevant Filtering Fields

### Available Fields in Database

| Field | Presets with Value | Purpose |
|-------|-------------------|---------|
| `is_active` | 68/68 | Soft delete / deactivation flag |
| `generation_mode` | 68/68 | Image, Video, or Both |
| `sort_order` | 68/68 | Manual ordering |
| `category` | 68/68 | Categorization |
| `usage_count` | 68/68 | Popularity tracking |
| `likes_count` | 68/68 | User engagement |

**Current API Filters Available:**
- Category filter
- Search query (name, display_name, description)
- Sort options: popular, recent, featured, usage
- User filter (user_id)

---

## 7. Usage Statistics

| Metric | Value |
|--------|-------|
| Total Usage Count | 7 |
| Average Usage per Preset | 0.10 |
| Max Usage Count | 2 |
| Min Usage Count | 0 |

**Finding:** Presets have very low usage counts, suggesting they are either:
1. Recently created
2. Not frequently used yet
3. Usage tracking may not be fully implemented

---

## 8. Cinematic Presets Table

The API also fetches from a separate `cinematic_presets` table:

| Metric | Count |
|--------|-------|
| Total Cinematic Presets | 10 |
| Public | 10 (100%) |
| Featured | 0 (0%) |

**Integration:** The API combines presets from both tables:
- Regular presets get `preset_type: 'regular'`
- Cinematic presets get `preset_type: 'cinematic'`

**Total Combined Presets:** 68 + 10 = **78 presets** shown on `/presets` page

---

## 9. Sample Preset List (First 10)

| ID | Name | Category | Featured | Usage |
|----|------|----------|----------|-------|
| e933479b... | Fashion Editorial | fashion_lifestyle | Yes | 0 |
| 56736bb6... | Wildlife Photography | pet_animal | Yes | 0 |
| 56c19d82... | Event Photography | wedding_events | Yes | 0 |
| ee9f66e0... | Real Estate Interior | real_estate | Yes | 0 |
| 5c6e4a0a... | Architecture Exterior | real_estate | Yes | 0 |
| a934acf8... | Lifestyle Portrait | fashion_lifestyle | Yes | 0 |
| 87ab89fe... | Restaurant Food Photography | food_culinary | Yes | 0 |
| 5b07fe5a... | Recipe Photography | food_culinary | Yes | 0 |
| b2074f4a... | Pet Portrait | pet_animal | Yes | 0 |
| 595c3541... | Travel Portrait | travel_landscape | Yes | 0 |

---

## 10. API Implementation Details

### Query Flow
1. **Fetch:** Queries both `presets` and `cinematic_presets` tables in parallel
2. **Combine:** Merges results with `preset_type` identifier
3. **Filter:**
   - User filter (if specified)
   - Public filter (if no user filter)
   - Category filter
   - Search filter
4. **Sort:** By selected sort option
5. **Paginate:** Slice results based on page/limit

### Code Location
`/apps/web/app/api/presets/route.ts`

### Default Query (No Filters)
```sql
SELECT * FROM presets WHERE is_public = true
UNION
SELECT * FROM cinematic_presets WHERE is_public = true
LIMIT 20
```

---

## 11. Answers to Specific Questions

### Q1: How many total presets are owned by the admin user?
**Answer:** 78 presets total
- 68 in `presets` table
- 10 in `cinematic_presets` table

### Q2: Of those, how many have `is_public = true`?
**Answer:** All 78 presets (100%)
- All 68 regular presets are public
- All 10 cinematic presets are public

### Q3: How many meet the criteria for showing on the `/presets` page?
**Answer:** All 78 presets meet the criteria (`is_public = true`)

### Q4: Is there a limit/pagination on the query?
**Answer:** Yes
- **Default limit:** 20 presets per page
- **Configurable:** Via `?limit=N` query parameter
- **Implementation:** Client-side pagination after fetching all presets
- **Pages needed:** 4 pages (at 20 per page) for all 78 presets

---

## 12. Potential Issues & Recommendations

### Issue 1: Performance
The API fetches ALL presets from both tables before filtering and pagination. With only 78 presets this is fine, but it won't scale well.

**Recommendation:** Implement database-level pagination using SQL LIMIT/OFFSET.

### Issue 2: Low Usage Counts
Most presets have 0 usage, suggesting users aren't discovering or using them.

**Recommendation:**
- Implement better preset discovery features
- Add usage tracking validation
- Consider preset recommendations

### Issue 3: No Private Presets
All admin presets are public. This may be intentional, but worth confirming.

**Recommendation:** Verify this is the intended behavior.

### Issue 4: Featured vs Non-Featured
75% of presets are featured, which may dilute the meaning of "featured."

**Recommendation:** Be more selective with featured status to highlight truly exceptional presets.

---

## Conclusion

The admin user has **78 total presets**, all of which are **public** and will appear on the `/presets` page. The API implements **client-side pagination** with a default limit of **20 presets per page**, requiring 4 pages to show all presets. The most common categories are instant film (16), effects (12), and product photography/headshots (7 each).
