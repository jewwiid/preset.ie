# Platform Images Folder Structure Guide

**Last Updated**: October 12, 2025  
**Bucket**: `platform-images`

---

## 📁 Folder Organization

All platform images are now organized in folders within the `platform-images` bucket for better management and clarity.

### Folder Structure

```
platform-images/
├── page-headers/
│   ├── hero/                    # Hero section backgrounds
│   ├── talent-for-hire/         # Talent For Hire section headers
│   ├── contributors/            # Contributors section headers
│   └── creative-roles/          # Creative Roles section headers
├── roles/                       # Individual role card images
│   ├── photographers/
│   ├── models/
│   ├── actors/
│   └── ... (one folder per role)
└── general/                     # Miscellaneous images
```

---

## 🎯 How It Works

### Automatic Folder Assignment

When you upload an image through the Admin Platform Images page, it automatically saves to the correct folder based on:

1. **`image_type`** - The primary type selector
2. **`category`** - The category/subcategory

### Folder Mapping

| Image Type | Category | Folder Path | Purpose |
|------------|----------|-------------|---------|
| `hero` | `hero` | `page-headers/hero/` | Main hero rotating backgrounds |
| `talent-for-hire` | `talent-for-hire` | `page-headers/talent-for-hire/` | Talent section header |
| `contributors` | `contributors` | `page-headers/contributors/` | Contributors section header |
| `creative-roles` | `creative-roles` | `page-headers/creative-roles/` | Creative Roles section header |
| `role` | `role-photographers` | `roles/` | Role card images |
| `role` | `role-actors` | `roles/` | Role card images |
| (custom) | (custom category) | `{category}/` | Custom categories |
| (none) | (none) | `general/` | General purpose images |

---

## 📤 Uploading Images

### Via Admin Interface

1. Go to **Admin → Platform Images**
2. Click **"Quick Upload"** for any section (Hero, Talent For Hire, etc.)
   - The `image_type` and `category` are pre-filled
   - Upload automatically saves to correct folder
3. Or click **"Add New Image"** and manually set:
   - **Image Type**: `hero`, `role`, `talent-for-hire`, etc.
   - **Category**: Specific subcategory or leave blank

### Example: Uploading a Hero Background

```
Image Type: hero
Category: hero
File: my-hero-image.jpg

→ Saves to: platform-images/page-headers/hero/platform-image-{timestamp}-{random}.jpg
```

### Example: Uploading a Role Card Image

```
Image Type: role
Category: role-photographers
File: photographer-card.jpg

→ Saves to: platform-images/roles/platform-image-{timestamp}-{random}.jpg
```

---

## 🗂️ Benefits of Folder Structure

✅ **Organization**: Easy to find images by purpose  
✅ **Scalability**: Can handle thousands of images  
✅ **Backup**: Easier to backup/restore specific categories  
✅ **Performance**: Faster listing when browsing specific folders  
✅ **Clarity**: Clear separation between page headers, roles, and general images

---

## 📋 Current Categories

### Page Headers
- `/page-headers/hero/` - Hero section backgrounds
- `/page-headers/talent-for-hire/` - Talent For Hire section
- `/page-headers/contributors/` - Contributors section
- `/page-headers/creative-roles/` - Creative Roles section

### Role Images
- `/roles/` - All role card images (photographers, actors, models, etc.)

### General
- `/general/` - Miscellaneous platform images

---

## 🔧 Managing Files

### View All Images in a Folder

Use Supabase Storage Browser:
1. Go to **Storage → platform-images**
2. Navigate to folder (e.g., `page-headers/hero/`)
3. See all images in that category

### Move Existing Images to Folders

If you have images in the root that need to be organized:

```sql
-- Update database records with new paths
UPDATE platform_images 
SET image_url = REPLACE(image_url, '/platform-images/', '/platform-images/page-headers/hero/')
WHERE image_type = 'hero';
```

Then move files in Supabase Storage Browser or use the Storage API.

---

## 🎨 Image Type Reference

### Valid Image Types

Based on your `platform_images` table constraint:
- `homepage` - General homepage images
- `preset_visual_aid` - Visual aids for presets
- `category_icon` - Category icons
- `marketing` - Marketing materials
- `feature_showcase` - Feature showcases

### Extended Types (used in practice)
- `hero` - Hero section backgrounds
- `role` - Role card images
- `talent-for-hire` - Talent section
- `contributors` - Contributors section
- `creative-roles` - Creative roles section

---

## 📊 Storage Best Practices

### Naming Convention
```
{folder-path}/platform-image-{timestamp}-{random-id}.{ext}

Examples:
page-headers/hero/platform-image-1728858000-abc123def.jpg
roles/platform-image-1728858100-xyz789ghi.webp
general/platform-image-1728858200-mno456pqr.png
```

### File Specs
- **Max Size**: 10MB
- **Formats**: JPEG, PNG, WebP, GIF
- **Recommended**: WebP for best performance
- **Dimensions**: Varies by usage (1920x1080 for headers, 800x1000 for roles)

---

## 🚀 Quick Reference

### Upload Page Header Background
1. Admin → Platform Images
2. Find section (e.g., "Hero Background", "Talent For Hire Cover")
3. Click "Quick Upload"
4. Select image
5. Upload → Automatically saves to `page-headers/{section}/`

### Upload Role Card Image  
1. Admin → Platform Images
2. Scroll to "Role Images"
3. Click role card (e.g., "Photographers")
4. Click "Quick Upload"
5. Select image
6. Upload → Automatically saves to `roles/`

---

## 🔍 Troubleshooting

**Q: Where did my image go?**  
A: Check the console logs for "📁 Uploading to folder" to see exact path

**Q: Can I change the folder after upload?**  
A: Yes, but you need to:
1. Move file in Supabase Storage
2. Update `image_url` in database record

**Q: What if I want a custom folder?**  
A: Set `category` to your custom folder name (e.g., `my-custom-category`)

---

**Updated Code**:
- ✅ `apps/web/app/api/upload/platform-image/route.ts` - Auto folder detection
- ✅ `apps/web/app/admin/platform-images/page.tsx` - Passes metadata to API

**Result**: Clean, organized folder structure in `platform-images` bucket! 🎉

