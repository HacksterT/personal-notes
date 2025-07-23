#!/usr/bin/env python3
"""
Regenerate storage files from database to HOST directory
This creates files in frontend/public/storage/ which will be copied during Docker build
"""

import os
import sys
import subprocess
import tempfile
import json
from pathlib import Path

def regenerate_files():
    """Use docker exec to query database and create files on host"""
    
    print("🔄 Regenerating files from database to host storage...")
    
    # Get all content from database via docker exec
    query = """
    SELECT id, title, category, content, file_type, date_created
    FROM content_items 
    ORDER BY date_created ASC
    """
    
    cmd = [
        'docker', 'compose', 'exec', '-T', 'notes-db', 
        'psql', '-U', 'dev_user', '-d', 'sermon_organizer_dev',
        '-t', '-c', query
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        lines = result.stdout.strip().split('\n')
        
        # Parse the output
        records = []
        for line in lines:
            if line.strip() and not line.startswith('-') and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 5:
                    records.append({
                        'id': parts[0],
                        'title': parts[1], 
                        'category': parts[2],
                        'content': parts[3],
                        'file_type': parts[4] if parts[4] else 'text/plain'
                    })
        
        print(f"📊 Found {len(records)} content items")
        
        # Create base storage directory
        storage_path = Path('frontend/public/storage')
        storage_path.mkdir(parents=True, exist_ok=True)
        
        file_count = 0
        for record in records:
            if not record['category'] or not record['title']:
                continue
                
            # Create category directory 
            category_path = storage_path / record['category']
            category_path.mkdir(parents=True, exist_ok=True)
            
            # Generate safe filename
            safe_title = "".join(c for c in record['title'] if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_title = safe_title.replace(' ', '_')[:50]
            
            # Determine file extension
            if 'markdown' in record['file_type'].lower():
                ext = '.md'
            else:
                ext = '.txt'
                
            filename = f"{safe_title}_{record['id'][:8]}{ext}"
            file_path = category_path / filename
            
            # Get full content via separate query (handle large content)
            content_cmd = [
                'docker', 'compose', 'exec', '-T', 'notes-db',
                'psql', '-U', 'dev_user', '-d', 'sermon_organizer_dev', 
                '-t', '-c', f"SELECT content FROM content_items WHERE id = '{record['id']}'"
            ]
            
            content_result = subprocess.run(content_cmd, capture_output=True, text=True, check=True)
            content = content_result.stdout.strip()
            
            # Write file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            file_count += 1
            print(f"📄 Created: {file_path}")
        
        print(f"✅ Successfully regenerated {file_count} files to host storage")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Database query failed: {e}")
        print(f"STDERR: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ Error regenerating files: {e}")
        return False

if __name__ == "__main__":
    success = regenerate_files()
    sys.exit(0 if success else 1)