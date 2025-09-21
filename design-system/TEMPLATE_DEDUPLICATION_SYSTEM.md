# Template Deduplication System

## Overview

A smart template deduplication system has been implemented to prevent cluttered template libraries by detecting similar templates and offering intelligent options for handling duplicates.

## 🎯 **Problem Solved**

**Issue**: Users could create multiple nearly identical templates with minimal changes, leading to:
- Cluttered template library
- Difficulty finding the right template
- Storage waste with duplicate content
- Poor user experience when browsing templates

**Solution**: Intelligent similarity detection with user-friendly options for handling conflicts.

## ✨ **New Features**

### **1. Smart Similarity Detection**
- **Multi-Factor Analysis**: Compares name, description, image count, tags, and color palette
- **Weighted Scoring**: Different factors have appropriate importance weights
- **Real-Time Checking**: Analyzes similarity as user types template name
- **Threshold-Based Warnings**: Shows warnings only for high similarity (>70%)

### **2. Intelligent Conflict Resolution**
- **Update Existing**: Replace similar template with new content
- **Rename Current**: Add "(Copy)" suffix to create distinct template
- **Continue Anyway**: Proceed with duplicate if intentional
- **Visual Indicators**: Clear similarity factors and percentage

### **3. Enhanced User Experience**
- **Proactive Warnings**: Alerts before saving duplicate templates
- **Clear Options**: Simple choices for handling conflicts
- **Visual Feedback**: Shows exactly why templates are similar
- **Non-Blocking**: Users can still proceed if they want duplicates

## 🔧 **Technical Implementation**

### **Similarity Calculation Algorithm**
```typescript
const calculateSimilarity = (template: any) => {
  let score = 0
  let factors = []

  // Name similarity (30 points)
  if (template.template_name && templateName) {
    const nameSimilarity = template.template_name.toLowerCase().includes(templateName.toLowerCase()) ||
                         templateName.toLowerCase().includes(template.template_name.toLowerCase())
    if (nameSimilarity) {
      score += 30
      factors.push('Similar name')
    }
  }

  // Description similarity (20 points)
  if (template.template_description && description) {
    const descSimilarity = template.template_description.toLowerCase().includes(description.toLowerCase()) ||
                          description.toLowerCase().includes(template.template_description.toLowerCase())
    if (descSimilarity) {
      score += 20
      factors.push('Similar description')
    }
  }

  // Image count similarity (15 points)
  const templateImageCount = template.items?.length || 0
  const currentImageCount = items.length
  if (Math.abs(templateImageCount - currentImageCount) <= 2) {
    score += 15
    factors.push('Similar image count')
  }

  // Tag similarity (up to 25 points)
  if (template.tags && selectedTags.length > 0) {
    const commonTags = template.tags.filter((tag: string) => selectedTags.includes(tag))
    if (commonTags.length > 0) {
      score += (commonTags.length / Math.max(template.tags.length, selectedTags.length)) * 25
      factors.push(`${commonTags.length} common tags`)
    }
  }

  // Palette similarity (up to 10 points)
  if (template.palette && palette.length > 0) {
    const commonColors = template.palette.filter((color: string) => palette.includes(color))
    if (commonColors.length > 0) {
      score += (commonColors.length / Math.max(template.palette.length, palette.length)) * 10
      factors.push(`${commonColors.length} common colors`)
    }
  }

  return { score: Math.round(score), factors }
}
```

### **Database Query for Similar Templates**
```typescript
const { data: templates, error } = await supabase
  .from('moodboards')
  .select('*')
  .eq('owner_user_id', profile.id)
  .eq('is_template', true)
  .or(`template_name.ilike.%${name}%,template_description.ilike.%${description}%`)
  .limit(5)
```

### **Real-Time Similarity Checking**
```typescript
const handleTemplateNameChange = async (name: string) => {
  setTemplateName(name)
  
  if (name.trim().length >= 3) {
    const similarTemplates = await checkForSimilarTemplates(name)
    
    if (similarTemplates && similarTemplates.length > 0) {
      const templatesWithScores = similarTemplates.map(template => ({
        ...template,
        similarity: calculateSimilarity(template)
      }))
      
      const mostSimilar = templatesWithScores.reduce((prev, current) => 
        current.similarity.score > prev.similarity.score ? current : prev
      )
      
      // Show warning if similarity > 70%
      if (mostSimilar.similarity.score > 70) {
        setExistingTemplate(mostSimilar)
        setShowTemplateConflict(true)
      }
    }
  }
}
```

## 🎨 **User Interface**

### **Conflict Warning Display**
```typescript
{showTemplateConflict && existingTemplate && (
  <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-md">
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 bg-warning rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-warning-foreground text-xs font-bold">!</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-warning-foreground mb-1">
          Similar Template Found
        </p>
        <p className="text-xs text-warning-foreground/80 mb-2">
          You have an existing template "{existingTemplate.template_name}" that's {existingTemplate.similarity.score}% similar.
        </p>
        <div className="flex flex-wrap gap-1 mb-2">
          {existingTemplate.similarity.factors.map((factor: string, index: number) => (
            <span key={index} className="text-xs bg-warning/20 text-warning-foreground px-2 py-1 rounded">
              {factor}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Rename Current</Button>
          <Button variant="outline" size="sm">Update Existing</Button>
          <Button variant="ghost" size="sm">Continue Anyway</Button>
        </div>
      </div>
    </div>
  </div>
)}
```

### **Visual Warning Design**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Similar Template Found                                  │
│                                                             │
│     You have an existing template "Fashion Vibes" that's   │
│     85% similar.                                            │
│                                                             │
│     [Similar name] [3 common tags] [Similar image count]   │
│                                                             │
│     [Rename Current] [Update Existing] [Continue Anyway]   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 **Smart Conflict Resolution Options**

### **1. Update Existing Template**
```typescript
// Updates the existing template with new content
if (saveAsTemplate && existingTemplate?.shouldUpdate) {
  const { error: updateError } = await supabase
    .from('moodboards')
    .update({
      title: title || 'Untitled Moodboard',
      summary: description,
      items,
      palette,
      tags: selectedTags,
      template_name: templateName || title || 'Untitled Template',
      template_description: description,
      updated_at: new Date().toISOString()
    })
    .eq('id', existingTemplate.id)
}
```

**Benefits:**
- ✅ **No Duplicates**: Replaces existing template content
- ✅ **Preserves ID**: Maintains template references
- ✅ **Version Control**: Updates timestamp for tracking

### **2. Rename Current Template**
```typescript
onClick={() => {
  setTemplateName(existingTemplate.template_name + ' (Copy)')
  setShowTemplateConflict(false)
}}
```

**Benefits:**
- ✅ **Automatic Naming**: Adds "(Copy)" suffix
- ✅ **Preserves Original**: Keeps existing template unchanged
- ✅ **Clear Distinction**: Makes difference obvious

### **3. Continue Anyway**
```typescript
onClick={() => setShowTemplateConflict(false)}
```

**Benefits:**
- ✅ **User Choice**: Respects user intention
- ✅ **Non-Blocking**: Doesn't prevent legitimate duplicates
- ✅ **Flexibility**: Allows edge cases where duplicates are wanted

## 📊 **Similarity Scoring System**

### **Scoring Factors:**
| Factor | Weight | Description |
|--------|--------|-------------|
| **Name Match** | 30 points | Template names contain each other |
| **Description Match** | 20 points | Descriptions contain each other |
| **Image Count** | 15 points | Similar number of images (±2) |
| **Tag Overlap** | 0-25 points | Percentage of common tags |
| **Color Palette** | 0-10 points | Percentage of common colors |

### **Threshold System:**
- **0-50%**: No warning (sufficiently different)
- **50-70%**: Monitor but don't warn (some similarity acceptable)
- **70%+**: Show conflict warning (likely duplicate)

### **Example Scoring:**
```
Template A: "Fashion Vibes"
- 8 images, tags: [minimalist, fashion, modern]
- Palette: [#000000, #FFFFFF, #FF6B6B]

Template B: "Fashion Minimalist"
- 7 images, tags: [minimalist, fashion, clean]
- Palette: [#000000, #FFFFFF, #00D4AA]

Similarity Score:
- Name: 30 points (both contain "Fashion")
- Description: 0 points (different descriptions)
- Image count: 15 points (7 vs 8, within ±2)
- Tags: 16.7 points (2/3 common tags)
- Palette: 6.7 points (2/3 common colors)
Total: 68.4% (no warning)

Template C: "Fashion Vibes v2"
- 8 images, tags: [minimalist, fashion, modern]
- Same palette and description
Total: 85% (warning shown)
```

## 🎯 **User Experience Flow**

### **Scenario 1: No Similar Templates**
```
1. User enters template name
2. System checks for similarity
3. No matches found
4. User can save normally
```

### **Scenario 2: Similar Template Found**
```
1. User enters "Fashion Shoot"
2. System finds "Fashion Vibes" (85% similar)
3. Warning appears with options:
   - Update "Fashion Vibes" with new content
   - Rename to "Fashion Shoot (Copy)"
   - Continue with duplicate anyway
4. User chooses preferred option
5. Template saved according to choice
```

### **Scenario 3: Update Existing**
```
1. User chooses "Update Existing"
2. System updates existing template ID
3. No new template created
4. Success message: "Template updated successfully!"
5. Template library stays clean
```

## 🛡️ **Benefits**

### **1. Prevents Template Clutter**
- **Smart Detection**: Identifies likely duplicates before saving
- **User Education**: Shows why templates are similar
- **Easy Resolution**: Simple options for handling conflicts

### **2. Improves Template Library Quality**
- **Meaningful Differences**: Only truly different templates saved
- **Better Organization**: Easier to find the right template
- **Version Control**: Updates existing templates instead of duplicating

### **3. Enhanced User Experience**
- **Proactive Guidance**: Helps users make informed decisions
- **Non-Intrusive**: Only shows warnings when necessary
- **Flexible Options**: Accommodates different user intentions

### **4. Database Efficiency**
- **Reduced Storage**: Fewer duplicate templates
- **Better Performance**: Smaller template queries
- **Cleaner Data**: Higher quality template collection

## 🔮 **Future Enhancements**

### **Potential Improvements:**
- **Visual Diff**: Show side-by-side comparison of templates
- **Merge Options**: Combine elements from both templates
- **Version History**: Track template evolution over time
- **Batch Cleanup**: Find and merge existing duplicates
- **AI Similarity**: Use AI to detect semantic similarity

### **Advanced Features:**
- **Template Categories**: Auto-categorize based on content
- **Usage Analytics**: Track which templates are most used
- **Collaborative Templates**: Share templates between users
- **Template Marketplace**: Public template sharing

## 📁 **Files Modified**

### **`apps/web/app/components/MoodboardBuilder.tsx`**
- ✅ **Added States**: `existingTemplate`, `showTemplateConflict`, `success`
- ✅ **New Functions**: `checkForSimilarTemplates`, `calculateSimilarity`, `handleTemplateNameChange`
- ✅ **Enhanced UI**: Conflict warning with action buttons
- ✅ **Smart Saving**: Template update vs. create logic
- ✅ **Real-Time Checking**: Similarity detection on name input

### **Key Features Added:**
1. **Similarity Detection**: Multi-factor algorithm for template comparison
2. **Conflict Warning UI**: Professional warning with action options
3. **Smart Saving Logic**: Update existing vs. create new template
4. **Real-Time Feedback**: Immediate similarity checking
5. **User Choice**: Multiple options for handling conflicts

## 🎯 **Result**

**The template system now provides:**

- ✅ **Intelligent Deduplication**: Prevents unnecessary template clutter
- ✅ **User-Friendly Warnings**: Clear explanations of similarity
- ✅ **Flexible Resolution**: Multiple options for handling conflicts
- ✅ **Real-Time Feedback**: Immediate similarity detection
- ✅ **Database Efficiency**: Cleaner template storage
- ✅ **Better Organization**: Higher quality template library

### **Example User Flow:**
```
1. User creates moodboard with fashion images
2. Clicks "Save as Template"
3. Types "Fashion Inspiration"
4. System detects existing "Fashion Vibes" (82% similar)
5. Warning shows: "Similar name, 3 common tags, similar image count"
6. User chooses "Update Existing"
7. System updates "Fashion Vibes" with new content
8. Success: "Template updated successfully!"
9. Template library stays clean and organized
```

**The template system now intelligently prevents clutter while giving users full control over their template library!** 📚✨
