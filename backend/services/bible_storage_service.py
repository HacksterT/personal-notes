"""
Bible Storage Service - Phase 8 Implementation
Handles Bible content caching with license compliance for personal use.

This service manages the progressive accumulation of Bible content through 
natural usage while maintaining strict compliance with personal use limits.
"""

import asyncio
import asyncpg
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BibleChapter:
    """Data class for Bible chapter content"""
    book_name: str
    book_abbrev: str
    chapter_number: int
    version_code: str
    verses: List[Dict[str, Any]]
    verse_count: int
    api_reference: str
    raw_html: Optional[str] = None
    api_url: Optional[str] = None

@dataclass
class ComplianceSummary:
    """Data class for license compliance tracking"""
    total_verses_stored: int
    total_chapters_stored: int
    personal_use_limit: int
    license_mode: str
    is_compliant: bool
    last_updated: datetime

class BibleStorageService:
    """
    Bible content storage service with license compliance.
    Manages chapter-based caching for personal use (≤500 verses).
    """
    
    def __init__(self, db_config: Dict[str, str]):
        self.db_config = db_config
        self.connection_pool = None
        self.license_mode = 'personal_use'
        
    async def initialize(self):
        """Initialize the database connection pool"""
        try:
            self.connection_pool = await asyncpg.create_pool(**self.db_config)
            logger.info("✅ Bible storage service initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Bible storage service: {e}")
            raise
            
    async def close(self):
        """Close the database connection pool"""
        if self.connection_pool:
            await self.connection_pool.close()
            logger.info("📤 Bible storage service closed")
            
    async def get_compliance_status(self) -> ComplianceSummary:
        """Get current license compliance status"""
        async with self.connection_pool.acquire() as connection:
            row = await connection.fetchrow("""
                SELECT total_verses_stored, total_chapters_stored, personal_use_limit, 
                       license_mode, is_compliant, last_updated
                FROM bible_cache.compliance_summary 
                LIMIT 1
            """)
            
            if row:
                return ComplianceSummary(
                    total_verses_stored=row['total_verses_stored'],
                    total_chapters_stored=row['total_chapters_stored'],
                    personal_use_limit=row['personal_use_limit'],
                    license_mode=row['license_mode'],
                    is_compliant=row['is_compliant'],
                    last_updated=row['last_updated']
                )
            else:
                # Initialize if not exists
                await self._initialize_compliance_summary(connection)
                return ComplianceSummary(
                    total_verses_stored=0,
                    total_chapters_stored=0,
                    personal_use_limit=500,
                    license_mode='personal_use',
                    is_compliant=True,
                    last_updated=datetime.now()
                )
                
    async def can_store_chapter(self, verse_count: int) -> Tuple[bool, str]:
        """
        Check if a chapter can be stored without violating compliance.
        Returns (can_store, reason)
        """
        compliance = await self.get_compliance_status()
        
        if not compliance.is_compliant:
            return False, f"Already at limit ({compliance.total_verses_stored}/{compliance.personal_use_limit} verses)"
            
        if compliance.total_verses_stored + verse_count > compliance.personal_use_limit:
            return False, f"Would exceed limit: {compliance.total_verses_stored + verse_count}/{compliance.personal_use_limit} verses"
            
        return True, "Within compliance limits"
        
    async def store_chapter(self, chapter: BibleChapter) -> bool:
        """
        Store a Bible chapter with compliance checking.
        Returns True if stored successfully, False if compliance prevents storage.
        """
        # Check compliance before storing
        can_store, reason = await self.can_store_chapter(chapter.verse_count)
        if not can_store:
            logger.warning(f"🚫 Cannot store {chapter.book_name} {chapter.chapter_number}: {reason}")
            return False
            
        async with self.connection_pool.acquire() as connection:
            async with connection.transaction():
                try:
                    # Get version_id and book_id
                    version_id = await self._get_version_id(connection, chapter.version_code)
                    book_id = await self._get_book_id(connection, chapter.book_name)
                    
                    if not version_id or not book_id:
                        logger.error(f"❌ Invalid version ({chapter.version_code}) or book ({chapter.book_name})")
                        return False
                    
                    # Check if chapter already exists
                    existing = await connection.fetchrow("""
                        SELECT id FROM bible_cache.chapters 
                        WHERE version_id = $1 AND book_id = $2 AND chapter_number = $3
                    """, version_id, book_id, chapter.chapter_number)
                    
                    if existing:
                        # Update access count and timestamp
                        await connection.execute("""
                            UPDATE bible_cache.chapters 
                            SET accessed_count = accessed_count + 1, last_accessed = NOW()
                            WHERE id = $1
                        """, existing['id'])
                        logger.info(f"📖 Updated access for {chapter.book_name} {chapter.chapter_number}")
                        return True
                    
                    # Store new chapter
                    verses_json = json.dumps(chapter.verses)
                    
                    await connection.execute("""
                        INSERT INTO bible_cache.chapters 
                        (version_id, book_id, chapter_number, api_reference, api_url, 
                         raw_html, verses, verse_count)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    """, version_id, book_id, chapter.chapter_number, chapter.api_reference,
                    chapter.api_url, chapter.raw_html, verses_json, chapter.verse_count)
                    
                    # Update compliance summary
                    await self._update_compliance_summary(connection, chapter.verse_count)
                    
                    # Log usage
                    await self._log_usage(connection, 'download', chapter)
                    
                    logger.info(f"✅ Stored {chapter.book_name} {chapter.chapter_number} ({chapter.verse_count} verses)")
                    return True
                    
                except Exception as e:
                    logger.error(f"❌ Failed to store chapter: {e}")
                    return False
                    
    async def get_chapter(self, book_name: str, chapter_number: int, version_code: str) -> Optional[BibleChapter]:
        """Retrieve a stored Bible chapter"""
        async with self.connection_pool.acquire() as connection:
            try:
                row = await connection.fetchrow("""
                    SELECT c.api_reference, c.api_url, c.raw_html, c.verses, c.verse_count,
                           b.book_name, b.book_abbrev, v.code as version_code
                    FROM bible_cache.chapters c
                    JOIN bible_cache.books b ON c.book_id = b.id
                    JOIN bible_cache.versions v ON c.version_id = v.id
                    WHERE b.book_name = $1 AND c.chapter_number = $2 AND v.code = $3
                """, book_name, chapter_number, version_code)
                
                if row:
                    # Update access tracking
                    await connection.execute("""
                        UPDATE bible_cache.chapters 
                        SET accessed_count = accessed_count + 1, last_accessed = NOW()
                        WHERE version_id = (SELECT id FROM bible_cache.versions WHERE code = $1)
                        AND book_id = (SELECT id FROM bible_cache.books WHERE book_name = $2)
                        AND chapter_number = $3
                    """, version_code, book_name, chapter_number)
                    
                    # Log usage
                    await self._log_usage(connection, 'read', None, version_code, book_name, chapter_number)
                    
                    verses = json.loads(row['verses']) if isinstance(row['verses'], str) else row['verses']
                    
                    return BibleChapter(
                        book_name=row['book_name'],
                        book_abbrev=row['book_abbrev'],
                        chapter_number=chapter_number,
                        version_code=row['version_code'],
                        verses=verses,
                        verse_count=row['verse_count'],
                        api_reference=row['api_reference'],
                        raw_html=row['raw_html'],
                        api_url=row['api_url']
                    )
                    
                return None
                
            except Exception as e:
                logger.error(f"❌ Failed to retrieve chapter: {e}")
                return None
                
    async def get_all_cached_chapters(self, version_code: str) -> Dict[str, BibleChapter]:
        """
        Load all cached chapters for a version into session cache format.
        Returns dict with keys like 'Genesis.1', 'Exodus.2', etc.
        """
        async with self.connection_pool.acquire() as connection:
            try:
                rows = await connection.fetch("""
                    SELECT c.chapter_number, c.api_reference, c.verses, c.verse_count,
                           b.book_name, b.book_abbrev, v.code as version_code
                    FROM bible_cache.chapters c
                    JOIN bible_cache.books b ON c.book_id = b.id
                    JOIN bible_cache.versions v ON c.version_id = v.id
                    WHERE v.code = $1
                    ORDER BY b.book_number, c.chapter_number
                """, version_code)
                
                cached_chapters = {}
                for row in rows:
                    chapter_key = f"{row['book_name']}.{row['chapter_number']}"
                    verses = json.loads(row['verses']) if isinstance(row['verses'], str) else row['verses']
                    
                    cached_chapters[chapter_key] = BibleChapter(
                        book_name=row['book_name'],
                        book_abbrev=row['book_abbrev'],
                        chapter_number=row['chapter_number'],
                        version_code=row['version_code'],
                        verses=verses,
                        verse_count=row['verse_count'],
                        api_reference=row['api_reference']
                    )
                    
                logger.info(f"📚 Loaded {len(cached_chapters)} cached chapters for {version_code}")
                return cached_chapters
                
            except Exception as e:
                logger.error(f"❌ Failed to load cached chapters: {e}")
                return {}
                
    async def get_books_metadata(self) -> List[Dict[str, Any]]:
        """Get all books metadata for navigation"""
        async with self.connection_pool.acquire() as connection:
            try:
                rows = await connection.fetch("""
                    SELECT book_number, book_name, book_abbrev, testament, 
                           category, color_code, total_chapters
                    FROM bible_cache.books
                    ORDER BY book_number
                """)
                
                return [dict(row) for row in rows]
                
            except Exception as e:
                logger.error(f"❌ Failed to get books metadata: {e}")
                return []
                
    async def get_usage_statistics(self) -> Dict[str, Any]:
        """Get usage statistics for analytics"""
        async with self.connection_pool.acquire() as connection:
            try:
                # Get compliance summary
                compliance = await self.get_compliance_status()
                
                # Get recent usage
                recent_usage = await connection.fetch("""
                    SELECT action, version_code, book_name, chapter_number, created_at
                    FROM bible_cache.usage_logs
                    ORDER BY created_at DESC
                    LIMIT 10
                """)
                
                # Get most accessed chapters
                popular_chapters = await connection.fetch("""
                    SELECT b.book_name, c.chapter_number, c.accessed_count, v.code
                    FROM bible_cache.chapters c
                    JOIN bible_cache.books b ON c.book_id = b.id
                    JOIN bible_cache.versions v ON c.version_id = v.id
                    ORDER BY c.accessed_count DESC
                    LIMIT 5
                """)
                
                return {
                    'compliance': {
                        'verses_stored': compliance.total_verses_stored,
                        'chapters_stored': compliance.total_chapters_stored,
                        'verse_limit': compliance.personal_use_limit,
                        'is_compliant': compliance.is_compliant,
                        'usage_percentage': round((compliance.total_verses_stored / compliance.personal_use_limit) * 100, 1)
                    },
                    'recent_usage': [dict(row) for row in recent_usage],
                    'popular_chapters': [dict(row) for row in popular_chapters]
                }
                
            except Exception as e:
                logger.error(f"❌ Failed to get usage statistics: {e}")
                return {}
                
    # Private helper methods
    
    async def _get_version_id(self, connection, version_code: str) -> Optional[int]:
        """Get version ID by code"""
        row = await connection.fetchrow(
            "SELECT id FROM bible_cache.versions WHERE code = $1", version_code
        )
        return row['id'] if row else None
        
    async def _get_book_id(self, connection, book_name: str) -> Optional[int]:
        """Get book ID by name"""
        row = await connection.fetchrow(
            "SELECT id FROM bible_cache.books WHERE book_name = $1", book_name
        )
        return row['id'] if row else None
        
    async def _update_compliance_summary(self, connection, verse_count: int):
        """Update compliance summary with new chapter data"""
        await connection.execute("""
            UPDATE bible_cache.compliance_summary 
            SET total_verses_stored = total_verses_stored + $1,
                total_chapters_stored = total_chapters_stored + 1,
                last_updated = NOW()
        """, verse_count)
        
    async def _log_usage(self, connection, action: str, chapter: Optional[BibleChapter] = None,
                         version_code: str = None, book_name: str = None, chapter_number: int = None):
        """Log usage activity for compliance tracking"""
        if chapter:
            version_code = chapter.version_code
            book_name = chapter.book_name
            chapter_number = chapter.chapter_number
            verse_count = chapter.verse_count
        else:
            verse_count = 0
            
        await connection.execute("""
            INSERT INTO bible_cache.usage_logs 
            (action, version_code, book_name, chapter_number, verse_count, access_method)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, action, version_code, book_name, chapter_number, verse_count, 'api_storage')
        
    async def _initialize_compliance_summary(self, connection):
        """Initialize compliance summary if not exists"""
        await connection.execute("""
            INSERT INTO bible_cache.compliance_summary 
            (total_verses_stored, total_chapters_stored, license_mode)
            VALUES (0, 0, 'personal_use')
            ON CONFLICT DO NOTHING
        """)