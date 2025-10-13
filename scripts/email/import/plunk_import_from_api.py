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
        self.app_url = os.getenv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
        
        if not self.plunk_api_key:
            raise ValueError("PLUNK_API_KEY not found in environment")
    
    def fetch_users_from_api(self):
        """Fetch all users from the Next.js API endpoint"""
        print("🔍 Fetching users from API...")
        
        try:
            response = requests.get(f"{self.app_url}/api/admin/export-users", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                users = data.get('users', [])
                print(f"✅ Found {len(users)} users from API")
                return users
            else:
                print(f"❌ API request failed: {response.status_code}")
                print(f"Error: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Error fetching users from API: {e}")
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
        contact_data['profile_created_at'] = user.get('profile_created_at')
        contact_data['auth_created_at'] = user.get('auth_created_at')
        
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
        print("🚀 Starting bulk import from database via API...")
        
        # Fetch users from API
        users = self.fetch_users_from_api()
        if not users:
            print("❌ No users found via API")
            return
        
        print(f"📊 Found {len(users)} users to import")
        print("-" * 50)
        
        results = []
        
        for i, user in enumerate(users, 1):
            email = user.get('email', 'unknown')
            display_name = user.get('display_name', 'Unknown User')
            print(f"📦 Processing user {i}/{len(users)}: {email} ({display_name})")
            
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
        
        # Show some successful imports
        successful_imports = [r for r in results if r.get('success', False)]
        if successful_imports:
            print(f"\n✅ Sample successful imports:")
            for result in successful_imports[:5]:  # Show first 5 successes
                note = result.get('note', '')
                status = " (already existed)" if note == 'already_exists' else ""
                print(f"   - {result['email']}{status}")

def main():
    try:
        importer = PlunkDBImporter()
        importer.import_all_users(delay=0.2)  # 200ms delay between requests
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
