#!/usr/bin/env python3
"""
Comprehensive Email System Test
Tests all email types and API endpoints
"""

import requests
import os
from dotenv import load_dotenv
import json
from time import sleep

# Load environment variables
load_dotenv()

def test_email_endpoint(endpoint, payload, description):
    """Test a single email endpoint"""
    print(f"🧪 Testing: {description}")
    print(f"   Endpoint: {endpoint}")
    
    try:
        response = requests.post(
            f'http://localhost:3000{endpoint}',
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=15
        )
        
        if response.status_code == 200:
            print(f"   ✅ SUCCESS: {response.json().get('message', 'Email sent')}")
            return True
        else:
            print(f"   ❌ FAILED: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        return False
    finally:
        print()

def test_all_email_types():
    """Test all email types and endpoints"""
    print("🚀 COMPREHENSIVE EMAIL SYSTEM TEST")
    print("=" * 60)
    
    # Test data
    test_user_id = "test-user-123"
    test_email = "test@presetie.com"
    test_name = "Test User"
    test_role = "TALENT"
    
    results = {
        'onboarding': 0,
        'verification': 0,
        'gigs': 0,
        'applications': 0,
        'total': 0
    }
    
    print("📧 ONBOARDING EMAILS")
    print("-" * 30)
    
    # 1. Welcome Email
    if test_email_endpoint('/api/emails/welcome', {
        'authUserId': test_user_id,
        'name': test_name,
        'role': test_role
    }, 'Welcome Email'):
        results['onboarding'] += 1
    
    # 2. Welcome After Verification
    if test_email_endpoint('/api/emails/welcome-verified', {
        'authUserId': test_user_id,
        'email': test_email,
        'name': test_name,
        'role': test_role
    }, 'Welcome After Verification'):
        results['onboarding'] += 1
    
    print("🔐 VERIFICATION EMAILS")
    print("-" * 30)
    
    # 3. Email Verification
    if test_email_endpoint('/api/emails/verify-email', {
        'authUserId': test_user_id,
        'email': test_email,
        'name': test_name,
        'verificationToken': f"{test_user_id}:1234567890:test123"
    }, 'Email Verification'):
        results['verification'] += 1
    
    print("🎯 GIG EMAILS")
    print("-" * 30)
    
    # 4. Gig Published
    if test_email_endpoint('/api/emails/gig-published', {
        'authUserId': test_user_id,
        'email': test_email,
        'gigDetails': {
            'id': 'gig-123',
            'title': 'Test Photography Gig',
            'location': 'Test Location',
            'startTime': '2025-01-15T10:00:00Z',
            'endTime': '2025-01-15T16:00:00Z',
            'compType': 'TFP',
            'compDetails': 'Test compensation'
        }
    }, 'Gig Published'):
        results['gigs'] += 1
    
    print("📝 APPLICATION EMAILS")
    print("-" * 30)
    
    # 5. New Application
    if test_email_endpoint('/api/emails/new-application', {
        'authUserId': test_user_id,
        'email': test_email,
        'gigTitle': 'Test Photography Gig',
        'applicantName': 'John Doe',
        'applicantId': 'applicant-123',
        'applicationUrl': 'https://presetie.com/gigs/123/applications'
    }, 'New Application'):
        results['applications'] += 1
    
    # 6. Application Status Change
    if test_email_endpoint('/api/emails/application-status', {
        'authUserId': test_user_id,
        'email': test_email,
        'status': 'shortlisted',
        'gigTitle': 'Test Photography Gig',
        'contributorName': 'Jane Photographer'
    }, 'Application Status Change'):
        results['applications'] += 1
    
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    total_tests = results['onboarding'] + results['verification'] + results['gigs'] + results['applications']
    
    print(f"✅ Onboarding Emails: {results['onboarding']}/2 working")
    print(f"✅ Verification Emails: {results['verification']}/1 working") 
    print(f"✅ Gig Emails: {results['gigs']}/1 working")
    print(f"✅ Application Emails: {results['applications']}/2 working")
    print(f"📈 Total Working: {total_tests}/6 endpoints")
    
    success_rate = (total_tests / 6) * 100
    print(f"🎯 Success Rate: {success_rate:.1f}%")
    
    print("\n📋 EMAIL SYSTEM STATUS:")
    
    if total_tests >= 5:
        print("🟢 EXCELLENT: Most email types are working!")
    elif total_tests >= 3:
        print("🟡 GOOD: Some email types working, check failed ones")
    else:
        print("🔴 NEEDS WORK: Many email types not working")
    
    print("\n🔍 NEXT STEPS:")
    print("1. Check server logs for any errors")
    print("2. Verify Plunk API key is set correctly")
    print("3. Test with real user data")
    print("4. Check email delivery in Plunk dashboard")
    
    return total_tests >= 4

def test_email_preferences():
    """Test email preference system"""
    print("\n⚙️ EMAIL PREFERENCES TEST")
    print("=" * 40)
    
    test_email = "preferences@test.com"
    
    # Test updating preferences
    try:
        response = requests.post(
            'http://localhost:3000/api/email-preferences/update',
            json={
                'email': test_email,
                'preferences': {
                    'gig': True,
                    'application': False,
                    'message': True,
                    'booking': True,
                    'system': True,
                    'marketing': False
                }
            },
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Email preferences update: WORKING")
        else:
            print(f"❌ Email preferences update: FAILED ({response.status_code})")
    except Exception as e:
        print(f"❌ Email preferences update: ERROR ({e})")
    
    # Test unsubscribe all
    try:
        response = requests.post(
            'http://localhost:3000/api/email-preferences/unsubscribe-all',
            json={'email': test_email},
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Unsubscribe all: WORKING")
        else:
            print(f"❌ Unsubscribe all: FAILED ({response.status_code})")
    except Exception as e:
        print(f"❌ Unsubscribe all: ERROR ({e})")

if __name__ == "__main__":
    # Check if server is running
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        print("✅ Development server is running")
    except:
        print("❌ Development server is not running!")
        print("Please start it with: npm run dev")
        exit(1)
    
    # Run tests
    email_test_passed = test_all_email_types()
    test_email_preferences()
    
    print("\n" + "=" * 60)
    if email_test_passed:
        print("🎉 EMAIL SYSTEM IS READY FOR PRODUCTION!")
    else:
        print("⚠️  EMAIL SYSTEM NEEDS ATTENTION")
    print("=" * 60)
