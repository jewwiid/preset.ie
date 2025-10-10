#!/usr/bin/env python3
import requests
import os
from dotenv import load_dotenv
import asyncio
import aiohttp
from typing import List, Dict
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
    
    async def fetch_users_from_db(self) -> List[Dict]:
        """Fetch all users from Supabase database"""
        print("🔍 Fetching users from database...")
        
        # SQL query to get users with their profiles
        query = """
        SELECT 
            au.id as user_id,
            au.email,
            au.email_verified,
            au.created_at as user_created_at,
            up.first_name,
            up.last_name,
            up.display_name,
            up.handle,
            up.bio,
            up.city,
            up.country,
            up.role_flags,
            up.availability_status,
            up.created_at as profile_created_at
        FROM auth.users au
        LEFT JOIN users_profile up ON au.id = up.user_id
        WHERE au.email IS NOT NULL
        ORDER BY au.created_at DESC
        """
        
        headers = {
            'apikey': self.supabase_service_key,
            'Authorization': f'Bearer {self.supabase_service_key}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.supabase_url}/rest/v1/rpc/exec_sql"
        
        payload = {
            "sql": query
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Found {len(data)} users in database")
                        return data
                    else:
                        error_text = await response.text()
                        print(f"❌ Database query failed: {response.status}")
                        print(f"Error: {error_text}")
                        return []
            except Exception as e:
                print(f"❌ Error fetching users: {e}")
                return []
    
    async def import_contact_to_plunk(self, session: aiohttp.ClientSession, user: Dict) -> Dict:
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
        contact_data['user_created_at'] = user.get('user_created_at')
        contact_data['profile_created_at'] = user.get('profile_created_at')
        
        headers = {
            'Authorization': f'Bearer {self.plunk_api_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            async with session.post(
                'https://api.useplunk.com/v1/contacts',
                json=contact_data,
                headers=headers,
                timeout=10
            ) as response:
                if response.status in [200, 201]:
                    return {'email': email, 'success': True}
                elif response.status == 409:
                    return {'email': email, 'success': True, 'note': 'already_exists'}
                else:
                    error_text = await response.text()
                    return {'email': email, 'success': False, 'error': f'Status {response.status}: {error_text}'}
        except Exception as e:
            return {'email': email, 'success': False, 'error': str(e)}
    
    async def import_all_users(self, batch_size: int = 10):
        """Import all users from database to Plunk"""
        print("🚀 Starting bulk import from database...")
        
        # Fetch users from database
        users = await self.fetch_users_from_db()
        if not users:
            print("❌ No users found in database")
            return
        
        print(f"📊 Found {len(users)} users to import")
        print("-" * 50)
        
        results = []
        
        async with aiohttp.ClientSession() as session:
            # Process in batches
            for i in range(0, len(users), batch_size):
                batch = users[i:i + batch_size]
                print(f"📦 Processing batch {i//batch_size + 1} ({len(batch)} users)")
                
                # Process batch concurrently
                tasks = [self.import_contact_to_plunk(session, user) for user in batch]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for result in batch_results:
                    if isinstance(result, Exception):
                        results.append({'email': 'unknown', 'success': False, 'error': str(result)})
                    else:
                        results.append(result)
                        
                        if result['success']:
                            note = result.get('note', '')
                            if note == 'already_exists':
                                print(f"   ✅ {result['email']} (already exists)")
                            else:
                                print(f"   ✅ {result['email']}")
                        else:
                            print(f"   ❌ {result['email']}: {result.get('error', 'Unknown error')}")
                
                # Rate limiting between batches
                if i + batch_size < len(users):
                    await asyncio.sleep(1)
        
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

async def main():
    try:
        importer = PlunkDBImporter()
        await importer.import_all_users(batch_size=5)  # Small batch size for testing
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
