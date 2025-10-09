# 🤖 Plunk Automation Setup Guide

Step-by-step guide to setting up email automations in your Plunk dashboard.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Email Templates](#creating-email-templates)
3. [Setting Up Automations](#setting-up-automations)
4. [Event Configuration](#event-configuration)
5. [Testing & Monitoring](#testing--monitoring)

---

## 🚀 Getting Started

### 1. Access Your Plunk Dashboard

Visit [app.useplunk.com](https://app.useplunk.com) and log in.

### 2. Navigate to Sections

- **📧 Templates** - Create email templates
- **🤖 Automations** - Set up email sequences
- **📊 Analytics** - Monitor performance
- **⚙️ Settings** - Configure API keys

---

## 📧 Creating Email Templates

### Step 1: Create a Template

1. Go to **Templates** → **Create Template**
2. Name your template: `Welcome Email - User Signup`
3. Choose template type: **Transactional** or **Marketing**

### Step 2: Design Your Email

#### Option A: Use Template Builder (Recommended)

1. Drag and drop components
2. Add your branding
3. Use merge tags for personalization: `{{data.name}}`
4. Preview across devices

#### Option B: Code Your Own

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Your styles */
  </style>
</head>
<body>
  <h1>Welcome, {{data.name}}!</h1>
  <p>Your role: {{data.role}}</p>
  <a href="{{data.profileUrl}}">Complete Profile</a>
</body>
</html>
```

### Step 3: Save & Test

1. Click **Save Template**
2. Send test email
3. Check inbox for rendering issues

### Example: Welcome Email Template

**Template Name:** `welcome-email`

**Subject Line:** `Welcome to Preset! 🎬 Let's get you started`

**Body:**
```html
<div style="max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 40px; text-align: center;">
    <h1 style="color: white; margin: 0;">Welcome to Preset, {{data.name}}! 🎬</h1>
  </div>
  
  <div style="padding: 40px;">
    <p>We're thrilled to have you join our creative community!</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>You're signed up as a {{data.role}}</h3>
      <p>{{data.roleDescription}}</p>
    </div>
    
    <h3>🚀 Get Started:</h3>
    <ol>
      <li>Complete your profile</li>
      <li>{{data.primaryAction}}</li>
      <li>Connect & create!</li>
    </ol>
    
    <a href="{{data.profileUrl}}" style="display: inline-block; padding: 14px 28px; background: #00876f; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
      Complete Your Profile
    </a>
  </div>
</div>
```

---

## 🤖 Setting Up Automations

### Automation 1: User Onboarding Sequence

#### Step 1: Create Automation

1. Go to **Automations** → **Create Automation**
2. Name: `User Onboarding Sequence`
3. Trigger: **Event-based**

#### Step 2: Configure Trigger

```
Event Name: user.signup
Trigger when: Event is tracked
```

#### Step 3: Build Email Sequence

**Email 1: Welcome (Immediate)**
- Template: `welcome-email`
- Delay: None
- Conditions: None

**Email 2: Getting Started (2 hours later)**
- Template: `getting-started-guide`
- Delay: 2 hours after trigger
- Conditions: User has not completed profile

**Email 3: First Action Prompt (24 hours later)**
- Template: `first-action-prompt`
- Delay: 24 hours after trigger
- Conditions:
  - User has not created gig (if CONTRIBUTOR)
  - User has not applied to gig (if TALENT)

#### Step 4: Add Conditions & Filters

Use Plunk's conditional logic:

```
IF data.role == "CONTRIBUTOR"
  THEN send: "Create Your First Gig"
ELSE IF data.role == "TALENT"
  THEN send: "Apply to Your First Gig"
ELSE
  THEN send: "Choose Your Path"
```

#### Step 5: Activate

1. Review automation flow
2. Test with sample data
3. Click **Activate**

---

### Automation 2: Gig Lifecycle

**Name:** `Gig Published Notifications`

**Trigger Event:** `gig.published`

**Email Sequence:**

1. **Immediate: Confirmation**
   ```
   Template: gig-published-confirmation
   To: {{email}}
   Subject: Your gig "{{data.gigTitle}}" is now live! 🚀
   ```

2. **24 hours: First Check-in**
   ```
   Template: gig-first-checkin
   Delay: 24 hours
   Condition: No applications received
   Subject: Tips to get more applications
   ```

3. **3 days before deadline: Reminder**
   ```
   Template: gig-deadline-reminder
   Delay: Until 3 days before {{data.deadline}}
   Subject: Application deadline approaching
   ```

---

### Automation 3: Application Workflow

**Name:** `Application Status Updates`

**Triggers:**
- `application.submitted`
- `application.shortlisted`
- `application.accepted`
- `application.declined`

**Flow:**

```
TRIGGER: application.submitted
├─ Email: Application Confirmation (to talent)
└─ Email: New Application Alert (to contributor)

TRIGGER: application.shortlisted
└─ Email: Shortlist Notification (to talent)

TRIGGER: application.accepted
├─ Email: Booking Confirmation (to talent)
└─ Email: Booking Receipt (to contributor)

TRIGGER: application.declined
└─ Email: Application Update + Recommendations (to talent)
```

---

### Automation 4: Subscription Management

**Name:** `Subscription Lifecycle`

**Automations:**

1. **Trial Started**
   ```
   Trigger: subscription.trial.started
   Email: Welcome to Trial
   Delay: None
   ```

2. **Trial Ending Soon**
   ```
   Trigger: subscription.trial.started
   Email: Trial ends in 3 days
   Delay: 11 days (for 14-day trial)
   Condition: Still on trial
   ```

3. **Trial Ended**
   ```
   Trigger: subscription.trial.started
   Email: Trial ended - Upgrade now
   Delay: 14 days
   Condition: Not upgraded
   ```

4. **Payment Failed**
   ```
   Trigger: subscription.payment.failed
   Email: Payment Issue
   Delay: None
   ```

5. **Subscription Expiring**
   ```
   Trigger: subscription.expiring.soon
   Email Series:
   - 7 days before: Renewal reminder
   - 3 days before: Payment confirmation
   - 1 day before: Final reminder
   ```

---

### Automation 5: Re-engagement Campaigns

**Name:** `Inactive User Re-engagement`

**Setup:**

1. **7 Days Inactive**
   ```
   Trigger: user.inactive.7days
   Template: come-back-week
   Subject: We miss you! 🎬
   Content: What's new + recommendations
   ```

2. **30 Days Inactive**
   ```
   Trigger: user.inactive.30days
   Template: come-back-month
   Subject: Your creative community is waiting
   Content: Major updates + special offer
   ```

3. **90 Days Inactive**
   ```
   Trigger: user.inactive.90days
   Template: final-chance
   Subject: Last chance before archive
   Content: Reactivation incentive
   ```

---

## ⚙️ Event Configuration

### Setting Up Event Tracking

In Plunk, configure expected events:

1. Go to **Events** → **Create Event**
2. Add event details:

```
Event Name: gig.published
Description: When a contributor publishes a gig
Expected Data:
  - gigId (string)
  - gigTitle (string)
  - compensationType (string)
  - location (string)
  - deadline (date)
```

### Common Events to Configure

| Event Name | When Tracked | Key Data |
|------------|--------------|----------|
| `user.signup` | User creates account | name, role, tier |
| `gig.published` | Gig goes live | gigTitle, location, deadline |
| `application.submitted` | Talent applies | gigTitle, contributorName |
| `gig.talent.booked` | Talent booked for gig | gigTitle, shootDate |
| `showcase.published` | Showcase goes live | showcaseId, collaborators |
| `subscription.upgraded` | User upgrades plan | oldTier, newTier |
| `credits.purchased` | Credits bought | amount, credits |
| `review.requested` | Request to review | collaboratorName, gigTitle |

---

## 📊 Advanced Automation Features

### A/B Testing Subject Lines

1. Create automation
2. Add A/B test step
3. Configure variants:

```
Variant A: "Your gig is now live! 🚀"
Variant B: "{{gigTitle}} is published and ready for applications"

Split: 50/50
Winner metric: Open rate
Duration: 24 hours
```

### Dynamic Content Based on User Attributes

```html
<!-- In template -->
{{#if data.tier == "PRO"}}
  <div class="pro-badge">PRO Member</div>
  <p>As a Pro member, your gig gets priority placement!</p>
{{else}}
  <p>Upgrade to Pro for priority placement!</p>
  <a href="{{data.upgradeUrl}}">Upgrade Now</a>
{{/if}}
```

### Time-Based Sending

Configure optimal send times:

```
Automation: Weekly Reports
Trigger: Every Monday
Send Time: 9:00 AM user's timezone
```

---

## 🧪 Testing & Monitoring

### Testing Automations

1. **Test Mode**
   - Go to automation
   - Click **Test**
   - Enter sample data
   - Send to test email

2. **Sample Data**
   ```json
   {
     "email": "test@presetie.com",
     "data": {
       "name": "Test User",
       "role": "CONTRIBUTOR",
       "gigTitle": "Test Fashion Shoot",
       "location": "Dublin",
       "tier": "PRO"
     }
   }
   ```

3. **Check Results**
   - Email received?
   - Correct personalization?
   - Links working?
   - Mobile rendering OK?

### Monitoring Performance

1. Go to **Analytics** → **Automations**

2. Key Metrics:
   - **Open Rate** - Target: 25-35%
   - **Click Rate** - Target: 3-8%
   - **Conversion Rate** - Target: 1-5%
   - **Unsubscribe Rate** - Keep < 0.5%

3. Optimization:
   - A/B test subject lines
   - Test send times
   - Refine content
   - Adjust frequency

---

## 🎯 Best Practices

### 1. Personalization

Always use merge tags:
```html
<!-- ❌ Bad -->
<h1>Welcome to Preset!</h1>

<!-- ✅ Good -->
<h1>Welcome to Preset, {{data.name}}!</h1>
```

### 2. Clear CTAs

One primary action per email:
```html
<!-- ❌ Too many CTAs -->
<a href="#">Complete Profile</a>
<a href="#">Browse Gigs</a>
<a href="#">Read Guide</a>
<a href="#">Watch Video</a>

<!-- ✅ One clear CTA -->
<a href="{{data.profileUrl}}" class="button">Complete Your Profile</a>
```

### 3. Mobile-First Design

Test on mobile devices:
- Use responsive templates
- Large tap targets (44px minimum)
- Readable font sizes (16px+)
- Single column layout

### 4. Timing & Frequency

- Welcome email: Immediate
- Onboarding: Spread over 3-5 days
- Re-engagement: Weekly max
- Newsletters: Monthly
- Never send daily (except transactional)

### 5. Segmentation

Create targeted automations:
```
Segment: Contributors Only
Event: gig.published
Template: Contributor-specific tips

Segment: Talent Only
Event: application.submitted
Template: Talent-specific guidance
```

---

## 🚀 Launch Checklist

Before activating automations:

- [ ] All templates created & tested
- [ ] Events configured correctly
- [ ] Automations built & reviewed
- [ ] Test emails sent & verified
- [ ] Unsubscribe links working
- [ ] Mobile rendering checked
- [ ] Team approval obtained
- [ ] Analytics tracking set up
- [ ] Error monitoring in place
- [ ] Documentation updated

---

## 📈 Optimization Workflow

### Weekly Review

1. Check automation performance
2. Review open/click rates
3. Identify underperforming emails
4. Plan A/B tests

### Monthly Analysis

1. Overall engagement trends
2. Conversion attribution
3. Unsubscribe patterns
4. User feedback review
5. Competitive analysis

### Quarterly Updates

1. Refresh email copy
2. Update visuals
3. Test new formats
4. Expand automation flows
5. Archive non-performing automations

---

## 🆘 Troubleshooting

### Common Issues

**1. Emails not sending**
- Check automation is active
- Verify event name matches code
- Check Plunk logs for errors
- Ensure API key is valid

**2. Low open rates**
- Test different subject lines
- Check send time
- Verify email deliverability
- Review from name/address

**3. Data not populating**
- Verify event data structure
- Check merge tag syntax
- Test with sample data
- Review Plunk event logs

**4. High unsubscribe rate**
- Reduce email frequency
- Improve content relevance
- Check user expectations
- Review targeting/segmentation

---

## 📚 Resources

- [Plunk Documentation](https://docs.useplunk.com)
- [Email Best Practices](https://docs.useplunk.com/guides/best-practices)
- [Merge Tag Reference](https://docs.useplunk.com/guides/merge-tags)
- [Analytics Guide](https://docs.useplunk.com/guides/analytics)

---

**Your Plunk automations are ready to drive engagement! 🚀**

