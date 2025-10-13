#!/usr/bin/env python3
import csv
import requests
from time import sleep
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
EMAIL_INDEX = 0
FILE_NAME = 'sample_contacts.csv'
DELIMITER = ','
API_KEY = os.getenv('PLUNK_API_KEY')

def main():
    # Check if API key is set
    if not API_KEY:
        print("❌ Please add PLUNK_API_KEY to your .env file")
        print("   Example: PLUNK_API_KEY=sk_your_secret_key_here")
        return
    
    print(f"🚀 Starting Plunk contact import...")
    print(f"📁 File: {FILE_NAME}")
    print(f"🔑 API Key: {API_KEY[:10]}...")
    print("-" * 50)
    
    results = []
    
    try:
        with open(FILE_NAME, 'r', errors='ignore') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=DELIMITER)
            
            # Skip header row
            next(csv_reader, None)
            
            for line_num, line in enumerate(csv_reader, 2):  # Start from 2 (after header)
                if len(line) == 0:
                    continue
                
                if len(line) <= EMAIL_INDEX:
                    print(f"❌ Line {line_num}: Not enough columns")
                    continue
                
                email = line[EMAIL_INDEX].strip()
                if not email or '@' not in email:
                    print(f"❌ Line {line_num}: Invalid email: {email}")
                    continue
                
                # Prepare contact data
                contact_data = {
                    'email': email,
                    'subscribed': True,
                }
                
                # Add optional fields if they exist
                if len(line) > 1 and line[1].strip():
                    contact_data['first_name'] = line[1].strip()
                if len(line) > 2 and line[2].strip():
                    contact_data['last_name'] = line[2].strip()
                if len(line) > 3 and line[3].strip().lower() in ['false', '0', 'no']:
                    contact_data['subscribed'] = False
                
                # Import with retries
                retries = 3
                success = False
                
                while retries > 0 and not success:
                    try:
                        response = requests.post(
                            'https://api.useplunk.com/v1/contacts',
                            json=contact_data,
                            headers={
                                'Authorization': f'Bearer {API_KEY}',
                                'Content-Type': 'application/json'
                            },
                            timeout=10
                        )
                        
                        if response.status_code in [200, 201]:
                            print(f"✅ Line {line_num}: {email} - Success")
                            success = True
                            results.append({'email': email, 'success': True})
                        else:
                            print(f"⚠️ Line {line_num}: {email} - Status {response.status_code}")
                            if response.status_code == 409:  # Already exists
                                print(f"   (Contact already exists)")
                                success = True
                                results.append({'email': email, 'success': True, 'note': 'already_exists'})
                            else:
                                print(f"   Error: {response.text}")
                                retries -= 1
                        
                    except requests.exceptions.RequestException as e:
                        print(f"❌ Line {line_num}: {email} - Request failed: {e}")
                        retries -= 1
                        if retries > 0:
                            sleep(1)
                    
                    if not success and retries == 0:
                        print(f"💥 Line {line_num}: {email} - Failed after 3 retries")
                        results.append({'email': email, 'success': False})
                
                # Rate limiting
                sleep(0.1)
    
    except FileNotFoundError:
        print(f"❌ Error: File '{FILE_NAME}' not found")
        return
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        return
    
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
        for result in failed_imports:
            print(f"   - {result['email']}")

if __name__ == "__main__":
    main()
