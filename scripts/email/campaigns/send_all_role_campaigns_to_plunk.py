#!/usr/bin/env python3
"""
Send Comprehensive Role-Based Campaigns to Plunk
Creates campaigns for ALL talent categories and specializations from the database
Based on: apps/web/lib/constants/creative-options.ts
"""

import requests
import os
from dotenv import load_dotenv

load_dotenv()

PLUNK_API_KEY = os.getenv('PLUNK_API_KEY')
PLUNK_API_URL = 'https://api.useplunk.com/v1'
TEST_EMAIL = 'support@presetie.com'

def create_plunk_campaign(name, subject, body, recipients, style='HTML'):
    """Create a campaign in Plunk as DRAFT"""
    if not PLUNK_API_KEY:
        print("❌ PLUNK_API_KEY is not set")
        return None
    
    payload = {
        'subject': subject,
        'body': body,
        'recipients': recipients,
        'style': style
    }
    
    headers = {
        'Authorization': f'Bearer {PLUNK_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            f'{PLUNK_API_URL}/campaigns',
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def get_base_template(icon, title, subtitle, main_message, features, cta_text, cta_url, promo_message=""):
    """Reusable HTML template for all campaigns"""
    features_html = ""
    for i, feature in enumerate(features, 1):
        features_html += f"""
        <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 20px; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: start; gap: 15px;">
                <div style="background-color: #00876f; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">{i}</div>
                <div>
                    <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">{feature['title']}</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">{feature['description']}</p>
                </div>
            </div>
        </div>
        """
    
    promo_html = ""
    if promo_message:
        promo_html = f"""
        <div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #92400e; font-size: 15px; margin: 0;">
                <strong>🎁 {promo_message}</strong>
            </p>
        </div>
        """
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">{icon}</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">{title}</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">{subtitle}</p>
        </div>

        <!-- Main Message -->
        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="color: #166534; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">
                ✨ Create Your Gig with AI-Powered Tools
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6;">
                {main_message}
            </p>
        </div>

        <!-- Features -->
        <div style="margin: 30px 0;">
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">How It Works:</p>
            {features_html}
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="{cta_url}" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 18px 56px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 20px;
                      box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                {cta_text}
            </a>
        </div>

        {promo_html}

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie - Creative Collaboration Platform</p>
            <p style="margin: 0;">
                <a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | 
                <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
    """


# ============================================
# CAMPAIGN DEFINITIONS
# ============================================

CAMPAIGNS = [
    # 1. MODELS
    {
        'name': 'Models - Find Your Next Gig',
        'subject': 'Top Photographers Looking for Models Like You',
        'icon': '📸',
        'title': 'Get Booked for Premium Shoots',
        'subtitle': 'For Fashion & Commercial Models',
        'message': 'Photographers are creating gigs with AI-powered moodboards showing exactly what they need. Browse gigs with visual references and apply to perfect matches!',
        'features': [
            {'title': 'See the Vision', 'description': 'Browse gigs with AI-generated moodboards showing the exact look photographers want'},
            {'title': 'Perfect Matches', 'description': 'Apply only to shoots that match your style and portfolio'},
            {'title': 'Get Discovered', 'description': 'Top photographers can find and invite you to their projects'}
        ],
        'cta_text': 'Browse Modeling Gigs',
        'cta_url': 'https://presetie.com/gigs?category=model',
        'promo': 'Complete your profile to get 3x more bookings!'
    },
    
    # 2. ACTORS
    {
        'name': 'Actors - Acting Opportunities',
        'subject': 'New Acting Opportunities This Week',
        'icon': '🎭',
        'title': '50+ Acting Gigs Available',
        'subtitle': 'For Actors & Performers',
        'message': 'Directors and producers are posting casting calls with detailed visual references. See exactly what they\'re looking for before you apply!',
        'features': [
            {'title': 'Commercial Casting', 'description': '15+ brand campaigns looking for actors'},
            {'title': 'Theater & Stage', 'description': '8 stage productions seeking talent'},
            {'title': 'Voice Acting', 'description': '12 voice-over opportunities available'}
        ],
        'cta_text': 'Browse Acting Gigs',
        'cta_url': 'https://presetie.com/gigs?talent=actor',
        'promo': 'New: AI headshot generator for your profile!'
    },
    
    # 3. DANCERS
    {
        'name': 'Dancers - Dance Opportunities',
        'subject': 'Music Videos & Performance Opportunities',
        'icon': '💃',
        'title': 'Dance Gigs Waiting for You',
        'subtitle': 'For Professional Dancers',
        'message': 'Choreographers and videographers need dancers for music videos, events, and performances. Apply to gigs with visual moodboards!',
        'features': [
            {'title': 'Music Videos', 'description': 'Dance in music videos for emerging and established artists'},
            {'title': 'Live Performances', 'description': 'Event and stage performance opportunities'},
            {'title': 'Commercial Work', 'description': 'Brand campaigns and commercial shoots'}
        ],
        'cta_text': 'Find Dance Gigs',
        'cta_url': 'https://presetie.com/gigs?talent=dancer',
        'promo': 'Upload your dance reel to get 5x more invites!'
    },
    
    # 4. MUSICIANS
    {
        'name': 'Musicians - Music Collaboration',
        'subject': 'Collaborate on Music Projects',
        'icon': '🎵',
        'title': 'Music Collaboration Opportunities',
        'subtitle': 'For Musicians & Singers',
        'message': 'Producers, videographers, and brands need musicians for various projects. Browse opportunities with clear creative direction!',
        'features': [
            {'title': 'Music Videos', 'description': 'Feature in music video productions'},
            {'title': 'Studio Sessions', 'description': 'Recording and collaboration opportunities'},
            {'title': 'Live Events', 'description': 'Performance and event opportunities'}
        ],
        'cta_text': 'Browse Music Gigs',
        'cta_url': 'https://presetie.com/gigs?talent=musician',
        'promo': ''
    },
    
    # 5. CONTENT CREATORS / INFLUENCERS
    {
        'name': 'Content Creators - Brand Partnerships',
        'subject': 'Brand Collaboration Opportunities',
        'icon': '📱',
        'title': 'Get Paid for Content Creation',
        'subtitle': 'For Influencers & Content Creators',
        'message': 'Brands and photographers are looking for content creators for campaigns. See visual moodboards before applying!',
        'features': [
            {'title': 'Brand Campaigns', 'description': 'Paid partnerships with established brands'},
            {'title': 'Content Shoots', 'description': 'Photoshoots and video productions for social media'},
            {'title': 'UGC Opportunities', 'description': 'User-generated content projects'}
        ],
        'cta_text': 'Find Brand Deals',
        'cta_url': 'https://presetie.com/gigs?talent=content-creator',
        'promo': 'Verified creators get priority access to premium brands!'
    },
    
    # 6. FASHION PHOTOGRAPHERS
    {
        'name': 'Fashion Photographers - Create Gigs',
        'subject': 'Find Fashion Models with AI-Powered Gigs',
        'icon': '📸',
        'title': 'Book Models 3x Faster',
        'subtitle': 'For Fashion Photographers',
        'message': 'Use our AI Playground to generate fashion concepts, create professional moodboards, and attract the perfect models for your shoots!',
        'features': [
            {'title': 'AI Concept Generation', 'description': 'Generate unlimited fashion shoot concepts in minutes'},
            {'title': 'Professional Moodboards', 'description': 'Create visual moodboards that show models exactly what you need'},
            {'title': 'Perfect Matches', 'description': 'Get 90% better model applications when you include moodboards'}
        ],
        'cta_text': 'Create Fashion Gig',
        'cta_url': 'https://presetie.com/playground',
        'promo': 'Free AI credits for your first moodboard!'
    },
    
    # 7. VIDEOGRAPHERS / CINEMATOGRAPHERS
    {
        'name': 'Videographers - Music Video Gigs',
        'subject': 'Create Music Video Gigs with AI',
        'icon': '🎬',
        'title': 'Find Talent for Your Video Projects',
        'subtitle': 'For Videographers & Cinematographers',
        'message': 'Generate cinematic moodboards with AI, post your music video or commercial gigs, and get applications from dancers, actors, and models!',
        'features': [
            {'title': 'Cinematic AI Generation', 'description': 'Create stunning visual concepts for your video projects'},
            {'title': 'Visual Moodboards', 'description': 'Show talent exactly what you envision'},
            {'title': 'Quality Applications', 'description': 'Attract perfect-fit talent with visual references'}
        ],
        'cta_text': 'Create Video Gig',
        'cta_url': 'https://presetie.com/playground',
        'promo': '50 free AI generation credits this week!'
    },
    
    # 8. PORTRAIT PHOTOGRAPHERS
    {
        'name': 'Portrait Photographers - Book Talent',
        'subject': 'Book Portrait Models with AI Tools',
        'icon': '👤',
        'title': 'Create Stunning Portrait Gigs',
        'subtitle': 'For Portrait Photographers',
        'message': 'Generate portrait concepts, build moodboards, and find models who match your artistic vision perfectly!',
        'features': [
            {'title': 'Portrait Ideation', 'description': 'AI generates portrait concepts in any style you imagine'},
            {'title': 'Style Matching', 'description': 'Attract models who specialize in your portrait style'},
            {'title': 'Faster Booking', 'description': 'Moodboards help you book talent 2.5x faster'}
        ],
        'cta_text': 'Start Creating',
        'cta_url': 'https://presetie.com/playground',
        'promo': ''
    },
    
    # 9. MAKEUP ARTISTS
    {
        'name': 'Makeup Artists - Find Opportunities',
        'subject': 'Makeup Artist Opportunities Available',
        'icon': '💄',
        'title': 'Get Booked for Photoshoots',
        'subtitle': 'For Makeup Artists',
        'message': 'Photographers and videographers need makeup artists for their shoots. Browse gigs with visual references showing the makeup style needed!',
        'features': [
            {'title': 'Editorial Shoots', 'description': 'Work on high-fashion editorial photoshoots'},
            {'title': 'Video Productions', 'description': 'Music videos and commercial productions'},
            {'title': 'Bridal & Events', 'description': 'Wedding photography and event shoots'}
        ],
        'cta_text': 'Browse MUA Gigs',
        'cta_url': 'https://presetie.com/gigs?talent=makeup-artist',
        'promo': 'Showcase your work to get 4x more bookings!'
    },
    
    # 10. HAIR STYLISTS
    {
        'name': 'Hair Stylists - Creative Opportunities',
        'subject': 'Hair Styling Opportunities for Creatives',
        'icon': '💇',
        'title': 'Style for Top Photoshoots',
        'subtitle': 'For Hair Stylists',
        'message': 'Join photoshoots, music videos, and fashion campaigns. See visual moodboards before applying!',
        'features': [
            {'title': 'Fashion Shoots', 'description': 'Style hair for editorial and commercial fashion'},
            {'title': 'Video Productions', 'description': 'Music videos and branded content'},
            {'title': 'Creative Projects', 'description': 'Avant-garde and artistic collaborations'}
        ],
        'cta_text': 'Find Styling Gigs',
        'cta_url': 'https://presetie.com/gigs?talent=hair-stylist',
        'promo': ''
    },
    
    # 11. GRAPHIC DESIGNERS
    {
        'name': 'Graphic Designers - Creative Briefs',
        'subject': 'Visual Design Projects Available',
        'icon': '🎨',
        'title': 'Design Collaboration Opportunities',
        'subtitle': 'For Graphic Designers',
        'message': 'Work with photographers and brands on visual identity, album art, and campaign graphics. See project briefs with visual references!',
        'features': [
            {'title': 'Brand Campaigns', 'description': 'Design graphics for brand and marketing campaigns'},
            {'title': 'Album Artwork', 'description': 'Create artwork for music releases'},
            {'title': 'Social Media', 'description': 'Design for content creators and influencers'}
        ],
        'cta_text': 'Browse Design Gigs',
        'cta_url': 'https://presetie.com/gigs?specialization=graphic-design',
        'promo': ''
    },
    
    # 12. VIDEO EDITORS
    {
        'name': 'Video Editors - Editing Projects',
        'subject': 'Video Editing Opportunities',
        'icon': '✂️',
        'title': 'Find Video Editing Projects',
        'subtitle': 'For Video Editors',
        'message': 'Musicians, videographers, and brands need skilled editors. Browse projects with clear visual references and style guides!',
        'features': [
            {'title': 'Music Videos', 'description': 'Edit music videos for artists and labels'},
            {'title': 'Commercial Content', 'description': 'Brand campaigns and advertising content'},
            {'title': 'Social Media', 'description': 'Short-form content for TikTok, Instagram, YouTube'}
        ],
        'cta_text': 'Find Editing Work',
        'cta_url': 'https://presetie.com/gigs?specialization=video-editing',
        'promo': ''
    },
    
    # 13. VOICE ACTORS
    {
        'name': 'Voice Actors - VO Opportunities',
        'subject': 'Voice Acting Opportunities',
        'icon': '🎙️',
        'title': 'Voice Over Gigs Available',
        'subtitle': 'For Voice Actors',
        'message': 'Find voice-over work for commercials, animations, podcasts, and more. See detailed project briefs before auditioning!',
        'features': [
            {'title': 'Commercial VO', 'description': 'Brand commercials and advertising voice work'},
            {'title': 'Character Work', 'description': 'Animation and video game voice acting'},
            {'title': 'Narration', 'description': 'Documentary and podcast narration'}
        ],
        'cta_text': 'Browse VO Gigs',
        'cta_url': 'https://presetie.com/gigs?talent=voice-actor',
        'promo': 'Upload your demo reel to stand out!'
    },
    
    # 14. PRESENTERS / PUBLIC SPEAKERS
    {
        'name': 'Presenters - Speaking Opportunities',
        'subject': 'Presenting & Speaking Opportunities',
        'icon': '🎤',
        'title': 'Get Booked for Events',
        'subtitle': 'For Presenters & Public Speakers',
        'message': 'Event organizers and brands need presenters, hosts, and speakers. Find opportunities with detailed event briefs!',
        'features': [
            {'title': 'Corporate Events', 'description': 'Host conferences, launches, and corporate gatherings'},
            {'title': 'Live Streams', 'description': 'Present for online events and webinars'},
            {'title': 'Brand Events', 'description': 'Ambassador and spokesperson opportunities'}
        ],
        'cta_text': 'Find Speaking Gigs',
        'cta_url': 'https://presetie.com/gigs?talent=presenter',
        'promo': ''
    },
    
    # 15. ILLUSTRATORS / DIGITAL ARTISTS
    {
        'name': 'Illustrators - Creative Projects',
        'subject': 'Illustration & Digital Art Projects',
        'icon': '🖌️',
        'title': 'Illustration Opportunities',
        'subtitle': 'For Illustrators & Digital Artists',
        'message': 'Collaborate with brands, musicians, and content creators on illustrations, character design, and visual art!',
        'features': [
            {'title': 'Album Artwork', 'description': 'Create artwork for music releases and singles'},
            {'title': 'Brand Illustration', 'description': 'Commercial illustration for brands and campaigns'},
            {'title': 'Character Design', 'description': 'Design characters for content and animation'}
        ],
        'cta_text': 'Browse Art Projects',
        'cta_url': 'https://presetie.com/gigs?specialization=illustration',
        'promo': ''
    }
]


def main():
    if not PLUNK_API_KEY:
        print("❌ PLUNK_API_KEY not found in environment variables")
        return

    print("🚀 Sending Role-Based Campaigns to Plunk")
    print("=" * 70)
    print(f"\n📊 Total campaigns to create: {len(CAMPAIGNS)}")
    print(f"📧 Test recipient: {TEST_EMAIL}")
    print("\n" + "=" * 70 + "\n")

    created_campaigns = []

    for i, campaign in enumerate(CAMPAIGNS, 1):
        print(f"📋 Campaign {i}/{len(CAMPAIGNS)}: {campaign['name']}")
        print("-" * 70)
        print(f"   Target: {campaign['subtitle']}")
        print(f"   Subject: {campaign['subject']}")
        print()
        
        html = get_base_template(
            icon=campaign['icon'],
            title=campaign['title'],
            subtitle=campaign['subtitle'],
            main_message=campaign['message'],
            features=campaign['features'],
            cta_text=campaign['cta_text'],
            cta_url=campaign['cta_url'],
            promo_message=campaign.get('promo', '')
        )
        
        result = create_plunk_campaign(
            name=campaign['name'],
            subject=campaign['subject'],
            body=html,
            recipients=[TEST_EMAIL],
            style='HTML'
        )
        
        if result:
            print(f"   ✅ Created: {result.get('id')}")
            print(f"   📊 Status: {result.get('status')}")
            created_campaigns.append({
                'name': campaign['name'],
                'id': result.get('id'),
                'subject': result.get('subject'),
                'target': campaign['subtitle']
            })
        else:
            print(f"   ❌ Failed to create")
        
        print()

    # Summary
    print("=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"✅ Successfully created: {len(created_campaigns)}/{len(CAMPAIGNS)} campaigns\n")

    if created_campaigns:
        print("📋 Created Campaigns by Category:\n")
        
        print("🎭 TALENT CAMPAIGNS:")
        for camp in created_campaigns:
            if any(word in camp['target'] for word in ['Models', 'Actors', 'Dancers', 'Musicians', 'Creators', 'Artists', 'Voice', 'Presenters', 'Makeup', 'Hair', 'Illustrators']):
                print(f"   • {camp['name']}")
                print(f"     ID: {camp['id']}")
                print(f"     Subject: {camp['subject']}")
                print()
        
        print("\n📸 CONTRIBUTOR CAMPAIGNS:")
        for camp in created_campaigns:
            if any(word in camp['target'] for word in ['Photographers', 'Videographers', 'Cinematographers', 'Editors', 'Designers']):
                print(f"   • {camp['name']}")
                print(f"     ID: {camp['id']}")
                print(f"     Subject: {camp['subject']}")
                print()
        
        print("\n🎯 Next Steps:")
        print("   1. Visit: https://app.useplunk.com/campaigns")
        print("   2. Review each campaign (they're saved as DRAFTS)")
        print("   3. Update recipients based on targeting:")
        print("      - Models → talent_category='Model'")
        print("      - Actors → talent_category='Actor'")
        print("      - Fashion Photographers → specialization='Fashion Photography'")
        print("      - etc.")
        print("   4. Click 'Send' when ready to launch")
        print()
        print(f"💡 Tip: Currently set to test email {TEST_EMAIL}")
        print("   Use the PlunkCampaignsService in your app to send to targeted users!")
        print()
        print("🎨 All campaigns feature:")
        print("   • Professional HTML design")
        print("   • Role-specific messaging")
        print("   • Clear CTAs with moodboard promotion")
        print("   • Unsubscribe links included")
    else:
        print("❌ No campaigns were created. Check your PLUNK_API_KEY and try again.")
    
    print()


if __name__ == '__main__':
    main()

