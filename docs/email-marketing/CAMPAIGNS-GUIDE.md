# Plunk Campaigns Guide

**Create targeted email campaigns** for different user specializations and skills using the [Plunk Campaigns API](https://docs.useplunk.com/api-reference/campaigns/create).

---

## 🎯 Quick Start

### 1. Import Campaign Service

```typescript
import { 
  createTalentCampaign,
  createSpecializationCampaign,
  createStyleCampaign
} from '@/lib/services/plunk-campaigns.service';
```

### 2. Send Campaign to Specific Talent

```typescript
// Target all actors
await createTalentCampaign(
  ['Actor'],  // Talent categories
  {
    subject: 'New Acting Opportunities on Preset',
    body: getActorsCampaignTemplate('User', {
      heading: 'Exclusive Acting Gigs',
      message: 'We have 50+ new acting opportunities perfect for your profile!',
      ctaText: 'Browse Acting Gigs',
      ctaUrl: 'https://presetie.com/gigs?category=acting'
    })
  },
  { 
    sendNow: false,  // Creates draft first
    testEmails: ['you@presetie.com']  // Send test first
  }
);
```

---

## 📋 Available Targeting Options

### By Talent Category

Target specific talent types from your platform:

```typescript
// From apps/web/lib/constants/creative-options.ts
const TALENT_CATEGORIES = [
  // Performance & Entertainment
  'Model', 'Actor', 'Dancer', 'Musician', 'Singer', 'Voice Actor',
  
  // Digital & Social
  'Influencer', 'Content Creator', 'YouTuber', 'TikToker', 'Podcaster',
  
  // Creative & Artistic
  'Makeup Artist', 'Hair Stylist', 'Stylist', 'Artist',
  
  // Technical & Production
  'Photographer', 'Videographer', 'Video Editor', 'Sound Engineer',
  
  // Specialized
  'Hand Model', 'Fitness Model', 'Plus Size Model', 'Child Actor'
  // ... and many more!
];
```

### By Specialization

Target contributors by their photography/video specializations:

```typescript
const SPECIALIZATIONS = [
  // Photography
  'Fashion Photography', 'Portrait Photography', 'Product Photography',
  'Wedding Photography', 'Commercial Photography', 'Editorial Photography',
  
  // Video & Cinema
  'Cinematography', 'Video Production', 'Documentary Filmmaking',
  'Music Video Production', 'Commercial Video', 'Drone Videography',
  
  // Design & Visual
  'Graphic Design', 'UI/UX Design', 'Motion Graphics', '3D Animation',
  
  // ... and many more!
];
```

---

## 🚀 Campaign Examples

### Example 1: Target Actors Only

```typescript
import { createTalentCampaign } from '@/lib/services/plunk-campaigns.service';
import { getActorsCampaignTemplate } from '@/lib/services/emails/templates/campaigns.templates';

await createTalentCampaign(
  ['Actor', 'Theater Actor', 'Voice Actor'],
  {
    subject: 'New Acting Opportunities This Week',
    body: getActorsCampaignTemplate('Talent', {
      heading: '50+ New Acting Gigs',
      message: 'We have curated the best acting opportunities for you this week. From commercial work to theater productions, there is something for everyone!',
      ctaText: 'View Acting Gigs',
      ctaUrl: 'https://presetie.com/gigs?talent=actor',
      features: [
        {
          title: 'Commercial Casting',
          description: '15 brand campaigns looking for actors'
        },
        {
          title: 'Theater Productions',
          description: '8 stage productions seeking talent'
        },
        {
          title: 'Voice Work',
          description: '12 voice acting opportunities'
        }
      ]
    })
  },
  {
    testEmails: ['admin@presetie.com'],  // Test first
    sendNow: false  // Review before sending
  }
);
```

### Example 2: Target Fashion Photographers

```typescript
await createSpecializationCampaign(
  ['Fashion Photography', 'Editorial Photography'],
  {
    subject: 'Premium Fashion Models Looking for Photographers',
    body: getSegmentedCampaignTemplate('Photographer', 'Fashion Photographers', {
      heading: 'Work with Top Fashion Models',
      message: '25 verified models are actively looking for fashion photographers this month. Premium collaboration opportunities await!',
      ctaText: 'View Model Profiles',
      ctaUrl: 'https://presetie.com/browse/talent?category=model',
      stats: [
        { value: '25', label: 'Active Models' },
        { value: '15', label: 'Verified Profiles' },
        { value: '95%', label: 'Match Rate' }
      ]
    })
  },
  { sendNow: true }
);
```

### Example 3: Target Videographers in Los Angeles

```typescript
import { PlunkCampaignsService } from '@/lib/services/plunk-campaigns.service';

const service = new PlunkCampaignsService();

await service.createCampaign({
  name: 'LA Videographers - Music Video Campaign',
  targeting: {
    specializations: ['Cinematography', 'Video Production', 'Music Video Production'],
    cities: ['Los Angeles', 'West Hollywood', 'Santa Monica'],
    verified: true,  // Only verified users
    active: true     // Active in last 30 days
  },
  content: {
    subject: 'Music Video Opportunities in LA',
    body: getVideographersCampaignTemplate('Videographer', {
      heading: 'Premium Music Video Projects',
      message: 'Top LA artists are looking for cinematographers and video producers. Paid opportunities with major labels!',
      ctaText: 'View Projects',
      ctaUrl: 'https://presetie.com/gigs?location=los-angeles&type=music-video',
      features: [
        {
          title: 'Major Label Projects',
          description: '5 projects from Sony, Universal, and Warner'
        },
        {
          title: 'Independent Artists',
          description: '12 emerging artists with strong budgets'
        },
        {
          title: 'Creative Freedom',
          description: 'Full creative control on production'
        }
      ]
    })
  },
  sendNow: false,
  testEmails: ['admin@presetie.com']
});
```

### Example 4: Target Models by Style

```typescript
await createStyleCampaign(
  ['Fashion', 'Editorial', 'Commercial'],
  {
    subject: 'High-End Editorial Opportunities',
    body: getSegmentedCampaignTemplate('Model', 'Editorial & Fashion Models', {
      heading: 'Premium Editorial Shoots',
      message: 'Top fashion photographers are booking for upcoming editorial campaigns. TFP and paid opportunities available!',
      ctaText: 'Browse Opportunities',
      ctaUrl: 'https://presetie.com/gigs?style=editorial,fashion',
      highlights: [
        {
          icon: '📸',
          title: 'Magazine Features',
          description: '8 editorial shoots for major publications'
        },
        {
          icon: '💼',
          title: 'Brand Campaigns',
          description: '12 commercial shoots with top brands'
        },
        {
          icon: '🌟',
          title: 'Portfolio Building',
          description: '20+ TFP opportunities with experienced photographers'
        }
      ]
    })
  }
);
```

### Example 5: Premium Users Only

```typescript
await createPremiumUsersCampaign(
  {
    subject: 'Exclusive Pro Features Update',
    body: getSegmentedCampaignTemplate('Pro User', 'Premium Members', {
      heading: 'New Pro Features Available',
      message: 'As a valued Pro member, you now have access to advanced AI matching, priority support, and unlimited showcases!',
      ctaText: 'Explore Pro Features',
      ctaUrl: 'https://presetie.com/pro-features'
    })
  }
);
```

---

## 🎨 Campaign Targeting Strategies

### Strategy 1: Multi-Category Targeting

```typescript
const service = new PlunkCampaignsService();

// Target multiple related talent types
await service.createCampaign({
  name: 'Performance Artists Campaign',
  targeting: {
    talentCategories: ['Actor', 'Dancer', 'Musician', 'Performer'],
    cities: ['New York', 'Los Angeles', 'Chicago'],
    active: true
  },
  content: {
    subject: 'Performance Opportunities in Major Cities',
    body: '...'
  }
});
```

### Strategy 2: Verified Professionals

```typescript
// Only send to verified, active professionals
await service.createCampaign({
  name: 'Verified Professionals Update',
  targeting: {
    verified: true,
    active: true,
    tiers: ['PLUS', 'PRO']
  },
  content: {
    subject: 'Exclusive Opportunities for Verified Pros',
    body: '...'
  }
});
```

### Strategy 3: Location + Skill Combo

```typescript
// Fashion photographers in specific cities
await service.createCampaign({
  name: 'Fashion Week Campaign',
  targeting: {
    specializations: ['Fashion Photography', 'Editorial Photography'],
    cities: ['New York', 'Paris', 'Milan', 'London'],
    verified: true
  },
  content: {
    subject: 'Fashion Week Coverage Opportunities',
    body: '...'
  }
});
```

---

## 📊 Testing Campaigns

### Always Test First!

```typescript
// Send test email before launching
await createTalentCampaign(
  ['Actor'],
  {
    subject: 'Test Campaign',
    body: '...'
  },
  {
    sendNow: false,  // Don't send yet
    testEmails: [
      'admin@presetie.com',
      'marketing@presetie.com'
    ]
  }
);
```

### Test Checklist

- [ ] Subject line is compelling
- [ ] Email renders properly on mobile
- [ ] All links work correctly
- [ ] Unsubscribe link present
- [ ] Brand colors consistent
- [ ] No typos or errors
- [ ] CTA is clear and actionable

---

## 🎯 Campaign Templates Available

### By Talent Type

| Template Function | Target Audience | Use Case |
|-------------------|-----------------|----------|
| `getActorsCampaignTemplate()` | Actors | Acting gigs, casting calls |
| `getVideographersCampaignTemplate()` | Videographers | Video projects, cinema work |
| `getSegmentedCampaignTemplate()` | Any segment | Generic campaigns |

### Generic Template

Use `getSegmentedCampaignTemplate()` for any audience:

```typescript
getSegmentedCampaignTemplate(
  recipientName,
  'Segment Name',  // e.g., "Fashion Photographers"
  {
    heading: 'Campaign Headline',
    message: 'Main campaign message',
    ctaText: 'Call to Action',
    ctaUrl: 'https://presetie.com/target-page',
    highlights: [...],  // Optional
    stats: [...]        // Optional
  },
  userEmail,
  userId
)
```

---

## 🔧 API Usage

### Via API Endpoint

```bash
curl -X POST https://presetie.com/api/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Actors Campaign",
    "targeting": {
      "talentCategories": ["Actor", "Voice Actor"]
    },
    "content": {
      "subject": "New Acting Opportunities",
      "body": "<html>...</html>"
    },
    "sendNow": false,
    "testEmails": ["admin@presetie.com"]
  }'
```

### Response

```json
{
  "success": true,
  "campaignId": "45fb8871-c028-414e-a351-ce7fafaf00f1",
  "recipientCount": 245,
  "status": "draft",
  "message": "Campaign created as draft with 245 recipients"
}
```

---

## 📈 Advanced Targeting

### Combine Multiple Criteria

```typescript
const service = new PlunkCampaignsService();

await service.createCampaign({
  name: 'Premium Fashion Professionals',
  targeting: {
    // Must be TALENT or BOTH
    roles: ['TALENT', 'BOTH'],
    
    // Must be Model or Actor
    talentCategories: ['Model', 'Actor'],
    
    // Must have Fashion or Editorial style
    styleTags: ['Fashion', 'Editorial'],
    
    // Must be in these cities
    cities: ['New York', 'Los Angeles'],
    
    // Must be verified and active
    verified: true,
    active: true,
    
    // Must be on paid plan
    tiers: ['PLUS', 'PRO']
  },
  content: {
    subject: 'Exclusive Premium Opportunities',
    body: '...'
  }
});
```

### Custom Filter Function

```typescript
await service.createCampaign({
  name: 'Custom Filtered Campaign',
  targeting: {
    talentCategories: ['Model'],
    customFilter: (user) => {
      // Add any custom logic
      return user.follower_count > 1000 || user.showcase_count > 10;
    }
  },
  content: {
    subject: 'Influencer Opportunities',
    body: '...'
  }
});
```

---

## 🎨 Campaign Template Examples

### Fashion Models Campaign

```typescript
import { getSegmentedCampaignTemplate } from '@/lib/services/emails/templates/campaigns.templates';

const emailBody = getSegmentedCampaignTemplate(
  'Sarah',  // User's first name
  'Fashion Models',
  {
    heading: 'Runway Season is Here!',
    message: 'Top fashion photographers are booking models for Spring/Summer campaigns. Get booked for premium editorial shoots!',
    ctaText: 'View Fashion Gigs',
    ctaUrl: 'https://presetie.com/gigs?category=fashion',
    highlights: [
      {
        icon: '👗',
        title: 'Designer Campaigns',
        description: '15 luxury brand campaigns seeking models'
      },
      {
        icon: '📸',
        title: 'Editorial Shoots',
        description: '25 magazine editorial opportunities'
      },
      {
        icon: '🌟',
        title: 'Runway Shows',
        description: '8 upcoming fashion week opportunities'
      }
    ],
    stats: [
      { value: '48', label: 'Active Gigs' },
      { value: '$2.5k', label: 'Avg. Payment' },
      { value: '95%', label: 'Booking Rate' }
    ]
  }
);
```

### Cinematographers Campaign

```typescript
const emailBody = getVideographersCampaignTemplate(
  'John',
  {
    heading: 'Premium Video Projects',
    message: 'Major brands and artists are looking for skilled cinematographers. Paid opportunities with creative freedom!',
    ctaText: 'Browse Video Projects',
    ctaUrl: 'https://presetie.com/gigs?type=video',
    features: [
      {
        title: 'Music Videos',
        description: 'Work with emerging and established artists'
      },
      {
        title: 'Commercial Production',
        description: 'Brand campaigns with 5-figure budgets'
      },
      {
        title: 'Documentary Projects',
        description: 'Long-form storytelling opportunities'
      }
    ]
  }
);
```

---

## 📊 Campaign Workflow

### Step 1: Define Your Audience

```typescript
const targeting = {
  talentCategories: ['Actor', 'Voice Actor'],
  cities: ['Los Angeles', 'New York'],
  verified: true,
  active: true
};
```

### Step 2: Create Content

```typescript
const content = {
  subject: 'New Acting Opportunities',
  body: getActorsCampaignTemplate('User', {
    heading: 'Premium Acting Gigs',
    message: 'Your message here...',
    ctaText: 'View Gigs',
    ctaUrl: 'https://presetie.com/gigs'
  })
};
```

### Step 3: Test

```typescript
await createTalentCampaign(
  targeting.talentCategories,
  content,
  {
    sendNow: false,
    testEmails: ['you@presetie.com']
  }
);
```

### Step 4: Review & Send

After reviewing the test email, send the campaign:

```typescript
const service = new PlunkCampaignsService();
await service.sendCampaign(campaignId);
```

---

## 🎯 Use Cases

### 1. New Feature Announcements

Target specific user types with feature announcements:

```typescript
// Announce video editing features to videographers
await createSpecializationCampaign(
  ['Video Production', 'Cinematography', 'Video Editing'],
  {
    subject: 'New: AI-Powered Video Editing Tools',
    body: '...'
  }
);
```

### 2. Geographic Campaigns

Target users in specific cities for local events:

```typescript
await createLocationCampaign(
  ['London'],
  {
    subject: 'London Fashion Week Opportunities',
    body: '...'
  }
);
```

### 3. Re-engagement Campaigns

Target inactive users with specific skills:

```typescript
await service.createCampaign({
  name: 'Inactive Photographers Re-engagement',
  targeting: {
    specializations: ['Fashion Photography', 'Portrait Photography'],
    active: false,  // NOT active in last 30 days
    tiers: ['FREE']
  },
  content: {
    subject: 'We Miss You - Special Comeback Offer',
    body: '...'
  }
});
```

### 4. Premium Upsell Campaigns

Target free users to upgrade:

```typescript
await service.createCampaign({
  name: 'Free to Plus Upsell',
  targeting: {
    tiers: ['FREE'],
    active: true,
    verified: true
  },
  content: {
    subject: 'Unlock Unlimited Applications - Upgrade to Plus',
    body: '...'
  }
});
```

---

## 🛡️ Best Practices

### 1. Always Test First
- Send test emails to yourself/team
- Review on mobile and desktop
- Check all links

### 2. Respect User Preferences
- Only send to users who opted in to marketing
- Honor unsubscribe requests
- Don't over-email

### 3. Segment Thoughtfully
- Be specific with targeting
- Avoid sending irrelevant content
- Personalize when possible

### 4. Track Performance
- Monitor open rates in Plunk dashboard
- Track click-through rates
- Adjust strategy based on data

### 5. Timing Matters
- Best days: Tuesday, Wednesday, Thursday
- Best time: 9-11 AM or 1-3 PM (local time)
- Avoid weekends for professional campaigns

---

## 📚 Campaign Ideas by Segment

### For Actors
- Casting call announcements
- Acting workshop invitations
- Industry networking events
- Premium gig opportunities

### For Videographers
- Video production opportunities
- Equipment rental offers
- Video editing tool updates
- Client project leads

### For Models
- Fashion week opportunities
- Brand campaign castings
- Portfolio building sessions
- Agency scouting events

### For Photographers
- Photography contests
- Gear recommendations
- Location shoot opportunities
- Workshop announcements

---

## 🔗 API Reference

Based on [Plunk's Campaigns API](https://docs.useplunk.com/api-reference/campaigns/create):

### Create Campaign
```
POST https://api.useplunk.com/v1/campaigns
Authorization: Bearer sk_...
Content-Type: application/json

{
  "subject": "string",
  "body": "string",
  "recipients": ["email1@example.com", "email2@example.com"],
  "style": "HTML"
}
```

### Response
```json
{
  "id": "campaign-id",
  "subject": "...",
  "body": "...",
  "status": "DRAFT",
  "delivered": null,
  "style": "HTML",
  "projectId": "...",
  "createdAt": "2024-08-10T19:53:28.207Z",
  "updatedAt": "2024-08-10T19:53:28.207Z"
}
```

---

## ✅ Campaign Checklist

Before sending a campaign:

- [ ] Audience is properly targeted
- [ ] Subject line is compelling (< 50 characters)
- [ ] Email content is relevant to audience
- [ ] All links are tested and working
- [ ] Mobile responsive design verified
- [ ] Unsubscribe link included (via template)
- [ ] Test email sent and reviewed
- [ ] Sending time is optimal
- [ ] Campaign name is descriptive
- [ ] Analytics tracking is set up

---

## 🚀 Quick Reference

### Target Actors
```typescript
createTalentCampaign(['Actor'], content);
```

### Target Videographers
```typescript
createSpecializationCampaign(['Cinematography', 'Video Production'], content);
```

### Target Fashion Professionals
```typescript
createStyleCampaign(['Fashion', 'Editorial'], content);
```

### Target Specific Location
```typescript
createLocationCampaign(['Los Angeles', 'New York'], content);
```

### Custom Targeting
```typescript
new PlunkCampaignsService().createCampaign({
  name: 'Custom',
  targeting: { /* your criteria */ },
  content: { /* your content */ }
});
```

---

**Ready to create your first campaign?** Start with a test to a small segment!

_Last updated: October 10, 2025_

