/**
 * Plunk Campaign Examples
 * Real-world examples of sending targeted campaigns
 */

import {
  createTalentCampaign,
  createSpecializationCampaign,
  createStyleCampaign,
  createLocationCampaign,
  PlunkCampaignsService
} from '../apps/web/lib/services/plunk-campaigns.service';
import {
  getActorsCampaignTemplate,
  getVideographersCampaignTemplate,
  getSegmentedCampaignTemplate
} from '../apps/web/lib/services/emails/templates/campaigns.templates';

// ============================================
// Example 1: Target Actors Only
// ============================================

export async function sendActorsCampaign() {
  const result = await createTalentCampaign(
    ['Actor', 'Theater Actor', 'Voice Actor'],  // Target these talent types
    {
      subject: 'New Acting Opportunities This Week',
      body: getActorsCampaignTemplate('Actor', {
        heading: '50+ New Acting Gigs',
        message: 'We have curated the best acting opportunities for you this week. From commercial work to theater productions!',
        ctaText: 'Browse Acting Gigs',
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
      testEmails: ['admin@presetie.com'],  // Send test first
      sendNow: false  // Review before sending
    }
  );

  console.log(`✅ Campaign created for actors: ${result.id}`);
  console.log(`📧 Recipients: ${result.recipientCount}`);
  
  return result;
}

// ============================================
// Example 2: Target Videographers
// ============================================

export async function sendVideographersCampaign() {
  const result = await createSpecializationCampaign(
    ['Cinematography', 'Video Production', 'Music Video Production'],
    {
      subject: 'Premium Video Projects Available',
      body: getVideographersCampaignTemplate('Videographer', {
        heading: 'High-Budget Video Projects',
        message: 'Major brands and artists are looking for cinematographers. Paid opportunities with creative freedom!',
        ctaText: 'View Projects',
        ctaUrl: 'https://presetie.com/gigs?type=video',
        features: [
          {
            title: 'Music Videos',
            description: 'Work with top artists and labels'
          },
          {
            title: 'Commercial Production',
            description: 'Brand campaigns with 5-figure budgets'
          },
          {
            title: 'Documentary',
            description: 'Long-form storytelling projects'
          }
        ]
      })
    },
    { sendNow: false, testEmails: ['admin@presetie.com'] }
  );

  console.log(`✅ Campaign created for videographers: ${result.id}`);
  console.log(`📧 Recipients: ${result.recipientCount}`);
  
  return result;
}

// ============================================
// Example 3: Target Fashion Models in LA
// ============================================

export async function sendFashionModelsLACampaign() {
  const service = new PlunkCampaignsService();

  const result = await service.createCampaign({
    name: 'LA Fashion Models - Spring Campaign',
    targeting: {
      roles: ['TALENT', 'BOTH'],
      talentCategories: ['Model'],
      styleTags: ['Fashion', 'Editorial'],
      cities: ['Los Angeles', 'West Hollywood', 'Santa Monica'],
      verified: true
    },
    content: {
      subject: 'LA Fashion Week - Casting Now',
      body: getSegmentedCampaignTemplate('Model', 'LA Fashion Models', {
        heading: 'Fashion Week Opportunities',
        message: 'Los Angeles Fashion Week is coming! Top designers are casting models now. Don\'t miss your chance to walk the runway!',
        ctaText: 'View Castings',
        ctaUrl: 'https://presetie.com/gigs?location=los-angeles&type=fashion',
        highlights: [
          {
            icon: '👗',
            title: 'Designer Shows',
            description: '12 runway shows seeking models'
          },
          {
            icon: '📸',
            title: 'Lookbook Shoots',
            description: 'Pre-show editorial campaigns'
          },
          {
            icon: '🌟',
            title: 'VIP Events',
            description: 'Exclusive fashion week events'
          }
        ],
        stats: [
          { value: '35', label: 'Casting Calls' },
          { value: '$500-2k', label: 'Per Show' },
          { value: '90%', label: 'Booking Rate' }
        ]
      })
    },
    testEmails: ['admin@presetie.com'],
    sendNow: false
  });

  console.log(`✅ Campaign created: ${result.id}`);
  console.log(`📧 Recipients: ${result.recipientCount}`);
  
  return result;
}

// ============================================
// Example 4: Target All Photographers
// ============================================

export async function sendPhotographersCampaign() {
  const result = await createSpecializationCampaign(
    [
      'Fashion Photography',
      'Portrait Photography',
      'Commercial Photography',
      'Editorial Photography',
      'Product Photography'
    ],
    {
      subject: 'New Premium Models Available',
      body: getSegmentedCampaignTemplate('Photographer', 'Photographers', {
        heading: 'Premium Talent is Looking for You',
        message: '50+ verified models and actors have joined Preset this month and are actively looking for collaborations!',
        ctaText: 'Browse Talent',
        ctaUrl: 'https://presetie.com/browse/talent',
        stats: [
          { value: '52', label: 'New Talent' },
          { value: '40', label: 'Verified' },
          { value: '95%', label: 'Active' }
        ]
      })
    },
    { testEmails: ['admin@presetie.com'] }
  );

  console.log(`✅ Photographers campaign: ${result.id} (${result.recipientCount} recipients)`);
  
  return result;
}

// ============================================
// Example 5: Premium Users Update
// ============================================

export async function sendPremiumUsersUpdate() {
  const service = new PlunkCampaignsService();

  const result = await service.createCampaign({
    name: 'Premium Users - New Features',
    targeting: {
      tiers: ['PLUS', 'PRO'],
      active: true
    },
    content: {
      subject: 'Exclusive: New Pro Features Just for You',
      body: getSegmentedCampaignTemplate('Pro Member', 'Premium Members', {
        heading: 'New Pro Features Available',
        message: 'As a valued premium member, you now have access to advanced AI matching, priority support, and unlimited showcases!',
        ctaText: 'Explore Pro Features',
        ctaUrl: 'https://presetie.com/pro',
        highlights: [
          {
            icon: '🤖',
            title: 'AI Smart Matching',
            description: 'Get matched with perfect collaborators automatically'
          },
          {
            icon: '⚡',
            title: 'Priority Support',
            description: '24/7 dedicated support team'
          },
          {
            icon: '📸',
            title: 'Unlimited Showcases',
            description: 'Showcase all your best work with no limits'
          }
        ]
      })
    },
    testEmails: ['admin@presetie.com'],
    sendNow: false
  });

  console.log(`✅ Premium campaign: ${result.id} (${result.recipientCount} recipients)`);
  
  return result;
}

// ============================================
// Example 6: Multi-Category Campaign
// ============================================

export async function sendMultiCategoryCampaign() {
  const service = new PlunkCampaignsService();

  const result = await service.createCampaign({
    name: 'Performance Artists - Summer Season',
    targeting: {
      talentCategories: [
        'Actor',
        'Dancer',
        'Musician',
        'Singer',
        'Performer'
      ],
      cities: ['New York', 'Los Angeles', 'Chicago'],
      active: true
    },
    content: {
      subject: 'Summer Performance Season - Book Now',
      body: getSegmentedCampaignTemplate('Performer', 'Performance Artists', {
        heading: 'Summer Season is Here!',
        message: 'Festivals, events, and productions are booking now for the summer season. Get ahead of the competition!',
        ctaText: 'View All Opportunities',
        ctaUrl: 'https://presetie.com/gigs?season=summer',
        stats: [
          { value: '150+', label: 'Active Gigs' },
          { value: '$1.5k', label: 'Avg. Pay' },
          { value: '85%', label: 'Response Rate' }
        ]
      })
    },
    testEmails: ['admin@presetie.com'],
    sendNow: false
  });

  console.log(`✅ Multi-category campaign: ${result.id}`);
  console.log(`📧 Recipients: ${result.recipientCount}`);
  
  return result;
}

// ============================================
// Run Examples (for testing)
// ============================================

if (require.main === module) {
  (async () => {
    console.log('🚀 Plunk Campaigns Examples\n');
    
    try {
      // Run one example
      console.log('📧 Sending test campaign to actors...\n');
      await sendActorsCampaign();
      
      console.log('\n✅ Campaign created successfully!');
      console.log('💡 Check your email and Plunk dashboard');
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  })();
}

