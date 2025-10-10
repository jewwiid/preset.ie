#!/usr/bin/env python3
"""
Specialized Campaign Templates for Different Roles & Specializations
Creates targeted campaigns for specific talent and contributor types
"""

import requests
import os
from dotenv import load_dotenv

load_dotenv()

PLUNK_API_KEY = os.getenv('PLUNK_API_KEY')
PLUNK_API_URL = 'https://api.useplunk.com/v1'
TEST_EMAIL = 'support@presetie.com'

def create_plunk_campaign(subject, body, recipients, style='HTML'):
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


# ============================================
# TALENT CAMPAIGNS (Apply for Gigs)
# ============================================

def get_models_campaign_html():
    """Campaign for Models - Browse Fashion & Editorial Gigs"""
    return """
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">👗</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Fashion Week Casting Calls</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">Exclusive Opportunities for Models</p>
        </div>

        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                🌟 48 Premium Gigs Available Now
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6;">
                Top photographers are casting for editorial shoots, fashion campaigns, and runway shows. Browse professional gigs with detailed moodboards!
            </p>
        </div>

        <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; margin: 30px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-around; text-align: center; flex-wrap: wrap;">
                <div style="flex: 1; padding: 10px; min-width: 120px;">
                    <p style="color: #00876f; font-size: 32px; font-weight: 800; margin: 0;">48</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Active Gigs</p>
                </div>
                <div style="flex: 1; padding: 10px; min-width: 120px;">
                    <p style="color: #00876f; font-size: 32px; font-weight: 800; margin: 0;">$500+</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Avg. Payment</p>
                </div>
                <div style="flex: 1; padding: 10px; min-width: 120px;">
                    <p style="color: #00876f; font-size: 32px; font-weight: 800; margin: 0;">95%</p>
                    <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Booking Rate</p>
                </div>
            </div>
        </div>

        <div style="margin: 30px 0;">
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">📸 Editorial Shoots</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">25 magazine features and editorial campaigns</p>
            </div>
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">💼 Brand Campaigns</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">15 commercial shoots with top brands</p>
            </div>
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">🎭 Portfolio Building</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">20+ TFP opportunities with experienced photographers</p>
            </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/gigs?category=model" 
               style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 18px 56px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 20px; box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Browse Model Gigs
            </a>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie</p>
            <p style="margin: 0;"><a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
"""


def get_actors_campaign_html():
    """Campaign for Actors - Browse Acting Gigs"""
    return """
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">🎭</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">50+ Acting Opportunities</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">From Commercials to Theater</p>
        </div>

        <div style="background-color: #eff6ff; border: 2px solid #93c5fd; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                🎬 Your Next Role Awaits
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Directors and casting agents are actively seeking talent. Browse gigs with detailed character breakdowns and creative briefs!
            </p>
        </div>

        <div style="margin: 30px 0;">
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <p style="color: #1e40af; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">COMMERCIAL WORK</p>
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Brand Campaigns</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">15 commercial casting calls for major brands</p>
            </div>
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <p style="color: #1e40af; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">STAGE PRODUCTIONS</p>
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Theater & Live Performance</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">12 theater productions seeking actors</p>
            </div>
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <p style="color: #1e40af; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">VOICE ACTING</p>
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Voiceover Projects</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">18 voice acting opportunities</p>
            </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/gigs?talent=actor" 
               style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 18px 56px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 20px; box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Browse Acting Gigs
            </a>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie</p>
            <p style="margin: 0;"><a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
"""


def get_dancers_campaign_html():
    """Campaign for Dancers - Browse Dance Gigs"""
    return """
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">💃</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Music Video & Performance Gigs</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">For Professional Dancers</p>
        </div>

        <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                🎵 Dance to the Beat
            </p>
            <p style="color: #78716c; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Top artists and videographers are seeking dancers for music videos, live performances, and creative projects!
            </p>
        </div>

        <div style="margin: 30px 0;">
            <div style="background-color: #ffffff; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">🎬 Music Videos</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">20 music video productions seeking dancers</p>
            </div>
            <div style="background-color: #ffffff; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">🎪 Live Performances</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">12 live shows and concerts</p>
            </div>
            <div style="background-color: #ffffff; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">📸 Creative Photoshoots</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">15 editorial and commercial dance photoshoots</p>
            </div>
        </div>

        <div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 15px; font-weight: 600; margin: 0 0 10px 0; text-align: center;">
                💰 Payment & Opportunities:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #78716c; font-size: 14px;">
                <li style="margin-bottom: 8px;">Paid gigs from $200-$1,500 per day</li>
                <li style="margin-bottom: 8px;">TFP portfolio building opportunities</li>
                <li style="margin-bottom: 8px;">Recurring performance contracts</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/gigs?talent=dancer" 
               style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 18px 56px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 20px; box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                View Dance Gigs
            </a>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie</p>
            <p style="margin: 0;"><a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
"""


# ============================================
# CONTRIBUTOR CAMPAIGNS (Create Gigs with AI)
# ============================================

def get_fashion_photography_campaign_html():
    """Campaign for Fashion Photographers - Create Gigs with AI"""
    return """
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">📸</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Find Perfect Models for Your Fashion Shoots</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">AI-Powered Casting Made Easy</p>
        </div>

        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #166534; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                🎨 Create Stunning Visual Briefs in Minutes
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Use AI to generate fashion shoot concepts, build professional moodboards, and attract top models who match your creative vision!
            </p>
        </div>

        <div style="background-color: #ffffff; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">Your Complete Workflow:</p>

            <div style="background-color: #f9fafb; padding: 18px; border-radius: 8px; margin-bottom: 12px;">
                <p style="color: #00876f; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">STEP 1: GENERATE</p>
                <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">AI Playground</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Generate fashion shoot concepts: "High fashion editorial, minimalist aesthetic, studio lighting"
                </p>
            </div>

            <div style="background-color: #f9fafb; padding: 18px; border-radius: 8px; margin-bottom: 12px;">
                <p style="color: #00876f; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">STEP 2: CREATE</p>
                <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">Build Moodboard</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Curate AI-generated images into a professional moodboard that shows your exact vision
                </p>
            </div>

            <div style="background-color: #f9fafb; padding: 18px; border-radius: 8px;">
                <p style="color: #00876f; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">STEP 3: CAST</p>
                <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">Post Gig & Get Models</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Publish your fashion shoot gig with moodboard. Get 3x more applications from perfect-match models!
                </p>
            </div>
        </div>

        <div style="background-color: #fffbeb; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                ⚡ Results You'll See:
            </p>
            <div style="display: grid; gap: 12px;">
                <div style="background-color: #ffffff; padding: 12px; border-radius: 6px;">
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0;">✓ <strong>75% more applications</strong> with visual moodboards</p>
                </div>
                <div style="background-color: #ffffff; padding: 12px; border-radius: 6px;">
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0;">✓ <strong>90% better model matches</strong> to your style</p>
                </div>
                <div style="background-color: #ffffff; padding: 12px; border-radius: 6px;">
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0;">✓ <strong>Save 3+ hours</strong> on pre-production planning</p>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 18px 56px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 20px; box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Start Your Fashion Shoot
            </a>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie</p>
            <p style="margin: 0;"><a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
"""


def get_wedding_photography_campaign_html():
    """Campaign for Wedding Photographers - Create Gigs with AI"""
    return """
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">💐</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Book Your Next Styled Wedding Shoot</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">Find Models & Couples Fast</p>
        </div>

        <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                👰 Plan Styled Shoots in Minutes
            </p>
            <p style="color: #78716c; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Generate wedding shoot concepts with AI, create beautiful moodboards, and find perfect couples and models for your portfolio shoots!
            </p>
        </div>

        <div style="margin: 30px 0;">
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">1</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Generate Wedding Concepts</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            "Romantic garden wedding, golden hour, bohemian style" - Get instant visual inspiration
                        </p>
                    </div>
                </div>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">2</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Create Visual Mood</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Build a moodboard showing couples exactly what you envision
                        </p>
                    </div>
                </div>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">3</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Book Perfect Couples</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Post styled shoot gig, get applications from engaged couples and models
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 18px 56px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 20px; box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Plan Your Styled Shoot
            </a>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie</p>
            <p style="margin: 0;"><a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
"""


def get_commercial_video_campaign_html():
    """Campaign for Commercial Videographers - Create Gigs with AI"""
    return """
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">🎥</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Cast Your Next Commercial</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">Find On-Camera Talent Fast</p>
        </div>

        <div style="background-color: #eff6ff; border: 2px solid #93c5fd; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #1e40af; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                📺 From Concept to Casting in 20 Minutes
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Use AI to visualize your commercial concept, create shot lists and moodboards, then find actors, models, and on-camera talent who fit the brief!
            </p>
        </div>

        <div style="background-color: #ffffff; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">Perfect for:</p>

            <div style="margin-bottom: 15px;">
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #00876f;">
                    <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Brand Commercials</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        Generate product showcase concepts, find on-camera talent
                    </p>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #00876f;">
                    <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Social Media Content</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        Create engaging video concepts, cast influencers and creators
                    </p>
                </div>
            </div>

            <div>
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #00876f;">
                    <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Promotional Videos</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        Visualize promotional concepts, find perfect spokesperson talent
                    </p>
                </div>
            </div>
        </div>

        <div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 15px; font-weight: 600; margin: 0 0 10px 0; text-align: center;">
                ⚡ Why Videographers Choose Preset:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #78716c; font-size: 14px;">
                <li style="margin-bottom: 8px;">Visual moodboards attract 3x more applications</li>
                <li style="margin-bottom: 8px;">Find talent who match your exact creative vision</li>
                <li style="margin-bottom: 8px;">Cut casting time from days to hours</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 18px 56px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 20px; box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Start Commercial Casting
            </a>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie</p>
            <p style="margin: 0;"><a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
"""


def get_portrait_photography_campaign_html():
    """Campaign for Portrait Photographers - Create Gigs with AI"""
    return """
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">🎨</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Create Stunning Portrait Sessions</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">AI-Powered Creative Direction</p>
        </div>

        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #166534; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                🎭 Never Run Out of Portrait Ideas
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Generate unique portrait concepts with AI, create mood references, and find models who bring your creative vision to life!
            </p>
        </div>

        <div style="margin: 30px 0;">
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">AI-Powered Portrait Planning:</p>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <p style="color: #00876f; font-size: 13px; font-weight: 700; margin: 0 0 8px 0;">CONCEPT GENERATION</p>
                <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">Generate Portrait Concepts</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    "Dramatic lighting, studio portrait, film noir aesthetic" - Get instant visual references
                </p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <p style="color: #00876f; font-size: 13px; font-weight: 700; margin: 0 0 8px 0;">MOOD CREATION</p>
                <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">Build Visual Briefs</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Curate AI images showing lighting, poses, and styling direction
                </p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <p style="color: #00876f; font-size: 13px; font-weight: 700; margin: 0 0 8px 0;">MODEL CASTING</p>
                <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">Find Perfect Models</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    Post gig with moodboard, get applications from models who match your style
                </p>
            </div>
        </div>

        <div style="background-color: #eff6ff; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="color: #1e40af; font-size: 15px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
                💡 Portrait Styles to Explore:
            </p>
            <div style="display: grid; gap: 8px;">
                <p style="color: #4b5563; font-size: 14px; margin: 0; padding: 8px; background: #ffffff; border-radius: 4px;">
                    • Environmental Portraits • Studio Headshots • Natural Light
                </p>
                <p style="color: #4b5563; font-size: 14px; margin: 0; padding: 8px; background: #ffffff; border-radius: 4px;">
                    • Dramatic Lighting • Lifestyle Portraits • Creative Concepts
                </p>
                <p style="color: #4b5563; font-size: 14px; margin: 0; padding: 8px; background: #ffffff; border-radius: 4px;">
                    • Black & White • Fine Art • Professional Headshots
                </p>
            </div>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 18px 56px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 20px; box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Generate Portrait Ideas
            </a>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <p style="margin: 0 0 10px 0;">© 2025 Preset.ie</p>
            <p style="margin: 0;"><a href="https://presetie.com/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | <a href="https://presetie.com/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
"""


# ============================================
# Main Script
# ============================================

def main():
    if not PLUNK_API_KEY:
        print("❌ PLUNK_API_KEY not found in environment variables")
        return

    print("🎯 Sending Specialized Campaigns to Plunk")
    print("=" * 70)
    print()
    print("Creating campaigns for specific roles and specializations...")
    print()
    print("=" * 70)
    print()

    campaigns = [
        # TALENT CAMPAIGNS (Browse Gigs)
        {
            'category': 'TALENT',
            'name': 'Fashion Models - Browse Gigs',
            'subject': 'Fashion Week Casting - 48 Premium Gigs Available',
            'html': get_models_campaign_html(),
            'target': 'Models (Fashion, Editorial, Commercial)',
            'description': 'Browse fashion, editorial, and commercial gigs'
        },
        {
            'category': 'TALENT',
            'name': 'Actors - Browse Gigs',
            'subject': '50+ Acting Opportunities - Commercial, Theater & Voice',
            'html': get_actors_campaign_html(),
            'target': 'Actors (Stage, Commercial, Voice)',
            'description': 'Browse acting, commercial, and voice gigs'
        },
        {
            'category': 'TALENT',
            'name': 'Dancers - Browse Gigs',
            'subject': 'Music Video & Performance Gigs for Dancers',
            'html': get_dancers_campaign_html(),
            'target': 'Dancers (All styles)',
            'description': 'Browse dance, music video, and performance gigs'
        },
        
        # CONTRIBUTOR CAMPAIGNS (Create Gigs with AI)
        {
            'category': 'CONTRIBUTOR',
            'name': 'Fashion Photographers - Create Gigs',
            'subject': 'Find Perfect Models for Your Fashion Shoots with AI',
            'html': get_fashion_photography_campaign_html(),
            'target': 'Fashion Photographers',
            'description': 'Use AI playground to create fashion shoot gigs and find models'
        },
        {
            'category': 'CONTRIBUTOR',
            'name': 'Wedding Photographers - Create Gigs',
            'subject': 'Book Your Next Styled Wedding Shoot Fast',
            'html': get_wedding_photography_campaign_html(),
            'target': 'Wedding Photographers',
            'description': 'Use AI to plan styled wedding shoots and find couples'
        },
        {
            'category': 'CONTRIBUTOR',
            'name': 'Commercial Videographers - Create Gigs',
            'subject': 'Cast Your Next Commercial in 20 Minutes',
            'html': get_commercial_video_campaign_html(),
            'target': 'Commercial Videographers',
            'description': 'Use AI to visualize commercials and cast on-camera talent'
        },
        {
            'category': 'CONTRIBUTOR',
            'name': 'Portrait Photographers - Create Gigs',
            'subject': 'Never Run Out of Portrait Ideas with AI',
            'html': get_portrait_photography_campaign_html(),
            'target': 'Portrait Photographers',
            'description': 'Generate portrait concepts and find models with AI'
        }
    ]

    created_campaigns = []

    for i, campaign in enumerate(campaigns, 1):
        category_emoji = "🎭" if campaign['category'] == 'TALENT' else "📸"
        print(f"{category_emoji} Campaign {i}/{len(campaigns)}: {campaign['name']}")
        print("-" * 70)
        print(f"   Category: {campaign['category']}")
        print(f"   Target: {campaign['target']}")
        print(f"   Purpose: {campaign['description']}")
        print(f"   Subject: {campaign['subject']}")
        print()
        
        result = create_plunk_campaign(
            subject=campaign['subject'],
            body=campaign['html'],
            recipients=[TEST_EMAIL],
            style='HTML'
        )
        
        if result:
            print(f"   ✅ Created: {result.get('id')}")
            print(f"   📊 Status: {result.get('status')}")
            created_campaigns.append({
                'category': campaign['category'],
                'name': campaign['name'],
                'id': result.get('id'),
                'subject': result.get('subject'),
                'target': campaign['target']
            })
        else:
            print(f"   ❌ Failed to create")
        
        print()

    # Summary
    print("=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"✅ Successfully created: {len(created_campaigns)}/{len(campaigns)} campaigns")
    print()

    if created_campaigns:
        talent_campaigns = [c for c in created_campaigns if c['category'] == 'TALENT']
        contributor_campaigns = [c for c in created_campaigns if c['category'] == 'CONTRIBUTOR']

        if talent_campaigns:
            print("🎭 TALENT CAMPAIGNS (Browse Gigs):")
            for i, campaign in enumerate(talent_campaigns, 1):
                print(f"   {i}. {campaign['id']}")
                print(f"      {campaign['name']}")
                print(f"      Target: {campaign['target']}")
                print()

        if contributor_campaigns:
            print("📸 CONTRIBUTOR CAMPAIGNS (Create Gigs with AI):")
            for i, campaign in enumerate(contributor_campaigns, 1):
                print(f"   {i}. {campaign['id']}")
                print(f"      {campaign['name']}")
                print(f"      Target: {campaign['target']}")
                print()
        
        print("🎯 Next Steps:")
        print("   1. Visit: https://app.useplunk.com/campaigns")
        print("   2. Review each campaign")
        print("   3. Update recipients based on targeting:")
        print()
        print("   TALENT CAMPAIGNS → Send to:")
        print("      • Models → talentCategories: ['Model']")
        print("      • Actors → talentCategories: ['Actor', 'Voice Actor']")
        print("      • Dancers → talentCategories: ['Dancer']")
        print()
        print("   CONTRIBUTOR CAMPAIGNS → Send to:")
        print("      • Fashion Photographers → specializations: ['Fashion Photography']")
        print("      • Wedding Photographers → specializations: ['Wedding Photography']")
        print("      • Commercial Videographers → specializations: ['Commercial Video']")
        print("      • Portrait Photographers → specializations: ['Portrait Photography']")
        print()
        print(f"💡 Currently set to test: {TEST_EMAIL}")
        print("   Update in Plunk dashboard before sending!")
    else:
        print("❌ No campaigns were created.")
    
    print()


if __name__ == '__main__':
    main()

