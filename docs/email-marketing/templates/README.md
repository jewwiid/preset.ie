# 📧 Branded Email Templates

Production-ready HTML email templates for Presetie.com using correct brand colors and identity.

---

## 🎨 Brand Guidelines

### Official Branding
- **Brand Name:** **Presetie.com** or **Preset**
- **NOT:** "preset.ie" or "Preset.ie"
- **Website:** https://presetie.com
- **Logo:** Available at `/logo.svg`

### Brand Colors
```css
/* Primary */
--preset-primary: #00876f;        /* Teal/green - main brand color */
--preset-primary-light: #ccfbef;  /* Light teal */
--preset-primary-dark: #0d7d72;   /* Dark teal */

/* Accent */
--preset-accent: #f59e0b;         /* Amber/orange */

/* Neutrals */
--preset-text: #0f172a;           /* Dark slate */
--preset-text-light: #475569;     /* Medium slate */
--preset-bg: #ffffff;             /* White */
--preset-bg-tint: #fafdfc;        /* Light teal tint */
```

### Typography
- **Headings:** Bloc W01 Regular (fallback: Inter, system-ui)
- **Body:** Inter, -apple-system, sans-serif
- **Letter Spacing:** -0.025em for headings

---

## 📁 Template Files

### 1. `base-template.html`
**Purpose:** Foundation template with all brand styles  
**Use:** Starting point for all emails  
**Features:**
- Correct Presetie.com branding
- Brand colors (#00876f)
- Responsive design
- Email client compatibility

### 2. `01-welcome-email.html`
**Purpose:** User signup welcome email  
**Trigger:** `user.signup`  
**Features:**
- Role-specific content (Contributor/Talent)
- Personalized CTAs
- Getting started guide
- Pro tips

### 3. `02-gig-published.html`
**Purpose:** Gig published confirmation  
**Trigger:** `gig.published`  
**Features:**
- Gig details card (branded)
- Application timeline
- Tips for success

### 4. `03-booking-confirmation.html`
**Purpose:** Talent booking confirmation  
**Trigger:** `application.accepted` / `gig.talent.booked`  
**Features:**
- Shoot details
- Pre-shoot checklist
- Safety reminders
- Golden hour times

### 5. `04-credit-purchase.html`
**Purpose:** Credit purchase receipt  
**Trigger:** `credits.purchased`  
**Features:**
- Credits added banner
- Balance display
- Receipt details
- Invoice download

---

## 🎨 Visual Branding Elements

### Logo Usage
```html
<!-- Text Logo -->
<a href="https://presetie.com" style="color: #ffffff; font-size: 32px; font-weight: 600; text-decoration: none; letter-spacing: -0.025em;">
  Preset
</a>

<!-- Or with image (if hosted) -->
<img src="https://presetie.com/logo.svg" alt="Preset" width="40" height="40">
<span style="font-size: 32px; color: #ffffff; font-weight: 600; margin-left: 10px;">Preset</span>
```

### Primary Button
```html
<a href="{{url}}" style="display: inline-block; padding: 14px 28px; background: #00876f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
  Button Text
</a>
```

### Accent Button
```html
<a href="{{url}}" style="display: inline-block; padding: 14px 28px; background: #f59e0b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
  Secondary Action
</a>
```

### Branded Card/Section
```html
<div style="background: #00876f; padding: 30px; border-radius: 12px; color: #ffffff;">
  <h2 style="color: #ffffff; margin: 0 0 15px 0;">Heading</h2>
  <p style="color: #ccfbef; margin: 0;">Content</p>
</div>
```

---

## ✅ Quality Checklist

For each email template:
- [ ] Brand name is "Presetie.com" or "Preset" (NOT "preset.ie")
- [ ] Primary color is #00876f (not purple/blue)
- [ ] Logo/brand name in header
- [ ] Mobile responsive
- [ ] All links point to https://presetie.com
- [ ] Footer has correct branding
- [ ] Unsubscribe link present
- [ ] Tested across email clients

---

## 🚀 How to Use These Templates

### 1. In Plunk Dashboard

1. Go to **Templates** → **Create Template**
2. Copy HTML from template file
3. Replace {{variables}} with Plunk merge tags
4. Test rendering
5. Save & use in automations

### 2. In Code (Transactional)

```typescript
import { getPlunkService } from '@/lib/services/plunk';

const plunk = getPlunkService();

const emailHTML = `
  <!-- Copy from template file -->
  <!-- Replace {{variables}} with actual values -->
`;

await plunk.sendTransactionalEmail({
  to: 'user@example.com',
  subject: 'Welcome to Preset!',
  body: emailHTML
});
```

---

## 📱 Mobile Optimization

All templates include:
- Responsive breakpoints
- Touch-friendly buttons (44px minimum)
- Single-column layout on mobile
- Readable font sizes (16px+)
- Stacked buttons on small screens

---

## ✉️ Email Client Compatibility

Tested and compatible with:
- Gmail (Desktop & Mobile)
- Apple Mail (macOS & iOS)
- Outlook (2016, 2019, Office 365)
- Yahoo Mail
- Thunderbird
- Samsung Mail

---

## 🎯 Brand Voice

**Tone:** Friendly, Professional, Creative  
**Voice:** Supportive collaborator, not corporate  
**Style:** Clear, action-oriented, visual

**Examples:**
- ✅ "Your gig is now live! 🚀"
- ✅ "Let's get you started"
- ✅ "Happy creating!"
- ❌ "Your listing has been activated"
- ❌ "Please proceed to configure"

---

## 📊 Next Steps

1. Upload templates to Plunk dashboard
2. Test with sample data
3. Verify brand colors render correctly
4. Check mobile rendering
5. Set up automations
6. Monitor performance

---

**All templates follow Presetie.com brand guidelines! 🎨✨**

