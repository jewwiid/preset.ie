#!/usr/bin/env python3
"""
Complete Campaign Set for Plunk
Creates ALL missing campaigns:
- 3 more collaborative campaigns (Actors, Dancers, Musicians)
- 10 UPDATED talent campaigns with BOTH options (apply + create)
- Total new campaigns: 13
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


def get_two_way_template(icon, title, subtitle, apply_section, create_section, cta_apply, cta_create):
    """Template for campaigns with BOTH apply AND create options"""
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
            {apply_section}
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
            {create_section}
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
# COLLABORATIVE PROJECT CAMPAIGNS (3 NEW)
# ============================================

COLLAB_CAMPAIGNS = [
    {
        'name': 'Actors - Create Acting Projects',
        'subject': 'Create Your Acting Project & Find Directors',
        'icon': '🎭',
        'title': 'Bring Your Acting Vision to Life',
        'subtitle': 'Create collaborative acting projects',
        'description': """
            <p style="color: #4b5563; font-size: 15px; margin: 0; line-height: 1.6;">
                Have an idea for a scene, monologue, or short film? Use our AI Playground to visualize it, create a moodboard, 
                then post it as a collaborative project. Directors and cinematographers will apply to work with you!
            </p>
            <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
                <li style="margin-bottom: 8px;">Generate scene visuals with AI</li>
                <li style="margin-bottom: 8px;">Create professional moodboards</li>
                <li style="margin-bottom: 8px;">Find directors who match your style</li>
            </ul>
        """,
        'cta_url': 'https://presetie.com/playground'
    },
    {
        'name': 'Dancers - Create Dance Projects',
        'subject': 'Create Your Dance Project & Find Videographers',
        'icon': '💃',
        'title': 'Choreograph Your Dream Project',
        'subtitle': 'Create collaborative dance projects',
        'description': """
            <p style="color: #4b5563; font-size: 15px; margin: 0; line-height: 1.6;">
                Have a choreography concept or dance video idea? Visualize it with AI, build a moodboard showing your vision, 
                and find videographers who want to collaborate!
            </p>
            <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
                <li style="margin-bottom: 8px;">Generate dance video concepts with AI</li>
                <li style="margin-bottom: 8px;">Show your choreography vision clearly</li>
                <li style="margin-bottom: 8px;">Connect with cinematographers who get it</li>
            </ul>
        """,
        'cta_url': 'https://presetie.com/playground'
    },
    {
        'name': 'Musicians - Create Music Video Projects',
        'subject': 'Create Your Music Video Project & Find Cinematographers',
        'icon': '🎵',
        'title': 'Visualize Your Music Video',
        'subtitle': 'Create collaborative music projects',
        'description': """
            <p style="color: #4b5563; font-size: 15px; margin: 0; line-height: 1.6;">
                Got a track that needs a visual story? Use AI to generate music video concepts, create a stunning moodboard, 
                then find cinematographers and videographers to bring it to life!
            </p>
            <ul style="margin: 15px 0 0 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
                <li style="margin-bottom: 8px;">Generate cinematic music video concepts</li>
                <li style="margin-bottom: 8px;">Create professional treatment moodboards</li>
                <li style="margin-bottom: 8px;">Find video directors who match your sound</li>
            </ul>
        """,
        'cta_url': 'https://presetie.com/playground'
    }
]


# ============================================
# UPDATED TWO-WAY CAMPAIGNS (10 MODIFIED)
# ============================================

TWO_WAY_CAMPAIGNS = [
    {
        'name': 'Models - UPDATED Two-Way',
        'subject': 'Models: Find Gigs OR Create Your Dream Photoshoot',
        'icon': '📸',
        'title': 'Modeling Opportunities on Preset',
        'subtitle': 'Apply to shoots or create your own',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Browse photoshoots from top photographers. They use AI-powered moodboards to show exactly what they need.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Fashion, Editorial & Commercial</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">See exactly what photographers want before applying</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have a photoshoot concept? Generate it with AI, create a moodboard, and let photographers apply to work with you!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Your Vision, Your Portfolio</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Build the portfolio YOU want with your ideas</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=model',
        'cta_create': 'https://presetie.com/playground'
    },
    {
        'name': 'Actors - UPDATED Two-Way',
        'subject': 'Actors: Find Roles OR Create Your Acting Project',
        'icon': '🎭',
        'title': 'Acting Opportunities on Preset',
        'subtitle': 'Apply to roles or create your own',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Browse casting calls with visual references. See the director's vision before audition.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Commercials, Theater & Film</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Clear briefs with moodboards</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have a scene or short film idea? Visualize it with AI and find directors to collaborate!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Direct Your Career</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Create content that showcases YOUR talent</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=actor',
        'cta_create': 'https://presetie.com/playground'
    },
    {
        'name': 'Dancers - UPDATED Two-Way',
        'subject': 'Dancers: Find Gigs OR Create Your Dance Project',
        'icon': '💃',
        'title': 'Dance Opportunities on Preset',
        'subtitle': 'Apply to projects or create your own',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Music videos, events, and performances - see visual references before applying.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Music Videos & Performances</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Clear style and choreography direction</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have choreography to showcase? Create a project and find videographers to film it!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Your Choreography, Your Vision</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Build a dance reel that reflects YOU</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=dancer',
        'cta_create': 'https://presetie.com/playground'
    },
    {
        'name': 'Musicians - UPDATED Two-Way',
        'subject': 'Musicians: Find Gigs OR Create Your Music Video',
        'icon': '🎵',
        'title': 'Music Collaboration on Preset',
        'subtitle': 'Apply to projects or create your own',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Feature in music videos, studio sessions, and live events. See project details upfront.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Videos, Sessions & Events</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Visual briefs show the vibe</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Got a track that needs visuals? Generate music video concepts and find cinematographers!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Your Sound, Your Visual</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Create music videos that match your artistry</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=musician',
        'cta_create': 'https://presetie.com/playground'
    },
    {
        'name': 'Content Creators - UPDATED Two-Way',
        'subject': 'Content Creators: Find Brands OR Create Projects',
        'icon': '📱',
        'title': 'Content Creation Opportunities',
        'subtitle': 'Apply to brands or create collabs',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Browse brand partnerships and UGC opportunities with clear creative direction.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Brand Deals & UGC</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">See moodboards before applying</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have content ideas? Create projects and find photographers/videographers to collaborate!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Your Content, Your Way</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Build content that grows your brand</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=content-creator',
        'cta_create': 'https://presetie.com/collaborate/create'
    },
    {
        'name': 'Makeup Artists - UPDATED Two-Way',
        'subject': 'MUAs: Find Shoots OR Offer Your Services',
        'icon': '💄',
        'title': 'Makeup Artist Opportunities',
        'subtitle': 'Apply to shoots or list services',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Browse photoshoots and productions with visual style references.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Editorial, Bridal & Video</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">See makeup style needed upfront</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have signature looks? Create a project showcasing your work and find models/photographers!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Build Your Portfolio</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Create shoots that showcase YOUR artistry</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=makeup-artist',
        'cta_create': 'https://presetie.com/collaborate/create'
    },
    {
        'name': 'Hair Stylists - UPDATED Two-Way',
        'subject': 'Hair Stylists: Find Shoots OR Create Projects',
        'icon': '💇',
        'title': 'Hair Styling Opportunities',
        'subtitle': 'Apply to shoots or create projects',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Fashion, editorial, and video productions seeking hair stylists.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Fashion & Editorial</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">See hair style direction clearly</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have styling concepts? Create a project and find models/photographers to collaborate!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Showcase Your Skills</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Build a portfolio of YOUR signature styles</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=hair-stylist',
        'cta_create': 'https://presetie.com/collaborate/create'
    },
    {
        'name': 'Voice Actors - UPDATED Two-Way',
        'subject': 'Voice Actors: Find VO Work OR Create Projects',
        'icon': '🎙️',
        'title': 'Voice Acting Opportunities',
        'subtitle': 'Apply to roles or create projects',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Browse VO opportunities with clear character descriptions and tone guides.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Commercials, Animation & More</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">See character briefs upfront</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have character ideas or original content? Create projects and find creators to work with!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Your Voice, Your Content</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Create audio content that showcases your range</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=voice-actor',
        'cta_create': 'https://presetie.com/collaborate/create'
    },
    {
        'name': 'Presenters - UPDATED Two-Way',
        'subject': 'Presenters: Find Events OR Create Content',
        'icon': '🎤',
        'title': 'Presenting & Speaking Opportunities',
        'subtitle': 'Apply to events or create content',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Browse event hosting, corporate presenting, and speaking opportunities.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Events, Corporate & Livestreams</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Clear event details and requirements</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have a show concept or content idea? Create projects and find production teams!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Host Your Own Content</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Create shows that highlight YOUR personality</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?talent=presenter',
        'cta_create': 'https://presetie.com/collaborate/create'
    },
    {
        'name': 'Illustrators - UPDATED Two-Way',
        'subject': 'Illustrators: Find Projects OR Create Collabs',
        'icon': '🖌️',
        'title': 'Illustration Opportunities',
        'subtitle': 'Apply to projects or create your own',
        'apply_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Browse illustration projects with clear style guides and visual references.
            </p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✓ Album Art, Brand & Editorial</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">See style direction with moodboards</p>
            </div>
        """,
        'create_section': """
            <p style="color: #4b5563; font-size: 15px; margin: 0 0 15px 0; line-height: 1.6;">
                Have art concepts? Create collaborative projects and find musicians/brands to work with!
            </p>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px;">
                <p style="color: #1a1a1a; font-size: 14px; margin: 0; font-weight: 600;">✨ Your Art, Your Projects</p>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Create work that showcases YOUR style</p>
            </div>
        """,
        'cta_apply': 'https://presetie.com/gigs?specialization=illustration',
        'cta_create': 'https://presetie.com/playground'
    }
]


def main():
    if not PLUNK_API_KEY:
        print("❌ PLUNK_API_KEY not found")
        return

    print("🚀 Creating Complete Campaign Set")
    print("=" * 70)
    print("\n📊 Total new campaigns to create: 13")
    print("   - 3 Collaborative project campaigns")
    print("   - 10 Updated two-way campaigns")
    print("\n" + "=" * 70 + "\n")

    all_created = []

    # Create collaborative campaigns
    print("📋 PART 1: COLLABORATIVE PROJECT CAMPAIGNS (3)")
    print("-" * 70)
    
    for camp in COLLAB_CAMPAIGNS:
        print(f"\n✨ {camp['name']}")
        
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 80px; margin-bottom: 15px;">{camp['icon']}</div>
            <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">{camp['title']}</h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">{camp['subtitle']}</p>
        </div>
        <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0;">
            {camp['description']}
        </div>
        <div style="text-align: center; margin: 40px 0;">
            <a href="{camp['cta_url']}" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #00876f 0%, #00a389 100%); 
                      color: white; 
                      padding: 18px 56px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: 700; 
                      font-size: 20px;
                      box-shadow: 0 6px 20px rgba(0, 135, 111, 0.5);">
                Start Creating
            </a>
        </div>
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
        
        result = create_plunk_campaign(
            name=camp['name'],
            subject=camp['subject'],
            body=html,
            recipients=[TEST_EMAIL]
        )
        
        if result:
            print(f"   ✅ Created: {result.get('id')}")
            all_created.append({'name': camp['name'], 'id': result.get('id'), 'type': 'Collaborative'})
        else:
            print(f"   ❌ Failed")

    # Create two-way campaigns
    print("\n" + "=" * 70)
    print("📋 PART 2: UPDATED TWO-WAY CAMPAIGNS (10)")
    print("-" * 70)
    
    for camp in TWO_WAY_CAMPAIGNS:
        print(f"\n🔄 {camp['name']}")
        
        html = get_two_way_template(
            icon=camp['icon'],
            title=camp['title'],
            subtitle=camp['subtitle'],
            apply_section=camp['apply_section'],
            create_section=camp['create_section'],
            cta_apply=camp['cta_apply'],
            cta_create=camp['cta_create']
        )
        
        result = create_plunk_campaign(
            name=camp['name'],
            subject=camp['subject'],
            body=html,
            recipients=[TEST_EMAIL]
        )
        
        if result:
            print(f"   ✅ Created: {result.get('id')}")
            all_created.append({'name': camp['name'], 'id': result.get('id'), 'type': 'Two-Way'})
        else:
            print(f"   ❌ Failed")

    # Summary
    print("\n" + "=" * 70)
    print("📊 FINAL SUMMARY")
    print("=" * 70)
    print(f"✅ Successfully created: {len(all_created)}/13 campaigns\n")

    collab_count = len([c for c in all_created if c['type'] == 'Collaborative'])
    twoway_count = len([c for c in all_created if c['type'] == 'Two-Way'])

    print(f"📋 Campaign Breakdown:")
    print(f"   Collaborative Projects: {collab_count}")
    print(f"   Updated Two-Way: {twoway_count}")
    print()
    
    print("🎯 TOTAL CAMPAIGN COUNT:")
    print(f"   Previous campaigns: 23")
    print(f"   New campaigns: {len(all_created)}")
    print(f"   GRAND TOTAL: {23 + len(all_created)} campaigns! 🎉")
    print()
    
    print("📊 Complete Coverage:")
    print("   ✅ Photographers create gigs → Talent applies")
    print("   ✅ Talent creates projects → Photographers apply")
    print("   ✅ Equipment marketplace (sell & buy)")
    print("   ✅ Two-way options for all talent types")
    print()
    
    print("🎯 Next Steps:")
    print("   1. Review all campaigns: https://app.useplunk.com/campaigns")
    print("   2. You now have MULTIPLE options for each user type")
    print("   3. Send based on user behavior/preferences")
    print("   4. See PLUNK_CAMPAIGNS_REVIEW.md for complete analysis")
    print()


if __name__ == '__main__':
    main()

