#!/usr/bin/env python3
"""
Regenerate storage files from database content
Run this to recreate the file system storage from the database source of truth
"""

import asyncio
import asyncpg
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def regenerate_files():
    """Regenerate all storage files from database content"""
    
    # Database connection (from host to container)
    database_url = 'postgresql://dev_user:dev_password@localhost:5433/sermon_organizer_dev'
    
    try:
        conn = await asyncpg.connect(database_url)
        
        # Get all content items
        records = await conn.fetch("""
            SELECT id, title, category, content, file_type, date_created
            FROM content_items 
            ORDER BY date_created ASC
        """)
        
        logger.info(f"Found {len(records)} content items to regenerate")
        
        # Create base storage directory (on host - will be copied to container on build)
        storage_path = Path('/home/hackstert/projects/personal-notes/frontend/public/storage')
        
        for record in records:
            # Create category directory
            category_path = storage_path / record['category']
            category_path.mkdir(parents=True, exist_ok=True)
            
            # Generate filename from title and ID
            safe_title = "".join(c for c in record['title'] if c.isalnum() or c in (' ', '-', '_')).strip()
            safe_title = safe_title.replace(' ', '_')[:50]  # Limit length
            
            # Determine file extension
            file_type = record['file_type'] or 'text/plain'
            if 'markdown' in file_type:
                ext = '.md'
            elif 'text' in file_type:
                ext = '.txt'
            else:
                ext = '.txt'
                
            filename = f"{safe_title}_{record['id'].hex[:8]}{ext}"
            file_path = category_path / filename
            
            # Write content to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(record['content'])
            
            logger.info(f"Created: {file_path}")
        
        logger.info(f"Successfully regenerated {len(records)} files")
        
    except Exception as e:
        logger.error(f"Error regenerating files: {e}")
        return False
    finally:
        if conn:
            await conn.close()
    
    return True

if __name__ == "__main__":
    asyncio.run(regenerate_files())