# backend/services/storage_service.py
"""
Simple storage service to start with
We'll build this up slowly
"""

import asyncio
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
import asyncpg
import logging

logger = logging.getLogger(__name__)

class StorageService:
    """Simple PostgreSQL storage service"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool = None
    
    async def initialize(self):
        """Initialize database connection"""
        try:
            self.pool = await asyncpg.create_pool(self.database_url)
            logger.info("Database connected successfully")
            await self._create_tables()
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    async def close(self):
        """Close database connections"""
        if self.pool:
            await self.pool.close()
    
    async def _create_tables(self):
        """Create content table with full 17-field schema and profile tables"""
        async with self.pool.acquire() as conn:
            # Create content_items table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS content_items (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL,
                    title VARCHAR(500) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    date_created TIMESTAMPTZ DEFAULT NOW(),
                    word_count INTEGER,
                    passage TEXT,
                    tags TEXT[],
                    file_type VARCHAR(100),
                    bible_references TEXT[],
                    ai_processing_time_seconds NUMERIC(10,3),
                    key_themes TEXT[],
                    thought_questions TEXT[],
                    last_error TEXT,
                    date_modified TIMESTAMPTZ DEFAULT NOW(),
                    size_bytes INTEGER,
                    processing_status VARCHAR(20) DEFAULT 'pending'
                );
            """)
            
            # Create lookup tables
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS theological_profiles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS speaking_styles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS education_levels (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE
                );
            """)
            
            
            # Create user_profiles table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS user_profiles (
                    user_id UUID PRIMARY KEY,
                    full_name VARCHAR(255),
                    profile_picture_url TEXT,
                    preferred_bible_versions TEXT[],
                    other_bible_versions TEXT,
                    audience_description TEXT,
                    year_started_ministry INTEGER,
                    primary_church_affiliation VARCHAR(255),
                    favorite_historical_preacher VARCHAR(255),
                    role_id INTEGER REFERENCES roles(id),
                    theological_profile_id INTEGER REFERENCES theological_profiles(id),
                    other_theological_profile TEXT,
                    speaking_style_id INTEGER REFERENCES speaking_styles(id),
                    education_level_id INTEGER REFERENCES education_levels(id),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            """)
            
            # Insert default lookup data
            await self._insert_default_lookup_data(conn)
            
            logger.info("Database tables ready")
    
    async def store_content(self, user_id: str, content_data: Dict[str, Any]) -> str:
        """Store content item with all processed data"""
        # Check if this is an update (content_data contains an ID) or new content
        existing_id = content_data.get('id')
        
        if existing_id:
            # This is an update - use the existing ID
            content_id = existing_id
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    UPDATE content_items SET
                        title = $2,
                        category = $3,
                        content = $4,
                        word_count = $5,
                        passage = $6,
                        tags = $7,
                        file_type = $8,
                        bible_references = $9,
                        ai_processing_time_seconds = $10,
                        key_themes = $11,
                        thought_questions = $12,
                        last_error = $13,
                        size_bytes = $14,
                        processing_status = $15,
                        date_modified = NOW()
                    WHERE id = $1 AND user_id = $16
                """, content_id, 
                    content_data.get('title', 'Untitled'),
                    content_data.get('category', 'sermons'),
                    content_data.get('content', ''),
                    content_data.get('word_count', 0),
                    content_data.get('passage'),
                    content_data.get('tags', []),
                    content_data.get('file_type'),
                    content_data.get('bible_references', []),
                    content_data.get('ai_processing_time_seconds'),
                    content_data.get('key_themes', []),
                    content_data.get('thought_questions', []),
                    content_data.get('last_error'),
                    content_data.get('size_bytes'),
                    content_data.get('processing_status', 'pending'),
                    user_id)
            logger.info(f"Updated existing content: {content_id}")
        else:
            # This is new content - generate a new ID
            content_id = str(uuid.uuid4())
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO content_items (
                        id, user_id, title, category, content, 
                        word_count, passage, tags, file_type, bible_references,
                        ai_processing_time_seconds, key_themes, thought_questions,
                        last_error, size_bytes, processing_status
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                """, content_id, user_id, 
                    content_data.get('title', 'Untitled'),
                    content_data.get('category', 'sermons'),
                    content_data.get('content', ''),
                    content_data.get('word_count', 0),
                    content_data.get('passage'),
                    content_data.get('tags', []),
                    content_data.get('file_type'),
                    content_data.get('bible_references', []),
                    content_data.get('ai_processing_time_seconds'),
                    content_data.get('key_themes', []),
                    content_data.get('thought_questions', []),
                    content_data.get('last_error'),
                    content_data.get('size_bytes'),
                    content_data.get('processing_status', 'pending'))
            logger.info(f"Created new content: {content_id}")
        
        return content_id
    
    async def update_processing_data(self, content_id: str, 
                                   key_themes: List[str] = None,
                                   thought_questions: List[str] = None,
                                   processing_time_seconds: float = None,
                                   processing_status: str = None,
                                   last_error: str = None) -> bool:
        """Update content processing data"""
        try:
            async with self.pool.acquire() as conn:
                result = await conn.execute("""
                    UPDATE content_items 
                    SET key_themes = $1, thought_questions = $2, 
                        ai_processing_time_seconds = $3, processing_status = $4,
                        last_error = $5, date_modified = NOW()
                    WHERE id = $6
                """, key_themes, thought_questions, processing_time_seconds, 
                    processing_status, last_error, content_id)
                
                # Check if any row was updated
                if result == "UPDATE 0":
                    logger.warning(f"No content found with id: {content_id}")
                    return False
                
                logger.info(f"Processing data updated for content: {content_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to update processing data for {content_id}: {e}")
            return False
    
    async def get_content(self, user_id: str, content_id: str) -> Optional[Dict[str, Any]]:
        """Get content by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM content_items 
                WHERE id = $1 AND user_id = $2
            """, content_id, user_id)
            
            return dict(row) if row else None
    
    async def list_content(self, user_id: str, category: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List all content for user with optional filtering"""
        async with self.pool.acquire() as conn:
            if category:
                rows = await conn.fetch("""
                    SELECT * FROM content_items 
                    WHERE user_id = $1 AND category = $2
                    ORDER BY date_created DESC
                    LIMIT $3 OFFSET $4
                """, user_id, category, limit, offset)
            else:
                rows = await conn.fetch("""
                    SELECT * FROM content_items 
                    WHERE user_id = $1
                    ORDER BY date_created DESC
                    LIMIT $2 OFFSET $3
                """, user_id, limit, offset)
            
            return [dict(row) for row in rows]
    
    async def delete_content(self, user_id: str, content_id: str) -> bool:
        """Delete content item"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM content_items 
                WHERE id = $1 AND user_id = $2
            """, content_id, user_id)
            
            # Check if any rows were affected
            rows_affected = int(result.split()[-1])
            logger.info(f"Deleted content {content_id}: {rows_affected} rows affected")
            return rows_affected > 0
    
    async def search_content(self, user_id: str, query: str, category: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Search content with full-text search"""
        async with self.pool.acquire() as conn:
            if category:
                rows = await conn.fetch("""
                    SELECT * FROM content_items 
                    WHERE user_id = $1 AND category = $2
                    AND (title ILIKE $3 OR content ILIKE $3)
                    ORDER BY date_created DESC
                    LIMIT $4
                """, user_id, category, f"%{query}%", limit)
            else:
                rows = await conn.fetch("""
                    SELECT * FROM content_items 
                    WHERE user_id = $1
                    AND (title ILIKE $2 OR content ILIKE $2)
                    ORDER BY date_created DESC
                    LIMIT $3
                """, user_id, f"%{query}%", limit)
            
            return [dict(row) for row in rows]
    
    async def get_storage_usage(self, user_id: str) -> Dict[str, Any]:
        """Get storage usage statistics"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as item_count,
                    COALESCE(SUM(OCTET_LENGTH(content)), 0) as total_bytes,
                    MAX(date_created) as last_updated
                FROM content_items 
                WHERE user_id = $1
            """, user_id)
            
            return {
                'item_count': row['item_count'],
                'total_bytes': row['total_bytes'],
                'last_updated': row['last_updated']
            }
    
    async def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export all user data"""
        content_items = await self.list_content(user_id)
        
        return {
            'user_id': user_id,
            'export_date': datetime.now().isoformat(),
            'content_items': content_items
        }
    
    async def bulk_import(self, user_id: str, content_items: List[Dict[str, Any]]) -> List[str]:
        """Import multiple content items"""
        imported_ids = []
        
        for item in content_items:
            # Store each item
            content_id = await self.store_content(user_id, item)
            imported_ids.append(content_id)
        
        return imported_ids
    
    async def _insert_default_lookup_data(self, conn):
        """Insert default data into lookup tables"""
        # Insert roles
        await conn.execute("""
            INSERT INTO roles (name) VALUES 
            ('Pastor/Minister'), ('Teacher'), ('Lay Leader'), 
            ('Student'), ('Content Creator'), ('Evangelist')
            ON CONFLICT (name) DO NOTHING
        """)
        
        # Insert theological profiles
        await conn.execute("""
            INSERT INTO theological_profiles (name) VALUES 
            ('Baptist'), ('Methodist'), ('Lutheran'), 
            ('Pentecostal'), ('Presbyterian'), ('Non-denominational'), ('Other')
            ON CONFLICT (name) DO NOTHING
        """)
        
        # Insert speaking styles
        await conn.execute("""
            INSERT INTO speaking_styles (name) VALUES 
            ('Expository'), ('Topical'), ('Narrative'), ('Evangelistic')
            ON CONFLICT (name) DO NOTHING
        """)
        
        # Insert education levels
        await conn.execute("""
            INSERT INTO education_levels (name) VALUES 
            ('Self-Taught'), ('Certificate'), ('Bachelor''s Degree'), 
            ('Master''s Degree (M.Div, M.A.)'), ('Doctorate (Ph.D, D.Min)')
            ON CONFLICT (name) DO NOTHING
        """)
        
    
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile data"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM user_profiles 
                WHERE user_id = $1
            """, user_id)
            
            return dict(row) if row else None
    
    async def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update or create user profile"""
        async with self.pool.acquire() as conn:
            # Check if profile exists
            existing = await conn.fetchrow("""
                SELECT user_id FROM user_profiles WHERE user_id = $1
            """, user_id)
            
            if existing:
                # Update existing profile
                set_clauses = []
                values = []
                param_num = 1
                
                for key, value in profile_data.items():
                    if key != 'user_id':  # Don't update user_id
                        set_clauses.append(f"{key} = ${param_num}")
                        values.append(value)
                        param_num += 1
                
                set_clauses.append(f"updated_at = NOW()")
                values.append(user_id)
                
                query = f"""
                    UPDATE user_profiles 
                    SET {', '.join(set_clauses)}
                    WHERE user_id = ${param_num}
                    RETURNING *
                """
                
                row = await conn.fetchrow(query, *values)
            else:
                # Create new profile
                profile_data['user_id'] = user_id
                
                columns = list(profile_data.keys())
                placeholders = [f"${i+1}" for i in range(len(columns))]
                values = list(profile_data.values())
                
                query = f"""
                    INSERT INTO user_profiles ({', '.join(columns)})
                    VALUES ({', '.join(placeholders)})
                    RETURNING *
                """
                
                row = await conn.fetchrow(query, *values)
            
            return dict(row)
    
    async def delete_user_profile(self, user_id: str) -> bool:
        """Delete user profile"""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM user_profiles 
                WHERE user_id = $1
            """, user_id)
            
            rows_affected = int(result.split()[-1])
            return rows_affected > 0
    
    async def create_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Create empty user profile"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("""
                INSERT INTO user_profiles (user_id)
                VALUES ($1)
                RETURNING *
            """, user_id)
            
            return dict(row)
    
    async def get_lookup_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all lookup table data"""
        async with self.pool.acquire() as conn:
            # Get all lookup tables
            roles = await conn.fetch("SELECT id, name FROM roles ORDER BY id")
            theological_profiles = await conn.fetch("SELECT id, name FROM theological_profiles ORDER BY id")
            speaking_styles = await conn.fetch("SELECT id, name FROM speaking_styles ORDER BY id")
            education_levels = await conn.fetch("SELECT id, name FROM education_levels ORDER BY id")
            
            return {
                "roles": [dict(row) for row in roles],
                "theological_profiles": [dict(row) for row in theological_profiles],
                "speaking_styles": [dict(row) for row in speaking_styles],
                "education_levels": [dict(row) for row in education_levels]
            }