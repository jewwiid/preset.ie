# Analytics Dashboard Setup Guide - UGC Video Campaign

> **Complete guide to tracking, measuring, and optimizing your video campaign performance**

---

## Table of Contents
1. [Platform Setup (Google Analytics 4)](#platform-setup-google-analytics-4)
2. [Social Media Analytics](#social-media-analytics)
3. [Video Performance Tracking](#video-performance-tracking)
4. [Conversion Tracking](#conversion-tracking)
5. [Custom Dashboards](#custom-dashboards)
6. [Reporting Templates](#reporting-templates)

---

## Platform Setup (Google Analytics 4)

### Step 1: Install GA4 on Landing Pages

**Add to `<head>` of all landing pages:**
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Step 2: Set Up Custom Events

**Track Video Source:**
```javascript
// When user lands from Instagram video
gtag('event', 'video_source', {
  'platform': 'instagram',
  'video_id': 'video_1_ai_playground',
  'campaign': 'ugc_q1_2025'
});

// When user lands from TikTok video
gtag('event', 'video_source', {
  'platform': 'tiktok',
  'video_id': 'video_2_gig_discovery',
  'campaign': 'ugc_q1_2025'
});
```

**Track Key Actions:**
```javascript
// Profile creation started
gtag('event', 'profile_creation_started', {
  'source': 'video_campaign',
  'video_id': document.referrer
});

// Profile completed
gtag('event', 'profile_creation_completed', {
  'completion_time_seconds': timeElapsed,
  'portfolio_items_added': portfolioCount
});

// First gig application
gtag('event', 'first_gig_application', {
  'days_since_signup': daysSinceSignup,
  'gig_id': gigId
});

// Upgrade to Pro
gtag('event', 'upgrade_to_pro', {
  'plan': 'pro_monthly',
  'revenue': 19.00,
  'currency': 'EUR'
});
```

### Step 3: Set Up Conversion Goals

**In GA4 Admin > Events > Mark as Conversion:**

1. **profile_creation_completed** - Primary conversion
2. **first_gig_application** - Engagement conversion
3. **upgrade_to_pro** - Revenue conversion
4. **email_signup** - Micro-conversion

### Step 4: Create Custom Dimensions

**Admin > Custom Definitions > Custom Dimensions:**

| Dimension Name | Parameter | Scope |
|---------------|-----------|-------|
| Video Source | video_id | Event |
| Video Platform | platform | Event |
| Campaign Name | campaign | Event |
| User Type | user_type | User |
| Referral Source | referral_source | Session |

---

## Social Media Analytics

### Instagram Insights Setup

**Track These Metrics for Each Reel:**

**Reach Metrics:**
- Accounts Reached
- Accounts Engaged
- Impressions
- Reach Rate (Reached / Followers × 100)

**Engagement Metrics:**
- Likes
- Comments
- Saves
- Shares
- Engagement Rate ((Likes + Comments + Saves + Shares) / Reach × 100)

**Discovery Metrics:**
- From Explore
- From Hashtags
- From Home
- From Profile
- Non-Follower Reach %

**Action Metrics:**
- Profile Visits
- Link Clicks (link in bio)
- Follows

**Export Data:**
```
Go to Insights → Click Reel → Download Data → Export to Google Sheets
```

### TikTok Analytics Setup

**Track These Metrics:**

**Video Performance:**
- Video Views
- Avg. Watch Time
- Watch Full Video %
- Total Watch Time
- Traffic Source (FYP, Following, Sound, Hashtag)

**Engagement:**
- Likes
- Comments
- Shares
- Saves
- Engagement Rate (Total Interactions / Views × 100)

**Audience:**
- New Followers (from video)
- Profile Views
- Total Watch Time

**Export Data:**
```
Creator Tools → Analytics → Video Tab → Export CSV
```

### YouTube Shorts Analytics

**Track These Metrics:**

**Performance:**
- Views
- Impressions
- Click-Through Rate (CTR)
- Avg. View Duration
- Watch Time

**Engagement:**
- Likes
- Comments
- Shares
- Subscribers Gained

**Discovery:**
- YouTube Search
- Suggested Videos
- Browse Features
- External Sources

**Export Data:**
```
YouTube Studio → Analytics → Advanced Mode → Export Current View (CSV)
```

---

## Video Performance Tracking

### Master Video Performance Spreadsheet

**Create Google Sheet with these columns:**

| Video ID | Platform | Post Date | Views | VTR % | Engagement Rate | Profile Visits | Link Clicks | CTR % | Sign-ups | CPA €
|----------|----------|-----------|-------|-------|----------------|----------------|-------------|-------|----------|-------
| video_1 | Instagram | 2025-01-15 | 45,200 | 42% | 8.5% | 2,340 | 856 | 1.9% | 43 | €11.63
| video_1 | TikTok | 2025-01-15 | 128,500 | 58% | 12.3% | 6,720 | 2,145 | 1.7% | 89 | €5.62

**Formulas:**
```
VTR % = (Completed Views / Total Views) × 100
Engagement Rate = (Likes + Comments + Saves + Shares) / Views × 100
CTR % = (Link Clicks / Profile Visits) × 100
CPA = Total Campaign Cost / Total Sign-ups
```

### Video Comparison Dashboard

**Set up in Google Data Studio (Looker Studio):**

**Chart 1: Views by Video**
- Bar chart comparing total views across all 12 videos
- Color-coded by platform

**Chart 2: Engagement Rate Comparison**
- Line chart showing engagement rate over time
- Separate lines for each video

**Chart 3: Conversion Funnel**
- Funnel showing: Views → Profile Visits → Link Clicks → Sign-ups
- Compare drop-off rates by video

**Chart 4: Platform Performance**
- Scorecard comparing Instagram vs TikTok vs YouTube
- Metrics: Total views, Avg. engagement rate, Total sign-ups

---

## Conversion Tracking

### UTM Parameter Strategy

**Build URLs with UTM parameters for each video:**

```
https://preset.ie/join?
utm_source=instagram&
utm_medium=video&
utm_campaign=ugc_q1_2025&
utm_content=video_1_ai_playground
```

**UTM Structure:**
- **utm_source**: Platform (instagram, tiktok, youtube)
- **utm_medium**: Content type (video, reel, short)
- **utm_campaign**: Campaign name (ugc_q1_2025)
- **utm_content**: Specific video (video_1_ai_playground, video_2_gig_discovery)

**Use URL Builder:**
```
https://ga-dev-tools.google/campaign-url-builder/
```

### Conversion Funnel Tracking

**Track These Funnel Steps:**

```
Step 1: Video View (Platform Analytics)
   ↓
Step 2: Profile Visit (Platform Analytics)
   ↓
Step 3: Link Click (Platform Analytics)
   ↓
Step 4: Landing Page Visit (GA4)
   ↓
Step 5: Email Signup (GA4 Event: email_signup)
   ↓
Step 6: Profile Creation Start (GA4 Event: profile_creation_started)
   ↓
Step 7: Profile Completed (GA4 Event: profile_creation_completed)
   ↓
Step 8: First Gig Application (GA4 Event: first_gig_application)
```

**Calculate Drop-off Rates:**
```
Profile Visit → Link Click: (Link Clicks / Profile Visits) × 100
Link Click → Landing Page: (Landing Page Visits / Link Clicks) × 100
Landing Page → Signup: (Email Signups / Landing Page Visits) × 100
Signup → Profile Complete: (Profiles Completed / Email Signups) × 100
```

---

## Custom Dashboards

### Dashboard 1: Campaign Overview (Google Data Studio)

**Metrics to Display:**

**Top Row - Scorecards:**
- Total Video Views (all platforms)
- Total Sign-ups
- Average CPA
- Total Revenue (from Pro upgrades)

**Row 2 - Platform Breakdown:**
- Instagram Performance (views, engagement, sign-ups)
- TikTok Performance (views, engagement, sign-ups)
- YouTube Performance (views, engagement, sign-ups)

**Row 3 - Video Performance:**
- Best Performing Video (by sign-ups)
- Highest Engagement Video (by engagement rate)
- Most Viewed Video (by total views)

**Row 4 - Conversion Funnel:**
- Funnel visualization showing drop-off at each step
- Compare against target benchmarks

**Row 5 - Trend Analysis:**
- Line chart: Daily sign-ups over campaign period
- Line chart: Daily CPA over campaign period

**Filters:**
- Date range
- Platform
- Video ID
- User type (talent vs client)

### Dashboard 2: Video Deep Dive

**For Each Video, Display:**

**Performance Summary:**
- Total views across all platforms
- Engagement rate by platform
- Best performing platform
- Total sign-ups attributed

**Platform Comparison Table:**
| Metric | Instagram | TikTok | YouTube | Total |
|--------|-----------|--------|---------|-------|
| Views | 45K | 128K | 23K | 196K |
| Engagement Rate | 8.5% | 12.3% | 6.2% | 10.1% |
| Profile Visits | 2.3K | 6.7K | 1.2K | 10.2K |
| Sign-ups | 43 | 89 | 18 | 150 |

**Audience Demographics:**
- Age breakdown (18-24, 25-34, 35-44, 45+)
- Gender split
- Top 5 locations
- Top 5 interests

**Content Performance:**
- Avg. watch time
- Completion rate
- Peak engagement timestamp
- Drop-off point

### Dashboard 3: ROI & Attribution

**Calculate & Display:**

**Cost Breakdown:**
```
Video Production Cost: €350/video × 12 = €4,200
Ad Spend (if any): €X
Total Campaign Cost: €4,200 + €X
```

**Revenue Attribution:**
```
Free Sign-ups Value: 150 users × €0 = €0 (future value)
Pro Upgrades: 15 users × €19/month = €285/month
Annual Value: €285 × 12 = €3,420
```

**ROI Calculation:**
```
ROI = ((Revenue - Cost) / Cost) × 100
ROI = ((€3,420 - €4,200) / €4,200) × 100 = -18.6% (Year 1)

Year 2 ROI (no production cost):
ROI = ((€3,420 - €0) / €4,200) × 100 = +81.4%
```

**Lifetime Value (LTV) Projection:**
```
Average user stays: 18 months
Monthly ARPU: €19 × 10% conversion to Pro = €1.90
LTV per User = €1.90 × 18 = €34.20

Campaign LTV = 150 users × €34.20 = €5,130
True ROI = ((€5,130 - €4,200) / €4,200) × 100 = +22.1%
```

---

## Reporting Templates

### Weekly Performance Report

**Executive Summary (1 page):**

```
WEEK OF: [Date Range]
CAMPAIGN: UGC Video Campaign Q1 2025

KEY METRICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total Views: 245,000 (↑ 23% vs last week)
👥 New Sign-ups: 87 (↑ 15% vs last week)
💰 CPA: €12.50 (↓ €2.30 vs last week)
⭐ Pro Upgrades: 9 (€171 revenue)

TOP PERFORMERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥇 Video 12 (Success Story): 42 sign-ups
🥈 Video 1 (AI Playground): 28 sign-ups
🥉 Video 6 (Gig Invitations): 17 sign-ups

PLATFORM BREAKDOWN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• TikTok: 145K views, 12.5% eng, 52 sign-ups
• Instagram: 78K views, 9.2% eng, 28 sign-ups
• YouTube: 22K views, 7.1% eng, 7 sign-ups

INSIGHTS & ACTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Success story videos converting 2x better
→ ACTION: Create 2 more success story videos

✅ TikTok driving 60% of sign-ups at lowest CPA
→ ACTION: Increase TikTok posting frequency

⚠️ YouTube underperforming
→ ACTION: Test different video formats/lengths

NEXT WEEK GOALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Launch 2 new video variations
• Hit 100 sign-ups/week
• Reduce CPA to €10
```

### Monthly Performance Report

**Comprehensive Analysis (5-10 pages):**

**Page 1: Executive Summary**
- Campaign objectives vs. results
- Key wins and learnings
- Budget performance
- Next month strategy

**Page 2: Video Performance Breakdown**
- Table showing all 12 videos with full metrics
- Top 3 performers analysis
- Bottom 3 performers analysis
- Platform-specific insights

**Page 3: Audience Analysis**
- Demographics breakdown
- Geographic insights
- Behavioral patterns
- User journey analysis

**Page 4: Conversion Funnel Analysis**
- Funnel visualization
- Drop-off point identification
- Conversion rate by video
- Recommendations for improvement

**Page 5: ROI & Financial Performance**
- Total cost breakdown
- Revenue generated
- ROI calculation
- Projected LTV
- Budget allocation recommendations

**Page 6-7: Platform Deep Dives**
- Instagram performance & insights
- TikTok performance & insights
- YouTube performance & insights
- Emerging platform opportunities

**Page 8: A/B Test Results**
- Tests conducted
- Winners and losers
- Statistical significance
- Implementation recommendations

**Page 9: Content Insights**
- Best performing hooks
- Most effective CTAs
- Optimal video lengths
- Engagement patterns

**Page 10: Recommendations & Next Steps**
- What to do more of
- What to stop doing
- New opportunities to test
- Budget reallocation plan

---

## Automated Reporting Setup

### Google Data Studio Auto-Email Reports

**Set Up Weekly Email:**
```
1. Open your Data Studio dashboard
2. Click Share → Schedule email delivery
3. Set frequency: Every Monday, 9:00 AM
4. Add recipients: marketing team emails
5. Include: PDF attachment + link to live dashboard
```

**Set Up Monthly Email:**
```
Same process, but:
Frequency: First Monday of month, 9:00 AM
Include: Comprehensive monthly report template
```

### Slack Integration for Real-Time Alerts

**Set up Zapier automation:**

**Trigger: New GA4 Conversion**
```
When: profile_creation_completed event fires
Then: Post to #marketing-wins Slack channel
Message: "🎉 New sign-up from [video_id] on [platform]! Total today: [count]"
```

**Trigger: Daily Summary**
```
When: Every day at 5:00 PM
Then: Post to #marketing-daily Slack channel
Message: "📊 Today's Stats: [views] views, [sign-ups] sign-ups, €[cpa] CPA"
```

**Trigger: High-Performing Video Alert**
```
When: Video reaches 50K views
Then: Post to #marketing-wins Slack channel
Message: "🚀 Video [id] just hit 50K views on [platform]! [engagement_rate]% engagement"
```

---

## Key Metrics & Benchmarks

### Success Metrics by Platform

**Instagram Reels:**
```
Good Performance:
- Views: 10K+ in first 48 hours
- Engagement Rate: >8%
- Saves Rate: >3%
- Profile Visit Rate: >5%
- Link CTR: >2%

Excellent Performance:
- Views: 50K+ in first week
- Engagement Rate: >12%
- Saves Rate: >5%
- Profile Visit Rate: >8%
- Link CTR: >4%
```

**TikTok:**
```
Good Performance:
- Views: 50K+ in first 72 hours
- Engagement Rate: >10%
- Share Rate: >2%
- Profile Visit Rate: >6%
- Link CTR: >3%

Excellent Performance:
- Views: 200K+ in first week
- Engagement Rate: >15%
- Share Rate: >4%
- Profile Visit Rate: >10%
- Link CTR: >5%
```

**YouTube Shorts:**
```
Good Performance:
- Views: 20K+ in first week
- Avg. View Duration: >45%
- Like Rate: >5%
- Comment Rate: >0.5%
- Subscriber Conversion: >0.3%

Excellent Performance:
- Views: 100K+ in first month
- Avg. View Duration: >60%
- Like Rate: >8%
- Comment Rate: >1%
- Subscriber Conversion: >0.5%
```

### Conversion Benchmarks

**Video Campaign Funnel:**
```
Industry Average → Preset Target → Actual (Update Weekly)

Video Views → Profile Visits:
5% → 6% → ____%

Profile Visits → Link Clicks:
20% → 25% → ____%

Link Clicks → Landing Page:
85% → 90% → ____%

Landing Page → Email Signup:
15% → 20% → ____%

Email Signup → Profile Complete:
40% → 50% → ____%

Profile Complete → First Application:
30% → 40% → ____%
```

### Cost Benchmarks

**Target CPA by Source:**
```
Instagram: €8-12 per sign-up
TikTok: €5-8 per sign-up
YouTube: €10-15 per sign-up

Blended Average: €8-10 per sign-up
```

**Target ROI:**
```
Month 1: -50% to 0% (investment phase)
Month 3: 0% to +25% (break-even)
Month 6: +50% to +100% (profitable)
Month 12: +100% to +200% (scaling)
```

---

## Tools & Resources

### Analytics Tools Stack

**Free Tools:**
- **Google Analytics 4**: Website & conversion tracking
- **Google Data Studio (Looker Studio)**: Dashboard & reporting
- **Platform Native Analytics**: Instagram Insights, TikTok Analytics, YouTube Studio
- **Google Sheets**: Data compilation & calculations
- **UTM.io**: UTM parameter management

**Paid Tools (Optional):**
- **Supermetrics** (€99/month): Automate data pulls to Google Sheets
- **Dashthis** (€49/month): White-label reporting
- **Rival IQ** (€79/month): Competitive social media analysis
- **Hootsuite Analytics** (€49/month): Unified social reporting
- **Hotjar** (€39/month): Landing page heatmaps & session recordings

### Recommended Setup

**Minimum Viable Analytics Stack (Free):**
1. GA4 for website tracking
2. Platform native analytics for social
3. Google Sheets for data compilation
4. Google Data Studio for dashboards
5. Manual weekly reporting

**Professional Stack (€187/month):**
1. GA4 + Supermetrics integration
2. Dashthis for automated reporting
3. Hotjar for conversion optimization
4. Rival IQ for competitive insights
5. Automated daily/weekly/monthly reports

---

## Data Privacy & Compliance

### GDPR Compliance

**Ensure You:**
- ✅ Have cookie consent banner on landing pages
- ✅ Allow users to opt-out of tracking
- ✅ Have privacy policy explaining data usage
- ✅ Anonymize IP addresses in GA4
- ✅ Set data retention to 14 months max
- ✅ Allow users to request data deletion

**GA4 Anonymize IP Setup:**
```javascript
gtag('config', 'G-XXXXXXXXXX', {
  'anonymize_ip': true
});
```

---

## Troubleshooting Common Issues

### Issue 1: GA4 Not Tracking Conversions

**Check:**
- [ ] GA4 tag installed on all pages
- [ ] Events marked as conversions in GA4
- [ ] UTM parameters correct in links
- [ ] No ad blockers interfering
- [ ] Conversion time window set correctly

### Issue 2: Low Conversion Attribution

**Solutions:**
- Use first-click attribution for awareness videos
- Use last-click attribution for conversion videos
- Implement data-driven attribution model
- Track across devices with User-ID

### Issue 3: Platform Analytics Not Matching GA4

**Why This Happens:**
- Different attribution windows
- Bot/spam traffic filtered differently
- Time zone differences
- Counting methodology differences

**Solution:**
- Accept 10-15% discrepancy as normal
- Use platform analytics for engagement metrics
- Use GA4 for conversion metrics
- Focus on trends, not absolute numbers

---

## Monthly Optimization Checklist

### ✅ Data Collection:
- [ ] Export all platform analytics to master sheet
- [ ] Update GA4 conversion data
- [ ] Calculate CPA for each video/platform
- [ ] Identify top 3 and bottom 3 performers

### ✅ Analysis:
- [ ] Compare against target benchmarks
- [ ] Identify patterns in high performers
- [ ] Analyze drop-off points in funnel
- [ ] Review audience demographics & behavior

### ✅ Insights & Actions:
- [ ] Document 3 key insights
- [ ] Create 3 action items from insights
- [ ] Assign owners and deadlines
- [ ] Update testing roadmap

### ✅ Reporting:
- [ ] Generate automated reports
- [ ] Add manual commentary/insights
- [ ] Share with stakeholders
- [ ] Present findings in team meeting

### ✅ Optimization:
- [ ] Pause underperforming content
- [ ] Increase budget on winners
- [ ] Launch new A/B tests
- [ ] Update landing pages based on data

---

**Pro Tip:** The goal isn't perfect data - it's actionable insights. Focus on tracking what matters: Are people signing up? From which videos? At what cost? Everything else is secondary! 📊✨
