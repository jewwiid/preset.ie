# Email Design Guide - Preset.ie

**NO EMOJIS. Professional, clean, brand-focused design.**

---

## 🎨 Brand Colors

### Official Preset.ie Color Palette

```css
/* Primary Brand Colors */
--primary: #00876f;           /* Teal - Primary buttons, links, headers */
--primary-hover: #006d5a;     /* Darker teal for hover states */
--secondary: #0d7d72;         /* Teal accent - Gradients, secondary elements */

/* Status Colors */
--success: #10b981;           /* Green - Success messages, confirmations */
--warning: #f59e0b;           /* Amber - Warnings, alerts, deadlines */
--danger: #ef4444;            /* Red - Errors, critical actions */
--info: #3b82f6;              /* Blue - Information, tips */

/* Text Colors */
--text-primary: #1f2937;      /* Dark gray - Body text, headings */
--text-secondary: #4b5563;    /* Medium gray - Secondary text */
--text-muted: #6b7280;        /* Light gray - Muted text, captions */

/* Background Colors */
--bg-white: #ffffff;          /* White - Email body */
--bg-gray-50: #f9fafb;        /* Very light gray - Sections, cards */
--bg-gray-100: #f3f4f6;       /* Light gray - Subtle backgrounds */
--bg-dark: #111827;           /* Dark - Footer, dark sections */

/* Border Colors */
--border-gray: #e5e7eb;       /* Gray - Borders, dividers */
--border-light: #f3f4f6;      /* Light gray - Subtle borders */

/* Brand Gradient (Primary) */
--gradient-primary: linear-gradient(135deg, #00876f 0%, #0d7d72 100%);

/* Success Gradient */
--gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
```

---

## 🎨 Button Styles

### Primary Button (Main CTAs)

```html
<a href="{{url}}" style="
  display: inline-block;
  padding: 16px 32px;
  background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%);
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
">
  {{buttonText}}
</a>
```

**Use for:**
- Primary actions (Complete Profile, View Gig, Apply Now)
- Important confirmations
- Next step prompts

---

### Secondary Button (Alternative CTAs)

```html
<a href="{{url}}" style="
  display: inline-block;
  padding: 16px 32px;
  background: #ffffff;
  color: #00876f;
  text-decoration: none;
  border: 2px solid #00876f;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
">
  {{buttonText}}
</a>
```

**Use for:**
- Secondary actions (Learn More, View Profile)
- Less critical CTAs
- Alternative options

---

### Success Button (Positive Actions)

```html
<a href="{{url}}" style="
  display: inline-block;
  padding: 16px 32px;
  background: #10b981;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
">
  {{buttonText}}
</a>
```

**Use for:**
- Approvals (Accept Application, Approve Showcase)
- Confirmations
- Positive completions

---

### Text Link (Minimal CTA)

```html
<a href="{{url}}" style="
  color: #00876f;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid #00876f;
  padding-bottom: 2px;
">
  {{linkText}}
</a>
```

**Use for:**
- Inline links
- Less prominent actions
- "Learn more" links

---

## 📐 Layout Components

### Header Section (Brand Gradient)

```html
<div style="
  background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%);
  padding: 40px 30px;
  text-align: center;
">
  <a href="https://presetie.com" style="
    color: #ffffff;
    font-size: 28px;
    font-weight: bold;
    text-decoration: none;
    letter-spacing: -0.5px;
  ">Preset</a>
</div>
```

---

### Highlighted Card (Important Info)

```html
<div style="
  background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%);
  padding: 30px;
  border-radius: 12px;
  color: white;
  margin: 30px 0;
">
  <h2 style="margin: 0 0 15px 0; color: white; font-size: 24px;">
    {{title}}
  </h2>
  <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
    {{content}}
  </div>
</div>
```

**Use for:**
- Gig details
- Booking confirmations
- Important summaries

---

### Info Box (Subtle Background)

```html
<div style="
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
">
  <h4 style="margin-top: 0; color: #1f2937;">{{title}}</h4>
  <p style="margin-bottom: 0; color: #4b5563;">{{content}}</p>
</div>
```

**Use for:**
- Tips and suggestions
- Additional information
- Lists of benefits

---

### Warning/Alert Box

```html
<div style="
  background: #fef3c7;
  padding: 20px;
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
  margin: 20px 0;
">
  <p style="margin: 0; color: #92400e;">
    <strong>{{title}}</strong><br>
    {{message}}
  </p>
</div>
```

**Use for:**
- Deadlines
- Important reminders
- Time-sensitive information

---

### Success Box

```html
<div style="
  background: #ecfdf5;
  padding: 20px;
  border-left: 4px solid #10b981;
  border-radius: 4px;
  margin: 20px 0;
">
  <p style="margin: 0; color: #065f46;">
    <strong>{{title}}</strong><br>
    {{message}}
  </p>
</div>
```

**Use for:**
- Confirmations
- Success messages
- Positive updates

---

## 📝 Typography

### Headings

```html
<!-- H1 - Main title -->
<h1 style="
  color: #1f2937;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 10px 0;
">
  {{title}}
</h1>

<!-- H2 - Section title -->
<h2 style="
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  margin: 30px 0 15px 0;
">
  {{section}}
</h2>

<!-- H3 - Subsection with accent -->
<h3 style="
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
  border-left: 4px solid #00876f;
  padding-left: 15px;
  margin: 30px 0 15px 0;
">
  {{subsection}}
</h3>
```

### Body Text

```html
<!-- Regular paragraph -->
<p style="
  color: #4b5563;
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 15px 0;
">
  {{text}}
</p>

<!-- Subtitle / lead -->
<p style="
  color: #00876f;
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 20px 0;
">
  {{subtitle}}
</p>

<!-- Muted / helper text -->
<p style="
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin: 10px 0;
">
  {{helperText}}
</p>
```

---

## 🚫 What NOT to Use

### ❌ NO Emojis
```html
<!-- BAD -->
<h1>Welcome to Preset! 🎬</h1>
<p>Your gig is live! 🚀</p>

<!-- GOOD -->
<h1 style="color: #1f2937;">Welcome to Preset</h1>
<p style="color: #4b5563;">Your gig is now live</p>
```

### ❌ NO Icon Fonts (use text/color instead)
```html
<!-- BAD -->
<i class="icon-checkmark"></i> Success

<!-- GOOD -->
<div style="background: #10b981; color: white; padding: 20px; border-radius: 8px;">
  <strong>Success</strong><br>
  Your action was completed successfully.
</div>
```

### ❌ NO Centered Text Blocks (except CTAs)
```html
<!-- BAD -->
<p style="text-align: center;">
  This is a long paragraph of text that shouldn't be centered...
</p>

<!-- GOOD -->
<p style="color: #4b5563; line-height: 1.6;">
  This is a long paragraph of text with proper left alignment.
</p>

<!-- GOOD (for buttons) -->
<div style="text-align: center; margin: 30px 0;">
  <a href="#" class="button">Click Here</a>
</div>
```

---

## ✅ Visual Hierarchy Without Emojis

### Use Color for Emphasis

```html
<!-- Important information -->
<div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 25px; border-radius: 12px; color: white;">
  <h3 style="color: white; margin: 0 0 10px 0;">Important Update</h3>
  <p style="margin: 0;">{{content}}</p>
</div>
```

### Use Borders for Sections

```html
<!-- Section divider -->
<h3 style="
  color: #1f2937;
  border-left: 4px solid #00876f;
  padding-left: 15px;
  margin: 30px 0 15px 0;
">
  Next Steps
</h3>
```

### Use Background Colors for Grouping

```html
<!-- Grouped information -->
<div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h4 style="margin-top: 0; color: #1f2937;">Pro Tips</h4>
  <ul style="color: #4b5563; margin-bottom: 0;">
    <li>{{tip1}}</li>
    <li>{{tip2}}</li>
  </ul>
</div>
```

---

## 📧 Complete Email Template (No Emojis)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{emailTitle}}</title>
</head>
<body style="
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #1f2937;
  margin: 0;
  padding: 0;
  background-color: #f9fafb;
">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 40px 30px; text-align: center;">
      <a href="https://presetie.com" style="color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none;">Preset</a>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      
      <h1 style="color: #1f2937; margin-bottom: 10px; font-size: 28px;">{{mainTitle}}</h1>
      <p style="color: #00876f; font-size: 18px; margin-top: 0;">{{subtitle}}</p>
      
      <p style="color: #4b5563; line-height: 1.6;">{{bodyText}}</p>
      
      <!-- Highlighted Info -->
      <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
        <h2 style="margin: 0 0 15px 0; color: white;">{{highlightTitle}}</h2>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          {{highlightContent}}
        </div>
      </div>
      
      <!-- CTA -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{ctaUrl}}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">{{ctaText}}</a>
      </div>
      
      <!-- Tips -->
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h4 style="margin-top: 0; color: #1f2937;">{{tipsTitle}}</h4>
        <ul style="color: #4b5563; line-height: 1.8; margin-bottom: 0;">
          {{tipsList}}
        </ul>
      </div>
      
      <p style="color: #4b5563;">
        Best regards,<br>
        <strong style="color: #1f2937;">The Preset Team</strong>
      </p>
      
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px;">
      <p style="margin: 0 0 10px 0;">© 2025 Preset.ie - Creative Collaboration Platform</p>
      <p style="margin: 0;">
        <a href="{{preferencesUrl}}" style="color: #00876f; text-decoration: none;">Email Preferences</a> | 
        <a href="{{unsubscribeUrl}}" style="color: #00876f; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>
    
  </div>
</body>
</html>
```

---

## 🎯 Quick Reference

### Color Usage Guidelines

| Element | Color | Usage |
|---------|-------|-------|
| **Primary CTA** | `#00876f` | Main action buttons |
| **Gradient** | `#00876f → #0d7d72` | Headers, highlights, CTAs |
| **Headings** | `#1f2937` | All headings (H1-H4) |
| **Body Text** | `#4b5563` | Paragraphs, lists |
| **Muted Text** | `#6b7280` | Helper text, captions |
| **Links** | `#00876f` | All text links |
| **Success** | `#10b981` | Confirmations, approvals |
| **Warning** | `#f59e0b` | Deadlines, alerts |
| **Danger** | `#ef4444` | Errors, critical |

### Button Priority

1. **Primary Button** (Gradient) - One per email, main action
2. **Secondary Button** (Outline) - Alternative actions
3. **Success Button** (Green) - Approvals, confirmations
4. **Text Link** - Minimal, inline actions

---

## ✅ Checklist for Every Email

- [ ] NO emojis anywhere in the email
- [ ] Brand colors used correctly (#00876f, #0d7d72)
- [ ] Only ONE primary CTA button
- [ ] Clear visual hierarchy with headings
- [ ] Proper text colors (dark for headings, medium for body)
- [ ] Adequate spacing and padding
- [ ] Mobile-responsive (max-width: 600px)
- [ ] Footer with preferences/unsubscribe
- [ ] Accessible contrast ratios
- [ ] Professional, clean design

---

**Professional. Clean. Brand-Focused. No Emojis.** ✅

