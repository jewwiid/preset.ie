# 🔧 Remove Emojis & Update Brand Colors - Action Plan

## ⚠️ Current Issue

The email templates currently contain:
- ❌ Emojis throughout (🎬, 🚀, 📍, 💰, etc.)
- ❌ Inconsistent brand colors

## ✅ Target State

- ✅ NO emojis - professional, clean design
- ✅ Consistent Preset.ie brand colors (#00876f, #0d7d72)
- ✅ Visual hierarchy through color, typography, and layout

---

## 📋 Files to Update

### Main Template File
- `docs/email-marketing/03-email-templates.md`

### Update These Sections:

1. **Design System** (Lines ~7-19)
   - Update brand colors
   - Add design principles (NO emojis)

2. **Base Template** (Lines ~21-104)
   - Update gradient colors
   - Add button variants

3. **All Email Templates** (Lines ~105+)
   - Remove ALL emojis
   - Update colors to brand palette
   - Add proper visual hierarchy

---

## 🎨 Color Replacements

### Find & Replace in Templates

| Old Color (Generic) | New Color (Preset.ie) | Usage |
|---------------------|----------------------|-------|
| `#667eea` | `#00876f` | Primary |
| `#764ba2` | `#0d7d72` | Secondary |
| Keep `#10b981` | `#10b981` | Success |
| Keep `#f59e0b` | `#f59e0b` | Warning |
| Keep `#ef4444` | `#ef4444` | Danger |

### Gradient Updates

**Old:**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**New:**
```css
background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%);
```

---

## 🚫 Emoji Removal Strategy

### Step 1: Identify All Emojis

Common emojis in current templates:
- 🎬 (welcome, gig creation)
- 🚀 (gig published)
- 📍 (location)
- 📅 (dates)
- 💰 (compensation)
- ⏰ (deadlines)
- 📊 (tips)
- 💡 (pro tips)
- ⭐ (shortlisted)
- 🎉 (congratulations)
- ✨ (success)
- 📧 (email)
- 🎨 (creative)
- 🌟 (featured)

### Step 2: Replace with Text/Color

#### Instead of Emoji in Headers:

**Bad:**
```html
<h1>Welcome to Preset! 🎬</h1>
```

**Good:**
```html
<h1 style="color: #1f2937; margin-bottom: 10px;">Welcome to Preset</h1>
<p style="color: #00876f; font-size: 18px; margin-top: 0;">Your creative collaboration starts here</p>
```

#### Instead of Emoji in Lists:

**Bad:**
```html
<p>📍 {{location}}<br>
📅 {{shootDate}}<br>
💰 {{compensationType}}</p>
```

**Good:**
```html
<table style="color: white; width: 100%;">
  <tr>
    <td style="font-weight: 600; padding: 8px 15px 8px 0;">Location:</td>
    <td style="padding: 8px 0;">{{location}}</td>
  </tr>
  <tr>
    <td style="font-weight: 600; padding: 8px 15px 8px 0;">Shoot Date:</td>
    <td style="padding: 8px 0;">{{shootDate}}</td>
  </tr>
  <tr>
    <td style="font-weight: 600; padding: 8px 15px 8px 0;">Compensation:</td>
    <td style="padding: 8px 0;">{{compensationType}}</td>
  </tr>
</table>
```

#### Instead of Emoji for Status:

**Bad:**
```html
<strong>⏰ Application Deadline:</strong> {{deadline}}
```

**Good:**
```html
<div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; border-radius: 4px;">
  <p style="margin: 0; color: #92400e;">
    <strong>Application Deadline:</strong> {{deadline}}
  </p>
</div>
```

---

## 📝 Template-by-Template Updates

### 1. Welcome Email (user.signup)

**Remove:**
- 🎬 from title
- 🚀 from "Get Started"
- 💡 from "Pro Tips"

**Replace with:**
- Colored subtitle under main heading
- Border-left accent on "Get Started" heading
- Background color box for tips

### 2. Gig Published (gig.published)

**Remove:**
- 🚀 from title
- 📍📅💰 from details
- ⏰ from deadline
- 📊 from tips heading

**Replace with:**
- "Successfully published" subtitle in success green
- Table format for gig details
- Warning box for deadline
- Background box for tips

### 3. New Application (gig.application.received)

**Remove:**
- ✅ from confirmation
- 📧 from notification

**Replace with:**
- Success-colored subtitle
- Info box with border accent

### 4. Application Submitted (application.submitted)

**Remove:**
- 🎬 from title
- ✅ from "Application Details"
- ⏰ from timeline

**Replace with:**
- Gradient box for details
- Warning box for timeline

### 5. Booking Confirmation (application.accepted)

**Remove:**
- 🎉 from title
- 🎬📅📍💰 from details
- ⚡ from golden hour
- 🛡️ from safety

**Replace with:**
- Success gradient background
- Table for booking details
- Info boxes for additional info

### 6. Subscription Upgraded (subscription.upgraded)

**Remove:**
- 🚀 from title
- ✨ from features
- 🎯 from tips
- 📊 from billing

**Replace with:**
- Gradient highlight box
- Styled feature cards
- Background box for billing

### 7. Credit Purchase (credits.purchased)

**Remove:**
- 💳 from title
- 💡 from "What You Can Do"
- 🧾 from receipt

**Replace with:**
- Success-colored large credit display
- Background box for balance
- Styled receipt section

### 8. Review Request (review.requested)

**Remove:**
- ⭐ from title and rating
- 📝 from "What to Include"

**Replace with:**
- Star symbols as text "★" in buttons
- Background box for criteria

### 9. Inactive User (user.inactive.7days)

**Remove:**
- 👋 from title
- 🔥 from "What's New"

**Replace with:**
- Welcoming subtitle
- Styled cards for updates

---

## 🛠️ Implementation Steps

### Option 1: Manual Update (Recommended for Quality)

1. Open `docs/email-marketing/03-email-templates.md`
2. Update Design System section (lines 7-19)
3. Update Base Template (lines 21-104)
4. Go through each template (starting line 105)
5. Remove ALL emojis
6. Replace with styled HTML using brand colors
7. Test in email client

### Option 2: Automated Find/Replace

```bash
# In docs/email-marketing/03-email-templates.md

# 1. Update gradients
Find: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Replace: linear-gradient(135deg, #00876f 0%, #0d7d72 100%)

# 2. Update primary color
Find: color: #667eea
Replace: color: #00876f

Find: background: #667eea
Replace: background: #00876f

Find: border-color: #667eea
Replace: border-color: #00876f

# 3. Then manually remove each emoji and add proper styling
```

### Option 3: Use EMAIL-DESIGN-GUIDE.md

1. Reference `docs/email-marketing/EMAIL-DESIGN-GUIDE.md`
2. Copy component patterns from the guide
3. Rebuild each template section
4. Ensure consistency across all emails

---

## ✅ Quality Checklist

After updating each template:

- [ ] NO emojis present
- [ ] Brand colors correct (#00876f, #0d7d72)
- [ ] Visual hierarchy clear (headings, colors, spacing)
- [ ] CTAs use gradient buttons
- [ ] Info boxes have proper background colors
- [ ] Tables used for structured data (not emoji lists)
- [ ] Mobile-responsive (max-width: 600px)
- [ ] Professional tone maintained
- [ ] All variables ({{name}}, {{url}}, etc.) preserved

---

## 📊 Testing After Updates

### 1. Visual Test
- View in browser (HTML preview)
- Check all colors render correctly
- Verify spacing and alignment

### 2. Email Client Test
- Test in Gmail
- Test in Outlook
- Test in Apple Mail
- Check mobile rendering

### 3. Content Test
- Verify all merge tags work
- Check variable replacement
- Test with sample data

---

## 🚀 Quick Start Commands

```bash
# 1. Open the templates file
open docs/email-marketing/03-email-templates.md

# 2. Open the design guide for reference
open docs/email-marketing/EMAIL-DESIGN-GUIDE.md

# 3. Start updating templates, section by section

# 4. Test with Plunk after each template update
```

---

## 📋 Priority Order

**Week 1 - Critical Templates (No Emojis):**
1. Welcome Email (user.signup)
2. Gig Published (gig.published)
3. Application Submitted (application.submitted)
4. Booking Confirmation (application.accepted)

**Week 2 - Engagement Templates:**
5. New Application Received
6. Application Status Updates
7. Review Requests

**Week 3 - Monetization Templates:**
8. Subscription emails
9. Credit purchase confirmations
10. Payment reminders

**Week 4 - Retention Templates:**
11. Inactive user re-engagement
12. Milestone celebrations
13. Weekly reports

---

## 🎯 Success Criteria

✅ All templates updated when:
- Zero emojis in any email
- All colors match brand palette
- Visual hierarchy clear without emojis
- Professional, clean design
- Mobile-responsive
- Tested across email clients

---

**Remember: Professional emails don't need emojis. Use color, typography, and layout for visual impact!** 💪 (except this one 😄)

