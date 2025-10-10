#!/usr/bin/env python3
"""
Create Test Campaigns in Plunk
This will create DRAFT campaigns in your Plunk account that you can review and send
Based on: https://docs.useplunk.com/api-reference/campaigns/create
"""

import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

PLUNK_API_KEY = os.getenv('PLUNK_API_KEY')
PLUNK_API_URL = 'https://api.useplunk.com/v1'

def create_plunk_campaign(subject, body, recipients, style='HTML'):
    """
    Create a campaign in Plunk
    Returns campaign ID if successful
    """
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
            campaign = response.json()
            print(f"✅ Campaign created: {campaign.get('id')}")
            print(f"   Subject: {campaign.get('subject')}")
            print(f"   Status: {campaign.get('status')}")
            print(f"   Recipients: {len(recipients)}")
            return campaign
        else:
            print(f"❌ Failed to create campaign: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating campaign: {e}")
        return None


def get_actors_campaign_html():
    """Generate HTML for actors campaign"""
    return """
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
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">50+ New Acting Opportunities</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">Exclusively for Actors on Preset</p>
        </div>

        <!-- Message -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6;">
                We've curated the best acting opportunities for you this week. From commercial work to theater productions, there's something for everyone!
            </p>
        </div>

        <!-- Features -->
        <div style="margin: 30px 0;">
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Commercial Casting</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">15 brand campaigns looking for actors</p>
            </div>
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Theater Productions</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">8 stage productions seeking talent</p>
            </div>
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Voice Work</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">12 voice acting opportunities</p>
            </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/gigs?talent=actor" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 16px 48px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 18px;">
                Browse Acting Gigs
            </a>
        </div>

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

def get_videographers_campaign_html():
    """Generate HTML for videographers campaign"""
    return """
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
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px;">
                <svg width="30" height="30" fill="white" viewBox="0 0 24 24" style="margin-top: 15px;">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
            </div>
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Premium Video Projects</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">For Videographers & Cinematographers</p>
        </div>

        <!-- Message -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6;">
                Major brands and artists are looking for skilled cinematographers. Paid opportunities with creative freedom!
            </p>
        </div>

        <!-- Features -->
        <div style="margin: 30px 0;">
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Music Videos</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Work with emerging and established artists</p>
            </div>
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Commercial Production</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Brand campaigns with 5-figure budgets</p>
            </div>
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Documentary Projects</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Long-form storytelling opportunities</p>
            </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/gigs?type=video" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 16px 48px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 18px;">
                Browse Video Projects
            </a>
        </div>

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

def get_models_campaign_html():
    """Generate HTML for models campaign"""
    return """
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
            <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Fashion Week Opportunities</h1>
            <p style="color: #6b7280; font-size: 16px; margin: 0;">For Fashion Models</p>
        </div>

        <!-- Message -->
        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Top fashion photographers are booking models for premium editorial shoots. Get booked now!
            </p>
        </div>

        <!-- Stats -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; margin: 30px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-around; text-align: center;">
                <div style="flex: 1; padding: 10px;">
                    <p style="color: #00876f; font-size: 32px; font-weight: 800; margin: 0;">48</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Active Gigs</p>
                </div>
                <div style="flex: 1; padding: 10px;">
                    <p style="color: #00876f; font-size: 32px; font-weight: 800; margin: 0;">$500+</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Avg. Payment</p>
                </div>
                <div style="flex: 1; padding: 10px;">
                    <p style="color: #00876f; font-size: 32px; font-weight: 800; margin: 0;">95%</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Booking Rate</p>
                </div>
            </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/gigs?category=fashion" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 16px 48px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 18px;">
                View Fashion Gigs
            </a>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie</p>
            <p style="margin: 0;">
                <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
"""

def main():
    if not PLUNK_API_KEY:
        print("❌ Please set your PLUNK_API_KEY environment variable")
        print("   Example: export PLUNK_API_KEY='sk_your_secret_key_here'")
        return
    
    print("🎯 Creating Test Campaigns in Your Plunk Account")
    print("=" * 60)
    print()
    print("These will be created as DRAFTS - you can review and send from")
    print("your Plunk dashboard at https://app.useplunk.com")
    print()
    print("=" * 60)
    print()
    
    # Get your email for test campaigns
    test_email = input("Enter your email to receive test campaigns: ").strip()
    
    if not test_email:
        print("❌ Email is required")
        return
    
    print(f"\n📧 Creating campaigns that will be sent to: {test_email}")
    print()
    
    campaigns_created = []
    
    # Campaign 1: Actors
    print("📋 Campaign 1: Actors Campaign")
    print("-" * 40)
    campaign1 = create_plunk_campaign(
        subject="New Acting Opportunities This Week",
        body=get_actors_campaign_html(),
        recipients=[test_email],
        style='HTML'
    )
    if campaign1:
        campaigns_created.append(campaign1)
    print()
    
    # Campaign 2: Videographers
    print("📋 Campaign 2: Videographers Campaign")
    print("-" * 40)
    campaign2 = create_plunk_campaign(
        subject="Premium Video Projects Available",
        body=get_videographers_campaign_html(),
        recipients=[test_email],
        style='HTML'
    )
    if campaign2:
        campaigns_created.append(campaign2)
    print()
    
    # Campaign 3: Fashion Models
    print("📋 Campaign 3: Fashion Models Campaign")
    print("-" * 40)
    campaign3 = create_plunk_campaign(
        subject="Fashion Week - Casting Now",
        body=get_models_campaign_html(),
        recipients=[test_email],
        style='HTML'
    )
    if campaign3:
        campaigns_created.append(campaign3)
    print()
    
    # Summary
    print("=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"✅ Campaigns created: {len(campaigns_created)}/3")
    print()
    
    if campaigns_created:
        print("📋 Campaign IDs:")
        for i, campaign in enumerate(campaigns_created, 1):
            print(f"   {i}. {campaign.get('id')} - {campaign.get('subject')}")
        print()
        print("🎯 Next Steps:")
        print("   1. Go to https://app.useplunk.com/campaigns")
        print("   2. You'll see your DRAFT campaigns")
        print("   3. Review each campaign")
        print("   4. Click 'Send' when ready")
        print()
        print(f"📧 Test campaigns will be sent to: {test_email}")
        print()
        print("💡 Tip: You can edit the recipients in Plunk dashboard before sending!")
    else:
        print("❌ No campaigns were created. Check your API key and try again.")
    
    print()

if __name__ == '__main__':
    main()

