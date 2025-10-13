import csv
import requests
from time import sleep
import os
from typing import List, Dict, Optional

class PlunkContactImporter:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = 'https://api.useplunk.com/v1'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def import_single_contact(self, email: str, **kwargs) -> Dict:
        """Import a single contact to Plunk"""
        contact_data = {
            'email': email.strip(),
            'subscribed': kwargs.get('subscribed', True),
        }
        
        # Add any additional fields
        for key, value in kwargs.items():
            if key != 'subscribed' and value:
                contact_data[key] = value
        
        response = requests.post(
            f'{self.base_url}/contacts',
            json=contact_data,
            headers=self.headers
        )
        
        return {
            'success': response.status_code in [200, 201],
            'status_code': response.status_code,
            'response': response.json() if response.content else {},
            'email': email
        }
    
    def import_from_csv(self, file_path: str, email_index: int = 0, delimiter: str = ',', 
                       field_mapping: Optional[Dict[str, int]] = None, 
                       delay: float = 0.1) -> List[Dict]:
        """Import contacts from CSV file with field mapping"""
        results = []
        field_mapping = field_mapping or {}
        
        try:
            with open(file_path, 'r', errors='ignore', encoding='utf-8') as csv_file:
                csv_reader = csv.reader(csv_file, delimiter=delimiter)
                
                for line_num, line in enumerate(csv_reader, 1):
                    if len(line) == 0:
                        continue
                    
                    if len(line) <= email_index:
                        print(f"Line {line_num}: Not enough columns")
                        continue
                    
                    email = line[email_index].strip()
                    if not email or '@' not in email:
                        print(f"Line {line_num}: Invalid email: {email}")
                        continue
                    
                    # Prepare contact data
                    contact_kwargs = {}
                    for field_name, column_index in field_mapping.items():
                        if column_index < len(line):
                            contact_kwargs[field_name] = line[column_index].strip()
                    
                    # Import with retries
                    result = self._import_with_retries(email, contact_kwargs, line_num)
                    results.append(result)
                    
                    # Rate limiting
                    sleep(delay)
                    
        except FileNotFoundError:
            print(f"Error: File '{file_path}' not found")
        except Exception as e:
            print(f"Error reading CSV: {e}")
        
        return results
    
    def _import_with_retries(self, email: str, kwargs: Dict, line_num: int, 
                           max_retries: int = 3) -> Dict:
        """Import contact with retry logic"""
        for attempt in range(max_retries):
            try:
                result = self.import_single_contact(email, **kwargs)
                
                if result['success']:
                    print(f"✅ Line {line_num}: {email} - Success")
                    return result
                else:
                    print(f"⚠️ Line {line_num}: {email} - Failed (Status: {result['status_code']})")
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Line {line_num}: {email} - Request failed (attempt {attempt + 1}): {e}")
                
                if attempt < max_retries - 1:
                    sleep(1)  # Wait before retry
                    
        print(f"💥 Line {line_num}: {email} - Failed after {max_retries} retries")
        return {
            'success': False,
            'email': email,
            'error': 'Failed after all retries'
        }
    
    def batch_import(self, contacts: List[Dict], delay: float = 0.1) -> List[Dict]:
        """Import multiple contacts from a list"""
        results = []
        
        for i, contact in enumerate(contacts):
            email = contact.get('email', '')
            if not email:
                continue
                
            result = self._import_with_retries(email, contact, i + 1)
            results.append(result)
            
            # Rate limiting
            sleep(delay)
            
        return results
    
    def get_contact_stats(self) -> Dict:
        """Get contact statistics from Plunk"""
        try:
            response = requests.get(f'{self.base_url}/contacts', headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                return {
                    'total_contacts': data.get('total', 0),
                    'subscribed': data.get('subscribed', 0),
                    'unsubscribed': data.get('unsubscribed', 0)
                }
        except Exception as e:
            print(f"Error getting stats: {e}")
        return {}

# Example usage
if __name__ == "__main__":
    # Set your Plunk API key
    API_KEY = os.getenv('PLUNK_API_KEY', 'YOUR_SECRET_KEY')
    
    if API_KEY == 'YOUR_SECRET_KEY':
        print("Please set your PLUNK_API_KEY environment variable or update the API_KEY in the script")
        exit(1)
    
    importer = PlunkContactImporter(API_KEY)
    
    # Example 1: Import from CSV with field mapping
    field_mapping = {
        'first_name': 1,  # Column index for first name
        'last_name': 2,   # Column index for last name
        'subscribed': 3   # Column index for subscription status
    }
    
    results = importer.import_from_csv(
        file_path='contacts.csv',
        email_index=0,
        delimiter=',',
        field_mapping=field_mapping,
        delay=0.1  # 100ms delay between requests
    )
    
    # Print summary
    successful = sum(1 for r in results if r['success'])
    failed = len(results) - successful
    
    print(f"\n📊 Import Summary:")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Total: {len(results)}")
    
    # Get final stats
    stats = importer.get_contact_stats()
    if stats:
        print(f"\n📈 Plunk Contact Stats:")
        print(f"Total contacts: {stats.get('total_contacts', 'N/A')}")
        print(f"Subscribed: {stats.get('subscribed', 'N/A')}")
        print(f"Unsubscribed: {stats.get('unsubscribed', 'N/A')}")
