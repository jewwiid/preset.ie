#!/usr/bin/env python3
import requests
import os
from dotenv import load_dotenv
from time import sleep
import json

# Load environment variables
load_dotenv()

class PlunkDBImporter:
    def __init__(self):
        self.plunk_api_key = os.getenv('PLUNK_API_KEY')
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.plunk_api_key:
            raise ValueError("PLUNK_API_KEY not found in environment")
        if not self.supabase_url:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL not found in environment")
        if not self.supabase_service_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY not found in environment")
    
    def fetch_users_from_db(self):
        """Fetch all users from Supabase database using REST API"""
        print("🔍 Fetching users from database...")
        
        headers = {
            'apikey': self.supabase_service_key,
            'Authorization': f'Bearer {self.supabase_service_key}',
            'Content-Type': 'application/json'
        }
        
        # First, get users from auth.users
        auth_users_url = f"{self.supabase_url}/rest/v1/auth/users"
        
        try:
            # Note: This might not work directly with REST API
            # Let's try a different approach using a custom query
            print("📋 Using alternative method to fetch users...")
            
            # Try to get users from users_profile table instead
            profile_url = f"{self.supabase_url}/rest/v1/users_profile"
            
            response = requests.get(
                profile_url,
                headers=headers,
                params={
                    'select': 'user_id,first_name,last_name,display_name,handle,bio,city,country,role_flags,availability_status,created_at,email_verified'
                }
            )
            
            if response.status_code == 200:
                users = response.json()
                print(f"✅ Found {len(users)} user profiles in database")
                
                # For each profile, we need to get the email from auth.users
                # This is a limitation of the REST API approach
                enriched_users = []
                for user in users:
                    # Try to get email from auth.users using the user_id
                    email_response = requests.get(
                        f"{self.supabase_url}/rest/v1/auth/users",
                        headers=headers,
                        params={'id': f'eq.{user["user_id"]}'}
                    )
                    
                    if email_response.status_code == 200:
                        auth_data = email_response.json()
                        if auth_data and len(auth_data) > 0:
                            user['email'] = auth_data[0].get('email', '')
                            user['email_verified'] = auth_data[0].get('email_confirmed_at') is not None
                            enriched_users.append(user)
                    else:
                        print(f"⚠️ Could not fetch email for user {user['user_id']}")
                
                return enriched_users
            else:
                print(f"❌ Database query failed: {response.status_code}")
                print(f"Error: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Error fetching users: {e}")
            return []
    
    def import_contact_to_plunk(self, user):
        """Import a single user to Plunk"""
        email = user.get('email')
        if not email:
            return {'email': 'unknown', 'success': False, 'error': 'No email'}
        
        # Prepare contact data for Plunk
        contact_data = {
            'email': email,
            'subscribed': user.get('email_verified', False),
        }
        
        # Add optional fields
        if user.get('first_name'):
            contact_data['first_name'] = user['first_name']
        if user.get('last_name'):
            contact_data['last_name'] = user['last_name']
        if user.get('display_name'):
            contact_data['display_name'] = user['display_name']
        if user.get('city'):
            contact_data['city'] = user['city']
        if user.get('country'):
            contact_data['country'] = user['country']
        if user.get('bio'):
            contact_data['bio'] = user['bio']
        if user.get('role_flags'):
            contact_data['role_flags'] = user['role_flags']
        if user.get('availability_status'):
            contact_data['availability_status'] = user['availability_status']
        
        # Add custom fields for Preset
        contact_data['preset_user_id'] = user.get('user_id')
        contact_data['profile_created_at'] = user.get('created_at')
        
        headers = {
            'Authorization': f'Bearer {self.plunk_api_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(
                'https://api.useplunk.com/v1/contacts',
                json=contact_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                return {'email': email, 'success': True}
            elif response.status_code == 409:
                return {'email': email, 'success': True, 'note': 'already_exists'}
            else:
                return {'email': email, 'success': False, 'error': f'Status {response.status_code}: {response.text}'}
                
        except Exception as e:
            return {'email': email, 'success': False, 'error': str(e)}
    
    def import_all_users(self, delay=0.2):
        """Import all users from database to Plunk"""
        print("🚀 Starting bulk import from database...")
        
        # Fetch users from database
        users = self.fetch_users_from_db()
        if not users:
            print("❌ No users found in database")
            return
        
        print(f"📊 Found {len(users)} users to import")
        print("-" * 50)
        
        results = []
        
        for i, user in enumerate(users, 1):
            print(f"📦 Processing user {i}/{len(users)}: {user.get('email', 'unknown')}")
            
            result = self.import_contact_to_plunk(user)
            results.append(result)
            
            if result['success']:
                note = result.get('note', '')
                if note == 'already_exists':
                    print(f"   ✅ {result['email']} (already exists)")
                else:
                    print(f"   ✅ {result['email']}")
            else:
                print(f"   ❌ {result['email']}: {result.get('error', 'Unknown error')}")
            
            # Rate limiting
            sleep(delay)
        
        # Print summary
        successful = sum(1 for r in results if r.get('success', False))
        failed = len(results) - successful
        
        print("-" * 50)
        print(f"📊 Import Summary:")
        print(f"✅ Successful: {successful}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Total: {len(results)}")
        print(f"🎯 Success Rate: {(successful/len(results)*100):.1f}%" if results else "0%")
        
        # Show failed imports
        failed_imports = [r for r in results if not r.get('success', False)]
        if failed_imports:
            print(f"\n❌ Failed imports:")
            for result in failed_imports[:10]:  # Show first 10 failures
                print(f"   - {result['email']}: {result.get('error', 'Unknown error')}")
            if len(failed_imports) > 10:
                print(f"   ... and {len(failed_imports) - 10} more")

def main():
    try:
        importer = PlunkDBImporter()
        importer.import_all_users(delay=0.2)  # 200ms delay between requests
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
