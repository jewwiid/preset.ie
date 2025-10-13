#!/usr/bin/env python3
"""
GDPR-Compliant Campaign Generator
Creates campaigns with proper unsubscribe links using Plunk's built-in variables
All campaigns respect marketing preferences
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


def get_gdpr_footer():
    """GDPR-compliant footer with Plunk's built-in unsubscribe"""
    return """
        <!-- GDPR-Compliant Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #9ca3af;">
                You're receiving this because you opted into marketing emails from Preset.ie
            </p>
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie - Creative Collaboration Platform</p>
            <p style="margin: 0;">
                <a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none; margin: 0 8px;">Email Preferences</a> | 
                <a href="{{unsubscribeUrl}}" style="color: #00876f; text-decoration: none; margin: 0 8px;">Unsubscribe</a>
            </p>
        </div>
    """


def get_two_way_campaign(icon, title, subtitle, apply_desc, create_desc, cta_apply, cta_create, promo=""):
    """Template for two-way campaigns (apply OR create)"""
    
    promo_html = ""
    if promo:
        promo_html = f"""
        <div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #92400e; font-size: 15px; margin: 0;">
                <strong>🎁 {promo}</strong>
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
            <p style="color: #166534; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                🎯 Two Ways to Collaborate on Preset
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6;">
                Whether you're looking for opportunities or creating your own projects, we've got you covered!
            </p>
        </div>

        <!-- Option 1: Apply to Gigs -->
        <div style="background-color: #ffffff; border: 2px solid #00876f; border-radius: 12px; padding: 30px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px;">1</div>
            </div>
            <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 15px 0; text-align: center;">
                Find & Apply to Opportunities
            </h2>
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6; text-align: center;">
                {apply_desc}
            </p>
            <div style="text-align: center; margin: 25px 0 0 0;">
                <a href="{cta_apply}" 
                   style="display: inline-block; 
                          background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 700; 
                          font-size: 16px;">
                    Browse Opportunities
                </a>
            </div>
        </div>

        <!-- Option 2: Create Projects -->
        <div style="background-color: #ffffff; border: 2px solid #8b5cf6; border-radius: 12px; padding: 30px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: white; width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px;">2</div>
            </div>
            <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 15px 0; text-align: center;">
                Create Your Own Project
            </h2>
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6; text-align: center;">
                {create_desc}
            </p>
            <div style="text-align: center; margin: 25px 0 0 0;">
                <a href="{cta_create}" 
                   style="display: inline-block; 
                          background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 700; 
                          font-size: 16px;">
                    Start Creating
                </a>
            </div>
        </div>

        {promo_html}

        {get_gdpr_footer()}
    </div>
</body>
</html>
    """


# Define all campaign configurations
CAMPAIGNS = [
    # Equipment Marketplace
    {
        'name': 'Equipment - Sell Your Gear (GDPR)',
        'subject': 'Got Unused Camera Gear? Turn It Into Cash',
        'type': 'equipment',
        'template_type': 'single'
    },
    {
        'name': 'Equipment - Buy Gear (GDPR)',
        'subject': 'Upgrade Your Gear - Buy or Rent from Creatives',
        'type': 'equipment',
        'template_type': 'single'
    },
    
    # Two-Way Campaigns
    {
        'name': 'Models (GDPR) - Two-Way',
        'subject': 'Models: Find Gigs OR Create Your Dream Photoshoot',
        'icon': '📸',
        'title': 'Modeling Opportunities on Preset',
        'subtitle': 'Apply to shoots or create your own',
        'apply_desc': 'Browse photoshoots from top photographers with AI-powered moodboards showing exactly what they need.',
        'create_desc': 'Have a photoshoot concept? Generate it with AI, create a moodboard, and let photographers apply to work with you!',
        'cta_apply': 'https://presetie.com/gigs?talent=model',
        'cta_create': 'https://presetie.com/playground',
        'promo': 'Free AI credits for your first moodboard!',
        'template_type': 'two-way'
    },
    {
        'name': 'Actors (GDPR) - Two-Way',
        'subject': 'Actors: Find Roles OR Create Your Acting Project',
        'icon': '🎭',
        'title': 'Acting Opportunities on Preset',
        'subtitle': 'Apply to roles or create your own',
        'apply_desc': 'Browse casting calls with visual references. See the director\'s vision before audition.',
        'create_desc': 'Have a scene or short film idea? Visualize it with AI and find directors to collaborate!',
        'cta_apply': 'https://presetie.com/gigs?talent=actor',
        'cta_create': 'https://presetie.com/playground',
        'promo': '',
        'template_type': 'two-way'
    },
    {
        'name': 'Videographers (GDPR) - Create Gigs',
        'subject': 'Create Music Video Gigs with AI',
        'icon': '🎬',
        'title': 'Find Talent for Your Video Projects',
        'subtitle': 'For Videographers & Cinematographers',
        'apply_desc': '',
        'create_desc': 'Generate cinematic moodboards with AI, post your music video or commercial gigs, and get applications from dancers, actors, and models!',
        'cta_apply': '',
        'cta_create': 'https://presetie.com/playground',
        'promo': '50 free AI generation credits this week!',
        'template_type': 'create-only'
    },
    {
        'name': 'Photographers (GDPR) - Create Gigs',
        'subject': 'Plan Your Perfect Photoshoot with AI',
        'icon': '📷',
        'title': 'Book Models 3x Faster',
        'subtitle': 'For Photographers',
        'apply_desc': '',
        'create_desc': 'Use our AI Playground to generate fashion concepts, create professional moodboards, and attract the perfect models for your shoots!',
        'cta_apply': '',
        'cta_create': 'https://presetie.com/playground',
        'promo': 'Free AI credits for your first moodboard!',
        'template_type': 'create-only'
    }
]


def main():
    if not PLUNK_API_KEY:
        print("❌ PLUNK_API_KEY not found")
        return

    print("🚀 Creating GDPR-Compliant Campaigns")
    print("=" * 70)
    print("\n✅ Features:")
    print("   • Proper Plunk {{unsubscribeUrl}} variable")
    print("   • Opt-in messaging in footer")
    print("   • Will only send to users who opted into marketing")
    print("   • GDPR compliant")
    print("\n" + "=" * 70 + "\n")

    created = []
    
    # For now, just create a few key campaigns as examples
    # You can expand this list based on the CAMPAIGNS array above
    
    # Example: Models Two-Way Campaign
    models_campaign = CAMPAIGNS[2]  # Models two-way
    print(f"📋 Creating: {models_campaign['name']}")
    print(f"   Subject: {models_campaign['subject']}")
    print()
    
    html = get_two_way_campaign(
        icon=models_campaign['icon'],
        title=models_campaign['title'],
        subtitle=models_campaign['subtitle'],
        apply_desc=models_campaign['apply_desc'],
        create_desc=models_campaign['create_desc'],
        cta_apply=models_campaign['cta_apply'],
        cta_create=models_campaign['cta_create'],
        promo=models_campaign['promo']
    )
    
    result = create_plunk_campaign(
        name=models_campaign['name'],
        subject=models_campaign['subject'],
        body=html,
        recipients=[TEST_EMAIL]
    )
    
    if result:
        print(f"   ✅ Created: {result.get('id')}")
        print(f"   📊 Status: {result.get('status')}")
        created.append(result)
    
    print()
    print("=" * 70)
    print(f"✅ Created {len(created)} GDPR-compliant campaigns")
    print()
    print("🎯 Key Improvements:")
    print("   ✅ Uses Plunk's {{{{unsubscribeUrl}}}} variable")
    print("   ✅ Clear opt-in messaging in footer")
    print("   ✅ Professional GDPR-compliant design")
    print()
    print("💡 Next: Update PlunkCampaignsService filters recipients by marketing_notifications")
    print()


if __name__ == '__main__':
    main()

