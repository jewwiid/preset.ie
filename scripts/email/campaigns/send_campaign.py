#!/usr/bin/env python3
"""
Quick Campaign Sender
Send targeted Plunk campaigns from command line
"""

import requests
import os
from dotenv import load_dotenv

load_dotenv()

APP_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')

def send_campaign(
    name,
    talent_categories=None,
    specializations=None,
    cities=None,
    subject='',
    message='',
    cta_text='',
    cta_url='',
    test_email=None,
    send_now=False
):
    """Send a targeted campaign via API"""
    
    targeting = {}
    
    if talent_categories:
        targeting['talentCategories'] = talent_categories
    
    if specializations:
        targeting['specializations'] = specializations
    
    if cities:
        targeting['cities'] = cities
    
    # Build email body (simple HTML for now)
    body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">{subject}</h1>
        <p style="color: #4b5563; font-size: 16px;">{message}</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{cta_url}" 
               style="display: inline-block; 
                      background: #00876f; 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;">
                {cta_text}
            </a>
        </div>
    </div>
    """
    
    payload = {
        'name': name,
        'targeting': targeting,
        'content': {
            'subject': subject,
            'body': body
        },
        'sendNow': send_now
    }
    
    if test_email:
        payload['testEmails'] = [test_email]
    
    print(f"🚀 Creating campaign: {name}")
    print(f"📊 Targeting: {targeting}")
    print()
    
    try:
        response = requests.post(
            f'{APP_URL}/api/campaigns/create',
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Campaign created successfully!")
            print(f"📧 Campaign ID: {result.get('campaignId')}")
            print(f"👥 Recipients: {result.get('recipientCount')}")
            print(f"📊 Status: {result.get('status')}")
            print(f"💬 {result.get('message')}")
            
            if test_email:
                print(f"\n🧪 Test email sent to: {test_email}")
            
            return result
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")


# ============================================
# Pre-configured Campaigns
# ============================================

def send_actors_campaign(test_email=None):
    """Send campaign to all actors"""
    return send_campaign(
        name='Actors Weekly Update',
        talent_categories=['Actor', 'Theater Actor', 'Voice Actor'],
        subject='New Acting Opportunities This Week',
        message='We have 50+ new acting gigs perfect for your profile. From commercial work to theater productions!',
        cta_text='Browse Acting Gigs',
        cta_url='https://presetie.com/gigs?talent=actor',
        test_email=test_email,
        send_now=False
    )

def send_videographers_campaign(test_email=None):
    """Send campaign to all videographers"""
    return send_campaign(
        name='Videographers Opportunities',
        specializations=['Cinematography', 'Video Production', 'Music Video Production'],
        subject='Premium Video Projects Available',
        message='Major brands are looking for cinematographers. Paid opportunities with creative freedom!',
        cta_text='View Video Projects',
        cta_url='https://presetie.com/gigs?type=video',
        test_email=test_email,
        send_now=False
    )

def send_models_la_campaign(test_email=None):
    """Send campaign to LA models"""
    return send_campaign(
        name='LA Models - Fashion Week',
        talent_categories=['Model'],
        cities=['Los Angeles', 'West Hollywood', 'Santa Monica'],
        subject='LA Fashion Week - Casting Now',
        message='Top designers are casting models for Fashion Week. Don\'t miss your chance to walk the runway!',
        cta_text='View Castings',
        cta_url='https://presetie.com/gigs?location=la&type=fashion',
        test_email=test_email,
        send_now=False
    )


# ============================================
# Main Menu
# ============================================

if __name__ == '__main__':
    print('🎯 Quick Campaign Sender\n')
    print('=' * 50)
    print('\nPre-configured campaigns:')
    print('1. Actors Campaign')
    print('2. Videographers Campaign')
    print('3. LA Models Campaign')
    print('4. Custom Campaign')
    print()
    
    choice = input('Choose campaign (1-4): ')
    test_email = input('Test email (or press Enter to skip): ').strip() or None
    
    print()
    
    if choice == '1':
        send_actors_campaign(test_email)
    elif choice == '2':
        send_videographers_campaign(test_email)
    elif choice == '3':
        send_models_la_campaign(test_email)
    elif choice == '4':
        print('Custom campaign builder - use scripts/send-campaign.ts instead')
    else:
        print('❌ Invalid choice')

