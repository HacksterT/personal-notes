#!/usr/bin/env python3
"""
Test script to verify user profiles and resources are properly connected
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.services.storage_service import StorageService

async def test_user_profile_resource_connection():
    """Test that user profiles and resources are properly linked"""
    
    database_url = os.getenv('DATABASE_URL', 'postgresql://dev_user:dev_password@localhost:5432/sermon_organizer_dev')
    storage = StorageService(database_url)
    
    try:
        await storage.initialize()
        print("✅ Database connection successful")
        
        # Test user ID consistency
        user_id = "00000000-0000-0000-0000-000000000001"
        
        # 1. Test profile operations
        print("\n🔍 Testing Profile Operations:")
        
        # Create/update a test profile
        test_profile = {
            'full_name': 'Test User',
            'preferred_bible_versions': ['NIV', 'ESV'],
            'other_bible_versions': 'NASB 2020',
            'theological_profile_id': 1,  # Baptist
            'other_theological_profile': '',
            'role_id': 1  # Pastor/Minister
        }
        
        updated_profile = await storage.update_user_profile(user_id, test_profile)
        print(f"✅ Profile created/updated: {updated_profile['full_name']}")
        
        # Retrieve profile
        retrieved_profile = await storage.get_user_profile(user_id)
        print(f"✅ Profile retrieved: {retrieved_profile['preferred_bible_versions']}")
        
        # 2. Test content/resource operations
        print("\n🔍 Testing Resource Operations:")
        
        test_content = {
            'title': 'Test Sermon',
            'category': 'sermons', 
            'content': 'This is a test sermon content.',
            'tags': ['test', 'sermon'],
            'word_count': 8
        }
        
        content_id = await storage.store_content(user_id, test_content)
        print(f"✅ Content stored with ID: {content_id}")
        
        # Retrieve content
        retrieved_content = await storage.get_content(user_id, content_id)
        print(f"✅ Content retrieved: {retrieved_content['title']}")
        
        # 3. Test user connection
        print("\n🔍 Testing User-Resource Connection:")
        
        # List all content for this user
        user_content = await storage.list_content(user_id)
        print(f"✅ User has {len(user_content)} content items")
        
        # Get storage usage for this user
        usage = await storage.get_storage_usage(user_id)
        print(f"✅ Storage usage: {usage['item_count']} items, {usage['total_bytes']} bytes")
        
        # 4. Test lookup data
        print("\n🔍 Testing Lookup Data:")
        lookup_data = await storage.get_lookup_data()
        print(f"✅ Lookup tables loaded:")
        for table, data in lookup_data.items():
            print(f"   - {table}: {len(data)} items")
        
        print("\n🎉 All database connections verified successfully!")
        print(f"   - User ID: {user_id}")
        print(f"   - Profile: ✅ Connected")
        print(f"   - Resources: ✅ Connected") 
        print(f"   - Lookup tables: ✅ Connected")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
        
    finally:
        await storage.close()

if __name__ == "__main__":
    success = asyncio.run(test_user_profile_resource_connection())
    exit(0 if success else 1)