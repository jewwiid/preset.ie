# 🎨 Email Branding Guidelines - Presetie.com

Official brand guidelines for all email communications.

---

## 🏷️ Brand Identity

### Official Brand Name
✅ **CORRECT:**
- **Presetie.com** (full)
- **Preset** (short form)

❌ **INCORRECT:**
- ~~preset.ie~~
- ~~Preset.ie~~
- ~~PRESET~~
- ~~preset~~

### Website
- Primary: **https://presetie.com**
- Alternative: https://preset.ie (redirects to .com)

### Tagline
**"Creative Collaboration Platform"** or **"Where Creatives Connect"**

---

## 🎨 Color Palette

### Primary Brand Color
```css
/* Teal/Green - Main brand identity */
#00876f  /* Primary */
#0d7d72  /* Hover/Dark */
#15706b  /* Active */
#ccfbef  /* Light tint */
#f0fdf9  /* Lightest tint */
```

**RGB:** `rgb(0, 135, 111)`  
**HSL:** `hsl(172, 100%, 26%)`  
**Usage:** Buttons, headers, links, accents

### Accent Color
```css
/* Amber/Orange - Secondary actions */
#f59e0b  /* Accent */
```

**Usage:** Secondary buttons, highlights, notifications

### Neutral Colors
```css
/* Text */
#0f172a  /* Primary text (dark slate) */
#475569  /* Secondary text */
#64748b  /* Muted text */

/* Background */
#ffffff  /* White */
#fafdfc  /* Very light teal tint */
#f5fbf9  /* Light teal tint */

/* Borders */
#e2e8f0  /* Light border */
#cbd5e1  /* Medium border */
```

### Status Colors
```css
/* Success */
#00876f  /* Same as primary */

/* Warning */
#f59e0b  /* Amber */

/* Error/Danger */
#ef4444  /* Red */

/* Info */
#a855f7  /* Purple */
```

---

## 📝 Typography

### Fonts
```css
/* Headings */
font-family: 'Bloc W01 Regular', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
letter-spacing: -0.025em;

/* Body Text */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif;
```

### Font Sizes
```css
/* Email-specific sizes (slightly smaller for readability) */
h1: 28px;  /* Main heading */
h2: 22px;  /* Section heading */
h3: 18px;  /* Subsection */
p:  16px;  /* Body text */
small: 14px;  /* Footer, metadata */
tiny: 12px;   /* Legal, fine print */
```

### Font Weights
```css
Regular: 400  /* Body text */
Medium: 500   /* Links, emphasis */
Semibold: 600 /* Headings, buttons */
Bold: 700     /* Strong emphasis */
```

---

## 🖼️ Logo Usage

### Text Logo (Recommended for Email)
```html
<a href="https://presetie.com" style="
  color: #ffffff;
  font-size: 32px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: -0.025em;
">Preset</a>
```

### Image Logo (If hosted)
```html
<img 
  src="https://presetie.com/logo.svg" 
  alt="Preset" 
  width="40" 
  height="40"
  style="display: block; margin: 0 auto;"
>
```

### Logo + Text Combination
```html
<div style="text-align: center;">
  <img src="https://presetie.com/logo.svg" alt="" width="40" height="40" style="vertical-align: middle;">
  <span style="color: #ffffff; font-size: 32px; font-weight: 600; margin-left: 10px; vertical-align: middle;">Preset</span>
</div>
```

---

## 🎨 Component Styles

### Primary Button
```html
<a href="{{url}}" style="
  display: inline-block;
  padding: 14px 28px;
  background: #00876f;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
">Button Text</a>
```

### Secondary Button
```html
<a href="{{url}}" style="
  display: inline-block;
  padding: 14px 28px;
  background: #ffffff;
  color: #00876f;
  text-decoration: none;
  border-radius: 8px;
  border: 2px solid #00876f;
  font-weight: 600;
">Button Text</a>
```

### Accent Button
```html
<a href="{{url}}" style="
  display: inline-block;
  padding: 14px 28px;
  background: #f59e0b;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
">Secondary Action</a>
```

### Branded Section/Card
```html
<div style="
  background: #00876f;
  padding: 30px;
  border-radius: 12px;
  color: #ffffff;
  margin: 30px 0;
">
  <h2 style="color: #ffffff; margin: 0 0 15px 0;">Heading</h2>
  <p style="color: #ccfbef; margin: 0;">Content in light teal</p>
</div>
```

### Info Box (Success)
```html
<div style="
  background: #ccfbef;
  border-left: 4px solid #00876f;
  padding: 20px;
  border-radius: 4px;
  margin: 20px 0;
">
  <p style="color: #0f172a; margin: 0;">Success message</p>
</div>
```

### Info Box (Warning)
```html
<div style="
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 20px;
  border-radius: 4px;
  margin: 20px 0;
">
  <p style="color: #92400e; margin: 0;">Warning message</p>
</div>
```

### Badge
```html
<span style="
  display: inline-block;
  padding: 6px 12px;
  background: #00876f;
  color: #ffffff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
">Badge Text</span>
```

---

## 📐 Spacing & Layout

### Container Widths
```css
Email container: 600px max-width
Content padding: 40px (desktop), 30px (mobile)
Section margins: 30px vertical spacing
```

### Border Radius
```css
Cards: 12px
Buttons: 8px
Badges: 12px
Small elements: 4px
```

### Padding Standards
```css
Large sections: 40px
Medium sections: 30px
Small sections: 20px
Compact: 15px
Minimal: 10px
```

---

## 📱 Responsive Design

### Breakpoints
```css
@media only screen and (max-width: 600px) {
  /* Mobile optimizations */
  .content { padding: 30px 20px !important; }
  h1 { font-size: 24px !important; }
  .button { display: block; width: 100%; }
}
```

### Mobile Best Practices
- Stack elements vertically
- Full-width buttons
- Larger font sizes (min 16px)
- Touch-friendly targets (min 44px)
- Reduced padding

---

## ✉️ Email Structure

### Standard Layout
```
┌─────────────────────────────┐
│ Header (Teal #00876f)      │
│ - Logo: "Preset"            │
│ - Tagline                   │
├─────────────────────────────┤
│ Content (White)             │
│ - Headline                  │
│ - Body text                 │
│ - CTA button                │
│ - Supporting info           │
├─────────────────────────────┤
│ Footer (Light teal tint)    │
│ - Branding                  │
│ - Links                     │
│ - Unsubscribe               │
└─────────────────────────────┘
```

---

## 🎯 Brand Voice & Tone

### Voice Characteristics
- **Friendly:** Approachable and warm
- **Professional:** Trustworthy and credible
- **Creative:** Visual and inspiring
- **Supportive:** Helpful and encouraging

### Writing Style
```
✅ DO:
- Use conversational tone
- Be encouraging and positive
- Use emojis sparingly (🎬 🎨 📸 ✨)
- Keep it concise and scannable
- Focus on user benefits

❌ DON'T:
- Use corporate jargon
- Be overly formal
- Overuse exclamation marks!!!
- Write long paragraphs
- Be pushy or salesy
```

### Example Phrases
```
✅ Good:
- "Your gig is now live! 🚀"
- "Let's get you started"
- "Happy creating!"
- "We're here to help"

❌ Avoid:
- "Your listing has been successfully activated"
- "Please proceed to configure your account"
- "Utilize our platform features"
```

---

## 📋 Email Checklist

Before sending any email:
- [ ] Brand name is "Presetie.com" or "Preset"
- [ ] Primary color is #00876f (teal)
- [ ] Logo/header uses brand colors
- [ ] All links go to https://presetie.com
- [ ] Footer has correct branding
- [ ] Unsubscribe link present
- [ ] Mobile responsive
- [ ] Tested in major email clients
- [ ] Brand voice consistent
- [ ] No typos or errors

---

## 🖼️ Visual Examples

### Header Examples
```html
<!-- Simple Text -->
<div style="background: #00876f; padding: 40px; text-align: center;">
  <a href="https://presetie.com" style="color: #ffffff; font-size: 32px; font-weight: 600; text-decoration: none;">
    Preset
  </a>
  <p style="color: #ccfbef; margin: 5px 0 0 0; font-size: 14px;">
    Creative Collaboration Platform
  </p>
</div>

<!-- With Logo Image -->
<div style="background: #00876f; padding: 40px; text-align: center;">
  <img src="https://presetie.com/logo.svg" alt="Preset" width="40" height="40">
  <div style="color: #ffffff; font-size: 32px; font-weight: 600; margin-top: 10px;">
    Preset
  </div>
</div>
```

### Footer Example
```html
<div style="background: #fafdfc; padding: 30px; text-align: center; color: #475569; font-size: 14px; border-top: 1px solid #e2e8f0;">
  <p><strong>Presetie.com</strong> - Where Creatives Connect</p>
  <p>
    <a href="https://presetie.com/preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | 
    <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a>
  </p>
  <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
    © 2025 Presetie.com. All rights reserved.<br>
    Dublin, Ireland
  </p>
</div>
```

---

## 🚀 Using the Templates

### In Plunk Dashboard
1. Copy HTML from `/templates/` folder
2. Replace `{{variables}}` with Plunk merge tags: `{{data.variable}}`
3. Preview & test
4. Save template

### In Code
1. Import the template
2. Replace variables with actual values
3. Send via PlunkService
4. Track the event

---

## 📊 Brand Consistency Score

Check each email:
- **Colors:** All #00876f? ✓
- **Name:** Always "Presetie.com"? ✓
- **Links:** All to presetie.com? ✓
- **Voice:** Friendly & professional? ✓
- **CTA:** Clear & branded? ✓

**Target Score:** 100% brand consistency across all emails

---

## 🔗 Resources

- **Logo File:** `/apps/web/public/logo.svg`
- **Color Tokens:** `/packages/tokens/src/colors.ts`
- **Templates:** `/docs/email-marketing/templates/`
- **Brand Kit:** `/brandkit/` (if available)

---

**All emails should be instantly recognizable as Presetie.com! 🎨**

