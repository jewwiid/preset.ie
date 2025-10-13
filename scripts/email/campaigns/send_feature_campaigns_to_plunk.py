#!/usr/bin/env python3
"""
Send All Feature Campaign Templates to Plunk
Creates all feature campaigns from feature-campaigns.templates.ts in Plunk as DRAFTS
"""

import requests
import os
from dotenv import load_dotenv

load_dotenv()

PLUNK_API_KEY = os.getenv('PLUNK_API_KEY')
PLUNK_API_URL = 'https://api.useplunk.com/v1'
TEST_EMAIL = 'support@presetie.com'  # Change to your email

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
            campaign = response.json()
            return campaign
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


# ============================================
# Campaign 1: Music Video Playground Campaign
# ============================================

def get_music_video_playground_html():
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
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                    <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
                </svg>
            </div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Create Stunning Music Videos</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">Turn your creative vision into reality with AI</p>
        </div>

        <!-- Feature Callout -->
        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                🎬 New: AI-Powered Creative Playground
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6;">
                Generate music video concepts, create visual moodboards, and find the perfect models to bring your ideas to life - all in one platform!
            </p>
        </div>

        <!-- How It Works -->
        <div style="margin: 30px 0;">
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">How It Works:</p>
            
            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 20px; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background-color: #00876f; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">1</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Use the AI Playground</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Generate cinematic visuals for your music video concept. Try different styles, moods, and aesthetics in seconds.
                        </p>
                    </div>
                </div>
            </div>

            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 20px; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background-color: #00876f; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">2</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Create a Stunning Moodboard</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Turn your AI-generated visuals into a professional moodboard that shows models exactly what you're looking for.
                        </p>
                    </div>
                </div>
            </div>

            <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 20px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background-color: #00876f; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">3</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Post Your Music Video Gig</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Publish your gig with the moodboard attached. Get applications from models and dancers who match your vision!
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Benefits -->
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <p style="color: #92400e; font-size: 15px; font-weight: 600; margin: 0 0 10px 0;">
                ✨ Why Videographers Love This Feature:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #78716c; font-size: 14px;">
                <li style="margin-bottom: 8px;">Generate unlimited visual concepts in minutes</li>
                <li style="margin-bottom: 8px;">Clearly communicate your creative vision</li>
                <li style="margin-bottom: 8px;">Attract the perfect models for your project</li>
                <li style="margin-bottom: 8px;">Save hours on planning and pre-production</li>
            </ul>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 18px 56px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 18px;
                      box-shadow: 0 4px 14px rgba(0, 135, 111, 0.4);">
                Try AI Playground Now
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


# ============================================
# Campaign 2: Photography Playground Campaign
# ============================================

def get_photography_playground_html():
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
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                </svg>
            </div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Plan Your Perfect Photoshoot</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">With AI-powered creative tools</p>
        </div>

        <!-- Feature Callout -->
        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 15px 0; text-align: center;">
                Stop Spending Hours on Pinterest
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Generate custom photoshoot concepts, create professional moodboards, and find the perfect models - all in one place. Your next shoot starts here!
            </p>
        </div>

        <!-- Workflow -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                From Concept to Collaboration:
            </p>

            <div style="margin-bottom: 20px;">
                <div style="background-color: #f9fafb; padding: 18px; border-radius: 8px; margin-bottom: 12px;">
                    <p style="color: #00876f; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">STEP 1: IDEATE</p>
                    <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">AI Playground</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        Describe your shoot idea, generate visuals in any style: editorial, fashion, portrait, lifestyle, etc.
                    </p>
                </div>

                <div style="background-color: #f9fafb; padding: 18px; border-radius: 8px; margin-bottom: 12px;">
                    <p style="color: #00876f; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">STEP 2: CURATE</p>
                    <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">Build Moodboard</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        Select your best AI-generated concepts, add reference images, create a cohesive visual direction
                    </p>
                </div>

                <div style="background-color: #f9fafb; padding: 18px; border-radius: 8px;">
                    <p style="color: #00876f; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">STEP 3: COLLABORATE</p>
                    <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">Post Gig with Moodboard</p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        Attach your moodboard to your gig. Models see your exact vision and you get perfect-match applications
                    </p>
                </div>
            </div>
        </div>

        <!-- Stats -->
        <div style="background-color: #fffbeb; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                🎯 Get Better Results:
            </p>
            <div style="display: grid; gap: 12px;">
                <div style="background-color: #ffffff; padding: 12px; border-radius: 6px;">
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0;">
                        ✓ <strong>75% more applications</strong> when you include a moodboard
                    </p>
                </div>
                <div style="background-color: #ffffff; padding: 12px; border-radius: 6px;">
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0;">
                        ✓ <strong>90% better matches</strong> - models understand your style
                    </p>
                </div>
                <div style="background-color: #ffffff; padding: 12px; border-radius: 6px;">
                    <p style="color: #1a1a1a; font-size: 14px; margin: 0;">
                        ✓ <strong>Save 3+ hours</strong> on shoot planning and pre-production
                    </p>
                </div>
            </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 18px 56px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 20px;
                      box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Try Playground Free
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


# ============================================
# Campaign 3: Moodboard Feature Campaign
# ============================================

def get_moodboard_feature_html():
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
            <div style="font-size: 80px; margin-bottom: 15px;">🎨</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Moodboards That Get You Booked</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">For Creatives on Preset</p>
        </div>

        <!-- Main Message -->
        <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                The Secret to Attracting Top Talent? 
            </p>
            <p style="color: #4b5563; font-size: 17px; margin: 0; line-height: 1.6; text-align: center;">
                <strong>Professional Moodboards.</strong>
            </p>
            <p style="color: #6b7280; font-size: 15px; margin: 15px 0 0 0; line-height: 1.6; text-align: center;">
                Gigs with moodboards get <strong>3x more applications</strong> and <strong>90% better matches</strong>. Here's how to create yours in minutes:
            </p>
        </div>

        <!-- Two Options -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
                🎨 Two Ways to Create Moodboards:
            </p>

            <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="color: #166534; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">Option 1: AI Playground (Recommended)</p>
                <p style="color: #4b5563; font-size: 14px; margin: 0; line-height: 1.6;">
                    Type your vision → Get instant visual references → Save to moodboard → Post gig
                </p>
                <p style="color: #166534; font-size: 13px; margin: 10px 0 0 0; font-weight: 600;">
                    ⚡ Takes 5-10 minutes
                </p>
            </div>

            <div style="background-color: #eff6ff; border: 2px solid #93c5fd; border-radius: 8px; padding: 20px;">
                <p style="color: #1e40af; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">Option 2: Upload Your Own</p>
                <p style="color: #4b5563; font-size: 14px; margin: 0; line-height: 1.6;">
                    Upload reference photos → Organize in moodboard → Add notes → Attach to gig
                </p>
                <p style="color: #1e40af; font-size: 13px; margin: 10px 0 0 0; font-weight: 600;">
                    📸 Perfect for specific looks
                </p>
            </div>
        </div>

        <!-- Pro Tip -->
        <div style="background-color: #f9fafb; border-left: 4px solid #00876f; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 10px 0;">
                💡 Pro Tip: Use AI Playground
            </p>
            <p style="color: #4b5563; font-size: 14px; margin: 0; line-height: 1.6;">
                Try prompts like: <em>"editorial fashion, moody lighting, urban setting"</em> - the AI generates multiple visual concepts you can refine and use in your moodboard!
            </p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 18px 56px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 20px;
                      box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Try AI Playground
            </a>
        </div>

        <!-- Stats -->
        <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-top: 30px;">
            <p style="color: #1e40af; font-size: 14px; margin: 0; text-align: center;">
                <strong>📊 Stats Don't Lie:</strong> Gigs with moodboards get booked 2.5x faster than those without!
            </p>
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


# ============================================
# Campaign 4: Create Gig with AI Campaign
# ============================================

def get_create_gig_with_ai_html():
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
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Create Your Next Project</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">With AI-powered tools in 3 simple steps</p>
        </div>

        <!-- Feature Callout -->
        <div style="background-color: #f0fdf4; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
            <p style="color: #166534; font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">
                🚀 Fastest Way to Post a Professional Gig
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0;">
                From blank canvas to fully-booked shoot in under 30 minutes
            </p>
        </div>

        <!-- Steps -->
        <div style="margin: 30px 0;">
            <div style="background-color: #ffffff; border: 2px solid #00876f; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px;">1</div>
                </div>
                <p style="color: #1a1a1a; font-size: 18px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">
                    Generate Your Vision
                </p>
                <p style="color: #4b5563; font-size: 15px; margin: 0; text-align: center; line-height: 1.6;">
                    Open the <strong>AI Playground</strong>. Describe your concept. The AI generates multiple visual references instantly.
                </p>
            </div>

            <div style="background-color: #ffffff; border: 2px solid #00876f; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px;">2</div>
                </div>
                <p style="color: #1a1a1a; font-size: 18px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">
                    Build Your Moodboard
                </p>
                <p style="color: #4b5563; font-size: 15px; margin: 0; text-align: center; line-height: 1.6;">
                    Save your favorite AI images. Add your own references. Create a professional moodboard that shows your exact creative direction.
                </p>
            </div>

            <div style="background-color: #ffffff; border: 2px solid #00876f; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px;">3</div>
                </div>
                <p style="color: #1a1a1a; font-size: 18px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">
                    Post & Get Applications
                </p>
                <p style="color: #4b5563; font-size: 15px; margin: 0; text-align: center; line-height: 1.6;">
                    Create your gig, attach the moodboard. Models and talent see exactly what you need. Get quality applications within hours!
                </p>
            </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 18px 56px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 20px;
                      box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Start Your Project
            </a>
        </div>

        <!-- Special Offer -->
        <div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #92400e; font-size: 15px; margin: 0;">
                <strong>🎁 Special Offer:</strong> Get 50 free AI generation credits when you create your first gig with a moodboard this week!
            </p>
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


# ============================================
# Campaign 5: Photoshoot Ideation Campaign
# ============================================

def get_photoshoot_ideation_html():
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
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
            </div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Never Run Out of Creative Ideas</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">AI-powered ideation for photographers</p>
        </div>

        <!-- Message -->
        <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin: 30px 0;">
            <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                🎨 Struggling to visualize your next photoshoot?
            </p>
            <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">
                Use our <strong>AI Creative Playground</strong> to generate unlimited photoshoot concepts, create professional moodboards, and find the perfect models to execute your vision!
            </p>
        </div>

        <!-- Complete Workflow -->
        <div style="margin: 30px 0;">
            <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">Complete Workflow:</p>
            
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">1</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Generate Ideas in the Playground</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Type your concept: "Editorial fashion shoot, moody lighting, urban setting" - get instant visual references
                        </p>
                    </div>
                </div>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">2</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Build Your Moodboard</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Save your favorite AI-generated images. Add reference photos. Create a professional moodboard that clearly shows your vision.
                        </p>
                    </div>
                </div>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <div style="display: flex; align-items: start; gap: 15px;">
                    <div style="background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">3</div>
                    <div>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Post Your Gig with Moodboard</p>
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Attach your moodboard to your gig posting. Models can see exactly what you're looking for - get better applications!
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Results -->
        <div style="background-color: #eff6ff; border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="color: #1e40af; font-size: 15px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
                ⚡ Real Results from Videographers:
            </p>
            <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <p style="color: #4b5563; font-size: 14px; margin: 0;">
                    <strong>"Cut my pre-production time in half"</strong> - Saved hours on mood references
                </p>
            </div>
            <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <p style="color: #4b5563; font-size: 14px; margin: 0;">
                    <strong>"3x more quality applications"</strong> - Models understood my vision perfectly
                </p>
            </div>
            <div style="background-color: #ffffff; border-radius: 8px; padding: 15px;">
                <p style="color: #4b5563; font-size: 14px; margin: 0;">
                    <strong>"Booked 2 music videos in one week"</strong> - Artists loved my professional presentation
                </p>
            </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://presetie.com/playground" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 18px 56px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 20px;
                      box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Start Creating Now
            </a>
        </div>

        <!-- Promo -->
        <div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
                <strong>🎁 Limited Time:</strong> Free credits to try the AI Playground! Available for all videographers this week.
            </p>
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


# ============================================
# Main Script
# ============================================

def main():
    if not PLUNK_API_KEY:
        print("❌ PLUNK_API_KEY not found in environment variables")
        print("   Please set it in your .env file")
        return

    print("🚀 Sending Feature Campaigns to Plunk")
    print("=" * 70)
    print()
    print("These campaigns will be created as DRAFTS in your Plunk dashboard.")
    print("You can review and send them from: https://app.useplunk.com/campaigns")
    print()
    print("=" * 70)
    print()

    campaigns = [
        {
            'name': 'Music Video Playground - Videographers',
            'subject': 'Create Stunning Music Videos with AI',
            'html': get_music_video_playground_html(),
            'description': 'Promote AI playground for music video creation'
        },
        {
            'name': 'Photography Playground - Photographers',
            'subject': 'Plan Your Perfect Photoshoot with AI',
            'html': get_photography_playground_html(),
            'description': 'Promote AI playground for photoshoot planning'
        },
        {
            'name': 'Moodboard Feature - All Creatives',
            'subject': 'Moodboards That Get You Booked 3x Faster',
            'html': get_moodboard_feature_html(),
            'description': 'Promote moodboard creation features'
        },
        {
            'name': 'Create Gig with AI - Contributors',
            'subject': 'Create Your Next Project in 30 Minutes',
            'html': get_create_gig_with_ai_html(),
            'description': 'Promote gig creation with AI tools'
        },
        {
            'name': 'Photoshoot Ideation - Photographers',
            'subject': 'Never Run Out of Creative Ideas',
            'html': get_photoshoot_ideation_html(),
            'description': 'Promote AI-powered creative ideation'
        }
    ]

    created_campaigns = []

    for i, campaign in enumerate(campaigns, 1):
        print(f"📋 Campaign {i}/5: {campaign['name']}")
        print("-" * 70)
        print(f"   Description: {campaign['description']}")
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
                'name': campaign['name'],
                'id': result.get('id'),
                'subject': result.get('subject')
            })
        else:
            print(f"   ❌ Failed to create")
        
        print()

    # Summary
    print("=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"✅ Successfully created: {len(created_campaigns)}/5 campaigns")
    print()

    if created_campaigns:
        print("📋 Campaign IDs:")
        for i, campaign in enumerate(created_campaigns, 1):
            print(f"   {i}. {campaign['id']}")
            print(f"      {campaign['name']}")
            print(f"      Subject: {campaign['subject']}")
            print()
        
        print("🎯 Next Steps:")
        print("   1. Visit: https://app.useplunk.com/campaigns")
        print("   2. Review each campaign (they're saved as DRAFTS)")
        print("   3. Update recipients if needed")
        print("   4. Click 'Send' when ready to launch")
        print()
        print(f"💡 Tip: Currently set to send test to {TEST_EMAIL}")
        print("   Update recipients in Plunk dashboard before sending!")
        print()
        print("🎨 All campaigns feature:")
        print("   • Professional HTML design")
        print("   • Mobile-responsive layout")
        print("   • Clear CTAs to playground/gig creation")
        print("   • Unsubscribe links included")
    else:
        print("❌ No campaigns were created. Check your PLUNK_API_KEY and try again.")
    
    print()


if __name__ == '__main__':
    main()

