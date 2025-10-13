import requests
import json
import os

class PlunkBulkImporter:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = 'https://api.useplunk.com/v1'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def bulk_import_contacts(self, contacts: list, batch_size: int = 100):
        """
        Import contacts in batches using Plunk's bulk import API
        Note: This is a simulated bulk import since Plunk may not have a dedicated bulk endpoint
        """
        results = []
        
        # Split contacts into batches
        for i in range(0, len(contacts), batch_size):
            batch = contacts[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1} ({len(batch)} contacts)")
            
            batch_results = []
            for contact in batch:
                try:
                    response = requests.post(
                        f'{self.base_url}/contacts',
                        json=contact,
                        headers=self.headers
                    )
                    
                    result = {
                        'email': contact.get('email'),
                        'success': response.status_code in [200, 201],
                        'status_code': response.status_code,
                        'response': response.json() if response.content else {}
                    }
                    
                    batch_results.append(result)
                    
                    if result['success']:
                        print(f"✅ {contact['email']}")
                    else:
                        print(f"❌ {contact['email']} - Status: {result['status_code']}")
                        
                except Exception as e:
                    print(f"❌ {contact.get('email', 'Unknown')} - Error: {e}")
                    batch_results.append({
                        'email': contact.get('email'),
                        'success': False,
                        'error': str(e)
                    })
            
            results.extend(batch_results)
            
            # Rate limiting between batches
            if i + batch_size < len(contacts):
                import time
                time.sleep(1)
        
        return results
    
    def import_from_json_file(self, file_path: str):
        """Import contacts from a JSON file"""
        try:
            with open(file_path, 'r') as f:
                contacts = json.load(f)
            
            return self.bulk_import_contacts(contacts)
            
        except Exception as e:
            print(f"Error reading JSON file: {e}")
            return []

# Example usage
if __name__ == "__main__":
    API_KEY = os.getenv('PLUNK_API_KEY', 'YOUR_SECRET_KEY')
    
    if API_KEY == 'YOUR_SECRET_KEY':
        print("Please set your PLUNK_API_KEY environment variable")
        exit(1)
    
    importer = PlunkBulkImporter(API_KEY)
    
    # Example contacts list
    contacts = [
        {
            'email': 'user1@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'subscribed': True
        },
        {
            'email': 'user2@example.com',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'subscribed': True
        },
        # Add more contacts...
    ]
    
    results = importer.bulk_import_contacts(contacts, batch_size=50)
    
    # Print summary
    successful = sum(1 for r in results if r.get('success', False))
    print(f"\nImport completed: {successful}/{len(results)} successful")
