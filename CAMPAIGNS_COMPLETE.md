# ✅ Plunk Campaigns System - COMPLETE!

## 🎯 **YES! You can now send targeted campaigns to actors, videographers, and any specialization!**

Based on the [Plunk Campaigns API](https://docs.useplunk.com/api-reference/campaigns/create), I've built a complete campaign management system.

---

## 📧 What Was Created

### ✅ **Campaign Service** (`plunk-campaigns.service.ts`)
- Full integration with Plunk Campaigns API
- Smart user targeting by skills/specializations
- Fetch users from Supabase
- Send campaigns via Plunk
- Test email support

### ✅ **Campaign Templates** (`campaigns.templates.ts`)
- Actor campaign template
- Videographer campaign template
- Generic segmented campaign template
- Brand-consistent design

### ✅ **API Endpoint** (`/api/campaigns/create`)
- RESTful API for creating campaigns
- Secure (admin-only recommended)
- JSON request/response

### ✅ **Helper Functions**
- `createTalentCampaign()` - Target specific talent types
- `createSpecializationCampaign()` - Target by specialization
- `createStyleCampaign()` - Target by style tags
- `createLocationCampaign()` - Target by city
- `createPremiumUsersCampaign()` - Target premium users

### ✅ **Examples & Scripts**
- `examples/send-campaigns.ts` - 6 complete examples
- `send_campaign.py` - Python CLI tool
- `scripts/send-campaign.ts` - Interactive CLI

### ✅ **Documentation**
- `docs/email-marketing/CAMPAIGNS-GUIDE.md` - Complete guide

---

## 🚀 How to Send Campaigns

### Method 1: Use Helper Functions (Easiest)

```typescript
import { createTalentCampaign } from '@/lib/services/plunk-campaigns.service';
import { getActorsCampaignTemplate } from '@/lib/services/emails/templates/campaigns.templates';

// Send to all actors
await createTalentCampaign(
  ['Actor', 'Voice Actor', 'Theater Actor'],
  {
    subject: 'New Acting Opportunities',
    body: getActorsCampaignTemplate('Actor', {
      heading: '50+ Acting Gigs Available',
      message: 'From commercials to theater - find your next role!',
      ctaText: 'Browse Gigs',
      ctaUrl: 'https://presetie.com/gigs?talent=actor'
    })
  },
  {
    testEmails: ['you@presetie.com'],  // Test first!
    sendNow: false  // Review before sending
  }
);
```

### Method 2: Use Campaign Service (More Control)

```typescript
import { PlunkCampaignsService } from '@/lib/services/plunk-campaigns.service';

const service = new PlunkCampaignsService();

await service.createCampaign({
  name: 'LA Videographers Campaign',
  targeting: {
    specializations: ['Cinematography', 'Video Production'],
    cities: ['Los Angeles'],
    verified: true,
    active: true  // Active in last 30 days
  },
  content: {
    subject: 'Premium Video Projects in LA',
    body: '...your HTML email...'
  },
  testEmails: ['you@presetie.com'],
  sendNow: false
});
```

### Method 3: Use API Endpoint

```bash
curl -X POST https://presetie.com/api/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Actors Campaign",
    "targeting": {
      "talentCategories": ["Actor"]
    },
    "content": {
      "subject": "New Opportunities",
      "body": "<html>...</html>"
    },
    "testEmails": ["you@presetie.com"]
  }'
```

---

## 🎯 Targeting Options

### Available Targeting Criteria

```typescript
interface CampaignTargeting {
  // Role-based
  roles?: ('CONTRIBUTOR' | 'TALENT' | 'BOTH')[];
  
  // Skill-based
  talentCategories?: string[];   // Actor, Model, Dancer, etc.
  specializations?: string[];    // Fashion Photography, Cinematography, etc.
  
  // Location
  cities?: string[];
  countries?: string[];
  
  // Subscription
  tiers?: ('FREE' | 'PLUS' | 'PRO')[];
  
  // Engagement
  verified?: boolean;
  active?: boolean;  // Active in last 30 days
  
  // Style
  styleTags?: string[];  // Fashion, Editorial, etc.
  
  // Custom
  customFilter?: (user: any) => boolean;
}
```

---

## 📋 Talent Categories (From Your Platform)

You can target any of these talent types:

### Performance & Entertainment
- Model, Actor, Dancer, Musician, Singer, Voice Actor, Performer
- Theater Actor, Stand-up Comedian, Magician, Stunt Performer

### Digital & Social Media  
- Influencer, Content Creator, YouTuber, TikToker, Podcaster
- Brand Ambassador, Digital Marketer, Live Streamer

### Creative & Artistic
- Makeup Artist, Hair Stylist, Stylist, Artist, Designer
- Creative Director, Art Director, Illustrator

### Technical & Production
- Photographer, Videographer, Video Editor, Sound Engineer
- Camera Operator, Lighting Technician, Production Assistant

### Specialized Roles
- Hand Model, Fitness Model, Plus Size Model
- Child Actor, Senior Model, Character Actor

**Total: 80+ talent categories!**

---

## 🎬 Specializations (For Contributors)

Target by these specializations:

### Photography
- Fashion Photography, Portrait Photography, Product Photography
- Wedding Photography, Commercial Photography, Editorial Photography
- Street Photography, Fine Art Photography, Sports Photography

### Video & Cinema
- Cinematography, Video Production, Documentary Filmmaking
- Music Video Production, Commercial Video, Drone Videography
- Motion Graphics, Video Editing, Color Grading

### Design & Visual
- Graphic Design, UI/UX Design, Brand Design
- Illustration, 3D Modeling, Visual Effects (VFX)

### Audio & Content
- Audio Production, Sound Design, Music Composition
- Content Strategy, Copywriting, Script Writing

**Total: 70+ specializations!**

---

## 💡 Campaign Ideas

### For Actors
- **New gig alerts:** "50 acting gigs added this week"
- **Industry tips:** "How to ace your audition"
- **Success stories:** "Actor spotlight: From Preset to Netflix"
- **Premium features:** "Upgrade to get priority casting"

### For Videographers
- **Project opportunities:** "Music videos, commercials, documentaries"
- **Equipment tips:** "Best cameras for cinematography"
- **Technique guides:** "Master color grading"
- **Collaboration invites:** "Work with top brands"

### For Models
- **Casting calls:** "Fashion week, editorial, commercial"
- **Portfolio building:** "TFP shoots with top photographers"
- **Industry insights:** "Modeling trends 2025"
- **Agency connections:** "Get scouted by top agencies"

### For Photographers
- **Talent availability:** "Premium models available now"
- **Location opportunities:** "Fashion week, events, studios"
- **Technical updates:** "New AI editing tools"
- **Business tips:** "Pricing your photography services"

---

## 🧪 Testing Before Sending

**ALWAYS test your campaigns first!**

```typescript
// Send test to yourself
await createTalentCampaign(
  ['Actor'],
  {
    subject: 'Test Campaign',
    body: getActorsCampaignTemplate('Test', {...})
  },
  {
    testEmails: ['you@presetie.com', 'marketing@presetie.com'],
    sendNow: false  // Don't send to all users yet
  }
);
```

### Test Checklist
- [ ] Subject line is compelling (< 50 chars)
- [ ] Email renders on mobile
- [ ] All links work
- [ ] Unsubscribe link present
- [ ] No typos
- [ ] CTA is clear
- [ ] Brand colors consistent

---

## 📊 Example Campaign Results

After creating a campaign, you'll get:

```json
{
  "success": true,
  "campaignId": "45fb8871-c028-414e-...",
  "recipientCount": 245,
  "status": "draft",
  "message": "Campaign created as draft with 245 recipients"
}
```

Then monitor in Plunk dashboard for:
- Delivery rate
- Open rate
- Click-through rate
- Unsubscribe rate

---

## 🎯 Quick Examples

### Send to ALL Actors
```typescript
createTalentCampaign(['Actor'], content);
```

### Send to Fashion Photographers
```typescript
createSpecializationCampaign(['Fashion Photography'], content);
```

### Send to LA Models
```typescript
createCampaign({
  targeting: { 
    talentCategories: ['Model'], 
    cities: ['Los Angeles'] 
  },
  content
});
```

### Send to Verified Videographers
```typescript
createCampaign({
  targeting: { 
    specializations: ['Cinematography'], 
    verified: true 
  },
  content
});
```

---

## 🔧 Files Created

1. **Service:** `apps/web/lib/services/plunk-campaigns.service.ts`
2. **API:** `apps/web/app/api/campaigns/create/route.ts`
3. **Templates:** `apps/web/lib/services/emails/templates/campaigns.templates.ts`
4. **Examples:** `examples/send-campaigns.ts`
5. **CLI:** `scripts/send-campaign.ts`
6. **Python:** `send_campaign.py`
7. **Docs:** `docs/email-marketing/CAMPAIGNS-GUIDE.md`

---

## ✅ What You Can Do NOW

**Target ANY combination of:**
- ✅ 80+ talent categories (actors, models, dancers, etc.)
- ✅ 70+ specializations (photography, video, design, etc.)
- ✅ Any city or location
- ✅ Subscription tiers (FREE, PLUS, PRO)
- ✅ Verified vs unverified users
- ✅ Active vs inactive users
- ✅ Style tags (Fashion, Editorial, etc.)
- ✅ Custom filters (any criteria you want!)

**Send campaigns for:**
- New gig opportunities
- Feature announcements
- Premium upsells
- Re-engagement
- Event invitations
- Educational content
- Success stories
- Promotions

---

## 🚀 Start Sending Campaigns

### Quick Start (Python)
```bash
python send_campaign.py
```

### Via Code
```typescript
import { createTalentCampaign } from '@/lib/services/plunk-campaigns.service';

await createTalentCampaign(['Actor'], content, { 
  testEmails: ['you@example.com'] 
});
```

### Via API
```bash
curl -X POST https://presetie.com/api/campaigns/create -d {...}
```

---

**Your campaign system is COMPLETE and ready to use!** 🎉

Test it with actors or videographers now, then expand to other segments!

