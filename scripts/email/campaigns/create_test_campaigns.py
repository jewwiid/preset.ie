#!/usr/bin/env python3
"""
Create Test Campaigns in Plunk
Simple script to create 3 test campaigns in your Plunk account
"""

import requests
import os
from dotenv import load_dotenv

load_dotenv()

PLUNK_API_KEY = os.getenv('PLUNK_API_KEY')
PLUNK_API_URL = 'https://api.useplunk.com/v1'
YOUR_EMAIL = 'support@presetie.com'  # Change this to your email

def create_campaign(subject, body, recipients):
    """Create a campaign in Plunk"""
    payload = {
        'subject': subject,
        'body': body,
        'recipients': recipients,
        'style': 'HTML'
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
            print(f"❌ Error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

# Simple HTML templates
ACTORS_HTML = """
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #00876f; font-size: 28px;">50+ New Acting Opportunities</h1>
    <p style="color: #4b5563; font-size: 16px;">We've curated the best acting opportunities for you this week!</p>
    <div style="margin: 20px 0;">
        <div style="border-left: 4px solid #00876f; padding: 15px; margin: 10px 0; background: #f9fafb;">
            <strong>Commercial Casting</strong><br>
            <span style="color: #6b7280;">15 brand campaigns looking for actors</span>
        </div>
        <div style="border-left: 4px solid #00876f; padding: 15px; margin: 10px 0; background: #f9fafb;">
            <strong>Theater Productions</strong><br>
            <span style="color: #6b7280;">8 stage productions seeking talent</span>
        </div>
        <div style="border-left: 4px solid #00876f; padding: 15px; margin: 10px 0; background: #f9fafb;">
            <strong>Voice Work</strong><br>
            <span style="color: #6b7280;">12 voice acting opportunities</span>
        </div>
    </div>
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://presetie.com/gigs?talent=actor" 
           style="display: inline-block; background: #00876f; color: white; padding: 14px 32px; 
                  text-decoration: none; border-radius: 8px; font-weight: 600;">
            Browse Acting Gigs
        </a>
    </div>
</div>
"""

VIDEOGRAPHERS_HTML = """
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #00876f; font-size: 28px;">Premium Video Projects</h1>
    <p style="color: #4b5563; font-size: 16px;">Major brands are looking for cinematographers. Paid opportunities!</p>
    <div style="margin: 20px 0;">
        <div style="border-left: 4px solid #00876f; padding: 15px; margin: 10px 0; background: #f9fafb;">
            <strong>Music Videos</strong><br>
            <span style="color: #6b7280;">Work with top artists and labels</span>
        </div>
        <div style="border-left: 4px solid #00876f; padding: 15px; margin: 10px 0; background: #f9fafb;">
            <strong>Commercial Production</strong><br>
            <span style="color: #6b7280;">Brand campaigns with 5-figure budgets</span>
        </div>
        <div style="border-left: 4px solid #00876f; padding: 15px; margin: 10px 0; background: #f9fafb;">
            <strong>Documentary</strong><br>
            <span style="color: #6b7280;">Long-form storytelling projects</span>
        </div>
    </div>
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://presetie.com/gigs?type=video" 
           style="display: inline-block; background: #00876f; color: white; padding: 14px 32px; 
                  text-decoration: none; border-radius: 8px; font-weight: 600;">
            Browse Video Projects
        </a>
    </div>
</div>
"""

MODELS_HTML = """
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #00876f; font-size: 28px;">Fashion Week Opportunities</h1>
    <p style="color: #4b5563; font-size: 16px;">Top photographers booking models for premium shoots!</p>
    <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-around; text-align: center;">
            <div>
                <div style="color: #00876f; font-size: 32px; font-weight: 800;">48</div>
                <div style="color: #6b7280; font-size: 13px;">Active Gigs</div>
            </div>
            <div>
                <div style="color: #00876f; font-size: 32px; font-weight: 800;">$500+</div>
                <div style="color: #6b7280; font-size: 13px;">Avg. Pay</div>
            </div>
            <div>
                <div style="color: #00876f; font-size: 32px; font-weight: 800;">95%</div>
                <div style="color: #6b7280; font-size: 13px;">Booking Rate</div>
            </div>
        </div>
    </div>
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://presetie.com/gigs?category=fashion" 
           style="display: inline-block; background: #00876f; color: white; padding: 14px 32px; 
                  text-decoration: none; border-radius: 8px; font-weight: 600;">
            View Fashion Gigs
        </a>
    </div>
</div>
"""

def main():
    if not PLUNK_API_KEY:
        print("❌ PLUNK_API_KEY not set")
        return
    
    print("🎯 Creating Test Campaigns in Plunk")
    print("=" * 50)
    print(f"📧 Recipient: {YOUR_EMAIL}")
    print()
    
    campaigns = [
        {
            'name': 'Actors',
            'subject': 'New Acting Opportunities This Week',
            'body': ACTORS_HTML
        },
        {
            'name': 'Videographers',
            'subject': 'Premium Video Projects Available',
            'body': VIDEOGRAPHERS_HTML
        },
        {
            'name': 'Fashion Models',
            'subject': 'Fashion Week - Casting Now',
            'body': MODELS_HTML
        }
    ]
    
    created = []
    
    for campaign in campaigns:
        print(f"📋 Creating: {campaign['name']} Campaign")
        result = create_campaign(
            campaign['subject'],
            campaign['body'],
            [YOUR_EMAIL]
        )
        if result:
            print(f"   ✅ ID: {result.get('id')}")
            print(f"   📊 Status: {result.get('status')}")
            created.append(result)
        print()
    
    print("=" * 50)
    print(f"✅ Created {len(created)}/3 campaigns")
    print()
    print("🎯 View them at: https://app.useplunk.com/campaigns")
    print()
    print("💡 They're saved as DRAFTS - review and send when ready!")

if __name__ == '__main__':
    main()

