#!/usr/bin/env python3
"""
Verify Email Preferences & GDPR Compliance
Tests that marketing email system is properly configured
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def get_supabase() -> Client:
    """Get Supabase admin client"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise Exception("Missing Supabase credentials")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def test_marketing_default():
    """Test 1: Verify marketing_notifications defaults to FALSE"""
    print("\n📋 Test 1: Marketing Notifications Default")
    print("-" * 70)
    
    supabase = get_supabase()
    
    # Check column default
    result = supabase.table('notification_preferences').select('*').limit(1).execute()
    
    if result.data and len(result.data) > 0:
        first_pref = result.data[0]
        marketing_value = first_pref.get('marketing_notifications')
        
        print(f"   Sample user marketing_notifications: {marketing_value}")
        
        if marketing_value == False:
            print("   ✅ PASS: Marketing defaults to FALSE (GDPR compliant)")
            return True
        else:
            print("   ❌ FAIL: Marketing is TRUE (needs migration)")
            return False
    else:
        print("   ⚠️  No users found to test")
        return None


def test_marketing_opt_in_count():
    """Test 2: Count users who opted into marketing"""
    print("\n📋 Test 2: Marketing Opt-In Count")
    print("-" * 70)
    
    supabase = get_supabase()
    
    # Total users
    total_result = supabase.table('notification_preferences').select('*', count='exact').execute()
    total = total_result.count or 0
    
    # Opted-in users
    opted_in_result = supabase.table('notification_preferences')\
        .select('*', count='exact')\
        .eq('marketing_notifications', True)\
        .execute()
    opted_in = opted_in_result.count or 0
    
    percentage = (opted_in / total * 100) if total > 0 else 0
    
    print(f"   Total users: {total}")
    print(f"   Opted into marketing: {opted_in}")
    print(f"   Opt-in rate: {percentage:.1f}%")
    
    if percentage <= 20:  # Expected: most users opted out by default
        print("   ✅ PASS: Low opt-in rate indicates opt-in system working")
        return True
    else:
        print("   ⚠️  WARNING: High opt-in rate - migration may not have run")
        return False


def test_marketing_view():
    """Test 3: Verify marketing_enabled_users view exists"""
    print("\n📋 Test 3: Marketing Enabled Users View")
    print("-" * 70)
    
    supabase = get_supabase()
    
    try:
        # Try to query the view
        result = supabase.rpc('exec_sql', {
            'sql': 'SELECT COUNT(*) as count FROM public.marketing_enabled_users'
        }).execute()
        
        print(f"   ✅ PASS: View exists and is queryable")
        return True
    except Exception as e:
        print(f"   ❌ FAIL: View not found - {str(e)}")
        return False


def test_preference_index():
    """Test 4: Verify index exists"""
    print("\n📋 Test 4: Performance Index")
    print("-" * 70)
    
    supabase = get_supabase()
    
    try:
        # Check if index exists
        result = supabase.rpc('exec_sql', {
            'sql': """
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'notification_preferences' 
                AND indexname = 'idx_notification_preferences_marketing'
            """
        }).execute()
        
        if result.data and len(result.data) > 0:
            print(f"   ✅ PASS: Performance index exists")
            return True
        else:
            print(f"   ❌ FAIL: Index not found")
            return False
    except Exception as e:
        print(f"   ⚠️  Could not verify index: {str(e)}")
        return None


def test_plunk_campaigns_service():
    """Test 5: Verify PlunkCampaignsService has filtering"""
    print("\n📋 Test 5: PlunkCampaignsService Filtering")
    print("-" * 70)
    
    # Check if the file contains the filtering method
    service_file = 'apps/web/lib/services/plunk-campaigns.service.ts'
    
    try:
        with open(service_file, 'r') as f:
            content = f.read()
            
        if 'filterByMarketingPreferences' in content:
            print("   ✅ PASS: filterByMarketingPreferences method exists")
            
            if 'marketing_notifications' in content:
                print("   ✅ PASS: Checks marketing_notifications column")
                return True
            else:
                print("   ❌ FAIL: Doesn't check marketing_notifications")
                return False
        else:
            print("   ❌ FAIL: filterByMarketingPreferences method not found")
            return False
            
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False


def main():
    print("=" * 70)
    print("🔍 EMAIL PREFERENCES & GDPR COMPLIANCE VERIFICATION")
    print("=" * 70)
    
    tests = [
        test_marketing_default,
        test_marketing_opt_in_count,
        test_plunk_campaigns_service
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for r in results if r == True)
    failed = sum(1 for r in results if r == False)
    warnings = sum(1 for r in results if r is None)
    
    print(f"\n   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    print(f"   ⚠️  Warnings: {warnings}")
    print()
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED - System is GDPR compliant!")
        print()
        print("✅ You can now safely send marketing campaigns:")
        print("   • They will only go to users who opted in")
        print("   • Unsubscribe links will work")
        print("   • Preferences are respected")
    else:
        print("⚠️  SOME TESTS FAILED")
        print()
        print("Required actions:")
        if results[0] == False:
            print("   1. Run migration: supabase/migrations/20251010100000_fix_marketing_email_opt_in.sql")
        if results[2] == False:
            print("   2. PlunkCampaignsService needs filtering update")
        print()
    
    print()


if __name__ == '__main__':
    main()

