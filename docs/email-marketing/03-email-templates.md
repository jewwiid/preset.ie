# 📧 Email Templates Library

Professional email templates for all Preset.ie email events.

---

## 🎨 Design System

### Brand Colors (Preset Theme)
```css
/* Primary Brand Colors */
--primary: #00876f;           /* Preset teal/green */
--primary-light: #ccfbef;     /* Light teal */
--primary-dark: #0d7d72;      /* Dark teal */

/* Accent Colors */
--accent: #f59e0b;            /* Amber/orange */
--success: #00876f;           /* Preset green */
--warning: #f59e0b;           /* Amber */
--danger: #ef4444;            /* Red */

/* Neutral Colors */
--text: #0f172a;              /* Dark slate */
--text-light: #475569;        /* Light slate */
--text-muted: #64748b;        /* Muted slate */
--bg: #ffffff;                /* White */
--bg-secondary: #fafdfc;      /* Very light teal tint */
--bg-tertiary: #f5fbf9;       /* Light teal tint */
--border: #e2e8f0;            /* Light border */
```

### Base Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif;
      line-height: 1.6;
      color: #0f172a;
      margin: 0;
      padding: 0;
      background-color: #fafdfc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: #00876f;
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 32px;
      font-weight: 600;
      text-decoration: none;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #00876f;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background 0.2s ease;
    }
    .button:hover {
      background: #0d7d72;
    }
    .footer {
      background-color: #fafdfc;
      padding: 30px;
      text-align: center;
      color: #475569;
      font-size: 14px;
    }
    .footer a {
      color: #00876f;
      text-decoration: none;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      background-color: #00876f;
      color: white;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://presetie.com" class="logo">Preset</a>
    </div>
    <div class="content">
      <!-- CONTENT GOES HERE -->
    </div>
    <div class="footer">
      <p>© 2025 <strong>Presetie.com</strong> - Creative Collaboration Platform</p>
      <p>
        <a href="{{preferencesUrl}}">Email Preferences</a> | 
        <a href="{{unsubscribeUrl}}">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 📬 Template Library

### 1. Welcome Email (user.signup)

```html
<h1>Welcome to Preset, {{name}}! 🎬</h1>

<p>We're thrilled to have you join our creative community!</p>

<div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin-top: 0;">You're signed up as a {{role}}</h3>
  <p style="margin-bottom: 0;">{{roleDescription}}</p>
</div>

<h3>🚀 Get Started in 3 Steps:</h3>
<ol>
  <li><strong>Complete your profile</strong> - Add photos, bio, and skills</li>
  <li><strong>{{primaryAction}}</strong> - {{primaryActionDescription}}</li>
  <li><strong>Connect & create</strong> - Start collaborating!</li>
</ol>

<a href="{{profileUrl}}" class="button">Complete Your Profile</a>

<h3>💡 Pro Tips:</h3>
<ul>
  <li>{{tip1}}</li>
  <li>{{tip2}}</li>
  <li>{{tip3}}</li>
</ul>

<p>Need help? Reply to this email or visit our <a href="{{helpUrl}}">Help Center</a>.</p>

<p>
  Happy creating!<br>
  The Preset Team
</p>
```

**Variables:**
- `name` - User's name
- `role` - CONTRIBUTOR, TALENT, or BOTH
- `roleDescription` - Role-specific description
- `primaryAction` - Browse gigs / Create your first gig
- `primaryActionDescription` - Action-specific text
- `profileUrl` - Link to complete profile
- `tip1-3` - Role-specific tips

---

### 2. Gig Published (gig.published)

```html
<h1>Your gig is now live! 🚀</h1>

<p>Great news! Your gig "<strong>{{gigTitle}}</strong>" is now published and visible to talent.</p>

<div style="background: #00876f; padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
  <h2 style="margin: 0 0 15px 0; color: white;">{{gigTitle}}</h2>
  <p style="margin: 0; font-size: 16px;">
    📍 {{location}}<br>
    📅 {{shootDate}}<br>
    💰 {{compensationType}}
  </p>
</div>

<h3>What happens next?</h3>

<ol>
  <li><strong>Talent start applying</strong> - You'll get notified for each application</li>
  <li><strong>Review applications</strong> - Check out profiles and shortlist favorites</li>
  <li><strong>Message & book</strong> - Chat directly and select your talent</li>
</ol>

<div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
  <strong>⏰ Application Deadline:</strong> {{deadline}}
</div>

<a href="{{gigUrl}}" class="button">View Your Gig</a>

<h3>📊 Tips for Great Applications:</h3>
<ul>
  <li>Respond to applications within 24 hours</li>
  <li>Ask questions to find the right fit</li>
  <li>Keep your chat professional and friendly</li>
</ul>

<p>Good luck with your shoot!</p>
```

**Variables:**
- `gigTitle` - Gig title
- `location` - Shoot location
- `shootDate` - Formatted shoot date
- `compensationType` - TFP/Paid/Expenses
- `deadline` - Application deadline
- `gigUrl` - Link to gig page

---

### 3. New Application Received (gig.application.received)

```html
<h1>New application for "{{gigTitle}}"</h1>

<p>{{applicantName}} has applied to your gig!</p>

<div style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <div style="display: flex; align-items: center; gap: 15px;">
    <img src="{{applicantAvatar}}" alt="{{applicantName}}" style="width: 60px; height: 60px; border-radius: 50%;">
    <div>
      <h3 style="margin: 0;">{{applicantName}}</h3>
      <p style="margin: 5px 0 0 0; color: #6b7280;">{{applicantRole}}</p>
    </div>
  </div>
  
  <div style="margin-top: 15px;">
    <p><strong>Experience:</strong> {{applicantExperience}}</p>
    <p><strong>Portfolio:</strong> {{portfolioCount}} showcases</p>
    
    {{#if note}}
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px;">
      <strong>Application Note:</strong>
      <p style="margin: 10px 0 0 0;">{{note}}</p>
    </div>
    {{/if}}
  </div>
</div>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{profileUrl}}" class="button" style="background: #00876f;">View Full Profile</a>
  <a href="{{shortlistUrl}}" style="display: inline-block; padding: 14px 28px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-left: 10px;">Shortlist</a>
</div>

<p style="color: #6b7280; font-size: 14px;">
  Applications so far: {{applicationCount}} / {{maxApplicants}}
</p>
```

**Variables:**
- `gigTitle` - Gig title
- `applicantName` - Applicant's name
- `applicantAvatar` - Profile picture URL
- `applicantRole` - Their role
- `applicantExperience` - Experience level
- `portfolioCount` - Number of showcases
- `note` - Optional application note
- `profileUrl` - Link to applicant's profile
- `shortlistUrl` - Quick shortlist action
- `applicationCount` - Current applications
- `maxApplicants` - Maximum allowed

---

### 4. Application Submitted (application.submitted)

```html
<h1>Application sent! 🎬</h1>

<p>Your application to {{contributorName}} has been successfully sent.</p>

<div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h3 style="margin-top: 0; color: #065f46;">✅ Application Details</h3>
  <p><strong>Gig:</strong> {{gigTitle}}</p>
  <p><strong>Contributor:</strong> {{contributorName}}</p>
  <p><strong>Shoot Date:</strong> {{shootDate}}</p>
  <p><strong>Location:</strong> {{location}}</p>
</div>

<h3>What happens next?</h3>

<ol>
  <li><strong>Review Period</strong> - The contributor will review your application</li>
  <li><strong>Possible Shortlist</strong> - You may be shortlisted for further consideration</li>
  <li><strong>Decision</strong> - You'll be notified of the outcome</li>
</ol>

<div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
  <strong>⏰ Expected Response:</strong> Within 3-5 days
</div>

<h3>💡 While You Wait:</h3>
<ul>
  <li>Complete your profile to increase your chances</li>
  <li>Browse and apply to other gigs</li>
  <li>Build your showcase portfolio</li>
</ul>

<p>We'll email you as soon as there's an update!</p>

<p style="color: #6b7280; font-size: 14px;">
  Applications this month: {{applicationsCount}} / {{applicationLimit}}
</p>
```

**Variables:**
- `contributorName` - Who they applied to
- `gigTitle` - Gig title
- `shootDate` - When the shoot is
- `location` - Where
- `applicationsCount` - Current month usage
- `applicationLimit` - Based on subscription tier

---

### 5. Booking Confirmation (application.accepted / gig.talent.booked)

```html
<h1>Congratulations! You're booked! 🎉</h1>

<p>Great news, {{talentName}}! You've been selected for "<strong>{{gigTitle}}</strong>".</p>

<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
  <h2 style="margin: 0 0 20px 0; color: white;">🎬 Shoot Details</h2>
  
  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
    <p style="margin: 0;"><strong>📅 Date & Time:</strong></p>
    <p style="margin: 5px 0 0 0; font-size: 18px;">{{shootDateTime}}</p>
  </div>
  
  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
    <p style="margin: 0;"><strong>📍 Location:</strong></p>
    <p style="margin: 5px 0 0 0; font-size: 18px;">{{location}}</p>
    <a href="{{mapUrl}}" style="color: white; text-decoration: underline;">Get Directions</a>
  </div>
  
  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
    <p style="margin: 0;"><strong>💰 Compensation:</strong></p>
    <p style="margin: 5px 0 0 0; font-size: 18px;">{{compensation}}</p>
  </div>
</div>

<h3>📋 Pre-Shoot Checklist:</h3>

<ul>
  <li>✅ Confirm your availability</li>
  <li>✅ Review the shot list and moodboard</li>
  <li>✅ Prepare outfits/props (if needed)</li>
  <li>✅ Check weather forecast (for outdoor shoots)</li>
  <li>✅ Message {{contributorName}} with any questions</li>
</ul>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{chatUrl}}" class="button">Message {{contributorName}}</a>
</div>

<div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
  <strong>⚡ Golden Hour Times:</strong> {{goldenHour}} (if applicable)
</div>

<h3>🛡️ Safety Reminders:</h3>
<ul>
  <li>Meet in a public place</li>
  <li>Bring a friend or notify someone of your location</li>
  <li>Keep communication within the app</li>
  <li>Report any concerns immediately</li>
</ul>

<p>Have an amazing shoot! Can't wait to see what you create! 📸</p>

<p style="color: #6b7280; font-size: 14px;">
  <a href="{{safetyGuideUrl}}">Read our Safety Guide</a>
</p>
```

**Variables:**
- `talentName` - Talent's name
- `gigTitle` - Gig title
- `contributorName` - Contributor's name
- `shootDateTime` - Formatted date/time
- `location` - Shoot location
- `mapUrl` - Google Maps link
- `compensation` - Compensation details
- `chatUrl` - Link to per-gig chat
- `goldenHour` - Golden hour times (if outdoor)
- `safetyGuideUrl` - Safety guidelines link

---

### 6. Subscription Upgraded (subscription.upgraded)

```html
<h1>Welcome to Preset {{tier}}! 🚀</h1>

<p>Your upgrade is complete! Here's what you've unlocked:</p>

<div style="background: #00876f; padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
  <h2 style="margin: 0 0 20px 0; color: white;">✨ Your New Features</h2>
  
  {{#each features}}
  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
    <p style="margin: 0;"><strong>{{icon}} {{title}}</strong></p>
    <p style="margin: 5px 0 0 0; font-size: 14px;">{{description}}</p>
  </div>
  {{/each}}
</div>

<h3>🎯 Make the Most of {{tier}}:</h3>

<ol>
  <li>{{tip1}}</li>
  <li>{{tip2}}</li>
  <li>{{tip3}}</li>
</ol>

<a href="{{dashboardUrl}}" class="button">Explore Your Dashboard</a>

<div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 30px 0;">
  <h3 style="margin-top: 0;">📊 Your Billing</h3>
  <p><strong>Plan:</strong> Preset {{tier}}</p>
  <p><strong>Price:</strong> {{price}}/month</p>
  <p><strong>Next billing:</strong> {{nextBilling}}</p>
  <p style="margin-bottom: 0;"><a href="{{billingUrl}}">Manage Billing</a></p>
</div>

<p>Thank you for upgrading! We can't wait to see what you create.</p>
```

**Variables:**
- `tier` - Plus or Pro
- `features` - Array of new features
- `tip1-3` - Usage tips
- `dashboardUrl` - Link to dashboard
- `price` - Monthly price
- `nextBilling` - Next billing date
- `billingUrl` - Billing management link

---

### 7. Credit Purchase Confirmation (credits.purchased)

```html
<h1>Credit Purchase Confirmed! 💳</h1>

<p>Your credits have been added to your account.</p>

<div style="background: #00876f; padding: 30px; border-radius: 12px; color: white; margin: 30px 0; text-align: center;">
  <h2 style="margin: 0 0 10px 0; color: white;">{{credits}} Credits</h2>
  <p style="margin: 0; font-size: 18px;">Added to your account</p>
</div>

<div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin-top: 0;">📊 Your Balance</h3>
  <p style="font-size: 24px; margin: 10px 0;"><strong>{{totalBalance}} credits</strong></p>
  <p style="margin: 0; color: #6b7280;">Total available credits</p>
</div>

<h3>💡 What You Can Do:</h3>
<ul>
  <li>Enhance images with AI</li>
  <li>Generate moodboard variations</li>
  <li>Access premium presets</li>
  <li>Unlock advanced features</li>
</ul>

<a href="{{playgroundUrl}}" class="button">Start Creating</a>

<div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
  <h3 style="margin-top: 0;">🧾 Receipt</h3>
  <p><strong>Transaction ID:</strong> {{transactionId}}</p>
  <p><strong>Amount:</strong> ${{amount}}</p>
  <p><strong>Credits:</strong> {{credits}}</p>
  <p><strong>Date:</strong> {{date}}</p>
  <p style="margin-bottom: 0;"><a href="{{invoiceUrl}}">Download Invoice</a></p>
</div>
```

**Variables:**
- `credits` - Credits purchased
- `totalBalance` - New total balance
- `playgroundUrl` - Link to start using credits
- `transactionId` - Transaction reference
- `amount` - Price paid
- `date` - Purchase date
- `invoiceUrl` - Invoice download link

---

### 8. Review Request (review.requested)

```html
<h1>How was your experience? ⭐</h1>

<p>You recently worked with <strong>{{collaboratorName}}</strong> on "<strong>{{gigTitle}}</strong>".</p>

<p>Your feedback helps build trust in our community and helps others make informed decisions.</p>

<div style="background: #f9fafb; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
  <h3 style="margin-top: 0;">Rate Your Experience</h3>
  
  <div style="margin: 20px 0;">
    {{#each stars}}
    <a href="{{url}}" style="text-decoration: none; font-size: 40px; margin: 0 5px;">⭐</a>
    {{/each}}
  </div>
  
  <p style="color: #6b7280; font-size: 14px;">Click a star to rate</p>
</div>

<h3>📝 What to Include:</h3>
<ul>
  <li>Professionalism</li>
  <li>Communication</li>
  <li>Creativity</li>
  <li>Punctuality</li>
  <li>Overall experience</li>
</ul>

<a href="{{reviewUrl}}" class="button">Write Your Review</a>

<p style="color: #6b7280; font-size: 14px;">
  Reviews are public and help the community thrive. Please be honest and constructive.
</p>
```

**Variables:**
- `collaboratorName` - Who they worked with
- `gigTitle` - Gig title
- `stars` - Array of star rating links
- `reviewUrl` - Link to review form

---

### 9. Inactive User Re-engagement (user.inactive.7days)

```html
<h1>We miss you! 👋</h1>

<p>It's been a week since we last saw you, {{name}}. A lot has happened!</p>

<h3>🔥 What's New:</h3>

<div style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
  {{#each updates}}
  <div style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
    <h4 style="margin: 0 0 5px 0;">{{title}}</h4>
    <p style="margin: 0; color: #6b7280;">{{description}}</p>
  </div>
  {{/each}}
</div>

<h3>{{recommendationTitle}}</h3>

<div style="display: grid; gap: 15px; margin: 20px 0;">
  {{#each recommendations}}
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
    <h4 style="margin: 0 0 10px 0;">{{title}}</h4>
    <p style="margin: 0 0 10px 0; color: #6b7280;">{{description}}</p>
    <a href="{{url}}" style="color: #667eea; text-decoration: none;">View →</a>
  </div>
  {{/each}}
</div>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{dashboardUrl}}" class="button">Return to Preset</a>
</div>

<p>The creative community is waiting for you!</p>
```

**Variables:**
- `name` - User's name
- `updates` - Recent platform updates
- `recommendationTitle` - "Recommended Gigs" or "New Applications"
- `recommendations` - Personalized content
- `dashboardUrl` - Link back to platform

---

## 🚀 Using Templates in Code

```typescript
// Example: Sending gig published email with template

const gigPublishedTemplate = `
<!DOCTYPE html>
<html>
  <!-- Base template HTML -->
  <body>
    <div class="content">
      <h1>Your gig is now live! 🚀</h1>
      <!-- Template content from above -->
    </div>
  </body>
</html>
`;

function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;
  
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return rendered;
}

// Usage
const emailBody = renderTemplate(gigPublishedTemplate, {
  gigTitle: 'Fashion Editorial Shoot',
  location: 'Downtown Dublin',
  shootDate: 'March 15, 2025',
  compensationType: 'TFP (Time for Print)',
  deadline: 'March 1, 2025',
  gigUrl: 'https://presetie.com/gigs/123'
});

await plunk.sendTransactionalEmail({
  to: 'contributor@example.com',
  subject: 'Your gig "Fashion Editorial Shoot" is now live! 🚀',
  body: emailBody
});
```

---

## 📋 Template Checklist

For each template, ensure:
- [ ] Clear subject line
- [ ] Personalization (name, details)
- [ ] Main action/CTA
- [ ] Supporting information
- [ ] Mobile-responsive design
- [ ] Accessible (good contrast, readable fonts)
- [ ] Unsubscribe link in footer
- [ ] Brand colors consistent
- [ ] Links work correctly
- [ ] Test across email clients

---

## 🎨 Next Steps

1. Create HTML versions of all templates
2. Upload to Plunk dashboard
3. Test rendering across email clients
4. A/B test subject lines
5. Monitor open rates
6. Iterate based on data

---

**Ready to create beautiful emails! 📧✨**

